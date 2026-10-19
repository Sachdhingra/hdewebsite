/* Home Decor Enterprises: AI sales assistant chat bubble.
 * Talks to Omniflow's website-agent function (HDE_CONFIG.agent.url). The bubble only appears once
 * that function answers, so the site never shows a broken chat. The conversation is kept for the
 * browser tab (sessionStorage), so it carries on as the visitor moves between pages.
 * The salesperson code from ?ref= links (saved by main.js) goes with every message, so an enquiry
 * sent from the chat lands with that salesperson in Omniflow. */
(function () {
  "use strict";
  var C = window.HDE_CONFIG || {};
  var A = C.agent || {};
  if (!A.url || !window.fetch) return;

  var B = C.business || {};
  var NAME = A.name || "Asha";
  var KEY = "hde_agent_chat", OK_KEY = "hde_agent_ok";
  var state = load();

  function load() {
    try { var s = JSON.parse(sessionStorage.getItem(KEY) || "null"); if (s && Array.isArray(s.log)) return s; } catch (e) {}
    return { log: [], open: false, enquirySent: false, teased: false };
  }
  function save() { try { sessionStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function rupees(n) { return "₹" + Math.round(n).toLocaleString("en-IN"); }
  function track(ev, p) { if (window.HDE_TRACK) window.HDE_TRACK(ev, p || {}); }
  function ref() {
    if (window.HDE_REF !== undefined) return window.HDE_REF || null;
    try { var r = JSON.parse(localStorage.getItem("hde_ref") || "null"); return r && r.code ? r.code : null; } catch (e) { return null; }
  }
  function shortlistIds() {
    if (window.HDE_SHORTLIST) return window.HDE_SHORTLIST.all();
    try { return JSON.parse(localStorage.getItem("hde_shortlist") || "[]"); } catch (e) { return []; }
  }
  function productId() {
    try { return (new URLSearchParams(location.search).get("id") || "").toLowerCase() || null; } catch (e) { return null; }
  }
  // Light formatting for replies: links, **bold**, line breaks. Everything is escaped first.
  function fmt(t) {
    return esc(t)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/(https?:\/\/[^\s<)]+?)([.,!?]*)(?=\s|<|$)/g, function (m, u, tail) {
        var label = u.indexOf(location.host) > -1 || u.indexOf("hdefurniture") > -1 ? u.replace(/^https?:\/\/[^/]+\/?/, "").split("?")[0].replace(".html", "") || "home" : "open link";
        label = label === "product" ? "View product" : label.replace(/-/g, " ");
        if (/maps\.google|google\.com\/maps/.test(u)) label = "Open in Google Maps";
        return '<a href="' + u + '"' + (/^https?:\/\/(maps|www\.google)/.test(u) ? ' target="_blank" rel="noopener"' : "") + ">" + label + "</a>" + tail;
      })
      .replace(/\n/g, "<br>");
  }

  /* ---------- styles ---------- */
  var css =
    ".hda-btn{position:fixed;right:18px;bottom:calc(86px + env(safe-area-inset-bottom,0px));z-index:61;width:58px;height:58px;border-radius:50%;border:0;background:var(--walnut,#7c4420);color:#fff;box-shadow:var(--shadow,0 10px 30px -12px rgba(0,0,0,.3));display:grid;place-items:center;cursor:pointer}" +
    ".hda-btn svg{width:28px;height:28px}.hda-btn:focus-visible{outline:3px solid var(--brass,#c8912e);outline-offset:3px}" +
    ".hda-dot{position:absolute;top:4px;right:4px;width:12px;height:12px;border-radius:50%;background:#2fb35a;border:2px solid #fff}" +
    ".hda-tease{position:fixed;right:86px;bottom:calc(94px + env(safe-area-inset-bottom,0px));z-index:61;max-width:250px;background:#fff;color:var(--ink,#221c18);border:1px solid var(--line,#e2d9d0);border-radius:14px 14px 4px 14px;padding:12px 30px 12px 14px;box-shadow:var(--shadow);font:400 .95rem/1.4 var(--body,system-ui);cursor:pointer}" +
    ".hda-tease button{position:absolute;top:4px;right:6px;border:0;background:none;font-size:1.1rem;color:var(--ink-2,#5b524b);cursor:pointer;padding:4px}" +
    ".hda-panel{position:fixed;right:18px;bottom:calc(18px + env(safe-area-inset-bottom,0px));z-index:70;width:380px;max-width:calc(100vw - 32px);height:min(620px,calc(100vh - 40px));background:#fff;border-radius:16px;box-shadow:0 20px 60px -15px rgba(34,28,24,.45);display:flex;flex-direction:column;overflow:hidden;font-family:var(--body,system-ui);color:var(--ink,#221c18)}" +
    ".hda-panel[hidden],.hda-btn[hidden]{display:none}" +
    ".hda-head{background:var(--walnut,#7c4420);color:#fff;padding:12px 14px;display:flex;align-items:center;gap:10px}" +
    ".hda-av{width:38px;height:38px;border-radius:50%;background:#fff;display:grid;place-items:center;overflow:hidden;flex:none}.hda-av img{width:34px;height:34px;object-fit:contain}" +
    ".hda-head b{display:block;font-size:1rem}.hda-head small{opacity:.85;font-size:.78rem}.hda-head .hda-x{margin-left:auto;background:none;border:0;color:#fff;font-size:1.6rem;line-height:1;cursor:pointer;padding:6px 8px}" +
    ".hda-log{flex:1;overflow-y:auto;padding:14px;background:var(--stone,#f5f1ed);display:flex;flex-direction:column;gap:10px;overscroll-behavior:contain}" +
    ".hda-log>*{flex-shrink:0}" +
    ".hda-m{max-width:86%;padding:10px 12px;border-radius:14px;font-size:.95rem;line-height:1.45;word-wrap:break-word}" +
    ".hda-m a{color:inherit;text-decoration:underline}" +
    ".hda-bot{background:#fff;border:1px solid var(--line,#e2d9d0);border-bottom-left-radius:4px;align-self:flex-start}" +
    ".hda-me{background:var(--walnut,#7c4420);color:#fff;border-bottom-right-radius:4px;align-self:flex-end}" +
    ".hda-cards{display:flex;gap:10px;overflow-x:auto;padding:2px 2px 6px;align-self:stretch;scroll-snap-type:x mandatory}" +
    ".hda-card{flex:0 0 170px;scroll-snap-align:start;background:#fff;border:1px solid var(--line,#e2d9d0);border-radius:12px;overflow:hidden;display:flex;flex-direction:column}" +
    ".hda-card img{width:100%;height:110px;object-fit:contain;background:#fff}" +
    ".hda-card div{padding:8px;display:flex;flex-direction:column;gap:4px;flex:1}" +
    ".hda-card a.hda-n{font-size:.85rem;font-weight:600;color:var(--ink,#221c18);text-decoration:none;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}" +
    ".hda-card .hda-p{font-size:.82rem;color:var(--ink-2,#5b524b)}" +
    ".hda-card .hda-sl{margin-top:auto;border:1px solid var(--walnut,#7c4420);background:#fff;color:var(--walnut,#7c4420);border-radius:8px;padding:7px;font:600 .8rem var(--body,system-ui);cursor:pointer;min-height:36px}" +
    ".hda-card .hda-sl[aria-pressed=true]{background:var(--walnut,#7c4420);color:#fff}" +
    ".hda-note{align-self:center;font-size:.8rem;color:var(--ink-2,#5b524b);background:#fff;border:1px solid var(--line,#e2d9d0);border-radius:20px;padding:5px 12px;text-align:center}" +
    ".hda-note a{color:var(--walnut,#7c4420);font-weight:600}" +
    ".hda-chips{display:flex;flex-wrap:wrap;gap:6px}.hda-chips button{border:1px solid var(--walnut,#7c4420);background:#fff;color:var(--walnut,#7c4420);border-radius:18px;padding:7px 12px;font:500 .85rem var(--body,system-ui);cursor:pointer;min-height:36px}" +
    ".hda-typing span{display:inline-block;width:7px;height:7px;margin:0 2px;border-radius:50%;background:var(--ink-2,#5b524b);animation:hda 1s infinite}.hda-typing span:nth-child(2){animation-delay:.15s}.hda-typing span:nth-child(3){animation-delay:.3s}" +
    "@keyframes hda{0%,60%,100%{opacity:.25}30%{opacity:1}}" +
    ".hda-form{display:flex;gap:8px;padding:10px;border-top:1px solid var(--line,#e2d9d0);background:#fff}" +
    ".hda-form textarea{flex:1;resize:none;border:1px solid var(--line,#e2d9d0);border-radius:20px;padding:10px 14px;font:400 16px/1.35 var(--body,system-ui);max-height:110px;min-height:44px}" +
    ".hda-form button{width:44px;height:44px;border-radius:50%;border:0;background:var(--walnut,#7c4420);color:#fff;display:grid;place-items:center;cursor:pointer;flex:none;align-self:flex-end}.hda-form button:disabled{opacity:.5}" +
    ".hda-foot{font-size:.72rem;color:var(--ink-2,#5b524b);text-align:center;padding:0 10px 8px;background:#fff}" +
    "@media (max-width:720px){.hda-btn{bottom:calc(76px + env(safe-area-inset-bottom,0px));right:14px;width:54px;height:54px}.hda-tease{right:76px;bottom:calc(84px + env(safe-area-inset-bottom,0px))}" +
    ".hda-panel{right:0;bottom:0;width:100vw;max-width:100vw;height:100%;height:100dvh;border-radius:0}}" +
    "@media (prefers-reduced-motion:reduce){.hda-typing span{animation:none;opacity:.6}}";

  var CHAT_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/><path d="M8.5 11h.01M12 11h.01M15.5 11h.01"/></svg>';
  var SEND_ICON = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4z"/></svg>';

  var btn, panel, log, input, sendBtn, tease, busy = false;

  function greeting() {
    var pid = productId();
    if (pid) return "Namaste 🙏 I'm " + NAME + ", Home Decor Enterprises' virtual assistant. Looking at this piece? I can tell you about sizes, colours and features, suggest what goes with it, or get you today's best price.";
    return A.greeting || "Namaste 🙏 I'm " + NAME + ", Home Decor Enterprises' virtual assistant. Tell me what you're looking for and I'll help you find and shortlist the right pieces, and get you today's best price. Hindi ya English, jo aapko comfortable ho!";
  }
  var CHIPS = productId()
    ? ["What sizes and colours?", "What goes with this?", "Get today's best price"]
    : ["Sofa for my living room", "Bed + mattress", "Modular kitchen", "Showroom timings & location"];

  function build() {
    var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

    btn = document.createElement("button");
    btn.className = "hda-btn"; btn.type = "button";
    btn.setAttribute("aria-label", "Chat with " + NAME + ", our shopping assistant");
    btn.innerHTML = CHAT_ICON + '<span class="hda-dot" aria-hidden="true"></span>';
    btn.addEventListener("click", function () { setOpen(true); });

    panel = document.createElement("section");
    panel.className = "hda-panel"; panel.hidden = true;
    panel.setAttribute("role", "dialog"); panel.setAttribute("aria-label", "Chat with " + NAME);
    panel.innerHTML =
      '<div class="hda-head"><span class="hda-av"><img src="assets/img/hde-logo-160.webp" alt=""></span>' +
      "<span><b>" + esc(NAME) + " · HDE</b><small>Virtual shopping assistant · replies instantly</small></span>" +
      '<button class="hda-x" type="button" aria-label="Close chat">×</button></div>' +
      '<div class="hda-log" aria-live="polite"></div>' +
      '<form class="hda-form"><label class="sr-only" for="hda-in">Type your message</label>' +
      '<textarea id="hda-in" rows="1" maxlength="1000" placeholder="Type your question…" enterkeyhint="send"></textarea>' +
      '<button type="submit" aria-label="Send">' + SEND_ICON + "</button></form>" +
      '<div class="hda-foot">AI assistant · prices shown are MRP · <a href="tel:' + esc(B.phoneHref || "") + '">Call us</a></div>';
    log = panel.querySelector(".hda-log");
    input = panel.querySelector("textarea");
    sendBtn = panel.querySelector(".hda-form button");
    panel.querySelector(".hda-x").addEventListener("click", function () { setOpen(false); });
    panel.querySelector("form").addEventListener("submit", function (e) { e.preventDefault(); send(input.value); });
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input.value); }
    });
    input.addEventListener("input", function () { input.style.height = "auto"; input.style.height = Math.min(input.scrollHeight, 110) + "px"; });
    panel.addEventListener("keydown", function (e) { if (e.key === "Escape") setOpen(false); });
    log.addEventListener("click", onLogClick);

    document.body.appendChild(btn);
    document.body.appendChild(panel);
    render();
    if (state.open) setOpen(true, true);
    else if (!state.teased) setTimeout(showTease, 18000);
  }

  function showTease() {
    if (state.open || state.teased || tease) return;
    state.teased = true; save();
    tease = document.createElement("div");
    tease.className = "hda-tease";
    tease.innerHTML = (productId() ? "Like this one? I can tell you more and get you today's best price 🙂" : "Hi! Need help choosing? I can suggest options in your budget 🙂") +
      '<button type="button" aria-label="Dismiss">×</button>';
    tease.addEventListener("click", function (e) {
      if (e.target.tagName === "BUTTON") { tease.remove(); return; }
      setOpen(true);
    });
    document.body.appendChild(tease);
    track("chat_teaser_shown");
  }

  function setOpen(open, restoring) {
    state.open = open; save();
    panel.hidden = !open;
    btn.hidden = open;
    if (tease) { tease.remove(); tease = null; }
    if (open) {
      if (!restoring) track("chat_open", { page: location.pathname });
      if (window.matchMedia("(max-width:720px)").matches) document.documentElement.style.overflow = "hidden";
      log.scrollTop = log.scrollHeight;
      if (!restoring || !window.matchMedia("(max-width:720px)").matches) setTimeout(function () { input.focus(); }, 50);
    } else {
      document.documentElement.style.overflow = "";
      btn.focus();
    }
  }

  /* ---------- rendering ---------- */
  function cardsHTML(items) {
    var sl = shortlistIds();
    return '<div class="hda-cards">' + items.map(function (p) {
      var on = sl.indexOf(p.id) > -1;
      return '<div class="hda-card">' +
        '<a href="' + esc(p.url) + '" tabindex="-1" aria-hidden="true"><img src="' + esc(p.image) + '" alt="" loading="lazy" onerror="this.style.visibility=\'hidden\'"></a>' +
        '<div><a class="hda-n" href="' + esc(p.url) + '">' + esc(p.name) + "</a>" +
        '<span class="hda-p">MRP ' + (p.from ? "from " : "") + rupees(p.mrp) + "</span>" +
        '<button class="hda-sl" type="button" data-sl="' + esc(p.id) + '" aria-pressed="' + on + '">' + (on ? "♥ Shortlisted" : "♡ Shortlist") + "</button></div></div>";
    }).join("") + "</div>";
  }

  function render() {
    var html = "";
    if (!state.log.length) {
      html += '<div class="hda-m hda-bot">' + fmt(greeting()) + "</div>";
      html += '<div class="hda-chips">' + CHIPS.map(function (c) { return '<button type="button" data-chip="' + esc(c) + '">' + esc(c) + "</button>"; }).join("") + "</div>";
    }
    state.log.forEach(function (m) {
      if (m.kind === "cards") html += cardsHTML(m.items);
      else if (m.kind === "note") html += '<div class="hda-note">' + m.html + "</div>";
      else html += '<div class="hda-m ' + (m.role === "user" ? "hda-me" : "hda-bot") + '">' + (m.role === "user" ? esc(m.text).replace(/\n/g, "<br>") : fmt(m.text)) + "</div>";
    });
    if (busy) html += '<div class="hda-m hda-bot hda-typing" aria-label="' + esc(NAME) + ' is typing"><span></span><span></span><span></span></div>';
    log.innerHTML = html;
    log.scrollTop = log.scrollHeight;
  }

  function onLogClick(e) {
    var chip = e.target.closest("[data-chip]");
    if (chip) { send(chip.getAttribute("data-chip")); return; }
    var b = e.target.closest("[data-sl]");
    if (b) {
      var id = b.getAttribute("data-sl"), on;
      if (window.HDE_SHORTLIST) on = window.HDE_SHORTLIST.toggle(id);
      else {
        var ids = shortlistIds(), i = ids.indexOf(id);
        if (i > -1) { ids.splice(i, 1); on = false; } else { ids.unshift(id); on = true; }
        try { localStorage.setItem("hde_shortlist", JSON.stringify(ids)); } catch (err) {}
      }
      b.setAttribute("aria-pressed", on); b.textContent = on ? "♥ Shortlisted" : "♡ Shortlist";
      track(on ? "chat_shortlist_add" : "chat_shortlist_remove", { product_id: id });
    }
  }

  /* ---------- talking to the assistant ---------- */
  function history() {
    // Plain text turns for the model; memo lines tell it what it already showed or saved.
    var out = [];
    state.log.forEach(function (m) {
      if (m.role !== "user" && m.role !== "assistant") return;
      var text = m.text + (m.memo ? "\n[" + m.memo + "]" : "");
      var last = out[out.length - 1];
      if (last && last.role === m.role) last.content += "\n" + text;
      else out.push({ role: m.role, content: text });
    });
    return out.slice(-24);
  }

  function waLink() {
    var r = ref();
    var t = "Hi " + (B.name || "") + ", I was chatting on your website and would like today's best price." + (r ? " (Ref: " + r + ")" : "");
    return "https://wa.me/" + (B.whatsapp || "") + "?text=" + encodeURIComponent(t);
  }

  function send(text) {
    text = String(text || "").trim();
    if (!text || busy) return;
    input.value = ""; input.style.height = "auto";
    state.log.push({ role: "user", text: text.slice(0, 1000) });
    busy = true; sendBtn.disabled = true; save(); render();
    track("chat_message", { page: location.pathname });

    fetch(A.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: history(), ref: ref(), page: (location.pathname.split("/").pop() || "index.html") + location.search.replace(/[?&]ref=[^&]*/, ""),
        productId: productId(), shortlist: shortlistIds().slice(0, 20), enquirySent: state.enquirySent
      })
    }).then(function (r) { return r.json(); }).then(function (d) {
      (d.actions || []).forEach(function (a) {
        if (a.type === "products" && a.items && a.items.length) state.log.push({ kind: "cards", items: a.items });
        if (a.type === "shortlist" && a.ids) {
          a.ids.forEach(function (id) { if (window.HDE_SHORTLIST) window.HDE_SHORTLIST.add(id); });
          state.log.push({ kind: "note", html: "♥ Saved to your <a href=\"shortlist.html\">shortlist</a>" });
        }
        if (a.type === "lead") {
          if (a.ok) {
            state.enquirySent = true;
            state.log.push({ kind: "note", html: "✓ Enquiry sent to your consultant" });
            track("lead_submitted", { lead_source: "chat", lead_interest: "chat" });
          } else {
            state.log.push({ kind: "note", html: '<a href="' + esc(waLink()) + '" target="_blank" rel="noopener">Send on WhatsApp instead</a>' });
          }
        }
      });
      if (d.enquirySent) state.enquirySent = true;
      state.log.push({ role: "assistant", text: d.reply || "Sorry, please try again.", memo: d.memo || "" });
    }).catch(function () {
      state.log.push({ role: "assistant", text: "Sorry, I couldn't connect just now. Please try again, or reach our team directly:" });
      state.log.push({ kind: "note", html: '<a href="' + esc(waLink()) + '" target="_blank" rel="noopener">WhatsApp us</a> · <a href="tel:' + esc(B.phoneHref || "") + '">Call ' + esc(B.phone || "") + "</a>" });
    }).then(function () {
      if (state.log.length > 80) state.log = state.log.slice(-80);
      busy = false; sendBtn.disabled = false; save(); render();
      if (!window.matchMedia("(max-width:720px)").matches) input.focus();
    });
  }

  /* ---------- start: only show the bubble once the assistant is live ---------- */
  function start() {
    var cached = null;
    try { cached = sessionStorage.getItem(OK_KEY); } catch (e) {}
    if (cached === "1") { build(); return; }
    if (cached === "0") return;
    fetch(A.url, { method: "GET" }).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      var ok = !!(d && d.ok);
      try { sessionStorage.setItem(OK_KEY, ok ? "1" : "0"); } catch (e) {}
      if (ok) { if (d.name) NAME = A.name || d.name; build(); }
    }).catch(function () {});
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
