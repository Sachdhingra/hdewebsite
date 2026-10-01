/* Home Decor Enterprises: "Complete the room" suggestions, the way a good salesperson cross-sells.
 * Every catalogue product is sorted into a kind (bed, mattress, sofa...) from its name and type,
 * because the synced room and type labels are not always right. PAIRS then says what goes with
 * each kind, and pick() chooses the item of that kind closest to the customer's budget:
 * a premium bed gets a premium mattress, a budget sofa gets a budget coffee table.
 * Wooden pieces also match the wood tone: a walnut bed gets dark bedside tables, and the other way round.
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
    ["diningtable", "Dining table", "dining", /dining/i],
    ["bed", "Bed", "bedroom", /\bbed\b/i],
    ["recliner", "Recliner", "living", /recliner/i],
    ["coffee", "Coffee table", "living", /coffee|centre table|center table/i],
    ["corner", "Corner table", "living", /corner table|side table|end table/i],
    ["sofa", "Sofa", "living", /sofa|sectional|seater/i],
    ["tv", "TV unit", "living", /\btv\b|television|entertainment|media unit/i],
    ["display", "Display unit or bookshelf", "living", /display|book ?shelf|showcase/i],
    ["shoerack", "Shoe rack", "living", /shoe/i],
    ["rug", "Rug", "living", /\brugs?\b|carpet/i],
    ["cushion", "Cushion covers", "living", /cushion cover/i],
    ["throw", "Throw", "living", /\bthrows?\b/i],
    ["ottoman", "Ottoman or pouffe", "living", /ottoman|pouffe/i],
    ["runner", "Table runner", "dining", /runner/i],
    ["mat", "Table mats", "dining", /table mats?|placemat/i],
    ["buffet", "Buffet or sideboard", "dining", /buffet|sideboard|crockery/i],
    ["officechair", "Office chair", "office", /chair/i],
    ["desk", "Desk or study table", "office", /desk|study table|computer table|wfh|work ?station|table t ?\d/i],
    ["officestorage", "Office storage", "office", /pedestal|filing|cabinet|storage|mobile ped/i]
  ];
  // Some kinds only show up in the product type, not the name ("Leisure chairs", "Sofa Sets").
  var BY_TYPE = [
    [/leisure chair/i, "recliner"], [/sofa/i, "sofa"], [/dining/i, "diningtable"], [/steel almirah/i, "almirah"],
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
    sofa: ["coffee", "corner", "rug", "cushion", "tv", "throw"],
    sofabed: ["coffee", "cushion", "rug", "pillow"],
    recliner: ["corner", "coffee", "rug", "throw"],
    coffee: ["sofa", "corner", "rug"],
    corner: ["sofa", "coffee", "rug"],
    tv: ["sofa", "display", "coffee"],
    display: ["tv", "sofa"],
    shoerack: ["display", "tv"],
    rug: ["sofa", "coffee", "cushion"],
    cushion: ["sofa", "throw", "rug"],
    throw: ["sofa", "cushion"],
    ottoman: ["sofa", "coffee"],
    diningtable: ["diningchair", "buffet", "runner", "mat", "bench"],
    diningset: ["buffet", "runner", "mat"],
    diningchair: ["diningtable", "runner", "mat"],
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
    for (var i = 0; i < KINDS.length; i++) if (KINDS[i][3].test(p.name || "")) return KINDS[i][0];
    for (var j = 0; j < BY_TYPE.length; j++) if (BY_TYPE[j][0].test(p.type || "")) return BY_TYPE[j][1];
    return "";
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

  // Wood and finish tones, so a walnut bed gets walnut-toned bedside tables and the other way round.
  // The colour is in the product note ("1-Year Warranty, Fine Walnut, Solid Wood") or the name.
  // The earliest match wins, so "Brown & Cream" is medium and "Sonoma Oak" is light.
  var TONES = [
    ["dark", /walnut|wenge|mahogany|dark|black|brownish|coffee|chocolate|espresso|rosewood|sheesham|sepia|noce|ebony|cola[ -]?rain/i],
    ["grey", /grey|gray|gunmetal|chrome|granite|gargoyle|silver|tree mist/i],
    ["light", /white|cream|ivory|beige|frost|maple|beech|pine|sonoma|\bash\b|light|vanilla|taupe/i],
    ["medium", /oak|teak|cherry|cinnamon|cappuccino|honey|gordion|brown|\btan\b/i]
  ];
  var TONE_NAME = { dark: "dark wood", medium: "medium wood", light: "light finish", grey: "grey finish" };
  // Tones that still sit well together when there is no exact match.
  var NEAR = { dark: ["medium", "grey"], medium: ["dark", "light"], light: ["medium", "grey"], grey: ["light", "dark"] };
  // Kinds where the finish has to match; mattresses, rugs and cushions are left alone.
  var WOOD = { bed: 1, bedside: 1, dresser: 1, wardrobe: 1, coffee: 1, corner: 1, tv: 1, display: 1, shoerack: 1,
    diningtable: 1, diningset: 1, diningchair: 1, buffet: 1, bench: 1, desk: 1, officestorage: 1 };

  function toneOf(text) {
    var best = "", at = Infinity;
    TONES.forEach(function (t) { var m = t[1].exec(text || ""); if (m && m.index < at) { at = m.index; best = t[0]; } });
    return best;
  }
  // The tone of the finish the customer chose (the product page passes its Colour), else the product's own.
  function anchorTone(a) { return toneOf(a.chosenColour) || toneOf(a.chosenName) || a.tone || ""; }

  var byKind = {};
  CAT.forEach(function (p) {
    p.kind = kindOf(p);
    p.tone = toneOf((p.note || "").replace(/(\d+-year|no) warranty,?\s*/i, "")) || toneOf(p.name);
    // Put clearly misfiled products back in their room (for example office chairs listed under Bedroom).
    if (p.kind && ROOM[p.kind] && p.room !== ROOM[p.kind] && !(p.kind === "almirah" || p.kind === "locker")) p.room = ROOM[p.kind];
    if (!p.kind) return;
    (byKind[p.kind] = byKind[p.kind] || []).push(p);
  });
  Object.keys(byKind).forEach(function (k) { byKind[k].sort(function (a, b) { return a.from - b.from; }); });

  // Where the anchor sits in its own kind's price range, from 0 (cheapest) to 1 (dearest).
  function tier(p) {
    var list = byKind[p.kind] || [p];
    if (list.length < 2) return 0.5;
    var i = list.indexOf(p);
    return (i < 0 ? 0.5 * list.length : i) / (list.length - 1);
  }

  // Pick the product of a kind at the same price tier as the anchor, matching bed size and wood tone where they apply.
  function pick(kind, anchors, skip) {
    var list = (byKind[kind] || []).filter(function (p) { return !skip[p.id]; });
    if (!list.length) return null;
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
    var tone = "";
    if (WOOD[kind]) anchors.some(function (a) { if (WOOD[a.kind]) tone = anchorTone(a); return !!tone; });
    // Wooden pieces go with wooden pieces: a walnut bedside table should not bring up a metal bed.
    if (WOOD[kind] && !anchors.some(function (a) { return /\b(metal|steel)\b/i.test(a.name); })) {
      var wooden = list.filter(function (p) { return !/\b(metal|steel)\b/i.test(p.name); });
      if (wooden.length) list = wooden;
    }
    var matched = false;
    if (tone) {
      var same = list.filter(function (p) { return p.tone === tone; });
      var near = list.filter(function (p) { return NEAR[tone].indexOf(p.tone) > -1; });
      if (same.length) { list = same; matched = true; } else if (near.length) list = near;
    }
    var t = anchors.reduce(function (s, a) { return s + tier(a); }, 0) / anchors.length;
    var hit = list[Math.round(t * (list.length - 1))];
    // An add-on should not cost more than what the customer already chose, where a cheaper one exists.
    var cap = Math.max.apply(null, anchors.map(function (a) { return a.from || 0; }));
    if (hit.from > cap) {
      var under = list.filter(function (p) { return p.from <= cap; });
      if (under.length) hit = under[under.length - 1];
    }
    return { product: hit, tone: matched ? tone : "" };
  }

  // Suggestions for a set of products (one product page, or a whole shortlist).
  // Returns [{kind, label, tone, product}] with at most one product per kind, skipping kinds already chosen.
  function suggest(anchors, limit) {
    anchors = anchors.filter(function (a) { return a && a.kind; });
    var have = {}, skip = {}, out = [];
    anchors.forEach(function (a) { have[a.kind] = true; skip[a.id] = true; });
    var queue = [];
    // Interleave so a shortlist with a bed and a sofa gets the top picks for both first.
    for (var r = 0; r < 6; r++) anchors.forEach(function (a) {
      var k = (PAIRS[a.kind] || [])[r];
      if (k && !have[k] && queue.indexOf(k) < 0) queue.push(k);
    });
    queue.forEach(function (k) {
      if (out.length >= (limit || 6)) return;
      var group = anchors.filter(function (a) { return (PAIRS[a.kind] || []).indexOf(k) > -1; });
      var r = pick(k, group, skip);
      if (r) {
        skip[r.product.id] = true;
        // "Bedside table, dark wood" tells the customer why this one was picked.
        out.push({ kind: k, label: LABEL[k] + (r.tone ? ", " + TONE_NAME[r.tone] : ""), tone: r.tone, product: r.product });
      }
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
    var pairs = (PAIRS[p && p.kind] || []).slice(0, 3).map(function (k) { return article(LABEL[k]); });
    if (!pairs.length) return "";
    return pairs.length === 1 ? pairs[0] : pairs.slice(0, -1).join(", ") + " and " + pairs[pairs.length - 1];
  }

  window.HDE_SUGGEST = { kindOf: kindOf, label: function (k) { return LABEL[k] || ""; }, article: article, suggest: suggest, pitch: pitch, sizeOf: sizeOf,
    tone: function (p) { return TONE_NAME[anchorTone(p)] || ""; } };
})();
