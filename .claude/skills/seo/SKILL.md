---
name: seo
description: Rank the Home Decor Enterprises website (site/) in Google Search and Maps for furniture searches in Dehradun. Use for an SEO audit, keyword research, a new "<thing> in Dehradun" landing page, title/description/schema fixes, indexing problems, rank tracking, or a monthly SEO report. Actions: audit, keywords, page, fix, track, report.
argument-hint: "[audit|keywords|page|fix|track|report] [topic]"
---

# SEO for Home Decor Enterprises

HDE is a Godrej Interio channel partner with a showroom in Patel Nagar, Dehradun. Almost every
valuable search is local ("sofa shop in Dehradun", "Godrej almirah Dehradun", "modular kitchen
near me"), so the goal is: appear in the Google Maps pack and the top organic results for
`<product> in Dehradun`, and turn those visits into calls, WhatsApp chats and enquiry forms.

With no argument, run `audit` and finish with the three changes most likely to bring enquiries.

## How this site is built (read before changing anything)

- `site/` is plain HTML, CSS and JS with no build step. Netlify publishes it as is.
- Live address: `https://hdefurniture.netlify.app/`. It is written in `tools/build_landing.py`
  (`BASE`), `tools/build_sitemap.py` (`BASE`), `site/assets/js/config.js` (`business.siteUrl`),
  `site/robots.txt`, `site/llms.txt` and the canonical, Open Graph and JSON-LD tags of every page.
  A domain change must touch all of them, plus a 301 from the old address.
- **Landing pages** (`site/*-in-dehradun.html`, `site/wedding-furniture-dehradun.html`) are
  generated. Never edit them by hand: change the `PAGES` list in `tools/build_landing.py`, then run
  `python3 tools/build_landing.py`. The weekly "Sync Interio catalogue" action rebuilds them.
- **Sitemap**: add new pages to `PAGES` in `tools/build_sitemap.py`, then run
  `python3 tools/build_sitemap.py`. A new landing page must also be added to the `git add` line in
  `.github/workflows/sync-interio-catalog.yml` if its name does not end in `-dehradun.html`.
- **Product pages** (`product.html?id=...`) render in the browser, have a canonical to
  `collections.html` and are kept out of the sitemap, so Google does not index them. Do not add
  them to the sitemap until they are pre-rendered as real HTML with their own canonical, title,
  description and `Product` schema. That pre-rendering is the largest on-site opportunity.
- **Business details** (name, address, phone, hours) live in `site/assets/js/config.js`, the
  JSON-LD block in `site/index.html`, `site/stores.html` and `site/llms.txt`. They must match the
  Google Business Profile exactly. Only list showrooms that are open.
- `site/llms.txt` and `robots.txt` already welcome AI search crawlers. Keep `llms.txt` in step
  when pages or business details change.

## Tools

- **OpenSEO connector** (`mcp__OpenSEO__*`): project "HDE Furniture". Get the `projectId` from
  `list_projects`. Pass India (`locationCode` 2356, language `en`) on research calls, because the
  project default may be set to the United States, which gives useless volumes for Dehradun.
  Research spends credits: check the balance with `whoami`, and ask before any batch above
  2,000 credits or before starting recurring tracking.
- **Search Console and Analytics** through OpenSEO (`get_search_console_performance`,
  `get_search_opportunities`, `inspect_urls`, `get_google_analytics_organic_landing_pages`). If no
  property is connected, say so and tell the owner to connect it in OpenSEO. Do not guess numbers.
- **Local**: `get_business_profile`, `get_business_reviews`, `get_local_rank_grid`,
  `get_local_serp_results`, `search_local_businesses` for the Maps side.
- **Browser**: Chromium and Playwright are installed for checking rendered pages and page speed.

Report only numbers a tool returned. If a tool is missing or out of credits, say which check was
skipped.

## Actions

### audit
1. Repo checks, no credits needed:
   - every page in `site/*.html` has one `<title>` (under about 60 characters, main phrase and
     "Dehradun" near the front), one meta description (under about 155 characters), one `<h1>`,
     and a canonical pointing at itself (`product.html` and `shortlist.html` are exceptions);
   - no two pages share a title or description;
   - every indexable page is in `sitemap.xml`, and nothing in the sitemap redirects or is missing;
   - JSON-LD parses, and `FurnitureStore`/`LocalBusiness` name, address, phone and hours match
     `config.js`; landing pages carry `BreadcrumbList` and `FAQPage`;
   - images have descriptive `alt`, set `width`/`height`, and lazy-load below the fold;
   - each landing page is linked from the home page, the menu or `collections.html`.
2. Live checks: `run_site_audit` then `get_audit_issues`; `inspect_urls` on the home page and
   landing pages to confirm they are indexed.
3. Search data: `get_search_console_performance` by query and by page for the last 28 days.
4. Local: `get_business_profile` and `get_local_rank_grid` for "furniture showroom" around the
   Patel Nagar showroom.
5. Report: a short table of findings ordered by expected effect on enquiries, each with the file
   to change. Fix the safe ones (see "fix") and list the rest.

### keywords [topic]
Start from what the showroom sells and how Dehradun shoppers phrase it, including Hinglish and
brand terms ("godrej almirah price", "almirah", "diwan", "sofa cum bed", "L shape sofa",
"modular kitchen price in Dehradun", "furniture shop near me", nearby areas such as Patel Nagar,
Rajpur Road, Premnagar, Doiwala, Rishikesh, Haridwar, Mussoorie). Use `research_keywords`,
`get_suggested_keywords` and `get_serp_results` with India as the location. Group the results
into: already has a page, needs a new landing page, belongs on an existing page as a section or
FAQ. Save the keepers with `save_keywords`.

### page <topic>
Add a landing page for one search phrase.
1. Check `get_serp_results` for the phrase to see what ranks and what those pages answer.
2. Add an entry to `PAGES` in `tools/build_landing.py`, copying the shape of an existing one:
   `slug`, `room`, `types` (catalogue product types to show), `title`, `desc`, `h1`, `sub`,
   `intro`, `tips`, `faq`. Write for a shopper: real advice, real showroom facts, no keyword
   stuffing, no claim the business cannot back (stock, prices, delivery areas, warranty).
3. Add the page to `tools/build_sitemap.py`, run both scripts, add a line to `site/llms.txt`, and
   link the page from a related page or the menu.
4. Open the page in the browser at phone width and check it reads well and the products load.
5. After it is deployed, `submit_indexnow_urls` and ask the owner to request indexing in Search
   Console.

One page per distinct search need. Do not make near-copies that differ only by a locality name.

### fix
Apply audit findings that are safe: titles, descriptions, headings, alt text, internal links,
schema errors, sitemap gaps, broken links. For generated pages edit the generator, then rebuild.
Ask before changing business facts, prices, the domain, redirects or anything on the Google
Business Profile.

### track
Use `create_rank_tracker` or `add_rank_tracking_keywords` for a short list (15 to 30 phrases:
one or two per landing page plus "furniture showroom in Dehradun" and brand searches), location
Dehradun where the tool allows, otherwise India. Show the cost estimate first and get a yes
before turning on a schedule.

### report
Monthly summary for the owner in plain language: clicks, impressions and average position against
the previous period, the queries and pages that moved most, enquiries from organic visits if
Analytics is connected, Maps visibility, new reviews, what was changed last month and the next
three actions. Keep it to one page.

## What moves local rankings (in rough order)

1. **Google Business Profile**: correct primary category (Furniture store), all services and
   products filled in, fresh photos every week, weekly posts, every question answered, and the
   website link pointing at the live site.
2. **Reviews**: a steady flow of new Google reviews that mention the product and "Dehradun", with
   a reply to each. A WhatsApp message with the review link after every delivery does most of it.
3. **Same name, address and phone everywhere**: website, Google, Justdial, Sulekha, IndiaMART,
   Facebook, Instagram, and the Godrej Interio store locator.
4. **A page for each thing people search**, with useful copy, FAQs and current products. This is
   what the landing pages are for.
5. **Links from local and brand sites**: the Godrej Interio dealer page, local news, builders,
   architects and interior designers the showroom works with.
6. **Speed on phones**: keep images as sized WebP, keep scripts small.
7. **Own domain**: a `.in` or `.com` domain earns more trust and survives a change of host. Plan
   the move once, with 301 redirects, rather than building authority on `netlify.app`.

## Rules

- No fake reviews, paid link schemes, hidden text, doorway pages or copied text from interio.com
  beyond the product data the partner agreement allows.
- Schema must describe what is visible on the page.
- Never mark the Subhash Road showroom as open until `config.js` says it is.
- Work on the session's branch and leave the catalogue files to the weekly sync.
