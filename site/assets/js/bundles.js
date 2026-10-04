/* Home Decor Enterprises: budget home packages for the home page ("Under ₹50,000" and so on).
 * Each package mixes real catalogue products (bed, mattress, sofa, dining set, almirah) picked at
 * random, so every visit and every "Shuffle" shows new ideas. The total of the MRPs stays within
 * the budget and close to it, so an "under ₹1 lakh" package is not the same as an "under ₹50,000" one.
 * The mattress always fits the bed size. Edit PACKS to change the mixes and TIERS to change budgets.
 * Needs suggest.js (it sorts products into kinds). */
(function () {
  "use strict";

  // Budgets, and the lowest total a package in that budget should reach.
  var TIERS = [
    { key: "50k", cap: 50000, floor: 30000, label: "Under ₹50,000" },
    { key: "75k", cap: 75000, floor: 50000, label: "Under ₹75,000" },
    { key: "1l", cap: 100000, floor: 75000, label: "Under ₹1 lakh" },
    { key: "1.5l", cap: 150000, floor: 100000, label: "Under ₹1.5 lakh" },
    { key: "2l", cap: 200000, floor: 150000, label: "Under ₹2 lakh" }
  ];

  // The mixes. A budget only shows the mixes that fit it.
  var PACKS = [
    { key: "bedroom", name: "Bedroom essentials", kinds: ["bed", "mattress"] },
    { key: "bedroom-plus", name: "Complete bedroom", kinds: ["bed", "mattress", "almirah"] },
    { key: "living-dining", name: "Living and dining", kinds: ["sofa", "dining"] },
    { key: "starter", name: "New home starter", kinds: ["bed", "mattress", "sofa"] },
    { key: "sofa-storage", name: "Sofa and almirah", kinds: ["sofa", "almirah"] },
    { key: "bed-dining", name: "Bedroom and dining", kinds: ["bed", "mattress", "dining"] },
    { key: "home", name: "Full home package", kinds: ["bed", "mattress", "sofa", "dining", "almirah"] }
  ];

  var LABEL = { bed: "Bed", mattress: "Mattress", sofa: "Sofa", dining: "Dining set", almirah: "Almirah" };
  var SIZES = { double: 1, queen: 1, king: 1 };

  var S = window.HDE_SUGGEST;
  var CAT = (window.HDE_CATALOG && window.HDE_CATALOG.products) || [];

  function item(card, kind, id, name, price, size) {
    return { kind: kind, id: id, name: name, price: price, image: card.image, size: size || "", mrp: !!card.mrp, card: card };
  }

  // One list per kind of what can go in a package, each with one size and one price.
  var POOL = { bed: [], mattress: [], sofa: [], dining: [], almirah: [] };
  if (S) CAT.forEach(function (p) {
    var k = S.kindOf(p), name = p.name || "";
    if (!p.from || !p.image) return;
    if (k === "bed") {
      // Families buy double, queen and king beds. A bed card with sizes lists each size once.
      var size = S.sizeOf(name);
      if (SIZES[size]) return POOL.bed.push(item(p, "bed", p.id, name, p.from, size));
      var seen = {};
      (p.options || []).forEach(function (o) {
        var s = S.sizeOf(o.name);
        if (SIZES[s] && !seen[s] && o.price) { seen[s] = 1; POOL.bed.push(item(p, "bed", o.id, o.name, o.price, s)); }
      });
    } else if (k === "mattress") {
      var ms = S.sizeOf(name);
      if (SIZES[ms] && !/combo/i.test(name)) POOL.mattress.push(item(p, "mattress", p.id, name, p.from, ms));
    } else if (k === "sofa" && /sofa/i.test(name)) {
      // A living room needs a 2-seater or bigger, a sofa set or an L shape, not a single armchair.
      var big = /\b[2-7] ?-?seater|sofa set|l[ -]?shape/i;
      if (big.test(name)) return POOL.sofa.push(item(p, "sofa", p.id, name, p.from));
      var opt = (p.options || []).filter(function (o) { return big.test(o.name) && o.price; })[0];
      if (opt) POOL.sofa.push(item(p, "sofa", opt.id, opt.name, opt.price));
    } else if (k === "diningset") {
      POOL.dining.push(item(p, "dining", p.id, name, p.from));
    } else if ((k === "almirah" || k === "wardrobe") && /almirah|wardrobe/i.test(name) && !/locker unit/i.test(name)) {
      POOL.almirah.push(item(p, "almirah", p.id, name, p.from));
    }
  });
  Object.keys(POOL).forEach(function (k) { POOL[k].sort(function (a, b) { return a.price - b.price; }); });

  function cheapest(kind, size) {
    var list = POOL[kind].filter(function (x) { return !size || x.size === size; });
    return list.length ? list[0].price : Infinity;
  }

  function any(list) { return list[Math.floor(Math.random() * list.length)]; }

  function shuffled(list) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  // One random package of these kinds whose total is between floor and cap, or null.
  function fill(kinds, cap, floor) {
    for (var tries = 0; tries < 300; tries++) {
      var picked = [], total = 0, size = "", ok = true;
      for (var i = 0; i < kinds.length && ok; i++) {
        var k = kinds[i];
        // Leave enough budget for the cheapest of everything still to come.
        var rest = 0;
        for (var j = i + 1; j < kinds.length; j++) rest += cheapest(kinds[j], kinds[j] === "mattress" ? size : "");
        var room = cap - total - rest;
        var list = POOL[k].filter(function (x) { return x.price <= room && (k !== "mattress" || !size || x.size === size); });
        // The last piece tops the package up towards the budget where it can.
        if (i === kinds.length - 1) {
          var topUp = list.filter(function (x) { return total + x.price >= floor; });
          if (topUp.length) list = topUp;
        }
        if (!list.length) { ok = false; break; }
        var x = any(list);
        if (x.kind === "bed") size = x.size;
        picked.push(x);
        total += x.price;
      }
      if (ok && total >= floor && total <= cap) return { items: picked, total: total };
    }
    return null;
  }

  // Up to `count` packages for a budget, each a different mix.
  function make(tierKey, count) {
    var tier = TIERS.filter(function (t) { return t.key === tierKey; })[0] || TIERS[0];
    var out = [];
    shuffled(PACKS).forEach(function (pack) {
      if (out.length >= (count || 3)) return;
      var hit = fill(pack.kinds, tier.cap, tier.floor);
      if (hit) out.push({ key: pack.key, name: pack.name, tier: tier, items: hit.items, total: hit.total });
    });
    return out;
  }

  // "Bed, queen size"
  function label(x) { return LABEL[x.kind] + (x.size ? ", " + x.size + " size" : ""); }

  window.HDE_BUNDLES = { tiers: TIERS, packs: PACKS, make: make, label: label, pool: POOL };
})();
