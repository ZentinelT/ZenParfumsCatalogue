/* ---- PLACAS PARA REDES (modo dueno) ----
   Un click en el boton de una tarjeta genera un JPEG 1080x1350 (feed de
   Instagram, 4:5) del producto y lo descarga; en celular abre la hoja de
   compartir, que permite mandarlo derecho a Instagram.

   Hay dos estilos, cada uno con su boton (el color del boton es el color de
   la placa que sale):
     CREMA  - fondo crema, foto fundida (multiply: el blanco del packshot
              desaparece y el frasco queda flotando), notas incluidas.
     OSCURA - fondo negro, foto grande sobre panel blanco, sin notas.
   Los colores son fijos a proposito: no siguen el tema del sitio, asi la
   placa sale siempre igual se este navegando en claro o en oscuro.

   El modo se prende con ?placa=1 o con la tecla "k" y queda guardado en
   localStorage, asi el cliente nunca ve los botones.

   La placa se dibuja con Canvas 2D y no con html2canvas: esa libreria clona el
   documento entero en un iframe y en este sitio tarda ~10s por placa, aun con
   un nodo vacio. Dibujando a mano tarda milisegundos y el resultado es exacto. */
(function () {
  var LS_KEY = "zp-placa";
  var PW = 1080, PH = 1350;      /* 4:5 Instagram */
  var MARGIN = 22, RADIUS = 36;  /* margen y esquinas de la tarjeta */
  var PAD_X = 56, PAD_T = 44, PAD_B = 46;
  var MIN_IMG = 520;             /* si la foto bajaria de esto, achicamos texto */
  var FD = '"Cormorant Garamond", Georgia, serif';
  var FB = '"Inter", system-ui, sans-serif';

  var on = false, busy = false;

  /* ---------- paletas (fijas, no dependen del tema del sitio) ---------- */
  var PAL = {
    crema: { page:"#ded2bd", card:"#f4eee3", ink:"#1d1710", gold:"#a97f3d",
             soft:"#6b5c4a", lbl:"#3d332a", pill:"#e6dbc8", photoBg:null,
             blend:"multiply" },
    oscura:{ page:"#0c0a07", card:"#17130f", ink:"#f8f3e9", gold:"#c8a66a",
             soft:"#c3b49d", lbl:"#e8dfcf", pill:"#2a221b", photoBg:"#ffffff",
             blend:"source-over" }
  };

  var ESTILOS = {
    crema:  { pal: PAL.crema,  notas: true,  nameSz: 84, inset: 24, suf: "" },
    oscura: { pal: PAL.oscura, notas: false, nameSz: 96, inset: 30, suf: " - destacado" }
  };

  /* ---------- helpers de texto ---------- */

  /* alto de linea a la CSS: centra la caja de la fuente dentro del line-height */
  function lineMetrics(ctx, size) {
    var m = ctx.measureText("Mg");
    return {
      asc:  m.fontBoundingBoxAscent  || size * 0.8,
      desc: m.fontBoundingBoxDescent || size * 0.2
    };
  }
  function drawLine(ctx, text, x, top, lineH, size) {
    var lm = lineMetrics(ctx, size);
    ctx.fillText(text, x, top + (lineH - (lm.asc + lm.desc)) / 2 + lm.asc);
  }

  /* letter-spacing manual: ctx.letterSpacing no existe en Safari viejo */
  function trackedWidth(ctx, text, sp) {
    var w = 0;
    for (var i = 0; i < text.length; i++) w += ctx.measureText(text[i]).width + sp;
    return w - (text.length ? sp : 0);
  }
  function drawTracked(ctx, text, x, top, lineH, size, sp) {
    var lm = lineMetrics(ctx, size);
    var y = top + (lineH - (lm.asc + lm.desc)) / 2 + lm.asc;
    for (var i = 0; i < text.length; i++) {
      ctx.fillText(text[i], x, y);
      x += ctx.measureText(text[i]).width + sp;
    }
  }

  function ellipsis(ctx, text, maxW) {
    if (ctx.measureText(text).width <= maxW) return text;
    var s = text;
    while (s.length > 1 && ctx.measureText(s + "…").width > maxW) s = s.slice(0, -1);
    return s.replace(/[\s,;]+$/, "") + "…";
  }

  function wrap(ctx, text, maxW, maxLines) {
    var words = String(text).split(/\s+/), lines = [], cur = "";
    for (var i = 0; i < words.length; i++) {
      var test = cur ? cur + " " + words[i] : words[i];
      if (ctx.measureText(test).width <= maxW || !cur) {
        cur = test;
      } else {
        lines.push(cur); cur = words[i];
        if (lines.length === maxLines) break;
      }
    }
    if (lines.length < maxLines && cur) lines.push(cur);
    if (lines.length === maxLines) {
      /* si quedo texto afuera, cortamos la ultima linea con puntos suspensivos */
      var used = lines.join(" ");
      if (used.length < String(text).replace(/\s+/g, " ").length) {
        lines[maxLines - 1] = ellipsis(ctx, lines[maxLines - 1] + " …", maxW).replace(/\s*…+$/, "…");
      }
    }
    return lines;
  }

  /* corta en lineas dejando la primera mas corta: ahi va la etiqueta en negrita */
  function wrapHanging(ctx, text, firstW, restW, maxLines) {
    var words = String(text).trim().split(/\s+/), all = [], cur = "";
    for (var i = 0; i < words.length; i++) {
      var w = all.length === 0 ? firstW : restW;
      var test = cur ? cur + " " + words[i] : words[i];
      if (ctx.measureText(test).width <= w || !cur) cur = test;
      else { all.push(cur); cur = words[i]; }
    }
    if (cur) all.push(cur);
    if (all.length <= maxLines) return all;
    var keep = all.slice(0, maxLines);
    keep[maxLines - 1] = ellipsis(ctx, all.slice(maxLines - 1).join(" "),
                                  maxLines === 1 ? firstW : restW);
    return keep;
  }

  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, h / 2, w / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  /* ---------- datos del producto ---------- */
  function nameOf(p) {
    if (typeof cleanName === "function") return cleanName(p.n);
    return p.n.indexOf("-") > -1
      ? p.n.split("-").slice(1).join("-").split("|")[0].trim()
      : p.n.split("|")[0].trim();
  }
  function typeOf(p) { return typeof getType === "function" ? (getType(p.n) || "") : ""; }
  function stagesOf(p) {
    var out = [];
    var nt = typeof parseNotes === "function" ? parseNotes(p.nt) : null;
    if (nt) {
      if (nt.salida)  out.push(["Salida:",  nt.salida]);
      if (nt.corazon) out.push(["Corazón:", nt.corazon]);
      if (nt.fondo)   out.push(["Fondo:",   nt.fondo]);
    } else if (p.nt && p.nt !== "—") {
      out.push(["Notas:", p.nt]);
    }
    return out.slice(0, 3);
  }

  /* la foto sale de Supabase con CORS abierto: la bajamos como blob para que el
     canvas no quede tainted ni dependa de la cache sin CORS del navegador */
  function loadPhoto(url) {
    if (!url) return Promise.resolve(null);
    return fetch(url, { mode: "cors" })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.blob(); })
      .then(function (b) {
        return new Promise(function (res, rej) {
          var u = URL.createObjectURL(b), im = new Image();
          im.onload = function () { URL.revokeObjectURL(u); res(im); };
          im.onerror = function () { URL.revokeObjectURL(u); rej(new Error("img")); };
          im.src = u;
        });
      })
      .catch(function () { return null; });
  }


  /* Las fotos de catalogo vienen con mucho blanco alrededor del producto: si lo
     dibujamos tal cual, el frasco queda chiquito en el medio de la placa.
     Buscamos la caja del producto (primer pixel que no es casi blanco) y
     recortamos ahi, con un margen minimo. Devuelve null si no hay nada que
     recortar o si la foto no tiene fondo claro. */
  function recorte(img) {
    var w = img.width, h = img.height;
    if (!w || !h) return null;
    var c = document.createElement("canvas");
    c.width = w; c.height = h;
    var x = c.getContext("2d", { willReadFrequently: true });
    x.drawImage(img, 0, 0);
    var d;
    try { d = x.getImageData(0, 0, w, h).data; } catch (e) { return null; }
    var TH = 243;                                  /* mas claro que esto = fondo */
    var step = Math.max(1, Math.round(Math.min(w, h) / 500));
    var minX = w, minY = h, maxX = -1, maxY = -1;
    for (var yy = 0; yy < h; yy += step) {
      var row = yy * w;
      for (var xx = 0; xx < w; xx += step) {
        var i = (row + xx) * 4;
        if (d[i] < TH || d[i + 1] < TH || d[i + 2] < TH) {
          if (xx < minX) minX = xx;
          if (xx > maxX) maxX = xx;
          if (yy < minY) minY = yy;
          if (yy > maxY) maxY = yy;
        }
      }
    }
    if (maxX < 0) return null;
    var pad = Math.round(Math.min(w, h) * 0.012) + step;
    minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad);
    maxX = Math.min(w - 1, maxX + pad); maxY = Math.min(h - 1, maxY + pad);
    var sw = maxX - minX + 1, sh = maxY - minY + 1;
    if (sw > w * 0.96 && sh > h * 0.96) return null;   /* ya venia ajustada */
    if (sw < w * 0.15 || sh < h * 0.15) return null;   /* sospechoso: no tocamos */
    return { x: minX, y: minY, w: sw, h: sh };
  }

  function fontsReady() {
    if (!document.fonts) return Promise.resolve();
    return Promise.all([
      document.fonts.load('500 32px ' + FB),
      document.fonts.load('600 24px ' + FB),
      document.fonts.load('600 31px ' + FB),
      document.fonts.load('300 31px ' + FB),
      document.fonts.load('500 17px ' + FB),
      document.fonts.load('400 96px ' + FD),
      document.fonts.load('300 34px ' + FD)
    ]).catch(function () {});
  }

  /* ---------- la placa ---------- */
  function drawPlaca(p, photo, estilo) {
    var opt = ESTILOS[estilo] || ESTILOS.crema;
    var C = opt.pal;

    var cv = document.createElement("canvas");
    cv.width = PW; cv.height = PH;
    var ctx = cv.getContext("2d");
    ctx.textBaseline = "alphabetic";

    var CW = PW - MARGIN * 2, CH = PH - MARGIN * 2;   /* medidas de la tarjeta */
    var maxW = CW - PAD_X * 2;
    var NAME_SZ = opt.nameSz, NAME_LH = Math.round(NAME_SZ * 1.17);
    var BRAND_SZ = 32, tx = PAD_X + 30;
    var FOOT_H = 26 + 2 + 18 + 34 + 10 + 17;

    /* --- medimos todo antes de dibujar, para saber que alto le queda a la foto --- */
    ctx.font = "400 " + NAME_SZ + "px " + FD;
    var nameLines = wrap(ctx, nameOf(p), maxW, 2);

    var badges = [];
    if (typeOf(p)) badges.push({ t: typeOf(p).toUpperCase(), alt: false });
    if (p.s)      badges.push({ t: String(p.s).toUpperCase(), alt: true });

    var fijo = PAD_T + BRAND_SZ + 14 + nameLines.length * NAME_LH +
               (badges.length ? 20 + 48 : 0) + FOOT_H + PAD_B;

    function medirNotas(maxPorEtapa, sz, lh) {
      return stagesOf(p).map(function (st) {
        ctx.font = "600 " + sz + "px " + FB;
        var lw = ctx.measureText(st[0]).width;
        ctx.font = "300 " + sz + "px " + FB;
        return {
          label: st[0], lw: lw, sz: sz, lh: lh,
          lines: wrapHanging(ctx, st[1], CW - PAD_X - tx - lw - 10,
                             CW - PAD_X - tx, maxPorEtapa)
        };
      });
    }

    /* las notas se van achicando hasta que a la foto le quede un alto digno */
    var stages = [], ntH = 0;
    if (opt.notas) {
      var planes = [[2, 31, 47], [1, 31, 47], [1, 28, 43]];
      for (var pi = 0; pi < planes.length; pi++) {
        stages = medirNotas(planes[pi][0], planes[pi][1], planes[pi][2]);
        ntH = stages.reduce(function (a, s) { return a + s.lines.length * s.lh; }, 0);
        if (CH - (fijo + (stages.length ? 26 + ntH : 0)) >= MIN_IMG) break;
      }
    }
    var bodyH = fijo + (stages.length ? 26 + ntH : 0);
    var imgH = Math.max(320, CH - bodyH);

    /* --- fondo de la pagina: queda como margen alrededor de la tarjeta --- */
    ctx.fillStyle = C.page;
    ctx.fillRect(0, 0, PW, PH);

    /* --- tarjeta con esquinas redondeadas --- */
    ctx.save();
    ctx.translate(MARGIN, MARGIN);
    roundRect(ctx, 0, 0, CW, CH, RADIUS);
    ctx.clip();
    ctx.fillStyle = C.card;
    ctx.fillRect(0, 0, CW, CH);

    /* --- foto entera (contain): nunca corta el frasco --- */
    var panelH = imgH;
    if (photo) {
      var r = recorte(photo) || { x: 0, y: 0, w: photo.width, h: photo.height };
      var sc = Math.min((CW - opt.inset * 2) / r.w,
                        (imgH - opt.inset * 2) / r.h);
      var dw = r.w * sc, dh = r.h * sc;
      /* con fotos apaisadas sobra alto: el panel blanco se achica hasta la foto
         (si no, queda un bloque blanco enorme medio vacio) y el espacio que sobra
         queda como aire entre la foto y el texto (el pie siempre pegado abajo) */
      if (C.photoBg) {
        panelH = Math.min(imgH, Math.round(dh + opt.inset * 2));
        ctx.fillStyle = C.photoBg;
        ctx.fillRect(0, 0, CW, panelH);
      }
      ctx.save();
      ctx.beginPath(); ctx.rect(0, 0, CW, panelH); ctx.clip();
      ctx.globalCompositeOperation = C.blend;
      ctx.drawImage(photo, r.x, r.y, r.w, r.h,
                    (CW - dw) / 2, (panelH - dh) / 2, dw, dh);
      ctx.restore();
      if (C.photoBg) {   /* filete dorado que separa el panel blanco del cuerpo */
        ctx.save(); ctx.globalAlpha = 0.5; ctx.fillStyle = C.gold;
        ctx.fillRect(0, panelH - 1.5, CW, 1.5); ctx.restore();
      }
    }

    var y = imgH + PAD_T;

    /* --- marca --- */
    ctx.fillStyle = C.gold;
    ctx.font = "500 " + BRAND_SZ + "px " + FB;
    drawTracked(ctx, String(p.b).toUpperCase(), PAD_X, y, BRAND_SZ, BRAND_SZ, 6.4);
    y += BRAND_SZ + 14;

    /* --- nombre --- */
    ctx.fillStyle = C.ink;
    ctx.font = "400 " + NAME_SZ + "px " + FD;
    for (var i = 0; i < nameLines.length; i++) {
      drawLine(ctx, nameLines[i], PAD_X, y + i * NAME_LH, NAME_LH, NAME_SZ);
    }
    y += nameLines.length * NAME_LH;

    /* --- badges (EDP / 100ml) --- */
    if (badges.length) {
      y += 20;
      var bx = PAD_X;
      for (var j = 0; j < badges.length; j++) {
        ctx.font = (badges[j].alt ? "500 " : "600 ") + "24px " + FB;
        var sp = badges[j].alt ? 1.2 : 2;
        var bw = trackedWidth(ctx, badges[j].t, sp) + 46;
        if (badges[j].alt) {
          ctx.fillStyle = C.pill;
          roundRect(ctx, bx, y, bw, 48, 24); ctx.fill();
          ctx.fillStyle = C.soft;
        } else {
          ctx.strokeStyle = C.gold; ctx.lineWidth = 2;
          roundRect(ctx, bx + 1, y + 1, bw - 2, 46, 23); ctx.stroke();
          ctx.fillStyle = C.gold;
        }
        drawTracked(ctx, badges[j].t, bx + 23, y, 48, 24, sp);
        bx += bw + 14;
      }
      y += 48;
    }

    /* --- piramide de notas (cada etapa puede ocupar dos renglones) --- */
    if (stages.length) {
      y += 26;
      var ntTop = y;
      ctx.save();
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = C.gold;
      ctx.fillRect(PAD_X + 4, ntTop + 10, 2, ntH - 20);
      ctx.restore();
      var top = ntTop;
      for (var k = 0; k < stages.length; k++) {
        var st = stages[k];
        ctx.fillStyle = C.gold;
        ctx.beginPath();
        ctx.arc(PAD_X + 5, top + st.lh / 2, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = "600 " + st.sz + "px " + FB;
        ctx.fillStyle = C.lbl;
        drawLine(ctx, st.label, tx, top, st.lh, st.sz);
        ctx.font = "300 " + st.sz + "px " + FB;
        ctx.fillStyle = C.soft;
        for (var q = 0; q < st.lines.length; q++) {
          drawLine(ctx, st.lines[q],
                   q === 0 ? tx + st.lw + 10 : tx,
                   top + q * st.lh, st.lh, st.sz);
        }
        top += st.lines.length * st.lh;
      }
      y += ntH;
    }

    /* --- pie ZENPARFUMS --- */
    y += 26;
    ctx.fillStyle = C.gold;
    ctx.fillRect(CW / 2 - 30, y, 60, 1.6);
    y += 2 + 18;
    ctx.font = "300 34px " + FD;
    var word = "ZENPARFUMS", wsp = 11;
    drawTracked(ctx, word, (CW - trackedWidth(ctx, word, wsp)) / 2, y, 34, 34, wsp);
    y += 34 + 10;
    ctx.font = "500 17px " + FB;
    ctx.fillStyle = C.soft;
    var tag = "ONLINE FRAGRANCE BOUTIQUE", tsp = 3.1;
    drawTracked(ctx, tag, (CW - trackedWidth(ctx, tag, tsp)) / 2, y, 17, 17, tsp);

    ctx.restore();

    /* --- marco sutil --- */
    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.strokeStyle = C.gold;
    ctx.lineWidth = 2;
    roundRect(ctx, MARGIN + 1, MARGIN + 1, CW - 2, CH - 2, RADIUS - 1);
    ctx.stroke();
    ctx.restore();

    return cv;
  }

  /* ---------- generar y entregar ---------- */
  function toast(m) { if (typeof notify === "function") notify(m); }

  function generar(p, estilo, btn) {
    if (busy) return;
    busy = true;
    if (btn) btn.classList.add("zpp-busy");
    var done = function () { busy = false; if (btn) btn.classList.remove("zpp-busy"); };

    Promise.all([loadPhoto(p.i), fontsReady()])
      .then(function (r) {
        var cv = drawPlaca(p, r[0], estilo);
        return new Promise(function (res) { cv.toBlob(res, "image/jpeg", 0.92); });
      })
      .then(function (blob) {
        var suf = (ESTILOS[estilo] || ESTILOS.crema).suf;
        var fname = p.b + " - " + nameOf(p).replace(/[\/\\:*?"<>|]/g, "") +
                    " (" + p.id + ")" + suf + ".jpg";
        var file = null;
        try { file = new File([blob], fname, { type: "image/jpeg" }); } catch (e) {}
        /* en celular la hoja de compartir va directo a Instagram */
        if (file && navigator.canShare && navigator.canShare({ files: [file] }) &&
            matchMedia("(pointer:coarse)").matches) {
          return navigator.share({ files: [file] }).catch(function () { bajar(blob, fname); });
        }
        bajar(blob, fname);
        toast("Placa descargada");
      })
      .catch(function (e) { console.error(e); toast("No se pudo generar la placa"); })
      .then(done, done);
  }

  function bajar(blob, fname) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = fname;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  /* ---------- botones en las tarjetas ---------- */
  var ICON =
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M12 3v12"/><path d="M7 11l5 5 5-5"/><path d="M4 20h16"/></svg>';

  function prodById(id) {
    if (typeof PRODS === "undefined" || !PRODS) return null;
    return PRODS.find(function (x) { return x.id === id; }) || null;
  }

  function hacerBtn(id, estilo, clase, titulo) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "zpp-btn " + clase;
    b.title = titulo;
    b.innerHTML = ICON;
    b.addEventListener("click", function (ev) {
      ev.stopPropagation(); ev.preventDefault();
      var p = prodById(id);
      if (p) generar(p, estilo, b); else toast("Producto no encontrado");
    });
    return b;
  }

  function decorar() {
    if (!on) return;
    document.querySelectorAll(".pc, .scard").forEach(function (card) {
      if (card.getAttribute("data-zpp")) return;
      var m = (card.getAttribute("onclick") || "").match(/openProduct\((\d+)\)/);
      if (!m) return;
      var host = card.querySelector(".pc-img, .scard-img");
      if (!host) return;
      card.setAttribute("data-zpp", m[1]);
      var id = parseInt(m[1], 10);
      var wrapEl = document.createElement("div");
      wrapEl.className = "zpp-wrap";
      wrapEl.appendChild(hacerBtn(id, "crema",  "zpp-cre", "Placa crema (con notas)"));
      wrapEl.appendChild(hacerBtn(id, "oscura", "zpp-osc", "Placa oscura (foto grande)"));
      host.appendChild(wrapEl);
    });
  }

  function limpiar() {
    document.querySelectorAll(".zpp-wrap").forEach(function (b) { b.remove(); });
    document.querySelectorAll("[data-zpp]").forEach(function (c) { c.removeAttribute("data-zpp"); });
  }

  function setModo(v, avisar) {
    on = !!v;
    try { localStorage.setItem(LS_KEY, on ? "1" : "0"); } catch (e) {}
    document.body.classList.toggle("zpp-on", on);
    if (on) decorar(); else limpiar();
    if (avisar) toast(on ? "Modo placas activado" : "Modo placas desactivado");
  }

  function isTyping(el) {
    if (!el) return false;
    var t = el.tagName;
    return t === "INPUT" || t === "TEXTAREA" || t === "SELECT" || el.isContentEditable;
  }

  document.addEventListener("keydown", function (e) {
    if (!e.key || e.key.toLowerCase() !== "k") return;
    if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
    if (isTyping(document.activeElement)) return;
    setModo(!on, true);
  });

  /* ---------- estilos de los botones ---------- */
  var css = document.createElement("style");
  css.textContent =
    ".zpp-wrap{position:absolute;bottom:10px;left:10px;display:flex;gap:6px;z-index:3}" +
    ".zpp-btn{box-sizing:border-box;width:32px;height:32px;border-radius:50%;" +
      "display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;" +
      "box-shadow:0 2px 10px rgba(0,0,0,.28);transition:transform .2s var(--e),opacity .2s var(--e)}" +
    ".zpp-btn.zpp-cre{background:#f4eee3;color:#a97f3d;border:1.5px solid rgba(169,127,61,.5)}" +
    ".zpp-btn.zpp-osc{background:#17130f;color:#c8a66a;border:1.5px solid rgba(200,166,106,.45)}" +
    ".zpp-btn:hover{transform:scale(1.1)}" +
    ".zpp-btn.zpp-busy{opacity:.5;pointer-events:none;animation:zpp-pulse 1s infinite}" +
    "@keyframes zpp-pulse{0%,100%{opacity:.35}50%{opacity:.8}}";
  document.head.appendChild(css);

  /* ---------- arranque ---------- */
  var forced = new URLSearchParams(location.search).get("placa");
  var saved = null;
  try { saved = localStorage.getItem(LS_KEY); } catch (e) {}
  on = forced === "1" ? true : forced === "0" ? false : saved === "1";
  if (forced !== null) { try { localStorage.setItem(LS_KEY, on ? "1" : "0"); } catch (e) {} }
  document.body.classList.toggle("zpp-on", on);

  /* las tarjetas se redibujan al filtrar o paginar: re-decoramos */
  var pend = null;
  new MutationObserver(function () {
    if (!on || pend) return;
    pend = setTimeout(function () { pend = null; decorar(); }, 80);
  }).observe(document.body, { childList: true, subtree: true });

  decorar();

  /* util desde la consola: zpPlaca(2091) o zpPlaca(2091,"oscura") */
  window.zpPlaca = function (id, estilo) {
    var p = prodById(typeof id === "number" ? id : parseInt(id, 10));
    if (p) generar(p, estilo || "crema", null); else toast("Producto no encontrado");
  };
  window.zpPlacaModo = function (v) { setModo(v === undefined ? !on : v, true); };
  window.zpPlacaCanvas = function (id, photo, estilo) {
    return drawPlaca(prodById(id), photo, estilo || "crema");
  };
})();
