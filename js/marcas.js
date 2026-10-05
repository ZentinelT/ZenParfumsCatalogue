/* ---- CARRUSEL DE MARCAS ----
   Lee data/marcas.json (generado por actualizar_catalogo.py), muestra los logos
   en círculos, resalta la marca del centro y avanza solo, despacio.
   Tocar una marca filtra el catálogo (se combina con los demás filtros); tocarla de nuevo la quita. */
(function () {
  var SPEED = 18;          // px por segundo del avance automático
  var RESUME_MS = 4000;    // espera tras una interacción antes de retomar
  var sec, sc, items = [], dir = 1, pausedUntil = 0, visible = false, last = 0, raf = 0, ticking = false, pos = 0;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function escA(s) { return String(s || "").replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function build(list) {
    sec = document.getElementById("marcasSec");
    sc = document.getElementById("mcScroll");
    if (!sec || !sc || !list.length) return;
    list.sort(function (a, b) { return a.b.localeCompare(b.b, "es", { sensitivity: "base" }); });
    sc.innerHTML = list.map(function (m) {
      return '<button type="button" class="mc-it" data-b="' + escA(m.b) + '" aria-label="Ver ' + escA(m.b) + '">' +
        '<span class="mc-c"><img src="' + escA(m.logo) + '" alt="" loading="lazy" decoding="async" width="128" height="128"></span>' +
        '<span class="mc-n">' + escA(m.b) + "</span></button>";
    }).join("");
    items = Array.prototype.slice.call(sc.querySelectorAll(".mc-it"));
    sec.hidden = false;

    items.forEach(function (el) {
      el.addEventListener("click", function () {
        hold();
        var b = el.getAttribute("data-b");
        var quitar = (typeof cMarca === "string" && cMarca === b);
        if (typeof setMarca === "function") setMarca(b); // tocar la marca activa la quita
        centerOn(el);
        if (!quitar) setTimeout(irAResultados, 160); // bajar a la grilla filtrada
      });
    });

    ["pointerdown", "touchstart", "wheel", "keydown"].forEach(function (ev) {
      sc.addEventListener(ev, hold, { passive: true });
    });
    sc.addEventListener("mouseenter", function () { pausedUntil = Infinity; });
    sc.addEventListener("mouseleave", function () { pausedUntil = performance.now() + 1200; });
    sc.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) start(); }, { threshold: 0.2 }).observe(sec);
    } else { visible = true; }

    // Arranca con la tira llena (sin hueco a la izquierda)
    pos = Math.max(0, sc.clientWidth / 2 - 48); // tira llena desde el inicio
    sc.scrollLeft = pos;
    focus();
    sync();
    start();
  }

  function irAResultados() {
    var t = document.querySelector(".ctrl-row") || document.getElementById("pg");
    if (!t) return;
    var hdr = document.getElementById("siteHeader");
    var off = (hdr ? hdr.getBoundingClientRect().bottom : 0) + 12;
    window.scrollTo({ top: t.getBoundingClientRect().top + window.pageYOffset - off, behavior: reduce ? "auto" : "smooth" });
  }

  function hold() { pausedUntil = performance.now() + RESUME_MS; }

  function centerOn(el) {
    var x = el.offsetLeft + el.offsetWidth / 2 - sc.clientWidth / 2;
    sc.scrollTo({ left: x, behavior: reduce ? "auto" : "smooth" });
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { ticking = false; focus(); });
  }

  // Marca la del centro (.on) y sus vecinas (.near)
  function focus() {
    if (!items.length) return;
    var mid = sc.scrollLeft + sc.clientWidth / 2, best = 0, bd = Infinity;
    for (var i = 0; i < items.length; i++) {
      var c = items[i].offsetLeft + items[i].offsetWidth / 2, d = Math.abs(c - mid);
      if (d < bd) { bd = d; best = i; }
    }
    for (var j = 0; j < items.length; j++) {
      var k = Math.abs(j - best);
      items[j].classList.toggle("on", k === 0);
      items[j].classList.toggle("near", k === 1);
    }
  }

  // Resalta la marca filtrada (si hay)
  function sync() {
    if (!items.length) return;
    var b = (typeof cMarca === "string") ? cMarca : "";
    items.forEach(function (el) { el.classList.toggle("sel", !!b && el.getAttribute("data-b") === b); });
  }

  function start() {
    if (raf) return; // movimiento muy lento: se mantiene aun con "reducir animaciones"
    last = performance.now();
    raf = requestAnimationFrame(step);
  }

  function step(t) {
    raf = 0;
    var dt = Math.min(0.1, (t - last) / 1000); last = t;
    if (!visible || document.hidden) return; // se reanuda al volver a verse
    if (t > pausedUntil) {
      var max = sc.scrollWidth - sc.clientWidth;
      if (max > 0) {
        // acumulador propio: scrollLeft redondea y con pasos chicos no avanzaría
        if (Math.abs(sc.scrollLeft - pos) > 2) pos = sc.scrollLeft;
        pos += dir * SPEED * dt;
        if (pos >= max) { pos = max; dir = -1; }
        if (pos <= 0) { pos = 0; dir = 1; }
        sc.scrollLeft = pos;
      }
    }
    raf = requestAnimationFrame(step);
  }
  document.addEventListener("visibilitychange", function () { if (!document.hidden && visible) start(); });

  // Mantener sincronizado con el filtro de marca
  if (typeof window.renderProds === "function") {
    var _render = window.renderProds;
    window.renderProds = function () { var r = _render.apply(this, arguments); sync(); return r; };
  }

  document.addEventListener("DOMContentLoaded", function () {
    fetch("data/marcas.json")
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (l) { if (Array.isArray(l)) build(l); })
      .catch(function () {});
  });
})();
