#!/usr/bin/env python3
"""Publish queued post cards to the godrej_interio_ddn Instagram account.

Uses the Instagram Graph API (the account must be a Business or Creator account
linked to a Facebook Page). Each run publishes at most --max posts from the queue
in site/assets/ig/, skips anything already listed in posted.json, and records what
it published there.

Instagram downloads each image from a public URL, so the cards must be deployed
(the site is on Netlify) before they can be posted. Use --base-url to say where.

Environment (set as GitHub Actions secrets, never committed):
  IG_USER_ID        Instagram Business account id
  IG_ACCESS_TOKEN   long-lived token with instagram_content_publish

Usage:
  python3 tools/instagram/post_instagram.py                     # dry run: prints what would post
  python3 tools/instagram/post_instagram.py --publish --max 1   # really post one card

Standard library only.
"""
import argparse
import datetime as dt
import json
import os
import sys
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", ".."))
QUEUE = os.path.join(REPO, "site", "assets", "ig")
LEDGER = os.path.join(QUEUE, "posted.json")
GRAPH = "https://graph.facebook.com/v21.0"


def load_ledger():
    if os.path.exists(LEDGER):
        with open(LEDGER, encoding="utf-8") as fh:
            return json.load(fh)
    return []


def save_ledger(entries):
    with open(LEDGER, "w", encoding="utf-8") as fh:
        json.dump(entries, fh, indent=2, ensure_ascii=False)
        fh.write("\n")


def queued(posted):
    done = {e["file"] for e in posted}
    names = sorted(f for f in os.listdir(QUEUE) if f.endswith(".jpg") and f not in done)
    return [n for n in names if os.path.exists(os.path.join(QUEUE, n[:-4] + ".txt"))]


def graph_post(path, fields, token):
    data = urllib.parse.urlencode({**fields, "access_token": token}).encode()
    req = urllib.request.Request(f"{GRAPH}/{path}", data=data, method="POST")
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.load(resp)


def publish(name, base_url, user_id, token):
    caption = open(os.path.join(QUEUE, name[:-4] + ".txt"), encoding="utf-8").read().strip()
    image_url = f"{base_url.rstrip('/')}/assets/ig/{name}"
    container = graph_post(f"{user_id}/media", {"image_url": image_url, "caption": caption}, token)
    # Instagram needs a moment to fetch the image before it can publish the container.
    result = graph_post(f"{user_id}/media_publish", {"creation_id": container["id"]}, token)
    return result["id"], image_url


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--publish", action="store_true", help="actually post (default is a dry run)")
    ap.add_argument("--max", type=int, default=1, help="most posts to publish in one run")
    ap.add_argument("--base-url", default="https://hdefurniture.netlify.app")
    args = ap.parse_args(argv)

    posted = load_ledger()
    todo = queued(posted)[: args.max]
    if not todo:
        print("Queue is empty. Run tools/instagram/make_posts.py and copy the output to site/assets/ig/.")
        return 0

    if not args.publish:
        for name in todo:
            print(f"[dry run] would post {name}")
        return 0

    user_id = os.environ.get("IG_USER_ID", "")
    token = os.environ.get("IG_ACCESS_TOKEN", "")
    if not user_id or not token:
        print("IG_USER_ID and IG_ACCESS_TOKEN must be set to publish.", file=sys.stderr)
        return 2

    for name in todo:
        media_id, url = publish(name, args.base_url, user_id, token)
        posted.append({"file": name, "media_id": media_id, "url": url,
                       "posted_at": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds")})
        save_ledger(posted)
        print("posted", name, media_id)
    return 0


if __name__ == "__main__":
    sys.exit(main())
