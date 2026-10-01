#!/usr/bin/env python3
"""Build the website catalogue from interio.com product pages.

Reads interio.com's public sitemaps, visits each /product/ page (politely, one
request at a time), and pulls the name, SKU, price, main photo and category
path from the page's Open Graph tags and breadcrumbs. Writes
site/assets/js/catalog.js, which the website loads automatically, plus one
site/assets/data/products/<id>.json per product with its photo gallery,
features and specifications for the product page.

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
# Interio files almirahs and lockers under Bedroom and shoe racks and display units under Living Room;
# the website shows them in its own Storage room, so these slugs win over the top-level category.
STORAGE_CATEGORIES = {
    "steel-almirahs", "home-lockers", "digital-lockers", "biometric-lockers", "manual-lockers",
    "shoe-racks", "storage-cabinets", "display-units",
}
# Landing pages whose products are collected first (before the sitemap), so ranges that sit late in the
# sitemap still make it into a time-limited sync. A room files every product under that room; None keeps
# each product's own room (listing pages also show related items from other rooms). Listing pages are
# followed through ?p=2, 3, ... until a page shows no new products.
FEATURED_PAGES = [
    ("/modular-kitchen", "kitchen"),
    ("/all-products/almirahs-wardrobes/steel-almirahs", None),
    ("/all-products/home-lockers", None),
    ("/all-products/cabinets/shoe-racks", None),
    ("/all-products/cabinets/storage-cabinets", None),
    ("/all-products/cabinets/display-units", None),
]
MAX_LISTING_PAGES = 40
# Fallback when a page has no usable breadcrumb: first keyword that matches the product name wins.
ROOM_KEYWORDS = [
    ("bedroom", ["bedside", "sofa cum bed", "diwan"]),
    ("storage", ["almirah", "locker", "shoe rack", "shoe cabinet", "display unit", "display cabinet", "storage cabinet"]),
    ("kitchen", ["kitchen", "chimney", "hob "]),
    ("dining", ["dining", "crockery"]),
    ("living", ["sofa", "recliner", "lounger", "tv unit", "centre table", "center table", "coffee table", "corner table",
                "side table", "bean bag", "pouffe", "ottoman"]),
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


def featured_products(pages, delay=1.0):
    """Yield (product_url, [], room) for every /product/ link on the given landing pages and their next pages."""
    for path, room in pages:
        seen = set()
        for n in range(1, MAX_LISTING_PAGES + 1):
            url = BASE + path + ("?product_list_limit=36&p=%d" % n if n > 1 else "?product_list_limit=36")
            try:
                page = fetch(url)
            except Exception as e:
                print("  ! %s: %s" % (url, e), file=sys.stderr)
                break
            new = []
            for m in re.finditer(r'href="((?:https://interio\.com)?/product/[^"?#]+)"', page):
                link = urllib.parse.urljoin(BASE, m.group(1))
                if link.lower() not in seen:
                    seen.add(link.lower())
                    new.append(link)
            for link in new:
                yield link, [], room
            if not new:
                break
            time.sleep(delay)
        print("  %s: %d products listed" % (path, len(seen)), file=sys.stderr)


def all_products(index_url, pages):
    """Featured landing-page products first, then the sitemap, each URL once."""
    seen = set()
    for url, imgs, room in featured_products(pages):
        seen.add(url.lower())
        yield url, imgs, room
    for url, imgs in sitemap_products(index_url):
        if url.lower() not in seen:
            yield url, imgs, None


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
    if any(slug in STORAGE_CATEGORIES for slug in cat_path) or "almirah" in name.lower():
        return "storage"
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
    m = re.search(r"great deals(?: &(?:amp;)? offers)? on (?:various )?(.+?)(?:\s+(?:with|by)\b|[.!\u2714]|$)", desc, re.I)
    return m.group(1).strip() if m else ""


def pretty(slug):
    return slug.replace("-", " ").strip().capitalize()


def image_url(src, width):
    """Ask Interio's image service for a web-sized copy instead of the 1920px original."""
    if not src:
        return ""
    base = src.split("?")[0]
    return base + "?optimize=high&bg-color=255,255,255&fit=bounds&width=%d" % width


