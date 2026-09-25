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
    phone: "+91 135 000 0000",          // FILL IN: main showroom phone
    phoneHref: "+911350000000",         // FILL IN: same number, digits only with country code
    whatsapp: "919800000000",           // FILL IN: WhatsApp number, digits only with country code (no +)
    email: "info@homedecorenterprises.in", // FILL IN
    hours: "Mon to Sat, 10:00 AM to 8:00 PM. Sun, 11:00 AM to 7:00 PM", // FILL IN
    instagram: "https://instagram.com/",   // FILL IN
    facebook: "https://facebook.com/"      // FILL IN
  },

  stores: [
    {
      name: "Rajpur Road Showroom",
      address: "FILL IN: shop no., Rajpur Road, Dehradun, Uttarakhand 248001",
      phone: "+91 135 000 0000",
      phoneHref: "+911350000000",
      mapLink: "https://maps.google.com/?q=Rajpur+Road+Dehradun", // FILL IN: your Google Maps link
      highlight: "Full living, bedroom and dining range on display"
    },
    {
      name: "Saharanpur Road Showroom",
      address: "FILL IN: shop no., Saharanpur Road, Dehradun, Uttarakhand 248001",
      phone: "+91 135 000 0001",
      phoneHref: "+911350000001",
      mapLink: "https://maps.google.com/?q=Saharanpur+Road+Dehradun", // FILL IN
      highlight: "Modular kitchen and wardrobe experience centre"
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
