/* Home Decor Enterprises — shared layout, lead forms and catalogue rendering. */
(function () {
  "use strict";
  var C = window.HDE_CONFIG;
  var D = window.HDE_DATA;
  var B = C.business;

  /* ---------- helpers ---------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function rupees(n) { return "₹" + Math.round(n).toLocaleString("en-IN"); }
  function waLink(text) { return "https://wa.me/" + B.whatsapp + "?text=" + encodeURIComponent(text); }
  function page() { return document.body.getAttribute("data-page") || "home"; }
  function openStores() { return C.stores.filter(function (s) { return !s.openingSoon; }); }

  /* ---------- salesperson link (?ref=<code>) ---------- */
  // Each salesperson shares the site as https://.../?ref=<their code> (shown on their CRM page).
  // Remember the code so any enquiry this visitor sends within 60 days is assigned to them.
  // The most recent salesperson link a visitor opened wins.
  var salesRef = (function () {
    var KEY = "hde_ref", DAYS = 60, valid = /^[a-z0-9][a-z0-9-]{0,39}$/;
    var code = "";
    try { code = (new URLSearchParams(location.search).get("ref") || "").trim().toLowerCase(); } catch (e) {}
    if (valid.test(code)) {
      try { localStorage.setItem(KEY, JSON.stringify({ code: code, at: Date.now() })); } catch (e) {}
      return code;
    }
    try {
      var saved = JSON.parse(localStorage.getItem(KEY) || "null");
      if (saved && valid.test(saved.code) && Date.now() - saved.at < DAYS * 864e5) return saved.code;
    } catch (e) {}
    return "";
  })();

  // Share links carry the salesperson's code, so a customer who opens a link a salesperson sent
  // (or one they pass on to family) keeps that salesperson on the enquiry.
  function withRef(url) { return salesRef ? url + (url.indexOf("?") > -1 ? "&" : "?") + "ref=" + encodeURIComponent(salesRef) : url; }

  /* ---------- shortlist (saved on this phone or laptop) ---------- */
  var shortlist = (function () {
    var KEY = "hde_shortlist", MAX = 40;
    var ids = [];
    try { ids = JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (e) {}
    if (!Array.isArray(ids)) ids = [];
    ids = ids.filter(function (x) { return typeof x === "string"; }).slice(0, MAX);
    function save() {
      try { localStorage.setItem(KEY, JSON.stringify(ids)); } catch (e) {}
      document.dispatchEvent(new CustomEvent("hde:shortlist"));
    }
    return {
      all: function () { return ids.slice(); },
      has: function (id) { return ids.indexOf(id) > -1; },
      add: function (id) { if (ids.indexOf(id) < 0) { ids.unshift(id); ids = ids.slice(0, MAX); save(); } },
      remove: function (id) { ids = ids.filter(function (x) { return x !== id; }); save(); },
      toggle: function (id) { if (this.has(id)) { this.remove(id); return false; } this.add(id); return true; }
    };
  })();

  var ICON = {
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>',
    wa: '<path d="M3 21l1.7-5A8.5 8.5 0 1 1 8 19.3z"/><path d="M9 10c0 3 2 5 5 5l1.2-1.2-2-1-1 .8a4 4 0 0 1-1.8-1.8l.8-1-1-2z"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    chev: '<path d="m6 9 6 6 6-6"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
    close: '<path d="M18 6 6 18M6 6l12 12"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4.3-4.3"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    ruler: '<path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.4 2.4 0 0 1 0-3.4l2.6-2.6a2.4 2.4 0 0 1 3.4 0z"/><path d="m14.5 12.5 2-2M11.5 9.5l2-2M8.5 6.5l2-2M17.5 15.5l2-2"/>',
    truck: '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.6a1 1 0 0 0-.2-.6l-3.5-4.4A1 1 0 0 0 17.5 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',
    shield: '<path d="M20 13c0 5-3.5 7.5-7.7 9a1 1 0 0 1-.7 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.2-2.7a1.2 1.2 0 0 1 1.6 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
    store: '<path d="m2 7 4.4-4.4A2 2 0 0 1 7.8 2h8.4a2 2 0 0 1 1.4.6L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20v2a3 3 0 0 1-5 2.2A3 3 0 0 1 12 12a3 3 0 0 1-5-.8A3 3 0 0 1 2 9z"/>',
    ig: '<rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/>',
    fb: '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>',
    heart: '<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>'
  };
  function icon(name) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICON[name] + "</svg>";
  }
  function ph(src, label, alt, eager) {
    return '<div class="ph" data-label="' + esc(label) + '"><img src="' + esc(src) + '" alt="' + esc(alt || "") + '"' +
      (eager ? "" : ' loading="lazy"') + ' decoding="async" width="900" height="675"></div>';
  }

  /* ---------- header, footer, floating actions ---------- */
  function renderChrome() {
    var cur = page();
    function navLink(href, label, key) {
      return '<a href="' + href + '"' + (cur === key || (key === "collections" && cur === "product") ? ' aria-current="page"' : "") + ">" + label + "</a>";
    }
    var megaCols = D.rooms.map(function (r) {
      return "<div><h4><a href=\"collections.html#" + r.slug + "\">" + esc(r.name) + "</a></h4><ul>" +
        r.types.slice(0, 5).map(function (t) { return '<li><a href="collections.html#' + r.slug + '">' + esc(t) + "</a></li>"; }).join("") +
        "</ul></div>";
    }).join("");

    var header =
      '<a class="skip" href="#main">Skip to content</a>' +
      '<div class="strip"><div class="wrap">' +
        '<span class="strip-partner"><span class="partner-pill"><img src="assets/img/interio-logo.png" alt="interio by Godrej" width="76" height="40"></span>' + esc(B.partnerLine) + " in " + esc(B.city) + " since " + esc(B.since) + "</span>" +
        '<span class="strip-contacts"><a href="tel:' + esc(B.phoneHref) + '">Call ' + esc(B.phone) + "</a>" +
        '<a href="' + waLink("Hi, I would like to know more about your furniture.") + '" target="_blank" rel="noopener">WhatsApp us</a>' +
          (B.service ? '<span class="strip-service"><a href="tel:' + esc(B.service.phoneHref) + '">Service ' + esc(B.service.phone) + '</a> <span class="strip-note">' + esc(B.service.hours) + "</span></span>" : "") +
        "</span>" +
      "</div></div>" +
      '<header class="site-header"><div class="wrap">' +
        '<a class="brand" href="index.html" aria-label="' + esc(B.name) + ' home"><img class="brand-logo" src="assets/img/hde-logo-160.webp" alt="" width="56" height="56">' +
          '<span><span class="brand-name">' + esc(B.name) + '</span><span class="brand-sub">Furniture and interiors, ' + esc(B.city) + "</span></span></a>" +
        '<nav class="nav" id="site-nav" aria-label="Main">' +
          '<div class="nav-item"><button type="button" aria-expanded="false" aria-controls="mega">Shop by room ' + icon("chev") + "</button>" +
            '<div class="mega" id="mega">' + megaCols +
              '<div class="mega-cta"><strong>Not sure where to start?</strong><p>Get a free consultation in our showroom or over the phone. We suggest layouts and share a quote.</p>' +
              '<button class="btn btn--primary" type="button" data-enquire data-interest="Full home interiors">Free consultation</button></div>' +
            "</div></div>" +
          navLink("collections.html", "Collections", "collections") +
          navLink("stores.html", "Showrooms", "stores") +
          navLink("about.html", "About us", "about") +
          navLink("contact.html", "Contact", "contact") +
        "</nav>" +
        '<div class="header-cta">' +
          '<form class="search" role="search" action="collections.html" id="site-search">' +
            '<label class="sr-only" for="search-q">Search products</label>' +
            '<span class="search-icon">' + icon("search") + '</span><input id="search-q" name="q" type="search" placeholder="Search products" autocomplete="off" aria-controls="search-results">' +
            '<div class="search-results" id="search-results" role="listbox" hidden></div></form>' +
          '<button class="search-toggle" type="button" aria-expanded="false" aria-controls="site-search" aria-label="Search products">' + icon("search") + "</button>" +
          '<a class="sl-link" href="shortlist.html"' + (cur === "shortlist" ? ' aria-current="page"' : "") + ">" + icon("heart") + '<span class="sl-count" data-sl-count></span><span class="sr-only" data-sl-label>My shortlist</span></a>' +
          '<button class="btn btn--primary" type="button" data-enquire>Get a free quote</button>' +
          '<button class="menu-toggle" type="button" aria-expanded="false" aria-controls="site-nav" aria-label="Open menu">' + icon("menu") + "</button></div>" +
      "</div></header>";

    var footer =
      '<footer class="site-footer"><div class="wrap">' +
        '<div class="footer-about"><a class="brand" href="index.html"><img class="brand-logo brand-logo--lg" src="assets/img/hde-logo-160.webp" alt="" width="72" height="72"><span class="brand-name">' + esc(B.name) + "</span></a>" +
          "<p class=\"footer-partner\"><img src=\"assets/img/interio-logo.png\" alt=\"interio by Godrej\" width=\"105\" height=\"55\"></p><p>Furniture, modular kitchens and wardrobes for homes and offices in " + esc(B.city) + " and nearby. " + esc(B.partnerLine) + " since " + esc(B.since) + ".</p>" +
          '<p><a href="' + esc(B.instagram) + '" target="_blank" rel="noopener">Instagram</a> &middot; <a href="' + esc(B.facebook) + '" target="_blank" rel="noopener">Facebook</a></p></div>' +
        "<div><h4>Shop</h4><ul>" + D.rooms.map(function (r) { return '<li><a href="collections.html#' + r.slug + '">' + esc(r.name) + "</a></li>"; }).join("") + "</ul></div>" +
        '<div><h4>Help</h4><ul><li><a href="shortlist.html">My shortlist</a></li><li><a href="about.html">About us</a></li><li><a href="contact.html">Get a quote</a></li><li><a href="room-planner.html">See it in your room</a></li><li><a href="contact.html#visit">Free consultation</a></li><li><a href="stores.html">Showrooms</a></li><li><a href="contact.html#faq">FAQs</a></li></ul></div>' +
        '<div><h4>Talk to us</h4><ul><li><a href="tel:' + esc(B.phoneHref) + '">' + esc(B.phone) + '</a></li><li><a href="' + waLink("Hi, I have a question.") + '" target="_blank" rel="noopener">WhatsApp</a></li>' +
          (B.service ? '<li>Service: <a href="tel:' + esc(B.service.phoneHref) + '">' + esc(B.service.phone) + "</a><br>" + esc(B.service.hours) + "</li>" : "") + '<li><a href="mailto:' + esc(B.email) + '">' + esc(B.email) + "</a></li><li>" + esc(B.hours) + "</li></ul></div>" +
      "</div>" +
      '<div class="legal"><div class="wrap"><span>&copy; ' + new Date().getFullYear() + " " + esc(B.name) + ". All rights reserved.</span>" +
        "<span>Godrej and Interio are trademarks of their respective owners.</span></div></div></footer>" +
      '<div class="fab"><a class="fab-wa" href="' + waLink("Hi, I would like a quote.") + '" target="_blank" rel="noopener" aria-label="Chat on WhatsApp">' + icon("wa") + "</a></div>" +
      '<div class="mobile-bar"><a class="btn btn--ghost" href="tel:' + esc(B.phoneHref) + '">' + icon("phone") + "Call</a>" +
        '<a class="btn btn--wa" href="' + waLink("Hi, I would like a quote.") + '" target="_blank" rel="noopener">' + icon("wa") + "WhatsApp</a>" +
        '<button class="btn btn--primary" type="button" data-enquire>Free quote</button></div>' +
      '<div class="modal" id="enquiry-modal" hidden role="dialog" aria-modal="true" aria-labelledby="modal-title">' +
        '<div class="modal-backdrop" data-close></div><div class="modal-box">' +
        '<button class="modal-close" type="button" data-close aria-label="Close">' + icon("close") + "</button>" +
        '<h2 id="modal-title">Get the best price</h2><p class="sub" id="modal-sub">Share your details and our team will call you back with prices, offers and stock.</p>' +
        '<div data-lead-form data-source="popup"></div></div></div>';

    var h = $("#site-header"), f = $("#site-footer");
    if (h) h.outerHTML = header;
    if (f) f.outerHTML = footer;

    var headerEl = $(".site-header");
    var toggle = $(".menu-toggle");
    toggle.addEventListener("click", function () {
      var open = headerEl.toggleAttribute("data-menu");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.innerHTML = icon(open ? "close" : "menu");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    var item = $(".nav-item"), btn = $(".nav-item > button");
    function setMega(open) {
      if (open) item.setAttribute("data-open", ""); else item.removeAttribute("data-open");
      btn.setAttribute("aria-expanded", String(open));
    }
    btn.addEventListener("click", function () { setMega(!item.hasAttribute("data-open")); });
    document.addEventListener("click", function (e) { if (!item.contains(e.target)) setMega(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") { setMega(false); closeModal(); } });
    $all(".nav a").forEach(function (a) { a.addEventListener("click", function () { setMega(false); headerEl.removeAttribute("data-menu"); }); });
    mountSearch(headerEl);
  }

  /* ---------- product search (header) ---------- */
  // Every word typed must appear in the product's name, type or room; name matches rank first.
  function searchProducts(q, list) {
    var words = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    return list.map(function (p) {
      var room = roomBySlug(p.room);
      var name = (p.name || "").toLowerCase();
      var hay = name + " " + (p.type || "").toLowerCase() + " " + (room ? room.name.toLowerCase() : "") + " " + (p.sku || "").toLowerCase();
      if (!words.every(function (w) { return hay.indexOf(w) > -1; })) return null;
      var score = words.reduce(function (s, w) { return s + (name.indexOf(w) === 0 ? 3 : name.indexOf(w) > -1 ? 2 : 0); }, 0);
      return { p: p, score: score };
    }).filter(Boolean).sort(function (a, b) { return b.score - a.score; }).map(function (r) { return r.p; });
  }

  function mountSearch(headerEl) {
    var form = $("#site-search"), input = $("#search-q"), box = $("#search-results"), toggle = $(".search-toggle");
    if (!form) return;
    var q0 = new URLSearchParams(location.search).get("q");
    if (q0 && page() === "collections") input.value = q0;
    function close() { box.hidden = true; }
    function show() {
      var q = input.value.trim();
      if (q.length < 2) { box.innerHTML = ""; close(); return; }
      var hits = searchProducts(q, PRODUCTS);
      box.innerHTML = (hits.length ? hits.slice(0, 6).map(function (p) {
        return '<a class="search-hit" role="option" href="' + (CATALOG ? productHref(p) : "collections.html#" + p.room) + '"><img src="' + esc(p.image) + '" alt="" loading="lazy" width="64" height="48">' +
          "<span><b>" + esc(p.name) + "</b><small>" + (p.type ? esc(p.type) + " · " : "") + priceLabel(p) + " " + rupees(p.from) + "</small></span></a>";
      }).join("") : '<p class="search-none">No products match "' + esc(q) + '". Try another word, or ask us on WhatsApp.</p>') +
        (hits.length > 6 ? '<a class="search-all" href="collections.html?q=' + encodeURIComponent(q) + '">See all ' + hits.length + " results " + icon("arrow") + "</a>" : "");
      box.hidden = false;
    }
    input.addEventListener("input", show);
    input.addEventListener("focus", show);
    form.addEventListener("submit", function (e) { if (!input.value.trim()) e.preventDefault(); });
    input.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { close(); if (headerEl.hasAttribute("data-search")) toggle.click(); }
      if (e.key === "ArrowDown") { var first = $(".search-hit, .search-all", box); if (first) { e.preventDefault(); first.focus(); } }
    });
    box.addEventListener("keydown", function (e) {
      var links = $all("a", box), i = links.indexOf(document.activeElement);
      if (e.key === "ArrowDown" && i < links.length - 1) { e.preventDefault(); links[i + 1].focus(); }
      if (e.key === "ArrowUp") { e.preventDefault(); (i > 0 ? links[i - 1] : input).focus(); }
    });
    document.addEventListener("click", function (e) { if (!form.contains(e.target) && e.target !== toggle && !toggle.contains(e.target)) close(); });
    toggle.addEventListener("click", function () {
      var open = headerEl.toggleAttribute("data-search");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.innerHTML = icon(open ? "close" : "search");
      if (open) { headerEl.removeAttribute("data-menu"); input.focus(); } else close();
    });
  }

  /* ---------- lead forms ---------- */
  var formCount = 0;
  var SOURCE_TO_API = { home: "website", hero: "website", popup: "website", band: "website", collections: "category-page", contact: "contact-form", stores: "showroom-page" };

  function interestOptions(selected) {
    var list = D.rooms.map(function (r) { return r.name; }).concat(["Full home interiors", "Office or commercial project", "Something else"]);
    return '<option value="">Choose one</option>' + list.map(function (n) {
      return "<option" + (n === selected ? " selected" : "") + ">" + esc(n) + "</option>";
    }).join("");
  }

  function leadFormHTML(el) {
    var id = "lf" + (++formCount);
    var compact = el.hasAttribute("data-compact");
    var emailRequired = C.leads.provider === "api";
    var storeOpts = '<option value="">Any showroom</option>' + openStores().map(function (s) { return "<option>" + esc(s.name) + "</option>"; }).join("");
    return '<form class="form" novalidate data-source="' + esc(el.getAttribute("data-source") || page()) + '">' +
      '<div class="form-row">' +
        '<div class="field"><label for="' + id + '-name">Your name</label><input id="' + id + '-name" name="name" autocomplete="name" required><p class="err" aria-live="polite"></p></div>' +
        '<div class="field"><label for="' + id + '-phone">Mobile number</label><input id="' + id + '-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="10-digit mobile" required><p class="err" aria-live="polite"></p></div>' +
      "</div>" +
      '<div class="field"><label for="' + id + '-interest">Looking for</label><select id="' + id + '-interest" name="interest" required>' + interestOptions(el.getAttribute("data-interest")) + '</select><p class="err" aria-live="polite"></p></div>' +
      (compact ? "" :
        '<div class="form-row">' +
          '<div class="field"><label for="' + id + '-email">Email' + (emailRequired ? "" : ' <span class="opt">(optional)</span>') + '</label><input id="' + id + '-email" name="email" type="email" autocomplete="email"' + (emailRequired ? " required" : "") + '><p class="err" aria-live="polite"></p></div>' +
          '<div class="field"><label for="' + id + '-area">Area or city <span class="opt">(optional)</span></label><input id="' + id + '-area" name="area" autocomplete="address-level2" placeholder="e.g. Vasant Vihar"><p class="err"></p></div>' +
        "</div>" +
        '<div class="field"><label for="' + id + '-store">Preferred showroom <span class="opt">(optional)</span></label><select id="' + id + '-store" name="store">' + storeOpts + "</select></div>" +
        '<div class="field"><label for="' + id + '-msg">Anything we should know? <span class="opt">(optional)</span></label><textarea id="' + id + '-msg" name="message" placeholder="Room size, budget, timeline, product you liked"></textarea></div>') +
      '<input type="hidden" name="product" value="">' +
      '<div class="hp" aria-hidden="true"><label for="' + id + '-web">Website</label><input id="' + id + '-web" name="website" tabindex="-1" autocomplete="off"></div>' +
      '<button class="btn btn--primary btn--block" type="submit">Request a call back</button>' +
      '<p class="consent">By submitting, you agree to be contacted by ' + esc(B.name) + " by call, SMS or WhatsApp about your enquiry.</p>" +
      '<p class="form-status" role="status" aria-live="polite"></p>' +
      "</form>";
  }

  function validate(form) {
    var ok = true;
    function setErr(name, msg) {
      var input = form.elements[name];
      if (!input) return;
      var field = input.closest(".field");
      field.querySelector(".err").textContent = msg || "";
      if (msg) { field.setAttribute("data-invalid", ""); input.setAttribute("aria-invalid", "true"); if (ok) input.focus(); ok = false; }
      else { field.removeAttribute("data-invalid"); input.removeAttribute("aria-invalid"); }
    }
    var name = form.elements.name.value.trim();
    setErr("name", name.length < 2 ? "Please enter your name." : "");
    var digits = form.elements.phone.value.replace(/\D/g, "");
    if (digits.length === 12 && digits.indexOf("91") === 0) digits = digits.slice(2);
    if (digits.length === 11 && digits[0] === "0") digits = digits.slice(1);
    setErr("phone", /^[6-9]\d{9}$/.test(digits) ? "" : "Enter a 10-digit mobile number, for example 98765 43210.");
    setErr("interest", form.elements.interest.value ? "" : "Choose what you are looking for.");
    if (form.elements.email) {
      var em = form.elements.email.value.trim();
      var need = form.elements.email.required;
      setErr("email", (need && !em) ? "Please enter your email." : (em && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) ? "Check the email address, it looks incomplete." : "");
    }
    return ok ? digits : null;
  }

  function collect(form, phone) {
    var v = function (n) { return form.elements[n] ? form.elements[n].value.trim() : ""; };
    return {
      name: v("name"), phone: "+91" + phone, email: v("email"), interest: v("interest"),
      area: v("area"), store: v("store"), message: v("message"), product: v("product"),
      source: form.getAttribute("data-source"), page: location.pathname.split("/").pop() || "index.html",
      ref: salesRef, submittedAt: new Date().toISOString()
    };
  }

  function waText(l) {
    return "Hi " + B.name + ", I'm " + l.name + ". I'm interested in " + (l.product || l.interest) +
      (l.area ? " (" + l.area + ")" : "") + "." + (l.message ? " " + l.message : "") + " My number is " + l.phone + "." +
      (l.ref ? " (Ref: " + l.ref + ")" : "");
  }

  function send(lead) {
    var L = C.leads;
    var json = { "Content-Type": "application/json", Accept: "application/json" };
    if (L.provider === "web3forms" && L.web3formsKey) {
      return fetch("https://api.web3forms.com/submit", {
        method: "POST", headers: json,
        body: JSON.stringify(Object.assign({ access_key: L.web3formsKey, subject: "New website enquiry: " + (lead.product || lead.interest), from_name: B.name + " website" }, lead))
      }).then(function (r) { return r.json(); }).then(function (d) { if (!d.success) throw new Error(d.message || "Rejected"); });
    }
    if (L.provider === "formspree" && L.formspreeId) {
      return fetch("https://formspree.io/f/" + encodeURIComponent(L.formspreeId), { method: "POST", headers: json, body: JSON.stringify(lead) })
        .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); });
    }
    if (L.provider === "omniflow" && L.omniflowUrl) {
      // Omniflow's website-lead function assigns the lead to the salesperson whose link (ref) was used
      return fetch(L.omniflowUrl, { method: "POST", headers: json, body: JSON.stringify(lead) })
        .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); });
    }
    if (L.provider === "api" && L.apiBase) {
      var body = {
        name: lead.name, email: lead.email, phone: lead.phone,
        message: [lead.message, lead.area && "Area: " + lead.area, lead.store && "Showroom: " + lead.store].filter(Boolean).join(" | ") || null,
        productInterest: lead.product || lead.interest, category: lead.interest,
        source: SOURCE_TO_API[lead.source] || "website",
        ref: lead.ref || null
      };
      return fetch(L.apiBase.replace(/\/$/, "") + "/api/leads", { method: "POST", headers: json, body: JSON.stringify(body) })
        .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); });
    }
    return Promise.resolve("unsent");
  }

  function doneHTML(lead, result) {
    var wa = '<a class="btn btn--wa" href="' + waLink(waText(lead)) + '" target="_blank" rel="noopener">' + icon("wa") + "Send on WhatsApp</a>";
    if (result === "unsent") {
      return '<div class="form-done"><h3>One last step</h3><p>Tap below to send your enquiry to us on WhatsApp. It is already written for you.</p>' + wa +
        '<p class="form-note">Prefer a call? Ring us on <a href="tel:' + esc(B.phoneHref) + '">' + esc(B.phone) + "</a>.</p></div>";
    }
    return '<div class="form-done"><span class="tick">' + icon("check") + "</span><h3>Thank you, " + esc(lead.name.split(" ")[0]) + "</h3>" +
      "<p>We have your enquiry. Someone from our team will call you on " + esc(lead.phone) + " within working hours.</p>" +
      (C.leads.offerWhatsAppAfterSubmit ? "<p class=\"form-note\">Want an answer sooner?</p>" + wa : "") + "</div>";
  }

  function bindForm(form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (form.elements.website.value) return; // bot
      var phone = validate(form);
      if (!phone) return;
      var lead = collect(form, phone);
      var btn = form.querySelector('[type="submit"]');
      var status = form.querySelector(".form-status");
      btn.disabled = true; btn.textContent = "Sending...";
      status.textContent = ""; status.removeAttribute("data-tone");
      send(lead).then(function (result) {
        form.outerHTML = doneHTML(lead, result);
        if (window.dataLayer) window.dataLayer.push({ event: "lead_submitted", lead_source: lead.source, lead_interest: lead.interest });
      }).catch(function () {
        btn.disabled = false; btn.textContent = "Request a call back";
        status.setAttribute("data-tone", "error");
        status.innerHTML = 'We could not send that just now. Please try again, or <a href="' + waLink(waText(lead)) + '" target="_blank" rel="noopener">send it on WhatsApp</a>.';
      });
    });
  }

  function mountForms(root) {
    $all("[data-lead-form]", root).forEach(function (el) {
      el.innerHTML = leadFormHTML(el);
      bindForm(el.querySelector("form"));
    });
  }

  /* ---------- enquiry modal ---------- */
  var lastFocus = null;
  function openModal(opts) {
    var m = $("#enquiry-modal");
    var slot = $("[data-lead-form]", m);
    slot.setAttribute("data-source", opts.source || page());
    if (opts.interest) slot.setAttribute("data-interest", opts.interest); else slot.removeAttribute("data-interest");
    slot.innerHTML = leadFormHTML(slot);
    var form = slot.querySelector("form");
    form.elements.product.value = opts.product || "";
    if (opts.message && form.elements.message) form.elements.message.value = opts.message;
    bindForm(form);
    $("#modal-title").textContent = opts.product ? "Get the best price" : "Get a free quote";
    $("#modal-sub").textContent = opts.product
      ? "For " + opts.product + ". We will call you back with today's price, offers and stock."
      : "Tell us what you need. We will call you back with ideas, prices and offers.";
    lastFocus = document.activeElement;
    m.hidden = false;
    document.body.style.overflow = "hidden";
    form.elements.name.focus();
  }
  function closeModal() {
    var m = $("#enquiry-modal");
    if (!m || m.hidden) return;
    m.hidden = true;
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-enquire]");
    if (t) {
      e.preventDefault();
      openModal({ product: t.getAttribute("data-product"), interest: t.getAttribute("data-interest"), source: t.getAttribute("data-source"), message: t.getAttribute("data-message") });
      return;
    }
    if (e.target.closest("[data-close]")) closeModal();
  });

  /* ---------- catalogue ---------- */
  function roomBySlug(s) { return D.rooms.filter(function (r) { return r.slug === s; })[0]; }
  // The synced interio.com catalogue (assets/js/catalog.js) replaces the sample products when present.
  var CATALOG = window.HDE_CATALOG && window.HDE_CATALOG.products && window.HDE_CATALOG.products.length ? window.HDE_CATALOG.products : null;
  var PRODUCTS = CATALOG || D.products;
  var PAGE_SIZE = 24;

  // Home page picks: round-robin across rooms so every room shows up.
  function featured(n) {
    var byRoom = D.rooms.map(function (r) { return PRODUCTS.filter(function (p) { return p.room === r.slug; }); });
    var out = [];
    for (var i = 0; out.length < n && i < 50; i++) {
      byRoom.forEach(function (list) { if (list[i] && out.length < n) out.push(list[i]); });
    }
    return out;
  }

  // Synced prices are Interio's MRP; HDE quotes its own discount when the enquiry comes in.
  function priceLabel(p) {
    if (!CATALOG) return "Starting from";
    return (p.mrp ? "MRP" : "Price") + (p.fromPrice ? " from" : "");
  }

  function productHref(p) { return "product.html?id=" + encodeURIComponent(p.id); }

  function heartButton(id, name) {
    var on = shortlist.has(id);
    return '<button class="heart" type="button" data-heart="' + esc(id) + '" data-name="' + esc(name) + '" aria-pressed="' + on + '" aria-label="Shortlist ' + esc(name) + '">' + icon("heart") + "</button>";
  }

  // `label` replaces the type line, for example "Mattress" on a "complete the room" suggestion.
  function productCard(p, label) {
    var room = roomBySlug(p.room) || D.rooms[0];
    // Synced products open their own page; the sample products have no details to show.
    var link = CATALOG ? productHref(p) : "";
    var pic = ph(p.image, room.name, p.name);
    return '<article class="card' + (link ? " card--link" : "") + '">' + (link ? '<a href="' + link + '" tabindex="-1" aria-hidden="true">' + pic + "</a>" : pic) +
      (CATALOG ? heartButton(p.id, p.name) : "") +
      '<div class="card-body"><span class="card-type">' + esc(typeof label === "string" ? label : p.type) + "</span><h3>" + (link ? '<a href="' + link + '">' + esc(p.name) + "</a>" : esc(p.name)) + '</h3><p class="card-note">' + (p.variants ? p.variants + " sizes, colours or finishes. " : "") + esc(p.note) + "</p>" +
      '<div class="card-foot"><span class="price"><small>' + priceLabel(p) + "</small><b>" + rupees(p.from) + "</b></span>" +
      '<button class="btn btn--primary" type="button" data-enquire data-product="' + esc(p.name) + '" data-interest="' + esc(room.name) + '">Get best price</button></div></div></article>';
  }

  /* ---------- product page (product.html?id=...) ---------- */
  function findProduct(id) {
    id = String(id || "").toLowerCase();
    for (var i = 0; i < (CATALOG || []).length; i++) {
      var p = CATALOG[i];
      if (p.id === id) return { card: p, option: id };
      var hit = (p.options || []).filter(function (o) { return o.id === id; })[0];
      if (hit) return { card: p, option: hit.id };
    }
    return null;
  }

  function loadDetails(id) {
    // The preview build inlines details as window.HDE_DETAILS; the live site fetches one small file per product.
    var pre = window.HDE_DETAILS && window.HDE_DETAILS[id];
    if (pre) return Promise.resolve(pre);
    if (!window.fetch) return Promise.resolve(null);
    return fetch("assets/data/products/" + encodeURIComponent(id) + ".json")
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  }

  function setMeta(name, content) {
    var m = $('meta[name="' + name + '"]') || $('meta[property="' + name + '"]');
    if (m) m.setAttribute("content", content);
  }

  function mountProductPage() {
    var root = $("[data-product-page]");
    if (!root) return;
    var params = new URLSearchParams(location.search);
    var found = findProduct(params.get("id"));
    if (!found) {
      root.innerHTML = '<section class="page-hero"><div class="wrap"><p class="crumbs"><a href="index.html">Home</a> / <a href="collections.html">Collections</a></p>' +
        "<h1>We couldn't find that product</h1><p>It may have been renamed or is no longer in the range. Browse the collections or ask us, and we will check stock for you.</p>" +
        '<div class="btns"><a class="btn btn--primary" href="collections.html">Browse collections</a><button class="btn btn--ghost" type="button" data-enquire>Ask us</button></div></div></section>';
      return;
    }
    var card = found.card;
    var room = roomBySlug(card.room) || D.rooms[0];

    function draw(optionId, d) {
      var opt = (card.options || []).filter(function (o) { return o.id === optionId; })[0];
      var name = (d && d.name) || (opt && opt.name) || card.name;
      var price = d ? d.price : (opt ? opt.price : card.from);
      var isMrp = d ? d.mrp : card.mrp;
      var gallery = d && d.gallery && d.gallery.length ? d.gallery : [card.image];
      var specs = (d && d.specs) || [];
      var key = specs.filter(function (r) { return ["Size (W x H x D, cm)", "Colour", "Made of", "Warranty"].indexOf(r[0]) > -1; });
      var pageUrl = location.origin + location.pathname + "?id=" + encodeURIComponent(optionId);
      var waText = "Hi, I'm interested in the " + name + " (" + (isMrp ? "MRP " : "") + rupees(price) + "). Please share your best price and stock. " + pageUrl;

      document.title = name + " | " + B.name + ", " + B.city;
      setMeta("description", name + ", " + (isMrp ? "MRP " : "") + rupees(price) + ". " + (card.note || "") + ". Available at " + B.name + ", " + B.city + ".");
      setMeta("og:title", name);
      setMeta("og:image", gallery[0]);

      var similar = CATALOG.filter(function (p) { return p !== card && p.room === card.room; });
      similar.sort(function (a, b) { return (b.type === card.type) - (a.type === card.type); });
      card.chosenName = name; // so a queen bed gets a queen mattress
      card.chosenColour = ((specs.filter(function (r) { return r[0] === "Colour"; })[0]) || [])[1] || ""; // and walnut gets walnut
      var S = window.HDE_SUGGEST;
      var extras = S ? S.suggest([card], 6) : [];
      var pitch = S ? S.pitch(card) : "";
      var taken = {};
      extras.forEach(function (x) { taken[x.product.id] = true; });
      similar = similar.filter(function (p) { return !taken[p.id]; });

      root.innerHTML =
        '<div class="wrap pdp-crumbs"><p class="crumbs"><a href="index.html">Home</a> / <a href="collections.html#' + room.slug + '">' + esc(room.name) + "</a> / " + esc(name) + "</p></div>" +
        '<section class="wrap pdp">' +
          '<div class="pdp-gallery">' +
            '<div class="pdp-main">' + ph(gallery[0], room.name, name, true) + "</div>" +
            (gallery.length > 1 ? '<div class="pdp-thumbs" role="group" aria-label="More photos">' + gallery.map(function (g, i) {
              return '<button type="button" data-img="' + esc(g) + '" aria-label="Photo ' + (i + 1) + '"' + (i ? "" : ' aria-current="true"') + '><img src="' + esc(g.replace(/width=\d+/, "width=160")) + '" alt="" loading="lazy" width="80" height="60"></button>';
            }).join("") + "</div>" : "") +
          "</div>" +
          '<div class="pdp-info">' +
            '<span class="card-type">' + esc(card.type || room.name) + "</span>" +
            "<h1>" + esc(name) + "</h1>" +
            '<p class="price pdp-price"><small>' + (isMrp ? "MRP (inclusive of all taxes)" : "Price") + "</small><b>" + rupees(price) + "</b></p>" +
            '<p class="pdp-emi">Ask us for today\'s discount. No-cost EMI and exchange with free pickup available.</p>' +
            (card.options && card.options.length > 1 ?
              '<div class="field"><label for="pdp-opt">Size, colour or finish</label><select id="pdp-opt">' + card.options.map(function (o) {
                return '<option value="' + esc(o.id) + '"' + (o.id === optionId ? " selected" : "") + ">" + esc(o.name) + " (" + (isMrp ? "MRP " : "") + rupees(o.price) + ")</option>";
              }).join("") + "</select></div>" : "") +
            (key.length ? '<dl class="pdp-key">' + key.map(function (r) { return "<div><dt>" + esc(r[0]) + "</dt><dd>" + esc(r[1]) + "</dd></div>"; }).join("") + "</dl>" : '<p class="card-note">' + esc(card.note) + "</p>") +
            '<div class="pdp-actions">' +
              '<button class="btn btn--primary" type="button" data-enquire data-product="' + esc(name) + '" data-interest="' + esc(room.name) + '" data-source="product">Get best price</button>' +
              '<a class="btn btn--wa" href="' + esc(waLink(waText)) + '" target="_blank" rel="noopener">' + icon("wa") + "Ask on WhatsApp</a>" +
              '<a class="btn btn--ghost" href="room-planner.html?add=' + encodeURIComponent(optionId) + '">See it in your room</a>' +
              heartToggle(optionId, name) +
              '<button class="btn btn--ghost" type="button" data-share>' + icon("share") + "Share</button>" +
            "</div>" +
            '<ul class="pdp-perks">' +
              "<li>" + icon("truck") + "Timely delivery by our local team in " + esc(B.city) + "</li>" +
              "<li>" + icon("shield") + "Genuine Godrej Interio warranty, serviced by our local team</li>" +
              "<li>" + icon("store") + "See it at our " + openStores().map(function (st) { return esc(st.name.replace(" Showroom", "")); }).join(" or ") + " showroom</li>" +
            "</ul>" +
          "</div>" +
        "</section>" +
        (d && (d.intro || (d.features && d.features.length)) ?
          '<section class="section section--stone"><div class="wrap"><div class="section-head"><div><h2>Why you will like it</h2>' + (d.intro ? "<p>" + esc(d.intro) + "</p>" : "") + "</div></div>" +
          '<div class="pdp-features">' + (d.features || []).map(function (f) {
            return '<article class="pdp-feature">' + (f.image ? ph(f.image, room.name, "") : "") + "<h3>" + esc(f.title) + "</h3><p>" + esc(f.text) + "</p></article>";
          }).join("") + "</div></div></section>" : "") +
        (specs.length || (d && d.care) ?
          '<section class="section"><div class="wrap pdp-specs"><div><h2>Specifications</h2><table class="spec-table"><tbody>' +
            specs.map(function (r) { return '<tr><th scope="row">' + esc(r[0]) + "</th><td>" + esc(r[1]) + "</td></tr>"; }).join("") + "</tbody></table></div>" +
            (d && d.care ? "<div><h2>Care</h2><p>" + esc(d.care) + "</p></div>" : "") +
          "</div></section>" : "") +
        (extras.length ? '<section class="section"><div class="wrap"><div class="section-head"><div><h2>Complete the room</h2>' +
          (pitch ? "<p>Customers who choose " + esc(aKind(card)) + " usually also need " + esc(pitch) + ". Here are picks matched to its " + (S.tone(card) ? esc(S.tone(card)) + " tone, " : "") + "size and budget.</p>" : "") +
          '</div><a class="link-arrow" href="shortlist.html">My shortlist ' + icon("arrow") + '</a></div><div class="grid-products">' +
          extras.map(function (x) { return productCard(x.product, x.label); }).join("") + "</div></div></section>" : "") +
        (similar.length ? '<section class="section section--stone"><div class="wrap"><div class="section-head"><div><h2>You may also like</h2></div><a class="link-arrow" href="collections.html#' + room.slug + '">All ' + esc(room.name.toLowerCase()) + " " + icon("arrow") + '</a></div><div class="grid-products">' +
          similar.slice(0, 4).map(productCard).join("") + "</div></div></section>" : "");
      wireImages(root);
      var ld = { "@context": "https://schema.org", "@type": "Product", name: name, image: gallery, sku: d ? d.sku : card.sku, brand: { "@type": "Brand", name: "Godrej Interio" },
        offers: { "@type": "Offer", priceCurrency: "INR", price: price, availability: "https://schema.org/InStock", seller: { "@type": "Organization", name: B.name } } };
      var tag = $("#pdp-ld") || document.head.appendChild(Object.assign(document.createElement("script"), { id: "pdp-ld", type: "application/ld+json" }));
      tag.textContent = JSON.stringify(ld);
    }

    function show(optionId) {
      loadDetails(optionId).then(function (d) { draw(optionId, d); });
    }
    root.addEventListener("click", function (e) {
      var t = e.target.closest("[data-img]");
      if (t) {
        var img = $(".pdp-main img", root);
        img.src = t.getAttribute("data-img");
        img.classList.remove("is-broken");
        $all("[data-img]", root).forEach(function (b) { b.removeAttribute("aria-current"); });
        t.setAttribute("aria-current", "true");
      }
      if (e.target.closest("[data-share]")) shareLink(document.title, withRef(location.origin + location.pathname + location.search.replace(/[?&]ref=[^&]*/, "").replace(/^&/, "?")));
    });
    root.addEventListener("change", function (e) {
      if (e.target.id === "pdp-opt") {
        history.replaceState(null, "", "?id=" + encodeURIComponent(e.target.value));
        show(e.target.value);
      }
    });
    show(found.option);
  }

  /* ---------- shortlist: hearts, toast, shortlist page ---------- */
  function heartToggle(id, name) {
    var on = shortlist.has(id);
    return '<button class="btn btn--ghost btn--heart" type="button" data-heart="' + esc(id) + '" data-name="' + esc(name) + '" aria-pressed="' + on + '">' +
      icon("heart") + '<span data-heart-text>' + (on ? "Shortlisted" : "Add to shortlist") + "</span></button>";
  }

  function aKind(p) {
    var S = window.HDE_SUGGEST;
    return (S && S.article(S.label(p.kind))) || "this";
  }

  function shareLink(title, url) {
    if (navigator.share) navigator.share({ title: title, url: url }).catch(function () {});
    else window.open("https://wa.me/?text=" + encodeURIComponent(title + " " + url), "_blank", "noopener");
  }

  function syncShortlist() {
    var n = shortlist.all().length;
    $all("[data-sl-count]").forEach(function (el) { el.textContent = n ? String(n) : ""; });
    $all("[data-sl-label]").forEach(function (el) { el.textContent = "My shortlist" + (n ? ", " + n + (n === 1 ? " item" : " items") : ""); });
    $all("[data-heart]").forEach(function (b) {
      var on = shortlist.has(b.getAttribute("data-heart"));
      b.setAttribute("aria-pressed", String(on));
      var t = $("[data-heart-text]", b);
      if (t) t.textContent = on ? "Shortlisted" : "Add to shortlist";
    });
  }

  var toastTimer = null;
  function toast(html) {
    var el = $(".toast") || document.body.appendChild(Object.assign(document.createElement("div"), { className: "toast" }));
    el.setAttribute("role", "status");
    el.innerHTML = html;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.hidden = true; }, 6000);
  }

  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-heart]");
    if (!b) return;
    e.preventDefault();
    var id = b.getAttribute("data-heart");
    var added = shortlist.toggle(id);
    if (!added) { toast("Removed from your shortlist."); return; }
    var hit = findProduct(id);
    var pitch = hit && window.HDE_SUGGEST ? window.HDE_SUGGEST.pitch(hit.card) : "";
    toast("<strong>Added to your shortlist.</strong> " + (pitch ? "With " + esc(aKind(hit.card)) + " you may also need " + esc(pitch) + ". " : "") +
      '<a href="shortlist.html">See shortlist and suggestions</a>');
    if (window.dataLayer) window.dataLayer.push({ event: "shortlist_add", product_id: id });
    // A shortlist is the moment someone is keen: offer to install the site as an app (install.js).
    document.dispatchEvent(new CustomEvent("hde:engaged"));
  });
  document.addEventListener("hde:shortlist", syncShortlist);
  // Keep other open tabs in step.
  window.addEventListener("storage", function (e) { if (e.key === "hde_shortlist") location.reload(); });

  function listItems(ids) {
    return ids.map(function (id) {
      var hit = findProduct(id);
      if (!hit) return null;
      var opt = (hit.card.options || []).filter(function (o) { return o.id === hit.option; })[0];
      return { id: id, card: hit.card, name: opt ? opt.name : hit.card.name, price: opt ? opt.price : hit.card.from, mrp: hit.card.mrp };
    }).filter(Boolean);
  }

  function listText(items) {
    return items.map(function (it, i) { return (i + 1) + ". " + it.name + " (" + (it.mrp ? "MRP " : "") + rupees(it.price) + ")"; }).join("\n");
  }

  function listUrl(items) {
    return withRef(location.origin + location.pathname.replace(/[^/]*$/, "") + "shortlist.html?items=" + items.map(function (it) { return encodeURIComponent(it.id); }).join(","));
  }

  function mountShortlist() {
    var root = $("[data-shortlist]");
    if (!root || !CATALOG) return;
    var shared = (new URLSearchParams(location.search).get("items") || "").split(",").map(function (x) { return x.trim().toLowerCase(); }).filter(Boolean).slice(0, 40);

    function draw() {
      var viewingShared = shared.length > 0;
      var items = listItems(viewingShared ? shared : shortlist.all());
      var total = items.reduce(function (s, it) { return s + (it.price || 0); }, 0);
      var anyMrp = items.some(function (it) { return it.mrp; });
      $("[data-sl-title]").textContent = viewingShared ? "A shortlist shared with you" : "My shortlist";
      $("[data-sl-sub]").textContent = viewingShared
        ? "Someone picked these for you. Save them to your own shortlist, or ask us for the best price on all of them."
        : items.length ? "Saved on this device. Send it to us for one combined price, or share it with family." : "";

      if (!items.length) {
        root.innerHTML = '<div class="wrap section"><div class="sl-empty">' + icon("heart") + "<h2>Your shortlist is empty</h2>" +
          "<p>Tap the heart on any product to save it here. When you are ready, send the whole list to us and we will reply with one combined best price.</p>" +
          '<a class="btn btn--primary" href="collections.html">Browse collections</a></div></div>';
        return;
      }

      var S = window.HDE_SUGGEST;
      items.forEach(function (it) { it.card.chosenName = it.name; });
      var extras = S ? S.suggest(items.map(function (it) { return it.card; }), 6) : [];
      var names = items.map(function (it) { return it.name; });
      var product = names.length === 1 ? names[0] : names[0] + " and " + (names.length - 1) + " more";
      var waMsg = "Hi " + B.name + ", please share your best price for my shortlist:\n" + listText(items) + "\n" + listUrl(items) + (salesRef ? "\n(Ref: " + salesRef + ")" : "");

      root.innerHTML =
        '<section class="section"><div class="wrap sl">' +
          '<div class="sl-list"><ul class="sl-items">' + items.map(function (it) {
            return '<li class="sl-item"><a class="sl-thumb" href="' + productHref({ id: it.id }) + '" tabindex="-1" aria-hidden="true">' + ph(it.card.image, "", "") + "</a>" +
              '<div><span class="card-type">' + esc(S ? S.label(it.card.kind) || it.card.type : it.card.type) + '</span><h3><a href="' + productHref({ id: it.id }) + '">' + esc(it.name) + "</a></h3>" +
              '<p class="price"><small>' + (it.mrp ? "MRP" : "Price") + "</small><b>" + rupees(it.price) + "</b></p></div>" +
              (viewingShared ? "" : '<button class="sl-remove" type="button" data-sl-remove="' + esc(it.id) + '" aria-label="Remove ' + esc(it.name) + '">' + icon("close") + "</button>") +
              "</li>";
          }).join("") + "</ul></div>" +
          '<aside class="sl-summary">' +
            "<h2>" + items.length + (items.length === 1 ? " item" : " items") + "</h2>" +
            '<p class="price"><small>' + (anyMrp ? "Total MRP" : "Total") + "</small><b>" + rupees(total) + "</b></p>" +
            "<p>Buying several pieces together usually gets a better price. Send the list and we will call you with one combined offer.</p>" +
            '<div class="sl-actions">' +
              (viewingShared ? '<button class="btn btn--accent btn--block" type="button" data-sl-save>' + icon("heart") + "Save to my shortlist</button>" : "") +
              '<button class="btn btn--primary btn--block" type="button" data-enquire data-source="shortlist" data-product="' + esc(product) + '" data-message="' + esc("My shortlist:\n" + listText(items) + "\n" + listUrl(items)) + '" data-interest="' + esc((roomBySlug(items[0].card.room) || D.rooms[0]).name) + '">Get best price for all</button>' +
              '<a class="btn btn--wa btn--block" href="' + esc(waLink(waMsg)) + '" target="_blank" rel="noopener">' + icon("wa") + "Send list on WhatsApp</a>" +
              '<button class="btn btn--ghost btn--block" type="button" data-sl-share>' + icon("share") + "Share with family</button>" +
            "</div></aside>" +
        "</div></section>" +
        (extras.length ? '<section class="section section--stone"><div class="wrap"><div class="section-head"><div><h2>Complete your room</h2>' +
          "<p>Our team usually suggests these with what you have picked, matched to its wood tone and your budget.</p></div></div>" +
          '<div class="grid-products">' + extras.map(function (x) { return productCard(x.product, x.label); }).join("") + "</div></div></section>" : "");
      wireImages(root);
      root.setAttribute("data-list", JSON.stringify({ text: listText(items), url: listUrl(items) }));
    }

    root.addEventListener("click", function (e) {
      var r = e.target.closest("[data-sl-remove]");
      if (r) { shortlist.remove(r.getAttribute("data-sl-remove")); draw(); return; }
      if (e.target.closest("[data-sl-save]")) {
        shared.slice().reverse().forEach(function (id) { shortlist.add(id); });
        shared = [];
        history.replaceState(null, "", location.pathname);
        draw();
        toast("<strong>Saved to your shortlist.</strong>");
        return;
      }
      if (e.target.closest("[data-sl-share]")) {
        var d = JSON.parse(root.getAttribute("data-list") || "{}");
        shareLink("My furniture shortlist from " + B.name, d.url);
      }
    });
    // Hearts on the suggestions add to the list, so redraw to move them up and refresh the picks.
    document.addEventListener("hde:shortlist", function () { if (!shared.length) draw(); });
    draw();
  }

  function mountRooms() {
    $all("[data-rooms]").forEach(function (el) {
      // The weekly catalogue sync picks a fresh product photo for each room (catalog.js `rooms`).
      var weekly = (window.HDE_CATALOG && window.HDE_CATALOG.rooms) || {};
      el.innerHTML = D.rooms.map(function (r, i) {
        var pick = weekly[r.slug];
        return '<a class="room" href="collections.html#' + r.slug + '">' + ph(pick ? pick.image : r.image, r.name, pick ? pick.name : "", i < 2) +
          '<span class="room-copy"><h3>' + esc(r.name) + "</h3><span>" + esc(r.blurb) + "</span></span></a>";
      }).join("");
    });
  }

  // Made-to-measure kitchen ranges, shown above the ready-made kitchen sets under Kitchen.
  function kitchenRanges() {
    return '<div class="section-head"><div><h2>Modular kitchen ranges</h2><p>Made to your room in the layout you need: ' +
      esc(D.kitchenLayouts.join(", ")) + '. We plan it with you and give you a fixed quote.</p></div></div><div class="grid-products">' +
      D.kitchenRanges.map(function (r) {
        return '<article class="card"><div class="ph"><img src="' + esc(r.image) + '" alt="' + esc(r.name) + ' modular kitchen" loading="lazy" width="467" height="350"></div>' +
          '<div class="card-body"><span class="card-type">' + esc(r.material) + "</span><h3>" + esc(r.name) + '</h3><p class="card-note">' + esc(r.text) + "</p>" +
          (r.link ? '<a class="link-arrow" href="' + esc(r.link) + '" target="_blank" rel="noopener">Explore the range ' + icon("arrow") + "</a>" : "") +
          '<div class="card-foot"><span class="price"><small>Price</small><b>On quote</b></span><button class="btn btn--primary" type="button" data-enquire data-interest="Modular Kitchen: ' + esc(r.name) + '">Get a quote</button></div></div></article>';
      }).join("") + '</div><div class="section-head kitchen-sets-head"><div><h2>Ready-made kitchen sets</h2></div></div>';
  }

  function mountProducts() {
    $all("[data-products]").forEach(function (el) {
      var limit = parseInt(el.getAttribute("data-limit") || "0", 10);
      var withFilters = el.hasAttribute("data-filters");
      var grid = document.createElement("div");
      grid.className = "grid-products";
      var more = document.createElement("div");
      more.className = "more";
      var bar, current = [], shown = 0;
      var ranges = document.createElement("div");
      ranges.className = "kitchen-ranges";
      function render() {
        grid.innerHTML = current.length ? current.slice(0, shown).map(productCard).join("") : query ?
          '<div class="empty"><p>We could not find "' + esc(query) + '" in our online range. We stock more than we list, so ask us and we will check for you.</p><button class="btn btn--primary" type="button" data-enquire data-product="' + esc(query) + '">Ask about it</button></div>' :
          '<div class="empty"><p>These are designed and priced for your home, so we quote them after a free consultation in our showroom or over the phone.</p><button class="btn btn--primary" type="button" data-enquire data-interest="' + esc((roomBySlug(location.hash.slice(1)) || {}).name || "Full home interiors") + '">Get a free consultation</button></div>';
        wireImages(grid);
        var left = current.length - shown;
        more.innerHTML = left > 0 ? '<p class="more-count">Showing ' + shown + " of " + current.length + '</p><button class="btn btn--ghost" type="button">Show ' + Math.min(left, PAGE_SIZE) + " more</button>" : "";
      }
      more.addEventListener("click", function (e) { if (e.target.closest("button")) { shown += PAGE_SIZE; render(); } });
      var query = withFilters ? (new URLSearchParams(location.search).get("q") || "").trim() : "";
      function draw(slug) {
        var all = limit && !withFilters ? featured(limit) : query ? searchProducts(query, PRODUCTS) : PRODUCTS.filter(function (p) { return !slug || p.room === slug; });
        shown = withFilters ? PAGE_SIZE : all.length;
        current = all;
        render();
        ranges.innerHTML = withFilters && slug === "kitchen" && D.kitchenRanges ? kitchenRanges() : "";
        wireImages(ranges);
        if (bar) $all(".chip", bar).forEach(function (c) { c.setAttribute("aria-pressed", String(c.getAttribute("data-slug") === (slug || ""))); });
        var title = $("[data-room-title]");
        if (title) {
          var r = roomBySlug(slug);
          title.textContent = r ? r.name : query ? 'Results for "' + query + '"' : "All collections";
          var sub = $("[data-room-sub]");
          if (sub) sub.textContent = query && !r ? all.length + (all.length === 1 ? " product matches" : " products match") + ". Ask us for today's best price on any of them." : r ? r.blurb + ". Visit a showroom to see and feel the range, or ask for today's best price." : "Browse by room, then ask for today's best price. Prices below are starting points; offers change every month.";
        }
      }
      el.innerHTML = "";
      if (withFilters) {
        bar = document.createElement("div");
        bar.className = "filters";
        bar.setAttribute("role", "group");
        bar.setAttribute("aria-label", "Filter by room");
        bar.innerHTML = '<button class="chip" type="button" data-slug="">All</button>' +
          D.rooms.map(function (r) { return '<button class="chip" type="button" data-slug="' + r.slug + '">' + esc(r.name) + "</button>"; }).join("");
        bar.addEventListener("click", function (e) {
          var c = e.target.closest(".chip");
          if (!c) return;
          var s = c.getAttribute("data-slug");
          query = "";
          history.replaceState(null, "", location.pathname + (s ? "#" + s : ""));
          draw(s);
        });
        el.appendChild(bar);
        window.addEventListener("hashchange", function () { query = ""; draw(location.hash.slice(1)); });
      }
      el.appendChild(ranges);
      el.appendChild(grid);
      el.appendChild(more);
      draw(withFilters ? location.hash.slice(1) : "");
    });
  }

  function mountStores() {
    $all("[data-stores]").forEach(function (el) {
      el.innerHTML = C.stores.map(function (s) {
        if (s.openingSoon) {
          return '<article class="store store--soon"><span class="tag">Opening soon</span><h3>' + esc(s.name) + "</h3>" +
            "<p>We are opening soon at our favourite location. Until then, visit us in Patel Nagar or call us for a free consultation over the phone.</p>" +
            "<dl><div><dt>Address</dt><dd>" + esc(s.address) + "</dd></div><div><dt>Phone</dt><dd>" + esc(s.phone) + "</dd></div></dl>" +
            '<div class="btns"><a class="btn btn--ghost" href="' + esc(s.mapLink) + '" target="_blank" rel="noopener">' + icon("pin") + "See location</a>" +
            '<a class="btn btn--ghost" href="tel:' + esc(s.phoneHref) + '">' + icon("phone") + "Call</a></div></article>";
        }
        return '<article class="store"><span class="tag">' + esc(s.landmark) + "</span><h3>" + esc(s.name) + "</h3>" +
          (s.rating ? '<p class="store-rating"><span class="stars" aria-hidden="true">\u2605</span> ' + esc(s.rating) + " on Google</p>" : "") +
          "<dl><div><dt>Address</dt><dd>" + esc(s.address) + "</dd></div><div><dt>Phone</dt><dd>" + esc(s.phone) + "</dd></div><div><dt>Open</dt><dd>" + esc(B.hours) + "</dd></div></dl>" +
          '<div class="btns"><a class="btn btn--ghost" href="' + esc(s.mapLink) + '" target="_blank" rel="noopener">' + icon("pin") + "Directions</a>" +
          '<a class="btn btn--ghost" href="tel:' + esc(s.phoneHref) + '">' + icon("phone") + "Call</a>" +
          '<button class="btn btn--primary" type="button" data-enquire data-source="stores" data-interest="Full home interiors">Book a visit</button></div></article>';
      }).join("");
    });
  }

  function mountReviews() {
    $all("[data-reviews]").forEach(function (el) {
      el.innerHTML = D.reviews.map(function (r) {
        return '<figure class="review"><span class="stars" aria-label="5 out of 5">★★★★★</span><blockquote>' + esc(r.text) + "</blockquote><figcaption><strong>" + esc(r.name) + "</strong><br>Google review, " + esc(r.area) + (r.date ? ", " + esc(r.date) : "") + "</figcaption></figure>";
      }).join("");
    });
  }

  function mountBiz() {
    $all("[data-biz]").forEach(function (el) {
      var k = el.getAttribute("data-biz");
      if (k === "tel") { el.href = "tel:" + B.phoneHref; el.textContent = B.phone; }
      else if (k === "wa") { el.href = waLink("Hi, I would like a quote."); }
      else if (k === "mail") { el.href = "mailto:" + B.email; el.textContent = B.email; }
      else if (B[k] != null) el.textContent = B[k];
    });
  }

  /* ---------- hero carousel ---------- */
  function mountSlides() {
    var root = $("[data-slides]");
    if (!root) return;
    var slides = $all(".slide", root);
    var dots = $(".slide-dots", root);
    var i = 0, timer = null;
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    dots.innerHTML = slides.map(function (_, n) { return '<button type="button" aria-label="Show slide ' + (n + 1) + '"></button>'; }).join("");
    function go(n) {
      i = (n + slides.length) % slides.length;
      slides.forEach(function (s, k) { s.classList.toggle("is-active", k === i); s.setAttribute("aria-hidden", String(k !== i)); s.inert = k !== i; });
      $all("button", dots).forEach(function (d, k) { d.setAttribute("aria-current", String(k === i)); });
    }
    function play() { if (!reduce) { stop(); timer = setInterval(function () { go(i + 1); }, 6000); } }
    function stop() { if (timer) clearInterval(timer); timer = null; }
    dots.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      go($all("button", dots).indexOf(b)); play();
    });
    root.addEventListener("mouseenter", stop);
    root.addEventListener("mouseleave", play);
    root.addEventListener("focusin", stop);
    document.addEventListener("visibilitychange", function () { if (document.hidden) stop(); else play(); });
    go(0); play();
  }

  function wireImages(root) {
    $all(".ph img", root).forEach(function (img) {
      function broke() { img.classList.add("is-broken"); }
      if (img.complete && img.naturalWidth === 0 && img.src) broke();
      img.addEventListener("error", broke);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderChrome();
    mountBiz();
    mountRooms();
    mountProducts();
    mountProductPage();
    mountShortlist();
    mountStores();
    mountReviews();
    mountForms(document);
    mountSlides();
    wireImages(document);
    syncShortlist();
  });
})();