def text(fragment):
    t = re.sub(r"<[^>]+>", " ", fragment)
    return re.sub(r"\s+", " ", html.unescape(t)).strip()


# Product-page rows worth showing; the others (registered address, net quantity) are legal boilerplate.
SPEC_LABELS = {
    "Dimensions W x H x D": "Size (W x H x D, cm)", "Finish Color": "Colour", "Weight": "Weight",
    "Warranty": "Warranty", "Primary Material": "Material", "Primary Material Subtype": "Made of",
    "Delivery Condition": "Delivery", "Country of origin": "Made in",
}


def tab_rows(page_html, tab):
    m = re.search(r'<div id="tab-%s" class="tab-content[^"]*">(.*?)</ul>' % tab, page_html, re.S)
    rows = []
    for li in re.findall(r"<li>(.*?)</li>", m.group(1) if m else "", re.S):
        lab = re.search(r"<label>(.*?)(?:<label|</label>)", li, re.S)
        val = re.search(r"<strong>(.*?)</strong>", li, re.S)
        if lab and val and text(val.group(1)):
            rows.append((text(lab.group(1)).rstrip(":"), text(val.group(1))))
    return rows


def parse_details(page_html, width=900, cfg=None, sku=""):
    """Gallery, 'why choose' intro, feature points, specifications and care text from a product page."""
    gallery = []
    page_sku = re.search(r'data-product-sku="([^"]+)"', page_html)
    page_sku = page_sku.group(1).lower() if page_sku else ""
    g = re.search(r'"mage/gallery/gallery".*?"data":\s*(\[.*?\])\s*,\s*"options"', page_html, re.S)
    if g:
        try:
            for it in json.loads(g.group(1)):
                if it.get("type", "image") == "image" and it.get("full"):
                    u = image_url(it["full"], width)
                    if u not in gallery:
                        gallery.append(u)
        except ValueError:
            pass
    # Keep this product's own photos; generic banners (offers, warranty cards) don't carry the SKU.
    own = [u for u in gallery if any(k and k in u.lower() for k in (page_sku, (sku or "").lower()))]
    gallery = own or gallery
    desc = re.search(r'class="product attribute description">(.*?)<div class="productpdp-tabs-content', page_html, re.S)
    desc = desc.group(1) if desc else ""
    short = ""
    cid = config_child(cfg or {}, sku)
    if cid:
        # Configurable pages load each option's description from jsonConfig instead of the page body.
        d = (cfg.get("descriptions") or {}).get(cid) or []
        if not desc and d and isinstance(d[0], dict):
            desc = d[0].get("description") or ""
        info = ((cfg.get("child_info") or {}).get(cid) or {}).get("review_html") or ""
        m = re.search(r'id="short-info-text">(.*?)</span>', info, re.S)
        short = text(m.group(1)) if m else ""
    intro = re.search(r'class="custom-title-text">(.*?)</span>', desc, re.S)
    pics = re.findall(r'<img[^>]+src="([^"]+/wysiwyg/[^"]+)"', desc)
    features = []
    for i, (title, body) in enumerate(re.findall(r'class="slider-description">\s*<h2>(.*?)</h2>\s*<p>(.*?)</p>', desc, re.S)):
        features.append({"title": text(title), "text": text(body), "image": pics[i] if i < len(pics) else ""})
    specs, category = [], ""
    for tab in ("specifications", "materials", "additionalinformation"):
        for label, value in tab_rows(page_html, tab):
            if label == "Product Category":
                category = value
            if label in SPEC_LABELS and SPEC_LABELS[label] not in [k for k, _ in specs]:
                specs.append((SPEC_LABELS[label], value))
    care = dict(tab_rows(page_html, "godrejcareinstructions")).get("Care instructions", "")
    return {
        "gallery": gallery[:8],
        "intro": text(intro.group(1)) if intro else "",
        "features": features[:6],
        "specs": [list(r) for r in specs],
        "care": care,
        "category": category,
        "short": short,
    }


