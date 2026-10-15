"""Writes site/sitemap.xml: the main pages plus one product.html?id=<id> page per catalogue product.

Run after tools/scrape_interio.py (the weekly 'Sync Interio catalogue' action does this), or by hand:
    python3 tools/build_sitemap.py
"""
import json
import re
from pathlib import Path
from xml.sax.saxutils import escape

BASE = "https://hdefurniture.netlify.app/"  # keep in step with business.siteUrl in site/assets/js/config.js
ROOT = Path(__file__).resolve().parent.parent / "site"
PAGES = [  # (page, priority)
    ("", "1.0"), ("collections.html", "0.9"), ("stores.html", "0.9"), ("contact.html", "0.8"),
    ("about.html", "0.6"), ("elite-card.html", "0.5"), ("room-planner.html", "0.5"),
]


def catalogue():
    text = (ROOT / "assets/js/catalog.js").read_text(encoding="utf-8")
    body = text[text.index("window.HDE_CATALOG = ") + len("window.HDE_CATALOG = "):].rstrip().rstrip(";")
    data = json.loads(re.sub(r"\b(updated|rooms|products)\s*:", r'"\1":', body))
    return data.get("updated", ""), data.get("products", [])


def main():
    updated, products = catalogue()
    urls = [(BASE + page, prio, "") for page, prio in PAGES]
    seen = set()
    for p in products:
        pid = p.get("id")
        if pid and pid not in seen:
            seen.add(pid)
            urls.append((BASE + "product.html?id=" + pid, "0.6", updated))
    rows = []
    for loc, prio, mod in urls:
        rows.append("  <url><loc>%s</loc>%s<priority>%s</priority></url>" % (
            escape(loc), "<lastmod>%s</lastmod>" % mod if mod else "", prio))
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "\n".join(rows) + "\n</urlset>\n"
    (ROOT / "sitemap.xml").write_text(xml, encoding="utf-8")
    print("sitemap.xml: %d pages (%d products)" % (len(urls), len(seen)))


if __name__ == "__main__":
    main()
