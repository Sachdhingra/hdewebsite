#!/usr/bin/env python3
"""Build the website catalogue from interio.com product pages.

Reads interio.com's public sitemaps, visits each /product/ page (politely, one
request at a time), and pulls the name, SKU, price, main photo and category
path from the page's Open Graph tags and breadcrumbs. Writes
site/assets/js/catalog.js, which the website loads automatically.

Standard library only, so it runs anywhere Python 3.8+ is installed.

Usage:
  python3 tools/scrape_interio.py                       # full catalogue
  python3 tools/scrape_interio.py --limit 40            # quick sample
  python3 tools/scrape_interio.py --rooms bedroom,living
  python3 tools/scrape_interio.py --from-html page.html # parse a saved page (testing)
"""
import argparse
import datetime as dt
import gzip
import html
import json
import re
import sys
import time
import urllib.parse
import urllib.request
import urllib.robotparser
import xml.etree.ElementTree as ET
from html.parser import HTMLParser

BASE = "https://interio.com"
SITEMAP_INDEX = BASE + "/sitemap.xml"
UA = "HomeDecorEnterprisesCatalogSync/1.0 (authorised channel partner; +https://github.com/Sachdhingra/hdewebsite)"
NS = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9", "image": "http://www.google.com/schemas/sitemap-image/1.1"}

# interio.com top-level category -> website room slug (see site/assets/js/data.js rooms)
ROOM_BY_CATEGORY = {
    "living-room": "living", "bedroom": "bedroom", "dining-room": "dining",
    "office-and-study": "office", "modular-kitchen": "kitchen", "kitchen": "kitchen",
    "storage": "storage", "mattresses": "bedroom",
}
# Fallback when a page has no usable breadcrumb: first keyword that matches the product name wins.
ROOM_KEYWORDS = [
    ("bedroom", ["bedside", "sofa cum bed", "diwan"]),
    ("kitchen", ["kitchen", "chimney", "hob "]),
    ("dining", ["dining", "crockery"]),
    ("living", ["sofa", "recliner", "lounger", "tv unit", "centre table", "center table", "coffee table", "corner table",
                "side table", "display unit", "bean bag", "pouffe", "ottoman"]),
    ("office", ["office chair", "chair", "study", "desk", "workstation", "computer table", "bookshelf", "book shelf"]),
    ("bedroom", ["bed", "wardrobe", "mattress", "dresser", "dressing", "bedside", "pillow"]),
    ("storage", ["almirah", "locker", "safe", "shoe", "cabinet", "rack", "cupboard"]),
]


def fetch(url, retries=3, timeout=30):
    last = None
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Encoding": "gzip"})
            with urllib.request.urlopen(req, timeout=timeout) as r:
                data = r.read()
                if r.headers.get("Content-Encoding") == "gzip" or data[:2] == b"\x1f\x8b":
                    data = gzip.decompress(data)
                return data.decode("utf-8", "replace")
        except Exception as e:  # network hiccup or 5xx: back off and retry
            last = e
            time.sleep(2 ** attempt * 2)
    raise last


def sitemap_products(index_url):
    """Yield (product_url, [image_urls]) from the sitemap index and its children."""
    root = ET.fromstring(fetch(index_url))
    children = [e.text.strip() for e in root.findall("sm:sitemap/sm:loc", NS)] or [index_url]
    seen = set()
    for child in children:
        tree = root if child == index_url else ET.fromstring(fetch(child))
        for u in tree.findall("sm:url", NS):
            loc = (u.findtext("sm:loc", default="", namespaces=NS) or "").strip()
            if "/product/" not in loc or loc in seen:
                continue
            seen.add(loc)
            imgs = [i.text.strip() for i in u.findall("image:image/image:loc", NS) if i.text]
            yield loc, imgs