def spec_note(specs):
    """'1-Year Warranty, Wenge, Engineered Wood' from the specification rows."""
    d = dict(specs)
    parts = [d.get("Warranty", "").replace(" Year Warranty", "-Year Warranty"), d.get("Colour", ""), d.get("Made of") or d.get("Material", "")]
    return ", ".join(p for p in parts if p)


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
    if "\u00c2" in name or "\u00c3" in name:  # UTF-8 read twice, e.g. "SpinefineÂ®"
        try:
            name = name.encode("latin-1").decode("utf-8")
        except (UnicodeEncodeError, UnicodeDecodeError):
            pass
    sku = product_ld.get("sku") or m.get("product:retailer_item_id") or ""
    if not sku:
        tail = re.search(r"-([0-9a-z]{10,})$", url.rstrip("/"))
        sku = tail.group(1).upper() if tail else ""
    price = to_number(offers.get("price") or m.get("product:price:amount") or m.get("og:price:amount"))
    cfg = json_config(page_html)
    mrp = to_number(m.get("product:original_price:amount") or m.get("product:regular_price:amount")) or page_mrp(page_html, price, cfg, sku)
    ld_img = product_ld.get("image")
    if isinstance(ld_img, list):
        ld_img = ld_img[0] if ld_img else None
    if isinstance(ld_img, dict):
        ld_img = ld_img.get("url")
    img = m.get("og:image") or ld_img or (sitemap_images[0] if sitemap_images else "")
    desc = html.unescape(m.get("og:description") or m.get("description") or product_ld.get("description") or "").strip()
    cats = category_path(p)
    details = parse_details(page_html, cfg=cfg, sku=sku)
    cid = config_child(cfg, sku)
    if cid and not desc:
        desc = html.unescape((cfg.get("metaDescriptions") or {}).get(cid) or "")
    kind = deal_type(desc) or details["category"] or (pretty(cats[-1]) if cats else "")
    # Some almirah pages carry another category's text ("Bed", "Mattress") or none at all.
    if "almirah" in name.lower() and "almirah" not in kind.lower():
        kind = "Steel Almirahs"
    if not name or price is None:
        return None
    details.pop("category")
    short = details.pop("short")
    return {
        "slugName": slug_name(url, sku),
        "id": (sku or url.rstrip("/").rsplit("/", 1)[-1]).lower(),
        "sku": sku.upper(),
        "name": name,
        "room": room_for(cats, kind + " " + name),
        "type": kind[:1].upper() + kind[1:],
        "family": name,
        # The site shows the MRP; HDE offers its own discount when the enquiry comes in, so
        # Interio's online selling price is deliberately not stored. `mrp` says the figure is an MRP.
        "from": round(mrp if mrp and mrp >= price else price),
        "mrp": bool(mrp and mrp >= price),
        "note": spec_note(details["specs"]) or short or short_note(desc),
        "image": image_url(img, width),
        "source": url,
        "details": details,
    }


def json_config(page_html):
    """The jsonConfig block of a configurable product (sizes or colours as child products)."""
    i = page_html.find('"jsonConfig":')
    if i < 0:
        return {}
    try:
        return json.JSONDecoder().raw_decode(page_html[page_html.index("{", i):])[0]
    except ValueError:
        return {}


def config_child(cfg, sku):
    """Child product id in a jsonConfig whose SKU matches this page's SKU."""
    for cid, csku in (cfg.get("sku") or {}).items():
        if str(csku).lower() == (sku or "").lower():
            return cid
    return None


def page_mrp(page_html, price, cfg=None, sku=""):
    """The MRP Interio shows struck through ("MRP ₹20,476") next to its online price.

    The main product's price box has a finalPrice span followed by an oldPrice span;
    related-product boxes further down have their own, so match the one carrying `price`."""
    if price is None:
        return None
    if cfg:
        # Configurable products (mattress sizes, colours) carry each option's MRP in jsonConfig.
        cid = config_child(cfg, sku)
        opt = (cfg.get("optionPrices") or {}).get(cid) if cid else None
        old = ((opt or cfg.get("prices") or {}).get("oldPrice") or {}).get("amount")
        if old:
            return to_number(old)
    for m in re.finditer(r'data-price-amount="([\d.]+)" data-price-type="finalPrice"', page_html):
        if to_number(m.group(1)) != price:
            continue
        old = re.search(r'data-price-amount="([\d.]+)" data-price-type="oldPrice"', page_html[m.end():m.end() + 800])
        return to_number(old.group(1)) if old else None
    tag = re.search(r'id="price-info-text"[^>]*>\s*MRP\s*(?:&#8377;|₹)?\s*([\d,]+)', page_html)
    return to_number(tag.group(1)) if tag else None


