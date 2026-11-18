"""Writes one real HTML page per catalogue product: site/product/<id>.html.

Search engines read these pages without running any script, so each product can be found on Google with
its own title, description, photo, MRP and specifications. In the browser, assets/js/main.js then redraws
the same content and adds the size and colour picker, the WhatsApp button and the suggestions.

Other sizes and colours of a product have no page of their own: they open in product.html?id=<option id>
and tell Google that the product's own page is the one to index.

Run after tools/scrape_interio.py (the weekly 'Sync Interio catalogue' action does this), or by hand:
    python3 tools/build_products.py
"""
import html
import json
import re
from pathlib import Path

BASE = "https://hdefurniture.netlify.app/"  # keep in step with business.siteUrl in site/assets/js/config.js
ROOT = Path(__file__).resolve().parent.parent / "site"
OUT = ROOT / "product"
BUSINESS = "Home Decor Enterprises"
CITY = "Dehradun"
SHOWROOM = "Patel Nagar"  # the open showroom; keep in step with assets/js/config.js
ROOM_NAMES = {"living": "Living Room", "bedroom": "Bedroom", "kitchen": "Modular Kitchen", "dining": "Dining",
              "office": "Home Office", "storage": "Storage"}
# The Dehradun page that lists each kind of product, so every product links back to its category.
LANDING = [
    (("Sofas", "Sofa", "Sofa Sets", "L shaped sofas", "Sofa cum Beds", "Sofa Cum Bed"), "sofas-in-dehradun.html", "Sofas in Dehradun"),
    (("Recliners",), "recliners-in-dehradun.html", "Recliners in Dehradun"),
    (("Wooden Beds", "Metal Beds"), "beds-in-dehradun.html", "Beds in Dehradun"),
    (("Mattress",), "mattress-in-dehradun.html", "Mattresses in Dehradun"),
    (("Steel Almirahs", "Wooden Wardrobes"), "godrej-almirah-in-dehradun.html", "Godrej almirahs in Dehradun"),
    (("Biometric Lockers", "Digital Lockers", "Manual Lockers"), "home-lockers-in-dehradun.html", "Home lockers in Dehradun"),
    (("Dining Tables", "Dining Sets", "Dining Set"), "dining-tables-in-dehradun.html", "Dining tables in Dehradun"),
    (("Office Chairs", "Work desks & Study Tables"), "office-chairs-in-dehradun.html", "Office chairs in Dehradun"),
    (("Modular Kitchen Sets",), "modular-kitchen-in-dehradun.html", "Modular kitchens in Dehradun"),
]
KEY_SPECS = ("Size (W x H x D, cm)", "Colour", "Made of", "Warranty")


def esc(s):
    return html.escape(str(s if s is not None else ""), quote=True)


def rupees(n):
    """Indian grouping, as the site shows it: 1,23,456."""
    s = str(int(round(float(n))))
    if len(s) <= 3:
        return "₹" + s
    head, tail = s[:-3], s[-3:]
    parts = []
    while len(head) > 2:
        parts.insert(0, head[-2:])
        head = head[:-2]
    if head:
        parts.insert(0, head)
    return "₹" + ",".join(parts) + "," + tail


def catalogue():
    text = (ROOT / "assets/js/catalog.js").read_text(encoding="utf-8")
    body = text[text.index("window.HDE_CATALOG = ") + len("window.HDE_CATALOG = "):].rstrip().rstrip(";")
    data = json.loads(re.sub(r"\b(updated|rooms|products)\s*:", r'"\1":', body))
    return data.get("products", [])


