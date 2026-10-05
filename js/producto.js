/* ---- FICHA UNIFICADA DE PRODUCTO ----
   Un solo modal con todo: foto, precio, piramide, datos de la ficha tecnica,
   inspiracion, similares y boton de compartir (link a /perfume/ID-nombre/).
   Reemplaza openProduct / openFicha de catalog.js. */
function pzSlug(s) {
  s = String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  return s.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70);
}
function pzUrl(p) { return location.origin + "/perfume/" + p.id + "-" + pzSlug(cleanName(p.n)) + "/"; }
function pzCap(s) { s = String(s || "").trim(); return s.charAt(0).toUpperCase() + s.slice(1); }
function pzPills(txt) {
  return String(txt || "").split(/\s*,\s*|\s+y\s+/).filter(Boolean).map(function (x) {
    return "<span class=\"pz-pill\">" + esc(pzCap(x)) + "</span>";
  }).join("");
}
function pzNotes(txt) {
  return String(txt || "").split(/\s*,\s*|\s+y\s+/).map(function (x) { return pzCap(x.replace(/[.\s]+$/, "")); }).filter(Boolean).map(esc).join(" \u00B7 ");
}
function pzFact(label, value) {
  if (!value) return "";
  return "<div class=\"pz-fact\"><div class=\"pz-fl\">" + esc(label) + "</div><div class=\"pz-fv\">" + esc(value) + "</div></div>";
}
function pzSec(id, title, body) {
  return body ? "<section class=\"pz-sec\"" + (id ? " id=\"" + id + "\"" : "") + "><h3 class=\"pz-h\">" + title + "</h3>" + body + "</section>" : "";
}
function pzShare(id) {
  var p = PRODS.find(function (x) { return x.id === id; });
  if (!p) return;
  var url = pzUrl(p), title = cleanName(p.n) + " — " + p.b;
  if (navigator.share) {
    navigator.share({ title: title, text: title + (p.p > 0 ? " · " + fmt(p.p) : ""), url: url }).catch(function () {});
  } else if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(function () { notify("Link copiado"); }, function () { window.prompt("Copiar link:", url); });
  } else { window.prompt("Copiar link:", url); }
  try { if (window.goatcounter && window.goatcounter.count) window.goatcounter.count({ path: "compartir: " + title, title: "Compartir", event: true }); } catch (e) {}
}

