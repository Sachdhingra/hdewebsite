#!/usr/bin/env python3
"""Make branded Instagram post images and captions from the website catalogue.

Reads site/assets/js/catalog.js (written by tools/scrape_interio.py), picks products
that have a photo on disk, and writes for each one:

  site/assets/ig/<id>.jpg   1080 x 1350 portrait card (product photo, name, price, store line)
  site/assets/ig/<id>.txt  caption with hook, price, store line and hashtags

Usage:
  python3 tools/instagram/make_posts.py --count 12 --room living
  python3 tools/instagram/make_posts.py --count 3 --out /path/to/preview

Standard library plus Pillow (pip install pillow).
"""
import argparse
import hashlib
import json
import os
import random
import sys

from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", ".."))
CATALOG = os.path.join(REPO, "site", "assets", "js", "catalog.js")
FONTS = os.path.join(HERE, "fonts")

CANVAS = (1080, 1350)
INK = (34, 28, 24)        # --ink
WALNUT = (124, 68, 32)    # --walnut
BRASS = (200, 145, 46)    # --brass
PAPER = (255, 255, 255)   # --paper
STONE = (245, 241, 237)   # --stone

STORE_LINE = "Home Decor Enterprises | Patel Nagar, Saharanpur Road, Dehradun"
PHONE = "+91 99172 33664"

ROOM_TAGS = {
    "living": "#LivingRoomDecor #SofaDehradun",
    "bedroom": "#BedroomDecor #MattressDehradun",
    "dining": "#DiningTable #DiningRoomDecor",
    "office": "#HomeOffice #WorkFromHome",
    "storage": "#StorageIdeas #AlmirahDehradun",
    "kitchen": "#ModularKitchen #KitchenDesign",
}

HOOKS = [
    "Ghar ko naya look, bina zyada kharch ke.",
    "Ek cheez jo aapke ghar ka mood badal degi.",
    "Dehradun ke gharon ke liye, jo sach mein chalta hai.",
    "Comfort jo din bhar saath deta hai.",
]


def load_products():
    """Parse the window.HDE_CATALOG object written by the scraper."""
    with open(CATALOG, encoding="utf-8") as fh:
        text = fh.read()
    start = text.index("products: ") + len("products: ")
    products, _ = json.JSONDecoder().raw_decode(text[start:])
    return products


def font(name, size):
    return ImageFont.truetype(os.path.join(FONTS, name), size)


def wrap(draw, text, fnt, width):
    lines, line = [], ""
    for word in text.split():
        trial = (line + " " + word).strip()
        if draw.textlength(trial, font=fnt) <= width:
            line = trial
        else:
            if line:
                lines.append(line)
            line = word
    if line:
        lines.append(line)
    return lines


def price_text(product):
    value = product.get("from")
    if not value:
        return ""
    prefix = "From " if product.get("fromPrice") else ""
    return f"{prefix}Rs. {value:,}"


def fit_photo(src, box):
    """Fit the whole product photo inside box, centred on the stone ground (no cropping)."""
    img = Image.open(src).convert("RGB")
    scale = min(box[0] / img.width, box[1] / img.height)
    img = img.resize((round(img.width * scale), round(img.height * scale)), Image.LANCZOS)
    ground = Image.new("RGB", box, STONE)
    ground.paste(img, ((box[0] - img.width) // 2, (box[1] - img.height) // 2))
    return ground


def make_card(product, out_path):
    W, H = CANVAS
    card = Image.new("RGB", CANVAS, PAPER)
    draw = ImageDraw.Draw(card)

    # Photo band at the top, product on a stone ground.
    photo_h = 860
    photo = fit_photo(os.path.join(REPO, "site", product["image"]), (W, photo_h))
    card.paste(photo, (0, 0))

    # Brand strip under the photo.
    draw.rectangle([0, photo_h, W, photo_h + 8], fill=BRASS)

    y = photo_h + 50
    name_font = font("Cinzel.ttf", 56)
    for line in wrap(draw, product["name"], name_font, W - 120)[:2]:
        draw.text((60, y), line, font=name_font, fill=INK)
        y += 68

    y += 14
    price = price_text(product)
    if price:
        draw.text((60, y), price, font=font("JosefinSans.ttf", 48), fill=WALNUT)
        y += 70

    note = product.get("note") or ""
    if note:
        for line in wrap(draw, note, font("JosefinSans.ttf", 34), W - 120)[:2]:
            draw.text((60, y), line, font=font("JosefinSans.ttf", 34), fill=INK)
            y += 44

    # Footer band with store line and phone.
    draw.rectangle([0, H - 170, W, H], fill=WALNUT)
    draw.text((60, H - 130), "Home Decor Enterprises | Authorised Godrej Interio partner", font=font("JosefinSans.ttf", 34), fill=PAPER)
    draw.text((60, H - 84), f"Patel Nagar, Dehradun | {PHONE}", font=font("JosefinSans.ttf", 32), fill=PAPER)

    card.save(out_path, "JPEG", quality=90, optimize=True)


def make_caption(product, rng):
    name = product["name"]
    price = price_text(product)
    room = product.get("room", "")
    lines = [
        rng.choice(HOOKS),
        "",
        f"{name}.",
    ]
    if product.get("note"):
        lines.append(product["note"] + ".")
    if price:
        lines.append(f"{price} (MRP, Interio). Free home consultation and delivery across Dehradun.")
    lines += [
        "",
        f"Showroom: Patel Nagar, Saharanpur Road. Call or WhatsApp {PHONE}.",
        "Save karo, aur apne dost ko bhejo jo naya ghar le raha hai.",
        "",
        f"#Dehradun #GodrejInterio #HomeDecorIndia {ROOM_TAGS.get(room, '')}".strip(),
    ]
    return "\n".join(lines) + "\n"


def pick(products, room, count, seed):
    pool = [
        p for p in products
        if p.get("image") and os.path.exists(os.path.join(REPO, "site", p["image"]))
        and (not room or p.get("room") == room)
    ]
    rng = random.Random(seed)
    rng.shuffle(pool)
    return pool[:count], rng


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--count", type=int, default=6)
    ap.add_argument("--room", default="", help="living, bedroom, dining, office, storage or kitchen")
    ap.add_argument("--out", default=os.path.join(REPO, "site", "assets", "ig"))
    ap.add_argument("--seed", default="", help="pick the same products again (default: today's date)")
    args = ap.parse_args(argv)

    seed = args.seed or __import__("datetime").date.today().isoformat()
    products = load_products()
    chosen, rng = pick(products, args.room, args.count, seed)
    if not chosen:
        print("No products with photos match these filters.", file=sys.stderr)
        return 1

    os.makedirs(args.out, exist_ok=True)
    for p in chosen:
        base = os.path.join(args.out, p["id"])
        make_card(p, base + ".jpg")
        with open(base + ".txt", "w", encoding="utf-8") as fh:
            fh.write(make_caption(p, rng))
        print("wrote", os.path.relpath(base + ".jpg", REPO))
    return 0


if __name__ == "__main__":
    sys.exit(main())
