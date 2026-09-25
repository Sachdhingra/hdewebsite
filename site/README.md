# Home Decor Enterprises: lead-capture website

A fast, static website (plain HTML, CSS and JavaScript, no build step) laid out like a large furniture-brand site: top contact strip, "Shop by room" mega menu, hero carousel with a call-back form beside it, room tiles, popular products with "Get best price" buttons, a modular kitchen process, showrooms, reviews and a full enquiry form. Every page has a floating WhatsApp button and, on phones, a sticky Call / WhatsApp / Free quote bar.

Pages: `index.html`, `collections.html` (filter by room, deep links like `collections.html#kitchen`), `stores.html`, `contact.html`.

## Go live checklist

1. **Business details**: open `assets/js/config.js` and replace everything marked `FILL IN` (phone, WhatsApp, email, showroom addresses, map links, hours, social links).
2. **Where leads go**: in the same file set `leads.provider`:
   - `"web3forms"`: easiest. Go to https://web3forms.com, enter the email that should receive leads, paste the access key into `web3formsKey`. Each enquiry arrives as an email.
   - `"formspree"`: create a form at https://formspree.io and paste its id into `formspreeId`. Gives you a dashboard and CSV export.
   - `"api"`: sends to the CRM backend already in `/backend` (`POST {apiBase}/api/leads`), so leads show in its admin dashboard. That backend requires an email, so the form makes email required in this mode.
   - `"none"` (the current default): nothing is stored. After filling the form, visitors get a one-tap button that sends the enquiry to your WhatsApp. No lead is silently lost, but you only get the ones who tap.
3. **Photos**: all images are free Unsplash placeholders. Put your own photos in `assets/img/` and change the `image` paths in `assets/js/data.js` (products and rooms) and the hero/kitchen `<img>` tags in `index.html`. If an image fails to load, a tinted panel with a label shows instead.
4. **Products and prices**: `assets/js/data.js`. Prices are indicative samples shown as "Starting from".
5. **Reviews and FAQs**: the three reviews in `data.js` and the FAQ answers in `contact.html` are samples. Replace them with real reviews and your actual delivery, EMI and warranty terms before launch.
6. **Partner wording**: the top strip says "Authorised Godrej Interio channel partner". Confirm this matches what your partner agreement allows. The site uses no Godrej or Interio logos, photos or copy.

## Deploy (pick one, all free)

- **Netlify**: connect this repo; `netlify.toml` already publishes the `site/` folder. Or drag the `site` folder onto https://app.netlify.com/drop.
- **Vercel**: import the repo and set the root directory to `site`, framework "Other".
- **GitHub Pages**: Settings > Pages > deploy from branch, folder `/site` is not selectable there, so use a Pages GitHub Action that uploads `site/`, or copy `site/` to a `docs/` folder.

Then point your domain (for example `homedecorenterprises.in`) at the host.

## Tracking

If you add Google Tag Manager, each successful enquiry pushes `{ event: "lead_submitted", lead_source, lead_interest }` to `dataLayer`, so you can count leads per form and per room.

## Design notes

Built with the UI UX Pro Max guidance for an interiors retailer: warm walnut and brass palette on white, Cinzel for headings, Josefin Sans for text, visible labels and inline errors on forms, 44px+ touch targets, keyboard focus rings, reduced-motion support and lazy-loaded images.