function openProduct(id, goFicha) {
  var p = PRODS.find(function (x) { return x.id === id; });
  if (!p) return;
  var f = getFicha(p) || {};
  var nm = cleanName(p.n);
  var sdot = p.st === "ok" ? "s-ok" : p.st === "low" ? "s-low" : "s-out";
  var stxt = p.st === "ok" ? "En stock" : p.st === "low" ? "Últimas unidades" : "Sin stock";
  var wished = isWished(p.id);
  var ico = function (d) { return "<svg width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\">" + d + "</svg>"; };

  // Piramide: de la ficha, o parseada del texto de notas
  var sal = f.notas_salida, cor = f.notas_corazon, fon = f.notas_fondo, plano = "";
  if (!sal && !cor && !fon) {
    var np = parseNotes(p.nt);
    if (np) { sal = np.salida; cor = np.corazon; fon = np.fondo; }
    else if (p.nt && p.nt !== "—") plano = p.nt;
  }
  var piram = "";
  [["Salida", sal], ["Corazón", cor], ["Fondo", fon]].forEach(function (r) {
    if (r[1]) piram += "<div class=\"pz-note\"><div class=\"pz-nl\">" + r[0] + "</div><div class=\"pz-nt\">" + pzNotes(r[1]) + "</div></div>";
  });
  if (plano) piram = "<div class=\"pz-note\"><div class=\"pz-nt\">" + pzNotes(plano) + "</div></div>";
  if (piram) piram = "<div class=\"pz-tl\">" + piram + "</div>";

  var facts = pzFact("Estación", f.estacion) + pzFact("Momento", f.momento_dia) + pzFact("Duración", f.duracion) +
              pzFact("Estela", f.estela) + pzFact("Proyección", f.proyeccion) + pzFact("Clima", f.clima);
  var rango = (f.rango_edad_min && f.rango_edad_max) ? (f.rango_edad_min + "–" + f.rango_edad_max + " años") : "";
  var more = pzFact("Familia olfativa", f.familia_olfativa) + pzFact("Ocasión", f.ocasion) + pzFact("Color del líquido", f.color_liquido) + pzFact("Edad sugerida", rango);

  var insp = "";
  if (f.inspiraciones && f.inspiraciones.length) {
    insp = f.inspiraciones.filter(function (i) { return i && (i.nombre || i.imagen_url); }).map(function (i) {
      return "<div class=\"pz-insp\">" + (i.imagen_url ? "<img src=\"" + i.imagen_url + "\" referrerpolicy=\"no-referrer\" alt=\"\" loading=\"lazy\">" : "") +
        "<div>" + (i.nombre ? "<div class=\"pz-in\">" + esc(i.nombre) + "</div>" : "") + (i.texto ? "<div class=\"pz-it\">" + esc(i.texto) + "</div>" : "") + "</div></div>";
    }).join("");
  } else if (f.inspirado_en_nombre) {
    insp = "<div class=\"pz-insp\">" + (f.inspirado_en_imagen_url ? "<img src=\"" + f.inspirado_en_imagen_url + "\" referrerpolicy=\"no-referrer\" alt=\"\" loading=\"lazy\">" : "") +
      "<div><div class=\"pz-in\">" + esc(f.inspirado_en_nombre) + "</div>" + (f.inspirado_en ? "<div class=\"pz-it\">" + esc(f.inspirado_en) + "</div>" : "") + "</div></div>";
  }

  var imgH = p.i ? "<img src=\"" + p.i + "\" referrerpolicy=\"no-referrer\" alt=\"" + esc(nm) + "\" onerror=\"this.style.display='none'\">" : "";
  var priceH = p.st === "out" ? "<span class=\"pz-price pz-nostock\">Sin stock</span>" : "<span class=\"pz-price\">" + (p.p > 0 ? fmt(p.p) : esc(p.p1)) + "</span>";
  var badges = (getType(p.n) ? "<span class=\"type-badge\">" + esc(getType(p.n)) + "</span>" : "") +
    (p.s ? "<span class=\"size-badge\">" + esc(p.s) + "</span>" : "") +
    (f.genero ? "<span class=\"size-badge\">" + esc(f.genero) + "</span>" : "");

  var box = $("pmBox");
  box.className = "pm pz";
  box.innerHTML =
    "<div class=\"pz-x\"><button class=\"pm-cl\" onclick=\"closeProduct()\" aria-label=\"Cerrar\">" + ico("<path d=\"M18 6 6 18M6 6l12 12\"/>") + "</button></div>" +
    "<div class=\"pz-img\">" + imgH + "</div>" +
    "<div class=\"pz-col\">" +
      "<div class=\"pz-scroll\">" +
        "<div class=\"pz-br\">" + esc(f.marca || p.b) + "</div>" +
        "<h2 class=\"pz-nm\">" + esc(nm) + "</h2>" +
        "<div class=\"pz-badges\">" + badges + "<span class=\"pz-stk\"><span class=\"sdot " + sdot + "\"></span>" + stxt + "</span></div>" +
        (facts ? "<div class=\"pz-facts\">" + facts + "</div>" : "") +
        pzSec("", "Pirámide olfativa", piram) +
        pzSec("", "Descripción", f.descripcion ? "<p class=\"pz-p\">" + esc(f.descripcion) + "</p>" : "") +
        pzSec("", "Para quién es", f.estilo_descripcion ? "<p class=\"pz-p\">" + esc(f.estilo_descripcion) + "</p>" : (f.perfil_usuario ? "<p class=\"pz-p\">" + esc(f.perfil_usuario) + "</p>" : "")) +
        pzSec("", "Inspirado en", insp) +
        pzSec("pzFicha", "Ficha técnica", more ? "<div class=\"pz-facts pz-facts2\">" + more + "</div>" : "") +
        renderSimilarSection(p) +
      "</div>" +
      "<div class=\"pz-bar\">" + priceH +
        "<button class=\"pw pz-ib" + (wished ? " on" : "") + "\" data-id=\"" + p.id + "\" title=\"Favoritos\" aria-label=\"Favoritos\" onclick=\"toggleWish(" + p.id + ")\">" + (wished ? "&#9829;" : "&#9825;") + "</button>" +
        "<button class=\"pz-ib\" title=\"Compartir\" aria-label=\"Compartir\" onclick=\"pzShare(" + p.id + ")\">" + ico("<circle cx=\"18\" cy=\"5\" r=\"3\"/><circle cx=\"6\" cy=\"12\" r=\"3\"/><circle cx=\"18\" cy=\"19\" r=\"3\"/><path d=\"M8.6 13.5l6.8 4M15.4 6.5l-6.8 4\"/>") + "</button>" +
        "<button class=\"pm-add\" onclick=\"addCart(" + p.id + ")\"" + (p.st === "out" ? " disabled" : "") + ">" + ico("<path d=\"M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z\"/><line x1=\"3\" y1=\"6\" x2=\"21\" y2=\"6\"/><path d=\"M16 10a4 4 0 0 1-8 0\"/>") + "<span>Agregar</span></button>" +
      "</div>" +
    "</div>";

  box.scrollTop = 0;
  var sc = box.querySelector(".pz-scroll"); if (sc) sc.scrollTop = 0;
  var ov = $("pmOv");
  ov.classList.remove("on");
  document.body.style.overflow = "hidden";
  requestAnimationFrame(function () { requestAnimationFrame(function () {
    ov.classList.add("on");
    if (goFicha) { var t = $("pzFicha"); if (t) t.scrollIntoView({ block: "start" }); }
  }); });
}
function openFicha(id) { openProduct(id, true); }
function closeFicha() { var o = $("fmOv"); if (o) o.classList.remove("on"); document.body.style.overflow = ""; }
