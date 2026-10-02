/* Home Decor Enterprises: hero turntable. Crossfades the real studio photos of a
 * product as the visitor drags, taps a thumbnail or uses the arrow keys, and
 * turns slowly on its own like a showroom turntable until they take over. */
(function () {
  var root = document.querySelector("[data-turntable]");
  if (!root) return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var turn = root.querySelector(".tt-turn"), rig = root.querySelector(".tt-rig"), spots = root.querySelector(".tt-spots");
  var frames = Array.prototype.slice.call(root.querySelectorAll(".tt-frame"));
  var thumbs = Array.prototype.slice.call(root.querySelectorAll(".tt-angle"));
  var n = frames.length, pos = 0, target = 0, vel = 0, idle = 0, dragging = false, lastX = 0, touched = false;
  var STEP = 90; // pixels of drag per angle

  function mod(a) { return ((a % n) + n) % n; }
  function paint() {
    var p = mod(pos), i = Math.floor(p), j = (i + 1) % n, t = p - i;
    t = t * t * (3 - 2 * t); // smoothstep crossfade
    frames.forEach(function (f, k) {
      var o = k === i ? 1 - t : k === j ? t : 0;
      f.style.opacity = o.toFixed(3);
      f.classList.toggle("is-on", o > 0.5);
    });
    var near = Math.round(p) % n;
    thumbs.forEach(function (b, k) { b.setAttribute("aria-pressed", k === near ? "true" : "false"); });
    spots.classList.toggle("is-hidden", Math.min(p, n - p) > 0.18); // callouts belong to the front view
  }
  function go(k) {
    touched = true;
    target = Math.round(pos) + ((mod(k - Math.round(pos)) + n / 2) % n) - n / 2;
    if (reduce) { pos = target; paint(); }
  }

  thumbs.forEach(function (b, k) { b.addEventListener("click", function () { go(k); }); });
  turn.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight") { go(Math.round(target) + 1); e.preventDefault(); }
    if (e.key === "ArrowLeft") { go(Math.round(target) - 1); e.preventDefault(); }
  });
  turn.addEventListener("pointerdown", function (e) {
    if (e.target.closest(".tt-spot")) return;
    dragging = true; touched = true; lastX = e.clientX; vel = 0; turn.setPointerCapture(e.pointerId);
  });
  turn.addEventListener("pointermove", function (e) {
    if (!reduce && e.pointerType === "mouse") {
      var r = turn.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
      rig.style.transform = "rotateY(" + (px * 6).toFixed(2) + "deg) rotateX(" + (-py * 3).toFixed(2) + "deg)";
    }
    if (!dragging) return;
    var dx = e.clientX - lastX; lastX = e.clientX;
    pos -= dx / STEP; target = pos; vel = -dx / STEP;
    if (reduce) paint();
  });
  function release() {
    if (!dragging) return;
    dragging = false;
    target = Math.round(pos + vel * 6);
    if (reduce) { pos = target; paint(); }
  }
  turn.addEventListener("pointerup", release);
  turn.addEventListener("pointercancel", release);
  turn.addEventListener("pointerleave", function () { rig.style.transform = ""; });
  Array.prototype.forEach.call(root.querySelectorAll(".tt-spot"), function (s) {
    s.addEventListener("click", function (e) { e.stopPropagation(); s.classList.toggle("is-open"); });
  });

  paint();
  if (reduce) return;
  var visible = true;
  if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(turn);
  var last = performance.now();
  function tick(now) {
    requestAnimationFrame(tick);
    var dt = Math.min((now - last) / 1000, 0.05); last = now;
    if (!visible || dragging || document.hidden) return;
    if (!touched) { idle += dt; if (idle > 2.8) { idle = 0; target = Math.round(target) + 1; } }
    pos += (target - pos) * Math.min(1, dt * 5);
    if (Math.abs(target - pos) < 0.001) pos = target;
    paint();
  }
  requestAnimationFrame(tick);
})();
