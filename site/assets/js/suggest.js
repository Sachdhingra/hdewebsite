/* Home Decor Enterprises: "Complete the room" suggestions, the way a good salesperson cross-sells.
 * Every catalogue product is sorted into a kind (bed, mattress, sofa...) from its name and type,
 * because the synced room and type labels are not always right. PAIRS then says what goes with
 * each kind, and pick() ranks the products of that kind by how well they go with what was chosen:
 * the same range first (Bliss V2 table, Bliss V2 chairs), then the same colour or tone (a walnut
 * table gets walnut chairs, a dark brown sofa a dark wood coffee table), then the same material
 * and budget. Where nothing really matches, it shows fewer suggestions rather than random ones.
 * Edit PAIRS to change what is suggested; the first kinds listed show first. */
(function () {
  "use strict";

  // Checked top to bottom, first match wins, so the specific kinds come before the general ones.
  var KINDS = [
    ["pillow", "Pillows", "bedroom", /\bpillows?\b/i],
    ["sofabed", "Sofa cum bed", "living", /sofa ?(cum )?bed|diwan/i],
    ["mattress", "Mattress", "bedroom", /mattress/i],
    ["bedside", "Bedside table", "bedroom", /bedside|night ?stand/i],
    ["almirah", "Steel almirah", "bedroom", /^(?!.*wood).*(almirah|steel.*wardrobe|\d ?-?door)/i],
    ["wardrobe", "Wooden wardrobe", "bedroom", /wardrobe/i],
    ["dresser", "Dressing table", "bedroom", /dress(er|ing)/i],
    ["locker", "Home locker", "bedroom", /locker|\bsafe\b/i],
    ["kitchen", "Kitchen", "kitchen", /kitchen/i],
    ["diningset", "Dining set", "dining", /dining set/i],
    ["diningchair", "Dining chairs", "dining", /dining chair/i],
    ["bench", "Dining bench", "dining", /bench/i],
    ["bartable", "Bar table", "dining", /bar (table|stool|unit)/i],
    ["diningtable", "Dining table", "dining", /dining(?! top)/i],
    ["bed", "Bed", "bedroom", /\bbed\b/i],
    ["recliner", "Recliner", "living", /recliner/i],
    ["easychair", "Easy chair", "living", /leisure chair|lounge chair|swivel chair|accent chair|arm ?chair|easy chair|rocking chair/i],
    ["coffee", "Coffee table", "living", /coffee|centre table|center table/i],
    ["corner", "Corner table", "living", /corner table|side table|end table/i],
    ["sofa", "Sofa", "living", /sofa|sectional|seater/i],
    ["tv", "TV unit", "living", /\btv\b|television|entertainment|media unit/i],
    ["display", "Display unit or bookshelf", "living", /display|book ?shelf|showcase/i],
    ["shoerack", "Shoe rack", "living", /shoe/i],
    ["rug", "Rug", "living", /\brugs?\b|carpet/i],
    ["cushion", "Cushion covers", "living", /cushion cover/i],
    ["throw", "Throw", "living", /\bthrows?\b/i],
    ["ottoman", "Ottoman or pouffe", "living", /ottoman|pouff?e?\b/i],
    ["runner", "Table runner", "dining", /runner/i],
    ["mat", "Table mats", "dining", /table mats?|placemat/i],
    ["buffet", "Buffet or sideboard", "dining", /buffet|sideboard|crockery/i],
    ["officechair", "Office chair", "office", /chair/i],
    ["desk", "Desk or study table", "office", /desk|study table|computer table|wfh|work ?station|table t ?\d/i],
    ["officestorage", "Office storage", "office", /pedestal|filing|cabinet|storage|mobile ped/i]
  ];
  // Some kinds only show up in the product type, not the name ("Leisure chairs", "Sofa Sets").
  var BY_TYPE = [
    [/leisure chair/i, "easychair"], [/sofa/i, "sofa"], [/dining/i, "diningtable"], [/steel almirah/i, "almirah"],
    [/tv unit/i, "tv"], [/work desk|study/i, "desk"]
  ];

  var PAIRS = {
    bed: ["mattress", "bedside", "dresser", "wardrobe", "almirah", "pillow"],
    mattress: ["bed", "pillow", "bedside"],
    bedside: ["bed", "mattress", "dresser"],
    dresser: ["bed", "bedside", "wardrobe"],
    wardrobe: ["bed", "dresser", "locker"],
    almirah: ["locker", "bed", "dresser"],
    locker: ["almirah", "wardrobe"],
    pillow: ["mattress", "bed"],
    sofa: ["easychair", "recliner", "coffee", "corner", "tv", "ottoman", "rug", "cushion"],
    sofabed: ["coffee", "corner", "cushion", "rug", "pillow"],
    recliner: ["sofa", "corner", "coffee", "tv", "rug", "throw"],
    easychair: ["sofa", "corner", "coffee", "ottoman", "rug"],
    coffee: ["sofa", "corner", "easychair", "tv", "rug"],
    corner: ["sofa", "coffee", "easychair", "rug"],
    tv: ["sofa", "display", "coffee", "corner"],
    display: ["tv", "sofa"],
    shoerack: ["display", "tv"],
    rug: ["sofa", "coffee", "cushion"],
    cushion: ["sofa", "throw", "rug"],
    throw: ["sofa", "cushion"],
    ottoman: ["sofa", "easychair", "coffee"],
    diningtable: ["diningchair", "diningchair", "bench", "buffet", "runner", "mat"],
    diningset: ["buffet", "runner", "mat"],
    diningchair: ["diningtable", "diningtable", "bench", "buffet", "runner", "mat"],
    bench: ["diningtable", "diningchair"],
    buffet: ["diningset", "runner"],
    runner: ["mat", "diningset"],
    mat: ["runner", "diningset"],
    officechair: ["desk", "officestorage"],
    desk: ["officechair", "officestorage"],
    officestorage: ["desk", "officechair"]
  };

  var LABEL = {}, ROOM = {};
  KINDS.forEach(function (k) { LABEL[k[0]] = k[1]; ROOM[k[0]] = k[2]; });

  var CAT = (window.HDE_CATALOG && window.HDE_CATALOG.products) || [];

  function kindOf(p) {
    for (var i = 0; i < KINDS.length; i++) if (KINDS[i][3].test(p.name || "")) return single(p, KINDS[i][0]);
    for (var j = 0; j < BY_TYPE.length; j++) if (BY_TYPE[j][0].test(p.type || "")) return BY_TYPE[j][1];
    return "";
  }

  // A 1-seater sofa sold on its own is an easy chair; one that also comes as a 2 or 3 seater is a sofa.
  function single(p, kind) {
    if (kind !== "sofa" || !/\b1-? ?seater\b/i.test(p.name || "")) return kind;
    return (p.options || []).some(function (o) { return /\b[2-7]-? ?seater|sofa set|l[ -]?shape/i.test(o.name); }) ? kind : "easychair";
  }

  // Bed and mattress widths: single 30-36", double 48", queen 60", king 72".
  function sizeOf(name) {
    var m = /\b(single|double|queen|king)\b/i.exec(name || "");
    if (m) return m[1].toLowerCase();
    var w = /\d{2} ?x ?(\d{2})/i.exec(name || "");
    if (!w) return "";
    var n = +w[1];
    return n <= 36 ? "single" : n <= 48 ? "double" : n <= 66 ? "queen" : "king";
  }

  // The note holds the colour and what it is made of, in either order: "Walnut, Rubberwood",
  // "Solid Wood, Toffee", "1-Year Warranty, Black, Mild Steel". Split it so a sofa is matched on its
  // upholstery colour, not on the pinewood frame inside it.
  var MATERIAL = /wood|mdf|board|steel|metal|glass|marble|ply|knock down|fib(er|re)|nylon|particle|cotton|poly|wool|leather|fabric|\bpp\b|^wood$/i;
  function splitNote(note) {
    var colour = "", made = [];
    String(note || "").split(/,\s*/).forEach(function (part) {
      part = part.trim();
      if (!part || /warr?a?n?ty|^table with|chairs?$/i.test(part)) return;
      if (MATERIAL.test(part) && !/^(dark|light) wood$/i.test(part)) made.push(part);
      else if (!colour) colour = part;
    });
    return { colour: colour, made: made.join(", ") };
  }

  // Colour tones, so a walnut table gets walnut-toned chairs and a dark brown sofa a dark wood coffee table.
  // The earliest match wins, so "Brown & Cream" is medium and "Cream and Coffee Brown" is light.
  // Bright upholstery (blue, green, purple...) is an "accent": it goes with any wood.
  var TONES = [
    ["dark", /walnut|wenge|mahogany|dark|black|brownish|coffee|chocolate|choco|espresso|rose ?wood|sheesham|sepia|noce|ebony|cola[ -]?rain|burg[au]n?dy|tobac/i],
    ["grey", /grey|gray|graphite|gunmetal|chrome|granite|gargoyle|silver|tree mist|\bmist\b/i],
    ["light", /white|cream|ivory|beige|frost|maple|beech|pine|sonoma|\bash\b|light|vanilla|taupe|khaki|mushroom|almond|sand/i],
    ["medium", /oak|teak|cherry|cinnamon|cappuccino|honey|gordion|brown|\btan\b|toffee|camel|peanut|cognac|natural/i],
    ["accent", /blue|green|purple|pink|red|forest|olive|azure|jade|blush|teal|yellow|orange|mustard|multicolou?r/i]
  ];
  var TONE_NAME = { dark: "dark wood", medium: "medium wood", light: "light finish", grey: "grey finish", accent: "" };
  var TONE_SOFT = { dark: "dark tones", medium: "warm brown tones", light: "light tones", grey: "grey tones", accent: "" };
  // Tones that still sit well together when there is no exact match.
  var NEAR = { dark: ["medium", "grey"], medium: ["dark", "light"], light: ["medium", "grey"], grey: ["light", "dark"], accent: [] };
  // Upholstered pieces: their colour is the fabric or leather, so say "tones" rather than "wood".
  var SOFT = { sofa: 1, sofabed: 1, recliner: 1, easychair: 1, ottoman: 1, rug: 1, cushion: 1, throw: 1, runner: 1, mat: 1 };
  // Kinds where colour and finish decide the match. The rest (mattresses, almirahs, office chairs...)
  // are matched on size and budget only.
  var LOOKS = { runner: 1, mat: 1, bed: 1, bedside: 1, dresser: 1, wardrobe: 1, coffee: 1, corner: 1, tv: 1, display: 1, shoerack: 1,
    diningtable: 1, diningset: 1, diningchair: 1, buffet: 1, bench: 1, desk: 1, officestorage: 1,
    sofa: 1, sofabed: 1, recliner: 1, easychair: 1, ottoman: 1, rug: 1, cushion: 1, throw: 1 };
  // Kinds where wood next to metal looks wrong (a walnut dining table with chrome chairs).
  var BUILT = { bed: 1, bedside: 1, dresser: 1, diningtable: 1, diningset: 1, diningchair: 1, bench: 1, buffet: 1,
    coffee: 1, corner: 1, tv: 1, display: 1 };

  function toneOf(text) {
    var best = "", at = Infinity;
    TONES.forEach(function (t) { var m = t[1].exec(text || ""); if (m && m.index < at) { at = m.index; best = t[0]; } });
    return best;
  }
  function madeOf(text) {
    if (/steel|metal|chrome|iron/i.test(text)) return "metal";
    if (/marble/i.test(text)) return "marble";
    if (/glass/i.test(text)) return "glass";
    if (/wood|mdf|board|ply|particle|knock down/i.test(text)) return "wood";
    return "";
  }
  // The tone of the finish the customer chose (the product page passes its Colour), else the product's own.
  function anchorTone(a) { return toneOf(a.chosenColour) || toneOf(optionColour(a)) || a.tone || ""; }
  function anchorColour(a) { return a.chosenColour || optionColour(a) || a.colour || ""; }
  // "Emperor Synthetic Leather Sofa Set Toffee 3-Seater 2-Seater": the colour in the chosen option's name.
  function optionColour(a) {
    var extra = String(a.chosenName || "").replace(a.name || "", "");
    return toneOf(extra) ? extra.replace(/\d.*$/, "").trim() : "";
  }

  // The range or collection, from the first word of the name: "Bliss V2 Fabric Dining Chair" is Bliss,
  // "Upmods Muna Synthetic Leather Dining Chair" is Muna. Interio sells matching tables, chairs, benches,
  // coffee and corner tables under one range name, so this is the strongest sign two pieces belong together.
  var NOT_A_RANGE = /^(upmods|modular|steel|wooden|engineered|solid|solidwood|fabric|leather|prelaminated|particle|metal|kd|hand|the|set|single|double|queen|king|\d.*|lift|display|abstract|floral|core|bay|kreative)$/i;
  // Spelling slips in the catalogue, and ranges sold together under different names.
  var SAME_RANGE = { mangum: "magnum", emporer: "emperor", lisav2: "lisa", kalyx: "franky" };
  function rangeOf(p) {
    var w = String(p.name || "").replace(/^upmods\s+/i, "").split(/[\s-]+/)[0].toLowerCase();
    w = SAME_RANGE[w] || w;
    return w.length > 2 && !NOT_A_RANGE.test(w) ? w : "";
  }
  function rangeName(p) {
    var w = String(p.name || "").replace(/^upmods\s+/i, "").split(/[\s-]+/)[0];
    return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  }

  var byKind = {};
  CAT.forEach(function (p) {
    p.kind = kindOf(p);
    var n = splitNote(p.note);
    p.colour = n.colour;
    p.made = madeOf(n.made) || madeOf(p.name);
    p.tone = toneOf(n.colour) || toneOf(p.name);
    p.range = rangeOf(p);
    // Put clearly misfiled products back in their room (for example office chairs listed under Bedroom).
    if (p.kind && ROOM[p.kind] && p.room !== ROOM[p.kind] && !(p.kind === "almirah" || p.kind === "locker")) p.room = ROOM[p.kind];
    if (!p.kind) return;
    (byKind[p.kind] = byKind[p.kind] || []).push(p);
  });
  Object.keys(byKind).forEach(function (k) { byKind[k].sort(function (a, b) { return a.from - b.from; }); });

  // Where a product sits in its own kind's price range, from 0 (cheapest) to 1 (dearest).
  function tier(p) {
    var list = byKind[p.kind] || [p];
    if (list.length < 2) return 0.5;
    var i = list.indexOf(p);
    return (i < 0 ? 0.5 : i / (list.length - 1));
  }

  // Colour words two pieces share ("Walnut" and "Fine Walnut"), ignoring words that say little.
  function sharedColour(a, b) {
    var skip = /^(and|high|gloss|dark|light|natural|fine|soft|warm|with|the|brown)$/i;
    // Only real colour words count: "Pebble Black" and "Pebble Grey" are not the same colour.
    var wa = String(a || "").toLowerCase().split(/[^a-z]+/).filter(function (w) { return w.length > 2 && !skip.test(w) && toneOf(w); });
    var wb = String(b || "").toLowerCase().split(/[^a-z]+/);
    return wa.filter(function (w) { return wb.indexOf(w) > -1; })[0] || "";
  }

  function title(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  // How well a candidate goes with what the customer picked, and the reason to show them.
  // Same range counts most, then the same colour or tone, then the same material, then the budget.
  function score(c, kind, anchors) {
    var best = { score: -Infinity, why: "" };
    anchors.forEach(function (a) {
      var s = 0, why = "", your = "your " + (LABEL[a.kind] || "pick").toLowerCase().replace(/s$/, "").replace(/\btv\b/, "TV");
      if (c.range && c.range === a.range) {
        s += 100;
        why = rangeName(c) === rangeName(a) ? "Same " + rangeName(c) + " range as " + your : "Made to go with " + your;
      }
      if (LOOKS[kind] && LOOKS[a.kind]) {
        var t = anchorTone(a), word = sharedColour(anchorColour(a), c.colour);
        if (word) { s += 45; why = why || title(word) + ", to match " + your; }
        else if (t && c.tone && t !== "accent" && c.tone !== "accent") {
          // Wood next to wood has to match closely; a sofa's fabric and a table's wood only have to sit well together.
          var loose = SOFT[a.kind] && !SOFT[kind];
          if (c.tone === t) { s += 35; why = why || title((SOFT[kind] || c.made !== "wood" ? TONE_SOFT : TONE_NAME)[t]) + " to go with " + your; }
          else if (NEAR[t].indexOf(c.tone) > -1) { s += loose ? 22 : 12; why = why || "Pairs well with " + your; }
          else if (!loose) s -= 30;
        } else if (t === "accent" && c.tone && c.tone !== "accent" && !SOFT[kind]) { s += 25; why = why || "A neutral finish to go with " + your; }
        if (BUILT[kind] && BUILT[a.kind] && c.made && a.made) {
          if (c.made === a.made || (a.made === "glass" && c.made === "metal") || (a.made === "marble" && c.made === "wood")) s += 15;
          else if (c.made === "metal" || a.made === "metal") s -= 25;
        }
      }
      // Same budget: a premium sofa gets a premium coffee table. Dearer than the main piece counts against,
      // unless it is from the same range.
      s += 15 * (1 - Math.abs(tier(c) - tier(a)));
      if (a.from && c.from > a.from * 1.1 && c.range !== a.range) s -= 20;
      if (s > best.score) best = { score: s, why: why };
    });
    return best;
  }

  // The best few products of a kind for the anchors, best first. Kinds where looks matter need a real
  // match (same range, colour or tone); if none qualifies we show nothing rather than a random piece.
  var GOOD_ENOUGH = 30;
  function pick(kind, anchors, skip, n) {
    var list = (byKind[kind] || []).filter(function (p) { return !skip[p.id]; });
    if (!list.length) return [];
    if (kind === "mattress" || kind === "bed") {
      var size = "";
      anchors.some(function (a) { if (a.kind === "bed" || a.kind === "mattress") size = sizeOf(a.chosenName || a.name); return !!size; });
      if (size) {
        var fit = list.filter(function (p) {
          return sizeOf(p.name) === size || (p.options || []).some(function (o) { return sizeOf(o.name) === size; });
        });
        if (fit.length) list = fit;
      }
    }
    var looks = LOOKS[kind] && anchors.some(function (a) { return LOOKS[a.kind]; });
    var ranked = list.map(function (p) { var r = score(p, kind, anchors); return { product: p, score: r.score, why: r.why }; })
      .filter(function (r) { return !looks || r.score >= GOOD_ENOUGH; })
      .sort(function (a, b) { return b.score - a.score || a.product.from - b.product.from; });
    var out = [], seen = {};
    for (var i = 0; i < ranked.length && out.length < n; i++) {
      // Two picks of one kind should be two different looks, not the 4- and 6-seater of the same thing.
      var key = ranked[i].product.range || ranked[i].product.id;
      if (out.length && seen[key]) continue;
      seen[key] = 1;
      if (!looks && !ranked[i].why) ranked[i].why = /mattress|bed/.test(kind) && sizeOf(ranked[i].product.name) ? title(sizeOf(ranked[i].product.name)) + " size, in your budget" : "In the same budget";
      out.push(ranked[i]);
    }
    return out;
  }

  // Suggestions for a set of products (one product page, or a whole shortlist).
  // Returns [{kind, label, why, product}], skipping kinds already chosen. A kind listed twice in PAIRS
  // (dining chairs for a dining table) gets two picks.
  function suggest(anchors, limit) {
    anchors = anchors.filter(function (a) { return a && a.kind; });
    var have = {}, skip = {}, out = [], want = {}, queue = [];
    anchors.forEach(function (a) { have[a.kind] = true; skip[a.id] = true; });
    // Interleave so a shortlist with a bed and a sofa gets the top picks for both first.
    for (var r = 0; r < 8; r++) anchors.forEach(function (a) {
      var list = PAIRS[a.kind] || [], k = list[r];
      if (!k || have[k]) return;
      var times = list.slice(0, r + 1).filter(function (x) { return x === k; }).length;
      if ((want[k] || 0) < times) { want[k] = times; if (queue.indexOf(k) < 0) queue.push(k); }
    });
    queue.forEach(function (k) {
      if (out.length >= (limit || 6)) return;
      var group = anchors.filter(function (a) { return (PAIRS[a.kind] || []).indexOf(k) > -1; });
      pick(k, group, skip, Math.min(want[k], (limit || 6) - out.length)).forEach(function (r) {
        skip[r.product.id] = true;
        out.push({ kind: k, label: LABEL[k], why: r.why, product: r.product });
      });
    });
    return out;
  }

  // "a mattress", "an ottoman", "cushion covers"
  function article(label) {
    var l = String(label || "").toLowerCase();
    if (!l) return "";
    return /[^s]s$/.test(l) ? l : (/^[aeiou]/.test(l) ? "an " : "a ") + l;
  }

  // "Customers who buy a bed also need..." line for a product.
  function pitch(p) {
    var pairs = (PAIRS[p && p.kind] || []).filter(function (k, i, all) { return all.indexOf(k) === i; }).slice(0, 3).map(function (k) { return article(LABEL[k]); });
    if (!pairs.length) return "";
    return pairs.length === 1 ? pairs[0] : pairs.slice(0, -1).join(", ") + " and " + pairs[pairs.length - 1];
  }

  window.HDE_SUGGEST = { kindOf: kindOf, label: function (k) { return LABEL[k] || ""; }, article: article, suggest: suggest, pitch: pitch, sizeOf: sizeOf,
    tone: function (p) { return TONE_NAME[anchorTone(p)] || ""; } };
})();
