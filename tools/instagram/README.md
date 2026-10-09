# Instagram auto-post for godrej_interio_ddn

Makes branded post cards from the website catalogue and posts one a day.

1. `python3 tools/instagram/make_posts.py --count 14 --room living` writes 1080x1350 cards and captions to `site/assets/ig/`. Use `--room` (living, bedroom, dining, office, storage, kitchen) to pick a category.
2. Review the cards, then commit and deploy. Instagram downloads each image from the public site, so the cards must be live first.
3. The "Instagram auto-post" GitHub action runs daily at 7:30 pm IST. It posts the next card that has not been posted and records it in `site/assets/ig/posted.json`.

## One-time setup (needed before real posting)

- The account must be a Business or Creator account linked to a Facebook Page.
- Create a Meta app with the Instagram Graph API and get a long-lived token with `instagram_content_publish`.
- Add repository secrets `IG_USER_ID` (the Instagram Business account id) and `IG_ACCESS_TOKEN`.

Until both secrets exist, the action only reports a dry run. Run it by hand from the Actions tab with "Post for real" ticked to publish immediately.

Captions are generated from catalogue text and are not reviewed by a person. Check the queue before deploying, and remove any card that doesn't look right.