def details(pid):
    f = ROOT / "assets/data/products" / (pid + ".json")
    try:
        return json.loads(f.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None


def ld(data, tag_id=""):
    return '  <script type="application/ld+json"%s>%s</script>\n' % (
        ' id="%s"' % tag_id if tag_id else "", json.dumps(data, ensure_ascii=False).replace("</", "<\\/"))


def set_meta(h, key, value):
    return re.sub(r'(<meta (?:property|name)="%s" content=")[^"]*(">)' % re.escape(key),
                  lambda m: m.group(1) + esc(value) + m.group(2), h, count=1)


def picture(src, label, alt, eager=False):
    return '<div class="ph" data-label="%s"><img src="%s" alt="%s"%s decoding="async" width="900" height="675"></div>' % (
        esc(label), esc(src), esc(alt), "" if eager else ' loading="lazy"')


def landing_for(card):
    for types, page, label in LANDING:
        if card.get("type") in types:
            return page, label
    return None


def small_card(p):
    label = ("MRP" if p.get("mrp") else "Price") + (" from" if p.get("fromPrice") else "")
    link = "product/%s.html" % p["id"]
    return ('<article class="card card--link"><a href="%s" tabindex="-1" aria-hidden="true">%s</a>'
            '<div class="card-body"><span class="card-type">%s</span><h3><a href="%s">%s</a></h3><p class="card-note">%s</p>'
            '<div class="card-foot"><span class="price"><small>%s</small><b>%s</b></span></div></div></article>') % (
        link, picture(p["image"], ROOM_NAMES.get(p["room"], ""), p["name"]), esc(p.get("type")), link, esc(p["name"]),
        esc(p.get("note")), label, rupees(p["from"]))


def build(card, template, similar):
    pid = card["id"]
    d = details(pid) or {}
    url = BASE + "product/" + pid + ".html"
    room = ROOM_NAMES.get(card["room"], "Furniture")
    name = d.get("name") or card["name"]
    price = d.get("price") or card.get("from")
    is_mrp = d.get("mrp", card.get("mrp"))
    gallery = d.get("gallery") or [card["image"]]
    specs = d.get("specs") or []
    key = [r for r in specs if r[0] in KEY_SPECS]
    price_text = ("MRP " if is_mrp else "") + rupees(price)
    note = (card.get("note") or "").rstrip(". ")
    desc = "%s, %s.%s See it at our %s showroom in %s and ask for today's best price." % (
        name, price_text, " " + note + "." if note else "", SHOWROOM, CITY)
    img = card["image"]
    own_image = img if img.startswith("http") else BASE + img  # not yet hosted on the site

    h = template
    h = re.sub(r"<title>.*?</title>", lambda m: "<title>%s</title>" % esc("%s in %s | %s" % (name, CITY, BUSINESS)), h, count=1)
    h = set_meta(h, "description", desc)
    for k in ("og:title", "twitter:title"):
        h = set_meta(h, k, name)
    for k in ("og:description", "twitter:description"):
        h = set_meta(h, k, desc)
    for k in ("og:image", "og:image:secure_url", "twitter:image"):
        h = set_meta(h, k, own_image)
    h = set_meta(h, "og:image:alt", name)
    h = set_meta(h, "og:type", "product")
    h = re.sub(r'  <meta property="og:image:(?:type|width|height)" content="[^"]*">\n', "", h)
    h = re.sub(r'(<link rel="canonical" href=")[^"]*(">)', lambda m: m.group(1) + url + m.group(2), h, count=1)
    h = h.replace('  <link rel="canonical"', '  <meta property="og:url" content="%s">\n  <link rel="canonical"' % url, 1)
    # Pages live one folder down; this keeps every link, script and image address the same as on other pages.
    h = h.replace('  <title>', '  <base href="../">\n  <title>', 1)

    product = {"@context": "https://schema.org", "@type": "Product", "name": name, "url": url,
               "image": [g if g.startswith("http") else BASE + g for g in gallery[:4]],
               "sku": d.get("sku") or card.get("sku"), "brand": {"@type": "Brand", "name": "Godrej Interio"}}
    if card.get("type"):
        product["category"] = card["type"]
    if card.get("note"):
        product["description"] = card["note"]
    if price:
        product["offers"] = {"@type": "Offer", "price": int(round(float(price))), "priceCurrency": "INR", "url": url,
                             "seller": {"@type": "Organization", "name": BUSINESS}}
    crumbs = {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Home", "item": BASE},
        {"@type": "ListItem", "position": 2, "name": room, "item": BASE + "collections.html#" + card["room"]},
        {"@type": "ListItem", "position": 3, "name": name, "item": url}]}
    h += ld(product, "product-ld") + ld(crumbs)

    out = [h, '</head>\n<body data-page="product">\n',
           "  <!-- Generated by tools/build_products.py. Edit that script, not this file. -->\n",
           '  <div id="site-header"></div>\n\n  <main id="main" data-product-page data-product-id="%s">\n' % esc(pid)]
    out.append('    <div class="wrap pdp-crumbs"><p class="crumbs"><a href="index.html">Home</a> / <a href="collections.html#%s">%s</a> / %s</p></div>\n'
               % (esc(card["room"]), esc(room), esc(name)))
    out.append('    <section class="wrap pdp">\n      <div class="pdp-gallery"><div class="pdp-main">%s</div></div>\n'
               % picture(gallery[0], room, name, eager=True))
    out.append('      <div class="pdp-info">\n        <span class="card-type">%s</span>\n        <h1>%s</h1>\n' % (esc(card.get("type") or room), esc(name)))
    out.append('        <p class="price pdp-price"><small>%s</small><b>%s</b></p>\n'
               % ("MRP (inclusive of all taxes)" if is_mrp else "Price", rupees(price)))
    out.append("        <p class=\"pdp-emi\">Ask us for today's discount. No-cost EMI and exchange with free pickup available.</p>\n")
    options = card.get("options") or []
    if len(options) > 1:
        out.append('        <p class="card-note">Also available as: %s.</p>\n' % esc("; ".join(
            "%s (%s%s)" % (o["name"], "MRP " if is_mrp else "", rupees(o["price"])) for o in options if o["id"] != pid)))
    if key:
        out.append('        <dl class="pdp-key">%s</dl>\n' % "".join("<div><dt>%s</dt><dd>%s</dd></div>" % (esc(r[0]), esc(r[1])) for r in key))
    elif card.get("note"):
        out.append('        <p class="card-note">%s</p>\n' % esc(card["note"]))
    out.append('        <div class="pdp-actions"><button class="btn btn--primary" type="button" data-enquire data-product="%s" data-interest="%s" data-source="product">Get best price</button>'
               '<a class="btn btn--ghost" href="stores.html">Directions and timings</a></div>\n' % (esc(name), esc(room)))
    out.append('        <ul class="pdp-perks"><li>Timely delivery by our local team in %s</li><li>Genuine Godrej Interio warranty, serviced by our local team</li>'
               '<li>See it at our %s showroom</li></ul>\n      </div>\n    </section>\n' % (CITY, SHOWROOM))

    features = d.get("features") or []
    if d.get("intro") or features:
        out.append('    <section class="section section--stone"><div class="wrap"><div class="section-head"><div><h2>Why you will like it</h2>%s</div></div>\n'
                   % ("<p>%s</p>" % esc(d["intro"]) if d.get("intro") else ""))
        out.append('      <div class="pdp-features">%s</div></div></section>\n' % "".join(
            '<article class="pdp-feature">%s<h3>%s</h3><p>%s</p></article>' % (
                picture(f["image"], room, "") if f.get("image") else "", esc(f.get("title")), esc(f.get("text"))) for f in features))
    if specs or d.get("care"):
        out.append('    <section class="section"><div class="wrap pdp-specs"><div><h2>Specifications</h2><table class="spec-table"><tbody>%s</tbody></table></div>%s</div></section>\n' % (
            "".join('<tr><th scope="row">%s</th><td>%s</td></tr>' % (esc(r[0]), esc(r[1])) for r in specs),
            "<div><h2>Care</h2><p>%s</p></div>" % esc(d["care"]) if d.get("care") else ""))
    if similar:
        land = landing_for(card)
        more = '<a class="link-arrow" href="%s">%s</a>' % (land[0], esc(land[1])) if land else \
               '<a class="link-arrow" href="collections.html#%s">All %s</a>' % (esc(card["room"]), esc(room.lower()))
        out.append('    <section class="section section--stone"><div class="wrap"><div class="section-head"><div><h2>You may also like</h2></div>%s</div>\n'
                   '      <div class="grid-products">%s</div></div></section>\n' % (more, "".join(small_card(p) for p in similar)))
    out.append('  </main>\n\n  <div id="site-footer"></div>\n\n'
               '  <script src="assets/js/config.js"></script>\n  <script src="assets/js/data.js"></script>\n'
               '  <script src="assets/js/catalog.js"></script>\n  <script src="assets/js/suggest.js"></script>\n'
               '  <script src="assets/js/main.js"></script>\n  <script src="assets/js/agent.js" defer></script>\n  <script src="assets/js/install.js"></script>\n</body>\n</html>\n')
    (OUT / (pid + ".html")).write_text("".join(out), encoding="utf-8")


def main():
    products = [p for p in catalogue() if re.fullmatch(r"[a-z0-9_-]+", p.get("id") or "")]
    src = (ROOT / "product.html").read_text(encoding="utf-8")
    template = src[:src.index("</head>")]
    OUT.mkdir(exist_ok=True)
    by_room = {}
    for p in products:
        by_room.setdefault(p["room"], []).append(p)
    keep = set()
    for p in products:
        same = [q for q in by_room[p["room"]] if q is not p]
        same.sort(key=lambda q: q.get("type") != p.get("type"))  # same kind of product first; the sort is stable
        build(p, template, same[:4])
        keep.add(p["id"] + ".html")
    stale = [f for f in OUT.glob("*.html") if f.name not in keep]
    for f in stale:  # products that left the range
        f.unlink()
    print("product pages: %d written, %d removed" % (len(keep), len(stale)))


if __name__ == "__main__":
    main()