def short_note(desc):
    """Keep the useful middle of 'Shop X 1-Year Warranty, Oak, Particle Board Online from Interio ...'."""
    d = re.sub(r"\s+", " ", desc)
    m = re.search(r"(\d+[- ]Years?\s+Warranty.*?)\s+Online from", d, re.I)
    return (m.group(1) if m else d)[:120].strip(" ,")


def option_colour(item):
    """The Colour spec of a product, used to tell apart options that share a name."""
    for label, value in (item.get("details") or {}).get("specs", []):
        if label == "Colour":
            return value
    return ""


def finalise(items):
    """Drop unpriced items and fold sizes/colours/finishes of one design (same short name) into one card.

    A folded card keeps the lowest price and says how many options exist; `fromPrice` marks
    that the options are priced differently, so the site labels it "Starting from".
    `options` lists every size/colour (id, name, price) so the product page can switch between them."""
    groups = {}
    for it in items:
        if it.get("from"):
            groups.setdefault(it["family"].lower(), []).append(it)
    out = []
    for members in groups.values():
        members.sort(key=lambda x: x["from"])
        card = dict(members[0])
        card.pop("details", None)
        if len(members) > 1:
            names = [m.get("slugName") or m["name"] for m in members]
            if len(set(n.lower() for n in names)) < len(names):
                # Same name for every option (e.g. kitchen sets in different finishes): label them by colour.
                names = [option_colour(m) or n for m, n in zip(members, names)]
            card["options"] = [{"id": m["id"], "name": n, "price": m["from"]} for m, n in zip(members, names)]
            card["name"] = card["family"]
            card["variants"] = len(members)
            if members[-1]["from"] != members[0]["from"]:
                card["fromPrice"] = True
        else:
            card["name"] = card.get("slugName") or card["name"]
        card.pop("slugName", None)
        out.append(card)
    return out


def write_details(items, folder):
    """One JSON file per product page, loaded by site/product.html; stale files are removed."""
    import os
    os.makedirs(folder, exist_ok=True)
    keep = set()
    for it in items:
        if not it.get("from") or not it.get("details"):
            continue
        name = it["id"] + ".json"
        keep.add(name)
        d = dict(it["details"], id=it["id"], sku=it["sku"], name=it.get("slugName") or it["name"],
                 price=it["from"], mrp=it["mrp"], image=it["image"])
        with open(os.path.join(folder, name), "w", encoding="utf-8") as f:
            json.dump(d, f, ensure_ascii=False, separators=(",", ":"))
    for old in os.listdir(folder):
        if old.endswith(".json") and old not in keep:
            os.remove(os.path.join(folder, old))


def host_images(cards, folder, delay=0.3):
    """Keep a copy of each card photo on the site (assets/img/products/<id>.jpg).

    Same-origin photos load faster and let the room planner cut the studio background away,
    which the browser only allows for images it may read. Existing copies are reused."""
    import os
    os.makedirs(folder, exist_ok=True)
    keep = set()
    for c in cards:
        src = c.get("image") or ""
        if not src.startswith("http") or "placeholder" in src:
            continue
        name = c["id"] + ".jpg"
        path = os.path.join(folder, name)
        if not os.path.exists(path):
            try:
                req = urllib.request.Request(src, headers={"User-Agent": UA})
                with urllib.request.urlopen(req, timeout=30) as r:
                    data = r.read()
                with open(path, "wb") as f:
                    f.write(data)
                time.sleep(delay)
            except Exception as e:
                print("  ! photo %s: %s" % (c["id"], e), file=sys.stderr)
                continue
        keep.add(name)
        c["remoteImage"] = src
        c["image"] = "assets/img/products/" + name
    for old in os.listdir(folder):
        if old.endswith(".jpg") and old not in keep:
            os.remove(os.path.join(folder, old))


