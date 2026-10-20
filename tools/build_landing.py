"""Writes the Dehradun landing pages (site/<slug>.html): one per thing people search for,
such as "sofa shop in Dehradun" or "Godrej almirah Dehradun". Each page has its own copy plus
current products from the catalogue, so it is rebuilt by the weekly catalogue sync.

    python3 tools/build_landing.py
"""
import html
import json
import re
from pathlib import Path

BASE = "https://hdefurniture.netlify.app/"
ROOT = Path(__file__).resolve().parent.parent / "site"
SHOW = 12

VISIT = ("Our Patel Nagar showroom on Saharanpur Road, opposite Kolhi Petrol Pump, is open every day from "
         "11 AM to 8 PM with free parking. Our new Subhash Road showroom near ICICI Bank opens soon.")

# Shared answers. They repeat what the contact page FAQ already says; keep the two in step.
FAQ_PRICE = ("Are the prices online the final price?",
             "The prices shown are the Godrej Interio MRP. Call, WhatsApp or visit us and we will tell you today's best price.")
FAQ_DELIVERY = ("Do you deliver across Dehradun?",
                "Yes. Our own local team delivers on time across Dehradun. Delivery charges depend on the product and where you live, and we tell you the charge with your quote.")
FAQ_EMI = ("Do you offer EMI or exchange?",
           "Yes. No-cost EMI is available on card and paper finance, and you can exchange your old furniture with free pickup.")
FAQ_WHERE = ("Where can I see them in Dehradun?", VISIT)

