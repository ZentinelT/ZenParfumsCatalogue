/* ============================================================================
   RECORTE DE FONDO EN LA GRILLA
   ----------------------------------------------------------------------------
   Muchas fotos de producto vienen con un margen blanco enorme alrededor del
   frasco. Con el panel crema + mix-blend-mode:multiply (css/styles.css) ese
   blanco ya no se ve, pero el frasco igual queda chico porque ocupa la mitad
   de la foto.

   Este script busca, en cada foto, donde empieza el producto de verdad y la
   vuelve a generar recortada. Dos pasadas:
     1) deteccion en una copia chica (220px) -> barato
     2) recorte final desde la original -> JPEG en un blob
   Se cachea por URL, asi que cuando el catalogo se vuelve a dibujar (filtros,
   busqueda, orden) el recorte ya esta hecho y se aplica al instante.

   Requiere crossorigin="anonymous" en los <img> (js/catalog.js). Los dos hosts
   de fotos (Supabase Storage y mlstatic) mandan access-control-allow-origin:*,
   asi que el canvas nunca queda "tainted". Si alguna vez fallara, el catch
   deja la foto original sin tocar.
   ========================================================================== */
(function () {
  "use strict";

  var SEL   = ".pc-img img, .scard-img img";
  var TH    = 243;   /* mas claro que esto = fondo */
  var DET   = 220;   /* ancho de la copia de deteccion */
  var MAXW  = 820;   /* lado maximo del recorte que generamos */
  var cache = {};    /* url original -> blob url, o "" = no hay que tocarla */
  var obs   = null;

  /* --- bbox del producto sobre una copia chica --------------------------- */
  function caja(img) {
    var nw = img.naturalWidth, nh = img.naturalHeight;
    if (!nw || !nh) return null;

    var sc = Math.min(1, DET / Math.max(nw, nh));
    var w  = Math.max(1, Math.round(nw * sc));
    var h  = Math.max(1, Math.round(nh * sc));

    var c = document.createElement("canvas");
    c.width = w; c.height = h;
    var x = c.getContext("2d", { willReadFrequently: true });
    if (!x) return null;
    x.drawImage(img, 0, 0, w, h);

    var d;
    try { d = x.getImageData(0, 0, w, h).data; } catch (e) { return null; }

    var minX = w, minY = h, maxX = -1, maxY = -1;
    for (var yy = 0; yy < h; yy++) {
      var row = yy * w;
      for (var xx = 0; xx < w; xx++) {
        var i = (row + xx) * 4;
        if (d[i + 3] > 8 && (d[i] < TH || d[i + 1] < TH || d[i + 2] < TH)) {
          if (xx < minX) minX = xx;
          if (xx > maxX) maxX = xx;
          if (yy < minY) minY = yy;
          if (yy > maxY) maxY = yy;
        }
      }
    }
    if (maxX < 0) return null;

    /* un poco de aire y de vuelta a pixeles de la foto original */
    var pad = 2;
    minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad);
    maxX = Math.min(w - 1, maxX + pad); maxY = Math.min(h - 1, maxY + pad);

    var bw = maxX - minX + 1, bh = maxY - minY + 1;
    if (bw > w * 0.95 && bh > h * 0.95) return null;   /* ya venia ajustada */
    if (bw < w * 0.12 || bh < h * 0.12) return null;   /* sospechoso: no tocamos */

    var k = 1 / sc;
    return {
      x: Math.max(0, Math.floor(minX * k)),
      y: Math.max(0, Math.floor(minY * k)),
      w: Math.min(nw, Math.ceil(bw * k)),
      h: Math.min(nh, Math.ceil(bh * k))
    };
  }

  /* --- recorte final ---------------------------------------------------- */
  function generar(img, r, listo) {
    var sc = Math.min(1, MAXW / Math.max(r.w, r.h));
    var dw = Math.max(1, Math.round(r.w * sc));
    var dh = Math.max(1, Math.round(r.h * sc));

    var c = document.createElement("canvas");
    c.width = dw; c.height = dh;
    var x = c.getContext("2d");
    if (!x) { listo(""); return; }
    x.fillStyle = "#ffffff";                 /* sin alpha: multiply lo borra */
    x.fillRect(0, 0, dw, dh);
    try { x.drawImage(img, r.x, r.y, r.w, r.h, 0, 0, dw, dh); }
    catch (e) { listo(""); return; }

    if (c.toBlob) {
      c.toBlob(function (b) {
        listo(b ? URL.createObjectURL(b) : "");
      }, "image/jpeg", 0.92);
    } else {
      try { listo(c.toDataURL("image/jpeg", 0.92)); } catch (e) { listo(""); }
    }
  }

  function aplicar(img, orig, url) {
    img.setAttribute("data-zpr", "1");
    if (url) img.src = url;
  }

  function procesar(img) {
    if (img.getAttribute("data-zpr")) return;
    var orig = img.currentSrc || img.src;
    if (!orig || orig.lastIndexOf("blob:", 0) === 0 ||
                 orig.lastIndexOf("data:", 0) === 0) return;

    if (cache[orig] !== undefined) { aplicar(img, orig, cache[orig]); return; }

    if (!img.complete || !img.naturalWidth) {
      if (img.getAttribute("data-zpr-wait")) return;
      img.setAttribute("data-zpr-wait", "1");
      img.addEventListener("load", function () {
        img.removeAttribute("data-zpr-wait");
        procesar(img);
      }, { once: true });
      return;
    }

    /* marcamos ya para que dos pasadas no lo hagan dos veces */
    img.setAttribute("data-zpr", "1");

    var r = caja(img);
    if (!r) { cache[orig] = ""; return; }

    generar(img, r, function (url) {
      cache[orig] = url;
      if (url) img.src = url;
    });
  }

  /* --- recorremos solo lo que esta (casi) en pantalla ------------------- */
  function barrer() {
    var l = document.querySelectorAll(SEL);
    for (var i = 0; i < l.length; i++) {
      var img = l[i];
      if (img.getAttribute("data-zpr")) continue;
      if (obs) {
        if (!img.getAttribute("data-zpr-obs")) {
          img.setAttribute("data-zpr-obs", "1");
          obs.observe(img);
        }
      } else {
        procesar(img);
      }
    }
  }

  function init() {
    if (!document.createElement("canvas").getContext) return;

    if (window.IntersectionObserver) {
      obs = new IntersectionObserver(function (ents) {
        for (var i = 0; i < ents.length; i++) {
          if (!ents[i].isIntersecting) continue;
          obs.unobserve(ents[i].target);
          procesar(ents[i].target);
        }
      }, { rootMargin: "400px 0px" });
    }

    barrer();

    /* el catalogo redibuja las tarjetas al filtrar / buscar / ordenar */
    var t = null;
    new MutationObserver(function () {
      clearTimeout(t);
      t = setTimeout(barrer, 90);
    }).observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