class PageParser(HTMLParser):
    """Collects meta tags, JSON-LD blocks and breadcrumb links from a product page."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.meta = {}
        self.jsonld = []
        self.crumbs = []
        self._in_ld = False
        self._ld_buf = []
        self._crumb_depth = 0
        self._tag_stack = []
        self.title = ""
        self._in_title = False
        self.h1 = ""
        self._in_h1 = False

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "meta":
            key = a.get("property") or a.get("name") or a.get("itemprop")
            if key and "content" in a and key not in self.meta:
                self.meta[key] = a["content"]
        elif tag == "script" and a.get("type") == "application/ld+json":
            self._in_ld, self._ld_buf = True, []
        elif tag == "title":
            self._in_title = True
        elif tag == "h1" and not self.h1:
            self._in_h1 = True
        cls = a.get("class", "") or ""
        if self._crumb_depth:
            self._crumb_depth += 1
            if tag == "a" and a.get("href"):
                self.crumbs.append(a["href"])
        elif "breadcrumb" in cls:
            self._crumb_depth = 1

    def handle_endtag(self, tag):
        if tag == "script" and self._in_ld:
            self._in_ld = False
            try:
                self.jsonld.append(json.loads("".join(self._ld_buf)))
            except ValueError:
                pass
        if tag == "title":
            self._in_title = False
        if tag == "h1" and self._in_h1:
            self._in_h1 = False
        if self._crumb_depth:
            self._crumb_depth -= 1

    def handle_data(self, data):
        if self._in_ld:
            self._ld_buf.append(data)
        if self._in_title:
            self.title += data
        if self._in_h1:
            self.h1 += data


def walk_jsonld(obj):
    if isinstance(obj, list):
        for o in obj:
            yield from walk_jsonld(o)
    elif isinstance(obj, dict):
        yield obj
        for v in obj.get("@graph", []) if isinstance(obj.get("@graph"), list) else []:
            yield from walk_jsonld(v)


def to_number(s):
    if s is None:
        return None
    m = re.search(r"[\d,]+(?:\.\d+)?", str(s))
    return float(m.group(0).replace(",", "")) if m else None


def category_path(parser):
    """Return category slugs like ['bedroom', 'beds', 'king-beds'] from breadcrumbs or JSON-LD."""
    paths = []
    for obj in (o for block in parser.jsonld for o in walk_jsonld(block)):
        if obj.get("@type") == "BreadcrumbList":
            for el in obj.get("itemListElement", []):
                item = el.get("item")
                url = item.get("@id") if isinstance(item, dict) else item
                if url:
                    paths.append(url)
    paths += parser.crumbs
    best = []
    for href in paths:
        p = urllib.parse.urlparse(href).path.strip("/")
        if not p or p.startswith("product/"):
            continue
        parts = [x for x in p.split("/") if x and x != "all-products"]
        if len(parts) > len(best):
            best = parts
    return best


def room_for(cat_path, name):
    for slug in cat_path:
        if slug in ROOM_BY_CATEGORY:
            return ROOM_BY_CATEGORY[slug]
    low = " " + name.lower() + " "
    for room, words in ROOM_KEYWORDS:
        if any(w in low for w in words):
            return room
    return "storage"


def slug_name(url, sku):
    """Full product name from the URL slug, e.g. 'Adria King Size Engineered Wood Bed'.

    Interio's og:title drops size and colour, which makes variants look identical."""
    slug = url.rstrip("/").rsplit("/", 1)[-1]
    if sku and slug.lower().endswith("-" + sku.lower()):
        slug = slug[: -len(sku) - 1]
    # Any other trailing product code (letters and digits mixed, 6+ chars), e.g. "-gint045", "-slim00242f".
    slug = re.sub(r"-(?=[0-9a-z]*\d)(?=[0-9a-z]*[a-z])[0-9a-z]{6,}$", "", slug, flags=re.I)
    words = [w if w.isdigit() else w.capitalize() for w in slug.split("-") if w]
    name = " ".join(words)
    name = re.sub(r"\b(\d) (Seater|Door|Drawer)\b", r"\1-\2", name)
    return re.sub(r"\b(Tv|Ohu|L)\b", lambda m: m.group(1).upper(), name)


def deal_type(desc):
    """Interio descriptions end with 'Get great deals on <Category> with ...'."""
    m = re.search(r"great deals on (.+?)(?:\s+with\b|[.!]|$)", desc, re.I)
    return m.group(1).strip() if m else ""


def pretty(slug):
    return slug.replace("-", " ").strip().capitalize()


def image_url(src, width):
    """Ask Interio's image service for a web-sized copy instead of the 1920px original."""
    if not src:
        return ""
    base = src.split("?")[0]
    return base + "?optimize=high&bg-color=255,255,255&fit=bounds&width=%d" % width


def parse_product(page_html, url, sitemap_images=(), width=640):
    p = PageParser()
    p.feed(page_html)
    m = p.meta
    product_ld = next((o for block in p.jsonld for o in walk_jsonld(block) if o.get("@type") in ("Product", ["Product"])), {})
    offers = product_ld.get("offers") or {}
    if isinstance(offers, list):
        offers = offers[0] if offers else {}

    # The page heading carries the full name ("Adria King Size ..."); og:title is often shorter.
    name = html.unescape(re.sub(r"\s+", " ", p.h1).strip() or product_ld.get("name") or m.get("og:title") or p.title.split("|")[0]).strip()
    sku = product_ld.get("sku") or m.get("product:retailer_item_id") or ""
    if not sku:
        tail = re.search(r"-([0-9a-z]{10,})$", url.rstrip("/"))
        sku = tail.group(1).upper() if tail else ""
    price = to_number(offers.get("price") or m.get("product:price:amount") or m.get("og:price:amount"))
    mrp = to_number(m.get("product:original_price:amount") or m.get("product:regular_price:amount"))
    ld_img = product_ld.get("image")
    if isinstance(ld_img, list):
        ld_img = ld_img[0] if ld_img else None
    if isinstance(ld_img, dict):
        ld_img = ld_img.get("url")
    img = m.get("og:image") or ld_img or (sitemap_images[0] if sitemap_images else "")
    desc = html.unescape(m.get("og:description") or m.get("description") or product_ld.get("description") or "").strip()
    cats = category_path(p)
    kind = deal_type(desc) or (pretty(cats[-1]) if cats else "")
    if not name or price is None:
        return None
    return {
        "slugName": slug_name(url, sku),
        "id": (sku or url.rstrip("/").rsplit("/", 1)[-1]).lower(),
        "sku": sku.upper(),
        "name": name,
        "room": room_for(cats, kind + " " + name),
        "type": kind[:1].upper() + kind[1:],
        "family": name,
        "from": round(price),
        "mrp": round(mrp) if mrp and mrp > price else None,
        "note": short_note(desc),
        "image": image_url(img, width),
        "source": url,
    }