PAGES = [
    {
        "slug": "sofas-in-dehradun", "room": "living", "interest": "Living Room",
        "types": ["Sofas", "Sofa", "Sofa Sets", "L shaped sofas", "Sofa cum Beds", "Sofa Cum Bed"],
        "title": "Sofa Shop in Dehradun | Godrej Interio Sofas, L-Shape and Sofa cum Beds",
        "desc": "Godrej Interio sofas in Dehradun: 3-seater, L-shape, sofa sets and sofa cum beds in fabric and leatherette. Sit on them at our Patel Nagar showroom. MRP shown, ask for today's best price.",
        "h1": "Sofas in Dehradun",
        "sub": "Fabric, leatherette, L-shape and sofa cum beds from Godrej Interio, ready to try at our Patel Nagar showroom.",
        "intro": [
            "A sofa is the one piece of furniture everyone in the house uses every day, so it is worth sitting on before you buy. At Home Decor Enterprises you can try Godrej Interio sofas side by side, compare cushion firmness and fabrics, and take home one that suits your room and your family.",
            "We have been a Godrej Interio channel partner in Dehradun since 2006. Below are some of the sofas in the current range, with their MRP. Many come in more sizes and colours than we can show here.",
        ],
        "tips": [
            ("Measure the wall first", "Leave about 75 cm in front for walking and a centre table. An L-shape suits a corner; a 3+1+1 set suits a square room."),
            ("Pick fabric for your home", "Leatherette wipes clean and suits homes with children. Fabric breathes better through Dehradun summers."),
            ("Sit before you choose", "Seat depth and cushion firmness feel very different in person. Come and try a few in the showroom."),
        ],
        "faq": [FAQ_WHERE, FAQ_PRICE, FAQ_DELIVERY, FAQ_EMI],
    },
    {
        "slug": "recliners-in-dehradun", "room": "living", "interest": "Living Room",
        "types": ["Recliners"],
        "title": "Recliners in Dehradun | Godrej Interio Manual and Motorised Recliners",
        "desc": "Godrej Interio single, two and three-seater recliners in Dehradun. Try them at our Patel Nagar showroom, open every day 11 AM to 8 PM. MRP shown, ask for today's best price.",
        "h1": "Recliners in Dehradun",
        "sub": "Single, two and three-seater Godrej Interio recliners to try at our Patel Nagar showroom.",
        "intro": [
            "A recliner is something you have to feel before you buy: how far it leans back, how the footrest rises, how firm the back is. Our Patel Nagar showroom has Godrej Interio recliners on display so you can try them yourself.",
            "Here are some of the recliners in the current range, with MRP. Ask us about colours and sizes not shown online.",
        ],
        "tips": [
            ("Allow space behind", "Most recliners need some room behind or in front to open fully. Check the space before you choose."),
            ("Manual or motorised", "Manual recliners need no socket. Motorised ones open at a touch, which helps elderly parents. Ask us which models come in each."),
            ("Try the footrest", "Sit back fully in the showroom and check that your legs are supported."),
        ],
        "faq": [FAQ_WHERE, FAQ_PRICE, FAQ_DELIVERY, FAQ_EMI],
    },
    {
        "slug": "beds-in-dehradun", "room": "bedroom", "interest": "Bedroom",
        "types": ["Wooden Beds", "Metal Beds"],
        "title": "Beds in Dehradun | Godrej Interio Storage, King and Queen Beds",
        "desc": "Godrej Interio king, queen and single beds in Dehradun, with hydraulic and box storage. See them at our Patel Nagar showroom. MRP shown, ask for today's best price.",
        "h1": "Beds in Dehradun",
        "sub": "King, queen and single beds from Godrej Interio, many with hydraulic or box storage.",
        "intro": [
            "A good bed lasts for years, so the frame, the storage and the finish all matter. At Home Decor Enterprises you can see Godrej Interio beds in person, open the storage, and match a mattress to the frame in one visit.",
            "Below are some of the beds in the current range, with MRP. Most are available in more sizes and finishes than shown here.",
        ],
        "tips": [
            ("King or queen", "A king bed takes a 72 x 78 inch mattress and a queen a 60 x 78 inch one. Leave about 60 cm on the sides you walk around."),
            ("Choose your storage", "Hydraulic storage lifts the whole base for easy access. Box storage with front drawers suits rooms where the bed sits against two walls."),
            ("Buy the mattress together", "Matching the mattress to the bed frame avoids gaps and sagging. We can help you pick both in the showroom."),
        ],
        "faq": [FAQ_WHERE, FAQ_PRICE, FAQ_DELIVERY, FAQ_EMI],
    },
    {
        "slug": "mattress-in-dehradun", "room": "bedroom", "interest": "Bedroom",
        "match": "mattress",
        "title": "Mattress Shop in Dehradun | Godrej Interio Foam, Spring and Orthopaedic Mattresses",
        "desc": "Godrej Interio foam, spring and orthopaedic mattresses in every size, in Dehradun. Lie down on them at our Patel Nagar showroom. MRP shown, ask for today's best price.",
        "h1": "Mattresses in Dehradun",
        "sub": "Foam, spring and orthopaedic Godrej Interio mattresses in single, queen and king sizes.",
        "intro": [
            "The only way to know if a mattress suits you is to lie on it. At our Patel Nagar showroom you can try Godrej Interio mattresses of different firmness and pick the right size for your bed.",
            "Here are some of the mattresses in the current range, with MRP and warranty. Most come in several sizes and thicknesses.",
        ],
        "tips": [
            ("Measure your bed", "Check the inside length and width of your bed frame. Common sizes are 72 x 36 (single), 78 x 60 (queen) and 78 x 72 inches (king)."),
            ("Firm or soft", "People with back pain often prefer a firmer, orthopaedic mattress. Side sleepers usually like a softer top."),
            ("Look at the warranty", "Godrej Interio mattresses carry the warranty shown on each product. Keep your bill safe."),
        ],
        "faq": [FAQ_WHERE, FAQ_PRICE, FAQ_DELIVERY, FAQ_EMI],
    },
    {
        "slug": "godrej-almirah-in-dehradun", "room": "storage", "interest": "Storage",
        "types": ["Steel Almirahs", "Wooden Wardrobes"],
        "title": "Godrej Almirah in Dehradun | Steel Almirahs and Wardrobes",
        "desc": "Godrej steel almirahs and wardrobes in Dehradun: 2-door, 3-door, with locker and mirror. See them at our Patel Nagar showroom. MRP shown, ask for today's best price.",
        "h1": "Godrej almirahs and wardrobes in Dehradun",
        "sub": "Steel almirahs with lockers and mirrors, and wooden wardrobes, from Godrej Interio.",
        "intro": [
            "A Godrej almirah is often bought once and kept for decades. At Home Decor Enterprises you can see Godrej Interio steel almirahs and wardrobes in person, check the shelves, lockers and locks, and choose the size and colour that suits your room.",
            "Below are some of the almirahs and wardrobes in the current range, with MRP. There are many more sizes, colours and door options than we can show online.",
        ],
        "tips": [
            ("Check the height", "Measure from floor to ceiling, and leave room above for the top to clear any beam or fan."),
            ("Locker and mirror", "Choose an almirah with an inside locker for valuables and a mirror if you will dress in the same room."),
            ("Door space", "Hinged doors need space in front to open fully. Sliding wardrobes suit narrow rooms."),
        ],
        "faq": [FAQ_WHERE, FAQ_PRICE, FAQ_DELIVERY, FAQ_EMI],
    },
    {
        "slug": "home-lockers-in-dehradun", "room": "storage", "interest": "Storage",
        "types": ["Biometric Lockers", "Digital Lockers", "Manual Lockers"],
        "title": "Godrej Home Lockers in Dehradun | Biometric, Digital and Manual Safes",
        "desc": "Godrej Interio home lockers and safes in Dehradun: biometric, digital and manual. See them at our Patel Nagar showroom. MRP shown, ask for today's best price.",
        "h1": "Home lockers in Dehradun",
        "sub": "Biometric, digital and manual Godrej Interio lockers for jewellery, cash and documents.",
        "intro": [
            "A home locker keeps jewellery, cash and important papers safe. At our Patel Nagar showroom you can try the locks yourself, from a simple key lock to fingerprint and digital keypad models.",
            "Here are the lockers in the current Godrej Interio range, with MRP.",
        ],
        "tips": [
            ("Pick the lock type", "Manual lockers need no batteries. Digital and biometric lockers open without a key, so there is nothing to lose."),
            ("Size for what you keep", "Measure jewellery boxes and document files before you choose an inside size."),
            ("Plan where it goes", "Lockers are heavy, so choose the spot before delivery and keep it out of sight."),
        ],
        "faq": [FAQ_WHERE, FAQ_PRICE, FAQ_DELIVERY],
    },
    {
        "slug": "dining-tables-in-dehradun", "room": "dining", "interest": "Dining",
        "types": ["Dining Tables", "Dining Sets", "Dining Set"],
        "title": "Dining Tables in Dehradun | Godrej Interio 4, 6 and 8 Seater Dining Sets",
        "desc": "Godrej Interio 4, 6 and 8-seater dining tables and sets in sheesham, engineered wood and glass, in Dehradun. See them at our Patel Nagar showroom. MRP shown, ask for today's best price.",
        "h1": "Dining tables in Dehradun",
        "sub": "Four, six and eight-seater Godrej Interio dining tables and sets.",
        "intro": [
            "A dining table brings the family together every day, so size, material and chair comfort all count. At Home Decor Enterprises you can sit at Godrej Interio dining sets and compare wood, finish and seating.",
            "Below are some of the dining tables and sets in the current range, with MRP. Chairs can often be bought separately to make up the number you need.",
        ],
        "tips": [
            ("Allow room for chairs", "Leave about 90 cm between the table edge and the wall so chairs can be pulled out."),
            ("Seats per person", "Allow about 60 cm of table edge for each person. A 6-seater suits most families of four with guests."),
            ("Material", "Solid sheesham wood is sturdy and warm. Engineered wood and glass tops are lighter and easy to clean."),
        ],
        "faq": [FAQ_WHERE, FAQ_PRICE, FAQ_DELIVERY, FAQ_EMI],
    },
    {
        "slug": "office-chairs-in-dehradun", "room": "office", "interest": "Home Office",
        "types": ["Office Chairs", "Work desks & Study Tables"],
        "title": "Office Chairs and Study Tables in Dehradun | Godrej Interio",
        "desc": "Godrej Interio ergonomic office chairs, work desks and study tables in Dehradun, for homes and offices. Try them at our Patel Nagar showroom. MRP shown, ask for today's best price.",
        "h1": "Office chairs and study tables in Dehradun",
        "sub": "Ergonomic Godrej Interio chairs, work desks and study tables for home, office and students.",
        "intro": [
            "If you sit for hours, the chair matters more than anything else on your desk. At our Patel Nagar showroom you can try Godrej Interio ergonomic chairs and adjust the height, back and arms to suit you.",
            "Here are some of the chairs, desks and study tables in the current range, with MRP.",
        ],
        "tips": [
            ("Adjustable is better", "Look for seat height, lumbar support and armrests that adjust, so the chair fits everyone who uses it."),
            ("Desk height", "Most people are comfortable at a 75 cm desk. Children's study tables are usually lower."),
            ("Buying for an office", "Tell us how many seats you need and we will quote for the whole order."),
        ],
        "faq": [FAQ_WHERE, FAQ_PRICE, FAQ_DELIVERY],
    },
    {
        "slug": "modular-kitchen-in-dehradun", "room": "kitchen", "interest": "Modular Kitchen",
        "types": ["Modular Kitchen Sets"], "kitchen": True,
        "title": "Modular Kitchen in Dehradun | Godrej Interio Steel and Wooden Kitchens",
        "desc": "Godrej Interio modular kitchens in Dehradun: Steel Chef steel kitchens, Willow Wok BWP ply and Flavors HDHMR. Free design consultation at our Patel Nagar showroom or on the phone.",
        "h1": "Modular kitchens in Dehradun",
        "sub": "Godrej Interio steel and wooden modular kitchens, designed to your layout.",
        "intro": [
            "A modular kitchen is planned around your room, your cooking and your budget. Bring your kitchen measurements to our Patel Nagar showroom, or share them over the phone, and we will help you choose the layout, material and finish in a free consultation.",
            "Godrej Interio offers three kitchen ranges, from rust-proof galvanised steel to boiling waterproof ply and moisture-resistant board.",
        ],
        "tips": [
            ("Pick the layout", "Straight, L-shape, U-shape, parallel or island. Your room shape and where the window and plumbing sit usually decide it."),
            ("Choose the material", "Steel resists termites, oil and moisture best. BWP ply gives a warm wooden look. HDHMR offers the widest shutter finishes."),
            ("Measure carefully", "Note wall lengths, window and door positions, and where the sink and gas point are. A photo helps too."),
        ],
        "faq": [FAQ_WHERE,
                ("How long does a modular kitchen take?", "Most kitchens are installed a few weeks after the design is approved. We give you a date with your quote."),
                ("Is the consultation really free?", "Yes. Talk to us in our showroom or over the phone, free and with no obligation to order."),
                FAQ_EMI],
    },
]