def room_photos(items, cards, folder, today=None):
    """This week's photo for each room tile on the home page, taken from a product in that room.

    Picks one product per room at random, seeded by the ISO week, so the tiles change with each
    weekly sync but stay the same within a week. Interio's lifestyle shot (the product styled in a
    room, file names like '_a2_') is preferred over the plain studio photo."""
    import os
    import random
    os.makedirs(folder, exist_ok=True)
    year, week, _ = (today or dt.date.today()).isocalendar()
    listed = {c["id"] for c in cards} | {o["id"] for c in cards for o in c.get("options", [])}
    picks = {}
    for room in sorted({c["room"] for c in cards}):
        pool = []
        for it in items:
            gal = (it.get("details") or {}).get("gallery") or []
            if it["room"] != room or it["id"] not in listed or not gal:
                continue
            life = [u for u in gal if re.search(r"_a\d+_", u.split("?")[0])]
            pool.append((it, (life or gal)[0], bool(life)))
        styled = [p for p in pool if p[2]]
        pool = sorted(styled or pool, key=lambda p: p[0]["id"])
        if not pool:
            continue
        it, url, _ = random.Random("%d-%d-%s" % (year, week, room)).choice(pool)
        path = os.path.join(folder, room + ".jpg")
        try:
            req = urllib.request.Request(image_url(url, 1200), headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=30) as r:
                data = r.read()
            with open(path, "wb") as f:
                f.write(data)
        except Exception as e:
            print("  ! room photo %s: %s" % (room, e), file=sys.stderr)
            continue
        # The week in the query string makes browsers fetch the new photo instead of a cached one.
        picks[room] = {"image": "assets/img/rooms/%s.jpg?w=%d-%02d" % (room, year, week),
                       "id": it["id"], "name": it.get("slugName") or it["name"]}
    return picks


def write_catalog(items, path, images_dir=None, rooms_dir=None):
    cards = finalise(items)
    rooms = room_photos(items, cards, rooms_dir) if rooms_dir else {}
    items = cards
    if images_dir:
        host_images(items, images_dir)
    items.sort(key=lambda x: (x["room"], x["type"], x["name"]))
    stamp = dt.datetime.utcnow().strftime("%Y-%m-%d")
    body = json.dumps(items, ensure_ascii=False, indent=1)
    with open(path, "w", encoding="utf-8") as f:
        f.write("/* Generated by tools/scrape_interio.py on %s from interio.com. Do not edit by hand:\n"
                " * re-run the script (or the 'Sync Interio catalogue' GitHub action) instead. */\n" % stamp)
        f.write("window.HDE_CATALOG = { updated: %s, rooms: %s, products: %s };\n"
                % (json.dumps(stamp), json.dumps(rooms, ensure_ascii=False), body))


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--out", default="site/assets/js/catalog.js")
    ap.add_argument("--details-dir", default="site/assets/data/products", help="where per-product JSON files go")
    ap.add_argument("--images-dir", default="site/assets/img/products", help="where card photos are copied ('' to link to interio.com)")
    ap.add_argument("--rooms-dir", default="site/assets/img/rooms", help="where this week's room-tile photos go ('' to keep the stock photos)")
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
    for url, imgs, room in all_products(SITEMAP_INDEX, FEATURED_PAGES):
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
        if item and room:
            item["room"] = room
        if item and (not keep or item["room"] in keep):
            items.append(item)
            print("%4d  %-8s %8s  %s" % (len(items), item["room"], item["from"], item["name"]))
        elif item is None:
            failed += 1
        time.sleep(a.delay)

    if not items:
        print("No products parsed; catalogue left unchanged.", file=sys.stderr)
        return 1
    write_details(items, a.details_dir)
    write_catalog(items, a.out, a.images_dir or None, a.rooms_dir or None)
    print("Wrote %d product pages to %s as %d cards, colour variants folded (%d failed, %d blocked by robots.txt)"
          % (len(items), a.out, len(finalise(list(items))), failed, skipped))
    return 0


if __name__ == "__main__":
    sys.exit(main())
