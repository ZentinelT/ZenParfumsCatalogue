/* ---- FILTROS COMBINABLES ----
   Reemplaza el viejo "Ordenar por" (un solo valor) por filtros independientes:
   - Género: Hombre / Mujer / Unisex / Niños   (cGen)
   - Tipo:   Árabes / Internacional / Corporales (cTipo)
   - Marca:  desde el carrusel                  (cMarca)
   Se combinan entre sí y con Precio, ¿Para cuándo?, Solo en stock, búsqueda y notas.
   Se carga justo después de catalog.js (antes de precios.js / estacion.js). */
var cGen = "", cTipo = "", cMarca = "";
var FIL_GEN = [{ v: "hombre", l: "Hombre" }, { v: "mujer", l: "Mujer" }, { v: "unisex", l: "Unisex" }, { v: "ninos", l: "Niños" }];
var FIL_TIPO = [{ v: "arabes", l: "Árabes" }, { v: "internacional", l: "Internacional" }, { v: "corporales", l: "Corporales" }];

function _filGen(p) {
  if (cGen === "ninos") return isKids(p);
  return p.g === cGen;
}
function _filTipo(p) {
  if (cTipo === "corporales") return isBodyCare(p);
  return p.c === cTipo;
}

/* getList nuevo: misma lógica que el original, con los filtros combinables */
function getList() {
  var l;
  if (cNotesMode && Object.keys(cSelectedNotes).length) {
    var scored = getProductsByNotes(Object.keys(cSelectedNotes));
    cNotesMatchInfo = {};
    scored.forEach(function (item) { cNotesMatchInfo[item.product.id] = item.matched; });
    l = scored.map(function (item) { return item.product; });
  } else {
    cNotesMatchInfo = {};
    l = PRODS.filter(function (p) { return p.c !== "accesorios"; });
  }
  if (cOnlyStock) l = l.filter(function (p) { return p.st !== "out"; });
  if (cGen) l = l.filter(_filGen);
  if (cTipo) l = l.filter(_filTipo);
  if (cMarca) l = l.filter(function (p) { return p.b === cMarca; });
  if (cSrch) {
    var q = cSrch;
    l = l.filter(function (p) { return (p.b + " " + p.n + " " + p.nt).toLowerCase().indexOf(q) > -1; });
  }
  return l;
}

function _novedadesFiltroActivo() {
  return !!(cGen || cTipo || cMarca || cSrch || (typeof cPrecio !== "undefined" && cPrecio));
}

function _filRefrescar() {
  cPg = 1;
  renderFiltros();
  if (cNotesMode) renderNotesGenderRow();
  renderProds();
}
function setGen(v) { cGen = (cGen === v || !v) ? "" : v; if (cGen === "ninos" && cNotesMode) { cSelectedNotes = {}; renderNoteChips(); } _filRefrescar(); }
function setTipo(v) { cTipo = (cTipo === v || !v) ? "" : v; _filRefrescar(); }
function setMarca(v) { cMarca = (cMarca === v || !v) ? "" : v; _filRefrescar(); }
function limpiarFiltros() {
  cGen = cTipo = cMarca = "";
  if (typeof cPrecio !== "undefined") cPrecio = "";
  var ps = document.getElementById("precioSel"); if (ps) ps.value = "";
  if (typeof cEstacion !== "undefined") cEstacion = "";
  var es = document.getElementById("estSel"); if (es) es.value = "";
  _filRefrescar();
}

/* Compatibilidad: links del pie ("Perfumes Hombre", "Árabes", ...) y código viejo */
function setSort(v) {
  v = String(v || "todos");
  cGen = cTipo = cMarca = "";
  if (v.indexOf("marca:") === 0) cMarca = v.slice(6);
  else if (FIL_GEN.some(function (o) { return o.v === v; })) cGen = v;
  else if (FIL_TIPO.some(function (o) { return o.v === v; })) cTipo = v;
  _filRefrescar();
  if (v !== "todos") setTimeout(function () { var c = $("catalogo"); if (c) c.scrollIntoView({ behavior: "smooth", block: "start" }); }, 80);
}
function filterBy(cat) { setSort(cat); }

/* Género dentro del buscador por notas: usa el mismo filtro */
function renderNotesGenderRow() {
  var box = $("notesGenderRow");
  if (!box) return;
  box.innerHTML = FIL_GEN.map(function (o) {
    return "<button class=\"chip" + (cGen === o.v ? " on" : "") + "\" onclick=\"setGen('" + o.v + "')\">" + esc(o.l) + "</button>";
  }).join("");
}
function setNotesGender(g) { setGen(g); }

/* Botones de filtros */
function renderFiltros() {
  var box = $("filtrosRow");
  if (!box) return;
  function chips(list, act, fn) {
    return list.map(function (o) {
      return "<button type=\"button\" class=\"chip" + (act === o.v ? " on" : "") + "\" aria-pressed=\"" + (act === o.v) + "\" onclick=\"" + fn + "('" + o.v + "')\">" + esc(o.l) + "</button>";
    }).join("");
  }
  var extra = "";
  if (cMarca) extra += "<button type=\"button\" class=\"chip on fil-x\" onclick=\"setMarca('')\" title=\"Quitar marca\">" + esc(cMarca) + " &#10005;</button>";
  var activos = cGen || cTipo || cMarca || (typeof cPrecio !== "undefined" && cPrecio) || (typeof cEstacion !== "undefined" && cEstacion);
  if (activos) extra += "<button type=\"button\" class=\"fil-clear\" onclick=\"limpiarFiltros()\">Limpiar filtros</button>";
  box.innerHTML =
    "<div class=\"fil-grp\">" + chips(FIL_GEN, cGen, "setGen") + "</div>" +
    "<div class=\"fil-grp\">" + chips(FIL_TIPO, cTipo, "setTipo") + "</div>" +
    (extra ? "<div class=\"fil-grp\">" + extra + "</div>" : "");
}
(function () {
  var _r = window.renderProds;
  window.renderProds = function () { var r = _r.apply(this, arguments); renderFiltros(); return r; };
})();