# Seasonal page: products grouped by budget instead of one category. Keep the copy free of offers
# and dates; HDE quotes its own festive price when the enquiry comes in.
PAGES.append({
    "slug": "diwali-furniture-dehradun", "room": None, "interest": "Diwali home refresh",
    "types": ["Recliners", "Sofas", "Sofa Sets", "L shaped sofas", "Wooden Beds", "Dining Sets", "Dining Tables",
              "Coffee Tables", "TV Units", "Digital Lockers", "Biometric Lockers", "Office Chairs", "Shoe Racks"],
    "bands": [("Under ₹15,000", 0, 15000), ("₹15,000 to ₹40,000", 15000, 40000), ("₹40,000 and above", 40000, 10**9)],
    "title": "Diwali Furniture in Dehradun | Godrej Interio Sofas, Beds, Dining and Lockers | Home Decor Enterprises",
    "desc": "Planning a Diwali home refresh in Dehradun? Godrej Interio sofas, recliners, beds, dining sets and home lockers at MRP, grouped by budget. Visit our Patel Nagar showroom and ask for today's best price.",
    "h1": "Diwali furniture in Dehradun",
    "sub": "Refresh your home for the festive season with Godrej Interio furniture, picked by budget.",
    "intro": [
        "Diwali is when many Dehradun families finally replace the old sofa, add a dining set before guests arrive, or buy a home locker for the jewellery. At Home Decor Enterprises you can see the Godrej Interio range in person and pick what fits your home and your budget.",
        "Below are ideas at three budgets, with their MRP. Tell us what you are planning and we will share today's best price, colours and stock. The festive season is our busiest time, so it helps to visit or call early.",
    ],
    "tips": [
        ("Plan the date", "Tell us when you need the furniture when you enquire. We will confirm whether stock and delivery can meet it."),
        ("Refresh one room well", "A new sofa and centre table, or a dining set, changes a room more than many small buys."),
        ("Gifts that last", "A recliner for parents, a study chair for a child or a home locker are gifts the family uses for years."),
    ],
    "faq": [FAQ_WHERE, FAQ_PRICE,
            ("Can I get it before Diwali?", "Tell us your date when you enquire. We will check stock and confirm a delivery date before you order."),
            FAQ_DELIVERY, FAQ_EMI],
})