def short_note(desc):
    """Keep the useful middle of 'Shop X 1-Year Warranty, Oak, Particle Board Online from Interio ...'."""
    d = re.sub(r"\s+", " ", desc)
    m = re.search(r"(\d+[- ]Years?\s+Warranty.*?)\s+Online from", d, re.I)
    return (m.group(1) if m else d)[:120].strip(" ,")


def finalise(items):
    """Drop unpriced items and fold sizes/colours/finishes of one design (same short name) into one card.

    A folded card keeps the lowest price and says how many options exist; `fromPrice` marks
    that the options are priced differently, so the site labels it "Starting from"."""
    groups = {}
    for it in items:
        if it.get("from"):
            groups.setdefault(it["family"].lower(), []).append(it)
    out = []
    for members in groups.values():
        members.sort(key=lambda x: x["from"])
        card = dict(members[0])
        if len(members) > 1:
            card["name"] = card["family"]
            card["variants"] = len(members)
            if members[-1]["from"] != members[0]["from"]:
                card["fromPrice"] = True
        else:
            card["name"] = card.get("slugName") or card["name"]
        card.pop("slugName", None)
        out.append(card)
    return out


def write_catalog(items, path):
    items = finalise(items)
    items.sort(key=lambda x: (x["room"], x["type"], x["name"]))
    stamp = dt.datetime.utcnow().strftime("%Y-%m-%d")
    body = json.dumps(items, ensure_ascii=False, indent=1)
    with open(path, "w", encoding="utf-8") as f:
        f.write("/* Generated by tools/scrape_interio.py on %s from interio.com. Do not edit by hand:\n"
                " * re-run the script (or the 'Sync Interio catalogue' GitHub action) instead. */\n" % stamp)
        f.write("window.HDE_CATALOG = { updated: %s, products: %s };\n" % (json.dumps(stamp), body))


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--out", default="site/assets/js/catalog.js")
    ap.add_argument("--limit", type=int, default=0, help="stop after N products (0 = all)")
    ap.add_argument("--rooms", default="", help="comma list of rooms to keep, e.g. bedroom,living")
    ap.add_argument("--delay", type=float, default=1.0, help="seconds between page requests")
    ap.add_argument("--max-minutes", type=float, default=50, help="stop and save what was collected after this long")
    ap.add_argument("--width", type=int, default=640, help="image width to request")
    ap.add_argument("--from-html", help="parse one saved product page and print JSON (no network)")
    ap.add_argument("--url", default=BASE + "/product/test-product-56101515sd00000", help="URL to pair with --from-html")
    a = ap.parse_args()

    if a.from_html:
        with open(a.from_html, encoding="utf-8") as f:
            print(json.dumps(parse_product(f.read(), a.url), indent=2, ensure_ascii=False))
        return 0

    rp = urllib.robotparser.RobotFileParser(BASE + "/robots.txt")
    try:
        rp.read()
    except Exception:
        rp = None
    keep = {r.strip() for r in a.rooms.split(",") if r.strip()}

    items, failed, skipped = [], 0, 0
    started = time.time()
    for url, imgs in sitemap_products(SITEMAP_INDEX):
        if a.limit and len(items) >= a.limit:
            break
        if time.time() - started > a.max_minutes * 60:
            print("Time limit reached; saving %d products collected so far." % len(items), file=sys.stderr)
            break
        if rp and not rp.can_fetch(UA, url):
            skipped += 1
            continue
        try:
            item = parse_product(fetch(url), url, imgs, a.width)
        except Exception as e:
            print("  ! %s: %s" % (url, e), file=sys.stderr)
            item = None
        if item and (not keep or item["room"] in keep):
            items.append(item)
            print("%4d  %-8s %8s  %s" % (len(items), item["room"], item["from"], item["name"]))
        elif item is None:
            failed += 1
        time.sleep(a.delay)

    if not items:
        print("No products parsed; catalogue left unchanged.", file=sys.stderr)
        return 1
    write_catalog(items, a.out)
    print("Wrote %d product pages to %s as %d cards, colour variants folded (%d failed, %d blocked by robots.txt)"
          % (len(items), a.out, len(finalise(list(items))), failed, skipped))
    return 0


if __name__ == "__main__":
    sys.exit(main())
