/* Home Decor Enterprises: "Install our app" pop-up.
 * Chrome / Edge / Samsung (Android and desktop) get a one-tap Install button;
 * iPhone and iPad Safari, which have no install prompt, get the Share → Add to Home Screen steps.
 * Shown once the visitor has spent a little time on the site or right after they shortlist a product,
 * never when already installed, and not again for 14 days after "Not now". Sits above the phone call/WhatsApp bar and,
 * on laptops, bottom left so it doesn't cover the WhatsApp button. */
(function () {
  "use strict";
  var KEY = "hde_install_dismissed", WAIT_MS = 12000, SNOOZE_DAYS = 14;
  var deferred = null, shown = false;

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () { navigator.serviceWorker.register("sw.js").catch(function () {}); });
  }

  var standalone = (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || window.navigator.standalone === true;

  // "Install the app" buttons on the page (e.g. the Elite Card page): install now, or show how to.
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-install-app]");
    if (!b) return;
    e.preventDefault();
    if (standalone) return;
    if (deferred) promptInstall(); else { var old = document.querySelector(".hde-install"); if (old) old.remove(); shown = false; show(true); }
  });
  if (standalone) {
    document.addEventListener("DOMContentLoaded", function () {
      Array.prototype.forEach.call(document.querySelectorAll("[data-install-app]"), function (b) { b.disabled = true; b.textContent = "You are using the app"; });
    });
    return;
  }

  function snoozed() {
    try { var t = Number(localStorage.getItem(KEY) || 0); return t && Date.now() - t < SNOOZE_DAYS * 864e5; } catch (e) { return false; }
  }
  function snooze() { try { localStorage.setItem(KEY, String(Date.now())); } catch (e) {} }

  var ua = navigator.userAgent || "";
  var isIOS = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  var isIOSSafari = isIOS && /safari/i.test(ua) && !/crios|fxios|edgios/i.test(ua);

  var css =
    ".hde-install{position:fixed;left:16px;right:16px;bottom:calc(84px + env(safe-area-inset-bottom,0px));z-index:70;max-width:420px;margin:0 auto;background:var(--paper,#fff);color:var(--ink,#221c18);" +
    "border:1px solid var(--line,#e2d9d0);border-radius:10px;box-shadow:var(--shadow,0 10px 30px -12px rgba(34,28,24,.28));padding:14px 14px 12px;display:flex;gap:12px;align-items:flex-start;" +
    "font-family:var(--body,system-ui,sans-serif);animation:hde-install-in .25s ease-out}" +
    "@media (min-width:721px){.hde-install{left:24px;right:auto;bottom:24px;margin:0}}" +
    ".hde-install img{width:48px;height:48px;border-radius:10px;flex:none}" +
    ".hde-install h3{margin:0 0 2px;font-family:var(--display,Georgia,serif);font-size:1rem;color:var(--walnut,#7c4420)}" +
    ".hde-install p{margin:0 0 10px;font-size:.9rem;line-height:1.4}" +
    ".hde-install .row{display:flex;gap:8px;flex-wrap:wrap}" +
    ".hde-install button{font:inherit;font-weight:600;border-radius:6px;padding:8px 14px;cursor:pointer;border:1px solid var(--walnut,#7c4420)}" +
    ".hde-install .go{background:var(--walnut,#7c4420);color:#fff}" +
    ".hde-install .later{background:transparent;color:var(--walnut,#7c4420)}" +
    ".hde-install .x{position:absolute;top:6px;right:8px;border:0;background:none;padding:4px;font-size:1.2rem;line-height:1;color:#6b6259}" +
    "@keyframes hde-install-in{from{transform:translateY(12px);opacity:0}to{transform:none;opacity:1}}" +
    "@media (prefers-reduced-motion:reduce){.hde-install{animation:none}}";

  function promptInstall() {
    var p = deferred; deferred = null;
    var box = document.querySelector(".hde-install");
    if (box) box.remove();
    p.prompt();
    p.userChoice.then(function (c) {
      if (c.outcome !== "accepted") snooze();
      if (window.HDE_TRACK) window.HDE_TRACK("app_install_prompt", { outcome: c.outcome });
    }).catch(function () {});
  }

  var styled = false;
  // force: the visitor asked for the app, so skip the timers and snooze and always say how to install.
  function show(force) {
    if (!force && (shown || snoozed())) return;
    if (!force && !deferred && !isIOSSafari) return;
    shown = true;
    if (!styled) {
      styled = true;
      var style = document.createElement("style");
      style.textContent = css;
      document.head.appendChild(style);
    }

    var box = document.createElement("div");
    box.className = "hde-install";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-label", "Install the Home Decor Enterprises app");
    box.innerHTML =
      '<img src="assets/img/app/icon-192.png" alt="">' +
      "<div><h3>Get the HDE app</h3>" +
      (deferred
        ? "<p>Add Home Decor Enterprises to your phone or laptop for one-tap access to our furniture and offers.</p>" +
          '<div class="row"><button type="button" class="go">Install</button><button type="button" class="later">Not now</button></div>'
        : isIOS
        ? "<p>Add us to your home screen: tap <b>Share</b> <span aria-hidden=\"true\">&#x2191;&#xFE0E;</span> at the bottom of Safari, then <b>Add to Home Screen</b>.</p>" +
          '<div class="row"><button type="button" class="later">Got it</button></div>'
        : "<p>Open your browser menu <span aria-hidden=\"true\">&#8942;</span> and choose <b>Install app</b> or <b>Add to Home screen</b>.</p>" +
          '<div class="row"><button type="button" class="later">Got it</button></div>') +
      "</div>" +
      '<button type="button" class="x" aria-label="Close">&times;</button>';
    document.body.appendChild(box);

    function close() { snooze(); box.remove(); }
    box.querySelector(".later").addEventListener("click", close);
    box.querySelector(".x").addEventListener("click", close);
    var go = box.querySelector(".go");
    if (go) go.addEventListener("click", promptInstall);
  }

  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    deferred = e;
    setTimeout(show, WAIT_MS);
  });
  window.addEventListener("appinstalled", function () {
    snooze();
    var box = document.querySelector(".hde-install");
    if (box) box.remove();
  });
  if (isIOSSafari) setTimeout(show, WAIT_MS);
  // Shortlisting a product (main.js) is a good moment to offer the app, without waiting.
  document.addEventListener("hde:engaged", function () { setTimeout(show, 1200); });
})();