KITCHEN_RANGES = [
    ("Steel Chef 2.0", "Galvanised steel kitchens", "A galvanised-steel carcass made for heavy utensils, oil and moisture, with laminate and wood-look finishes. Rust and termite resistant.", "assets/img/kitchen/range-steel-chef.jpg"),
    ("Willow Wok", "Boiling waterproof (BWP) ply", "A warm wooden look in boiling waterproof ply, termite resistant and easy to keep clean.", "assets/img/kitchen/range-willow-wok.jpg"),
    ("Flavors", "HDHMR board", "High density, high moisture resistant board with acrylic, glass, textured and powder-coated steel shutter options.", "assets/img/kitchen/range-flavors.jpg"),
]

ROOM_NAMES = {"living": "Living Room", "bedroom": "Bedroom", "kitchen": "Modular Kitchen", "dining": "Dining", "office": "Home Office", "storage": "Storage"}


def esc(s):
    return html.escape(str(s or ""), quote=True)


def rupees(n):
    n = int(round(n))
    s = str(n)
    if len(s) > 3:
        head, tail = s[:-3], s[-3:]
        head = re.sub(r"(\d)(?=(\d\d)+$)", r"\1,", head)
        s = head + "," + tail
    return "₹" + s


def catalogue():
    text = (ROOT / "assets/js/catalog.js").read_text(encoding="utf-8")
    body = text[text.index("window.HDE_CATALOG = ") + len("window.HDE_CATALOG = "):].rstrip().rstrip(";")
    return json.loads(re.sub(r"\b(updated|rooms|products)\s*:", r'"\1":', body))["products"]


