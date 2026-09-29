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
    // From the Google Business listing (Karanpur showroom). These look like Godrej call-routing
    // numbers; swap in your direct shop number if you prefer.
    phone: "+91 91679 90455",
    phoneHref: "+919167990455",
    whatsapp: "919837115799",            // WhatsApp number, digits only with country code (no +)
    email: "sachdhingra@gmail.com",     // From the Google listing. A business address (e.g. info@yourdomain) looks more professional
    hours: "Open every day, 11:00 AM to 8:00 PM", // From the Google listing
    instagram: "https://instagram.com/",   // FILL IN
    facebook: "https://facebook.com/"      // FILL IN
  },

  // From the Google Business listings (via stores.interio.com), September 2026.
  stores: [
    {
      name: "Karanpur Showroom",
      address: "No 9, Ashtley Hall, Irrigation Colony, Karanpur, Dehradun, Uttarakhand 248001",
      landmark: "Near Parade Ground",
      phone: "+91 91679 90455",
      phoneHref: "+919167990455",
      mapLink: "https://maps.google.com/maps?cid=1763858221292683378",
      rating: "4.6"
    },
    {
      name: "Patel Nagar Showroom",
      address: "No 23, Saharanpur Road, Patel Nagar, Dehradun, Uttarakhand 248001",
      landmark: "Opposite Kolhi Petrol Pump",
      phone: "+91 96191 81957",
      phoneHref: "+919619181957",
      mapLink: "https://maps.google.com/maps?cid=1477870679173429280",
      rating: "4.8"
    }
  ],

  /*
   * Where enquiries go. Pick ONE provider:
   *
   *  "web3forms" — free, no server. Get an access key at https://web3forms.com
   *                (enter the email that should receive leads) and paste it below.
   *  "formspree" — free tier. Create a form at https://formspree.io and paste its id (e.g. "xyzabcd").
   *  "api"       — your own CRM backend in /backend (POST {apiBase}/api/leads).
   *  "none"      — nothing is sent anywhere; visitors are asked to send the enquiry on WhatsApp instead.
   *
   * Until a provider is set, the site runs in "none" mode so no lead is silently lost.
   */
  leads: {
    provider: "none",
    web3formsKey: "",
    formspreeId: "",
    apiBase: "",
    // Also offer a one-tap WhatsApp follow-up after a successful submission.
    offerWhatsAppAfterSubmit: true
  }
};
