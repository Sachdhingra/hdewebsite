/* Home Decor Enterprises — "Try in your room" planner.
 * The visitor uploads a photo of their room and the width of the wall in it; products are then
 * drawn at true size (from their Interio dimensions) and can be dragged around. The photo never
 * leaves the visitor's device. Sending the layout opens the usual enquiry form. */
(function () {
  "use strict";
  var CAT = (window.HDE_CATALOG && window.HDE_CATALOG.products) || [];
  var ROOMS = (window.HDE_DATA && window.HDE_DATA.rooms) || [];
  var root = document.querySelector("[data-planner]");
  if (!root || !CAT.length) return;

  function $(s, r) { return (r || root).querySelector(s); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function rupees(n) { return "₹" + Math.round(n).toLocaleString("en-IN"); }

  var stage = $(".pl-stage"), photo = $(".pl-photo"), itemsEl = $(".pl-items");
  var wallInput = $("#pl-wall"), unitSel = $("#pl-unit"), list = $(".pl-list"), search = $("#pl-search"), roomSel = $("#pl-room");
  var chosen = $(".pl-chosen"), send = $("[data-plan-send]");
  var items = [], selected = null, seq = 0;

  function wallCm() {
    var v = parseFloat(wallInput.value);
    if (!v || v <= 0) return 0;
    return unitSel.value === "ft" ? v * 30.48 : v;
  }

  /* ---------- product details (size) ---------- */
  var cache = {};
  function details(id) {
    if (cache[id]) return cache[id];
    var pre = window.HDE_DETAILS && window.HDE_DETAILS[id];
    cache[id] = pre ? Promise.resolve(pre) : (window.fetch ? fetch("assets/data/products/" + encodeURIComponent(id) + ".json")
      .then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }) : Promise.resolve(null));
    return cache[id];
  }
  function sizeOf(d) {
    var row = d && (d.specs || []).filter(function (r) { return /^Size/.test(r[0]); })[0];
    var n = row ? row[1].match(/[\d.]+/g) : null;
    return n && n.length >= 2 ? { w: +n[0], h: +n[1], d: n[2] ? +n[2] : 0 } : null;
  }

  // Interio photos sit on a pale studio background with margins around the product. When the image
  // host lets us read pixels, cut the background away (flood fill from the edges) and measure how
  // much of the photo's width the product fills, so the product itself is drawn at true size.
  // Otherwise fall back to the plain photo blended with multiply, assuming the product fills 80%.
  function productBox(src) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = function () {
        try {
          var w = Math.min(640, img.naturalWidth), h = Math.round(w * img.naturalHeight / img.naturalWidth);
          var c = document.createElement("canvas"); c.width = w; c.height = h;
          var x = c.getContext("2d"); x.drawImage(img, 0, 0, w, h);
          var data = x.getImageData(0, 0, w, h), px = data.data;
          var bg = [px[0], px[1], px[2]], tol = 26, seen = new Uint8Array(w * h), stack = [];
          function near(i) { var k = i * 4; return Math.abs(px[k] - bg[0]) + Math.abs(px[k + 1] - bg[1]) + Math.abs(px[k + 2] - bg[2]) < tol * 3; }
          for (var i = 0; i < w; i++) { stack.push(i, (h - 1) * w + i); }
          for (var j = 0; j < h; j++) { stack.push(j * w, j * w + w - 1); }
          while (stack.length) {
            var q = stack.pop();
            if (seen[q] || !near(q)) continue;
            seen[q] = 1; px[q * 4 + 3] = 0;
            var qx = q % w;
            if (qx > 0) stack.push(q - 1);
            if (qx < w - 1) stack.push(q + 1);
            if (q >= w) stack.push(q - w);
            if (q < w * (h - 1)) stack.push(q + w);
          }
          var minX = w, maxX = -1, minY = h, maxY = -1;
          for (var y = 0; y < h; y++) for (var k2 = 0; k2 < w; k2++) {
            if (!seen[y * w + k2]) { if (k2 < minX) minX = k2; if (k2 > maxX) maxX = k2; if (y < minY) minY = y; if (y > maxY) maxY = y; }
          }
          if (maxX < minX) throw new Error("blank");
          x.putImageData(data, 0, 0);
          // Crop to the product so the drag handle hugs it.
          var out = document.createElement("canvas"); out.width = maxX - minX + 1; out.height = maxY - minY + 1;
          out.getContext("2d").drawImage(c, minX, minY, out.width, out.height, 0, 0, out.width, out.height);
          resolve({ fx: 1, cutout: out.toDataURL("image/png") });
        } catch (e) { resolve(null); }
      };
      img.onerror = function () { resolve(null); };
      img.src = src;
    });
  }

  /* ---------- product list ---------- */
  function drawList() {
    var q = search.value.trim().toLowerCase(), r = roomSel.value;
    var hits = CAT.filter(function (p) {
      return (!r || p.room === r) && (!q || (p.name + " " + p.type).toLowerCase().indexOf(q) > -1);
    }).slice(0, 60);
    list.innerHTML = hits.length ? hits.map(function (p) {
      return '<li><button type="button" class="pl-pick" data-id="' + esc(p.id) + '"><img src="' + esc(p.image) + '" alt="" loading="lazy" width="72" height="54">' +
        "<span><b>" + esc(p.name) + "</b><small>" + esc(p.type || "") + " · " + (p.mrp ? "MRP " : "") + rupees(p.from) + "</small></span><em>Add</em></button></li>";
    }).join("") : '<li class="pl-none">No products match. Try another word.</li>';
  }

  /* ---------- items on the photo ---------- */
  function layout() {
    var W = stage.clientWidth, cm = wallCm();
    items.forEach(function (it) {
      var widthCm = it.size ? it.size.w : 150;
      var fx = it.box ? it.box.fx : 0.8;
      var px = cm ? W * (widthCm / cm) / fx * it.scale : W * 0.3 * it.scale;
      it.el.style.width = px + "px";
      it.el.style.left = it.x * 100 + "%";
      it.el.style.top = it.y * 100 + "%";
      it.el.style.transform = "translate(-50%, -100%)" + (it.flip ? " scaleX(-1)" : "");
      it.el.classList.toggle("is-selected", it === selected);
    });
    var toolbar = $(".pl-tools");
    toolbar.hidden = !selected;
    if (selected) $(".pl-tools-name").textContent = selected.p.name + (selected.size ? " (" + selected.size.w + " x " + selected.size.h + " cm)" : " (size not listed)");
    chosen.innerHTML = items.length ? items.map(function (it) {
      return "<li>" + esc(it.p.name) + " <small>" + (it.p.mrp ? "MRP " : "") + rupees(it.p.from) + "</small></li>";
    }).join("") : "<li>Nothing added yet.</li>";
    var total = items.reduce(function (s, it) { return s + it.p.from; }, 0);
    $(".pl-total").textContent = items.length ? "Total " + (items.some(function (it) { return it.p.mrp; }) ? "MRP " : "") + rupees(total) : "";
    send.setAttribute("data-product", "Room plan" + (wallInput.value ? " (wall " + wallInput.value + " " + unitSel.value + ")" : "") + ": " +
      items.map(function (it) { return it.p.name; }).join("; "));
    send.disabled = !items.length;
    $(".pl-empty").hidden = !!photo.getAttribute("src");
  }

  function add(id) {
    var p = CAT.filter(function (x) { return x.id === id; })[0];
    if (!p) return;
    var el = document.createElement("div");
    el.className = "pl-item";
    el.innerHTML = '<img src="' + esc(p.image) + '" alt="' + esc(p.name) + '" draggable="false">';
    itemsEl.appendChild(el);
    var it = { key: ++seq, p: p, el: el, x: 0.5, y: 0.85, scale: 1, flip: false, size: null, box: null };
    items.push(it);
    selected = it;
    el.addEventListener("pointerdown", function (e) { startDrag(e, it); });
    layout();
    Promise.all([details(p.id), productBox(p.image)]).then(function (r) {
      it.size = sizeOf(r[0]);
      it.box = r[1];
      if (it.box && it.box.cutout) {
        var im = it.el.querySelector("img");
        im.src = it.box.cutout;
        im.classList.add("is-cutout");
      }
      layout();
    });
  }

  function startDrag(e, it) {
    e.preventDefault();
    selected = it;
    if (itemsEl.lastChild !== it.el) itemsEl.appendChild(it.el); // bring to front
    var rect = stage.getBoundingClientRect(), sx = e.clientX, sy = e.clientY, ox = it.x, oy = it.y;
    function move(ev) {
      it.x = Math.min(1, Math.max(0, ox + (ev.clientX - sx) / rect.width));
      it.y = Math.min(1.05, Math.max(0.05, oy + (ev.clientY - sy) / rect.height));
      layout();
    }
    function up() {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    layout();
  }

  /* ---------- wiring ---------- */
  $("#pl-photo").addEventListener("change", function (e) {
    var f = e.target.files && e.target.files[0];
    if (!f) return;
    if (photo.getAttribute("src")) URL.revokeObjectURL(photo.src);
    photo.src = URL.createObjectURL(f);
    stage.classList.add("has-photo");
    photo.onload = layout;
  });
  [wallInput, unitSel].forEach(function (el) { el.addEventListener("input", layout); el.addEventListener("change", layout); });
  search.addEventListener("input", drawList);
  roomSel.addEventListener("change", drawList);
  list.addEventListener("click", function (e) {
    var b = e.target.closest(".pl-pick");
    if (b) add(b.getAttribute("data-id"));
  });
  $(".pl-tools").addEventListener("click", function (e) {
    var b = e.target.closest("button");
    if (!b || !selected) return;
    var a = b.getAttribute("data-act");
    if (a === "bigger") selected.scale = Math.min(2.5, selected.scale * 1.08);
    if (a === "smaller") selected.scale = Math.max(0.3, selected.scale / 1.08);
    if (a === "flip") selected.flip = !selected.flip;
    if (a === "remove") {
      selected.el.remove();
      items = items.filter(function (it) { return it !== selected; });
      selected = null;
    }
    layout();
  });
  stage.addEventListener("pointerdown", function (e) {
    if (!e.target.closest(".pl-item")) { selected = null; layout(); }
  });
  window.addEventListener("resize", layout);

  roomSel.innerHTML = '<option value="">All rooms</option>' + ROOMS.filter(function (r) {
    return CAT.some(function (p) { return p.room === r.slug; });
  }).map(function (r) { return '<option value="' + r.slug + '">' + esc(r.name) + "</option>"; }).join("");
  drawList();
  var start = new URLSearchParams(location.search).get("add");
  if (start) add(start.toLowerCase());
  layout();
})();