def pick(products, page):
    seen, out = set(), []
    for p in products:
        if p["id"] in seen:
            continue
        if "match" in page:
            ok = page["match"] in p["name"].lower()
        else:
            ok = p.get("type") in page["types"]
        if ok:
            seen.add(p["id"])
            out.append(p)
    if "types" in page:  # the page's main type first (plain sofas before sofa cum beds)
        out.sort(key=lambda p: page["types"].index(p["type"]))
    return out


def card(p, interest):
    label = ("MRP" if p.get("mrp") else "Price") + (" from" if p.get("fromPrice") else "")
    link = "product.html?id=" + p["id"]
    note = (str(p["variants"]) + " sizes, colours or finishes. " if p.get("variants") else "") + (p.get("note") or "")
    return ('<article class="card card--link"><a href="%s" tabindex="-1" aria-hidden="true"><div class="ph" data-label="%s">'
            '<img src="%s" alt="%s" loading="lazy" decoding="async" width="900" height="675"></div></a>'
            '<div class="card-body"><span class="card-type">%s</span><h3><a href="%s">%s</a></h3><p class="card-note">%s</p>'
            '<div class="card-foot"><span class="price"><small>%s</small><b>%s</b></span>'
            '<button class="btn btn--primary" type="button" data-enquire data-source="landing" data-product="%s" data-interest="%s">Get best price</button></div></div></article>') % (
        link, esc(interest), esc(p["image"]), esc(p["name"]), esc(p.get("type")), link, esc(p["name"]), esc(note),
        label, rupees(p["from"]), esc(p["name"]), esc(interest))


def head_template():
    src = (ROOT / "collections.html").read_text(encoding="utf-8")
    # The showroom's business details (from stores.html), so each page ties its products to the Patel Nagar store
    stores = (ROOT / "stores.html").read_text(encoding="utf-8")
    m = re.search(r'  <script type="application/ld\+json">.*?</script>\n', stores, re.S)
    return src[:src.index("</head>")] + (m.group(0) if m else "")


