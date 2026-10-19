/*
 * Home Decor Enterprises — site settings.
 * This is the only file you need to edit to go live.
 * Anything marked FILL IN is a placeholder: replace it with your real details.
 */
window.HDE_CONFIG = {
  business: {
    name: "Home Decor Enterprises",
    shortName: "HDE",
    since: "2006",
    partnerLine: "Authorised Godrej Interio channel partner", // FILL IN: confirm wording allowed by your partner agreement
    city: "Dehradun",
    siteUrl: "https://hdefurniture.netlify.app/", // The live address. Change it if you move to your own domain (also in sitemap.xml and robots.txt).
    // Main shop number (user, 2026-09-30), also used for WhatsApp enquiries that come without a salesperson link.
    phone: "+91 99172 33664",
    phoneHref: "+919917233664",
    whatsapp: "919917233664",
    // After-sales service line (user, 2026-10-01), shown in the header strip and footer.
    service: { phone: "+91 90121 06106", phoneHref: "+919012106106", hours: "Mon to Sat, 11 AM to 7 PM" },            // WhatsApp number, digits only with country code (no +)
    email: "sachdhingra@gmail.com",     // From the Google listing. A business address (e.g. info@yourdomain) looks more professional
    hours: "Open every day, 11:00 AM to 8:00 PM", // From the Google listing
    stripHours: "Showroom open 7 days, 11 AM to 8 PM", // Short version for the header strip (user, 2026-10-01)
    instagram: "https://www.instagram.com/godrej_interio_ddn/", // user, 2026-10-17
    facebook: "https://www.facebook.com/share/1DgBenjNp2/" // user, 2026-10-17
  },

  // Patel Nagar is from its Google Business listing (September 2026). The Karanpur showroom closed in
  // September 2026 and is moving to Subhash Road; `openingSoon` shows it as coming soon, not open for visits.
  stores: [
    {
      name: "Patel Nagar Showroom",
      address: "No 23, Saharanpur Road, Patel Nagar, Dehradun, Uttarakhand 248001",
      landmark: "Opposite Kolhi Petrol Pump",
      phone: "+91 99172 33664",
      phoneHref: "+919917233664",
      mapLink: "https://maps.google.com/maps?cid=1477870679173429280",
      rating: "4.8"
    },
    {
      name: "Subhash Road Showroom",
      address: "46/1 Subhash Road, Near ICICI Bank, Dehradun, Uttarakhand 248001",
      landmark: "Near ICICI Bank",
      phone: "+91 99172 33664",
      phoneHref: "+919917233664",
      mapLink: "https://www.google.com/maps/search/?api=1&query=46%2F1+Subhash+Road+near+ICICI+Bank+Dehradun+248001",
      openingSoon: true
    }
  ],

  /*
   * Where enquiries go. Pick ONE provider:
   *
   *  "web3forms" — free, no server. Get an access key at https://web3forms.com
   *                (enter the email that should receive leads) and paste it below.
   *  "formspree" — free tier. Create a form at https://formspree.io and paste its id (e.g. "xyzabcd").
   *  "omniflow"  — the Omniflow CRM (hdeomniflow). Leads land in Omniflow, assigned to the salesperson
   *                whose link the customer used. Needs Omniflow's website-lead function deployed.
   *  "api"       — the older CRM backend in /backend (POST {apiBase}/api/leads).
   *  "none"      — nothing is sent anywhere; visitors are asked to send the enquiry on WhatsApp instead.
   *
   * Until a provider is set, the site runs in "none" mode so no lead is silently lost.
   *
   * Salesperson links: https://hdefurniture.netlify.app/?ref=<code> tags every enquiry that visitor
   * sends with the salesperson's code. Omniflow assigns the lead to that salesperson; the other
   * providers include it as "ref", and WhatsApp messages end with "(Ref: <code>)".
   * Each salesperson sees their own link on the Omniflow sales dashboard ("My website link").
   */
  leads: {
    provider: "omniflow",
    web3formsKey: "",
    formspreeId: "",
    apiBase: "",
    omniflowUrl: "https://cdrgbhnntonyofqkhzpm.supabase.co/functions/v1/website-lead",
    // Also offer a one-tap WhatsApp follow-up after a successful submission.
    offerWhatsAppAfterSubmit: true
  },

  /*
   * AI shopping assistant (chat bubble). Runs on Omniflow's website-agent function. It helps visitors
   * find and shortlist products and sends their enquiry, with the salesperson code from ?ref= links,
   * to Omniflow like the forms do. The bubble only shows once the function is live. Set url to "" to switch it off.
   */
  agent: {
    url: "https://cdrgbhnntonyofqkhzpm.supabase.co/functions/v1/website-agent",
    name: "Asha"
  },

  /*
   * Visitor analytics. Paste your Google Analytics 4 measurement id (looks like "G-ABC123XYZ",
   * from analytics.google.com > Admin > Data streams) to see visitors, which ads and posts bring
   * them, and how many tap Call, WhatsApp or Directions. Leave "" to load nothing.
   */
  analytics: {
    ga4: "G-6YWY4QP1NE"
  },

  /*
   * "Recently delivered in Dehradun" on the home page. Photos come from Omniflow > Website Gallery,
   * where an admin publishes delivery photos. The section stays hidden while there are none
   * or the feed can't be reached. Set url to "" to switch it off.
   */
  gallery: {
    url: "https://cdrgbhnntonyofqkhzpm.supabase.co/functions/v1/website-gallery",
    max: 8
  }
};