def build(page, products, head, others):
    url = BASE + page["slug"] + ".html"
    h = head
    h = re.sub(r"<title>.*?</title>", "<title>%s</title>" % esc(page["title"]), h, count=1)
    h = re.sub(r'<meta name="description" content="[^"]*">', '<meta name="description" content="%s">' % esc(page["desc"]), h, count=1)
    for prop in ("og:title", "twitter:title"):
        h = re.sub(r'(<meta (?:property|name)="%s" content=")[^"]*(">)' % prop, r"\g<1>%s\g<2>" % esc(page["h1"] + " | Home Decor Enterprises").replace("\\", "\\\\"), h, count=1)
    for prop in ("og:description", "twitter:description"):
        h = re.sub(r'(<meta (?:property|name)="%s" content=")[^"]*(">)' % prop, r"\g<1>%s\g<2>" % esc(page["desc"]).replace("\\", "\\\\"), h, count=1)
    h = re.sub(r'(<meta property="og:url" content=")[^"]*(">)', r"\g<1>%s\g<2>" % url, h, count=1)
    h = re.sub(r'(<link rel="canonical" href=")[^"]*(">)', r"\g<1>%s\g<2>" % url, h, count=1)
    crumbs = {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Home", "item": BASE},
        {"@type": "ListItem", "position": 2, "name": "Collections", "item": BASE + "collections.html"},
        {"@type": "ListItem", "position": 3, "name": page["h1"], "item": url}]}
    h += '  <script type="application/ld+json">%s</script>\n' % json.dumps(crumbs, ensure_ascii=False)

    room = page["room"]
    interest = page["interest"]
    picked = pick(products, page)
    out = [h, "</head>\n<body data-page=\"collections\">\n",
           "  <!-- Generated by tools/build_landing.py. Edit that script, not this file. -->\n",
           '  <div id="site-header"></div>\n\n  <main id="main">\n',
           '    <section class="page-hero">\n      <div class="wrap">\n',
           '        <p class="crumbs"><a href="index.html">Home</a> / <a href="collections.html%s">%s</a> / %s</p>\n' % (("#" + room) if room else "", ROOM_NAMES[room] if room else "Collections", esc(page["h1"])),
           "        <h1>%s</h1>\n        <p>%s</p>\n" % (esc(page["h1"]), esc(page["sub"])),
           '        <div class="btns"><a class="btn btn--primary" href="stores.html">Visit the showroom</a>'
           '<button class="btn btn--ghost" type="button" data-enquire data-source="landing" data-interest="%s">Get best price</button></div>\n' % esc(interest),
           "      </div>\n    </section>\n\n",
           '    <section class="section">\n      <div class="wrap story-copy">\n']
    for i, para in enumerate(page["intro"]):
        out.append('        <p%s>%s</p>\n' % (' class="lede"' if i == 0 else "", esc(para)))
    out.append("      </div>\n    </section>\n\n")

    if page.get("kitchen"):
        out.append('    <section class="section section--stone" aria-labelledby="ranges-title">\n      <div class="wrap">\n'
                   '        <div class="section-head"><div><span class="eyebrow">Godrej Interio kitchens</span><h2 id="ranges-title">Three kitchen ranges</h2></div></div>\n'
                   '        <div class="grid-products">\n')
        for name, mat, text, img in KITCHEN_RANGES:
            out.append('          <article class="card"><div class="ph" data-label="Modular Kitchen"><img src="%s" alt="%s kitchen" loading="lazy" decoding="async" width="900" height="675"></div>'
                       '<div class="card-body"><span class="card-type">%s</span><h3>%s</h3><p class="card-note">%s</p>'
                       '<div class="card-foot"><button class="btn btn--primary" type="button" data-enquire data-source="landing" data-product="%s kitchen" data-interest="Modular Kitchen">Get a kitchen quote</button></div></div></article>\n'
                       % (img, esc(name), esc(mat), esc(name), esc(text), esc(name)))
        out.append("        </div>\n      </div>\n    </section>\n\n")

    if page.get("bands"):
        for i, (label, lo, hi) in enumerate(page["bands"]):
            # One product per type, in the page's type order, each the one nearest the middle of the budget
            target = (lo + hi) / 2 if hi < 10**9 else lo * 1.6
            band, groups = [], set()
            for t in page["types"]:
                group = "sofa" if "sofa" in t.lower() else t  # at most one sofa per budget
                fits = [p for p in picked if p["type"] == t and lo <= p["from"] < hi]
                if fits and group not in groups:
                    groups.add(group)
                    band.append(min(fits, key=lambda p: abs(p["from"] - target)))
            if not band:
                continue
            band = band[:4]
            out.append('    <section class="section%s" aria-labelledby="band-%d">\n      <div class="wrap">\n'
                       '        <div class="section-head"><div><span class="eyebrow">Budget</span><h2 id="band-%d">%s</h2></div></div>\n'
                       '        <div class="grid-products">\n' % (" section--stone" if i % 2 == 0 else "", i, i, esc(label)))
            for p in band:
                out.append("          " + card(p, ROOM_NAMES.get(p["room"], interest)) + "\n")
            out.append("        </div>\n      </div>\n    </section>\n\n")
    elif picked and not page.get("kitchen"):
        out.append('    <section class="section section--stone" aria-labelledby="range-title">\n      <div class="wrap">\n'
                   '        <div class="section-head"><div><span class="eyebrow">%d in the current range</span><h2 id="range-title">Popular picks</h2></div>'
                   '<a class="link-arrow" href="collections.html#%s">See all %s</a></div>\n'
                   '        <div class="grid-products">\n' % (len(picked), room, esc(ROOM_NAMES[room].lower())))
        for p in picked[:SHOW]:
            out.append("          " + card(p, interest) + "\n")
        out.append("        </div>\n      </div>\n    </section>\n\n")

    out.append('    <section class="section" aria-labelledby="tips-title">\n      <div class="wrap">\n'
               '        <div class="section-head"><div><span class="eyebrow">Before you buy</span><h2 id="tips-title">What to look for</h2></div></div>\n'
               '        <div class="values">\n')
    for t, d in page["tips"]:
        out.append('          <div class="value"><h3>%s</h3><p>%s</p></div>\n' % (esc(t), esc(d)))
    out.append("        </div>\n      </div>\n    </section>\n\n")

    out.append('    <section class="section section--stone" aria-labelledby="faq-title">\n      <div class="wrap">\n'
               '        <div class="section-head"><div><span class="eyebrow">Questions</span><h2 id="faq-title">Buying in Dehradun</h2></div></div>\n'
               '        <div class="faq">\n')
    for q, a in page["faq"]:
        out.append("          <details><summary>%s</summary><p>%s</p></details>\n" % (esc(q), esc(a)))
    out.append("        </div>\n      </div>\n    </section>\n\n")

    out.append('    <section class="section" aria-labelledby="more-title">\n      <div class="wrap">\n'
               '        <h2 id="more-title">More furniture in Dehradun</h2>\n        <p class="seo-links">')
    out.append(" &middot; ".join('<a href="%s.html">%s</a>' % (o["slug"], esc(o["h1"].replace(" in Dehradun", ""))) for o in others if o is not page))
    out.append("</p>\n      </div>\n    </section>\n\n")

    out.append('    <section class="band" aria-labelledby="visit-title">\n      <div class="wrap">\n        <div>\n'
               '          <h2 id="visit-title">See them in person</h2>\n          <p>%s</p>\n        </div>\n'
               '        <div class="btns"><a class="btn btn--accent" href="stores.html">Directions and timings</a>'
               '<button class="btn btn--ghost" type="button" data-enquire data-source="landing" data-interest="%s">Get a free quote</button></div>\n'
               '      </div>\n    </section>\n  </main>\n\n  <div id="site-footer"></div>\n\n' % (esc(VISIT), esc(interest)))
    out.append('  <script src="assets/js/config.js"></script>\n  <script src="assets/js/data.js"></script>\n'
               '  <script src="assets/js/catalog.js"></script>\n  <script src="assets/js/suggest.js"></script>\n'
               '  <script src="assets/js/main.js"></script>\n  <script src="assets/js/agent.js" defer></script>\n  <script src="assets/js/install.js"></script>\n</body>\n</html>\n')
    (ROOT / (page["slug"] + ".html")).write_text("".join(out), encoding="utf-8")
    return len(picked)


def main():
    products = catalogue()
    head = head_template()
    for page in PAGES:
        n = build(page, products, head, PAGES)
        print("%s.html: %d products" % (page["slug"], n))


if __name__ == "__main__":
    main()
