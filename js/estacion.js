/* ---- FILTRO "¿PARA CUÁNDO?" (calor / frío / todo el año) ----
   Combina 3 señales de la ficha:
   1) estación cargada (verano/primavera vs otoño/invierno)
   2) clima cargado (calor/cálido vs frío)
   3) perfil de notas: el calor favorece notas volátiles y frescas (cítricos,
      acuáticos, verdes, aromáticas); el frío, fondos densos (vainilla, especias,
      resinas, ámbar, oud, cuero).
   Las notas corrigen fichas mal cargadas y clasifican las que no tienen estación.
   Dentro de cada filtro se muestran primero los más típicos. */
var cEstacion = "";
var EST_FRESH = ["bergamota","limon","lima","mandarina","naranja","pomelo","toronja","citric","yuzu","neroli","petitgrain","menta","hierbabuena","marin","acuatic","sal marina","ozon","pepino","te verde","notas verdes","hoja","galbano","albahaca","romero","salvia","lavanda","jengibre","pina","coco","sandia","melon","manzana","pera","lirio de los valles","muguet","fresia","flor de loto","nenufar","ambroxan","calone"];
var EST_WARM = ["vainill","tonka","caramel","praline","cacao","chocolate","cafe","miel","canela","clavo","nuez moscada","azafran","pimienta negra","benjui","ladano","labdanum","incienso","olibano","mirra","resina","opopanax","ambar","oud","agar","cuero","tabaco","pachuli","almendra","licor","ron","whisky","castana","gamuza","sandalo","heliotropo","tuberosa","orquidea"];

function _estN(s) { return (s || "").toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim(); }
function _estCount(t, list) { var c = 0; for (var i = 0; i < list.length; i++) if (t.indexOf(list[i]) > -1) c++; return c; }

/* Puntaje: positivo = calor, negativo = frío, cerca de 0 = todo el año. null = sin datos */
function estScore(f) {
  if (!f) return null;
  var s = 0, datos = false;
  var e = _estN(f.estacion);
  if (e) {
    var ver = /verano/.test(e), pri = /primavera/.test(e), oto = /otono/.test(e), inv = /invierno/.test(e);
    if (/todo/.test(e) || (ver && inv)) { datos = true; }
    else if (ver || pri || oto || inv) {
      datos = true;
      if (ver && !oto) s += 2; else if (ver) s += 1;
      else if (inv && !pri) s -= 2; else if (inv) s -= 1;
    }
  }
  var c = _estN(f.clima);
  if (c && !/todo/.test(c)) {
    var cal = /calor|calido/.test(c), fri = /frio/.test(c);
    if (cal && !fri) { s += 1; datos = true; } else if (fri && !cal) { s -= 1; datos = true; } else datos = true;
  }
  var t = ["notas_salida", "notas_corazon", "notas_fondo"].map(function (k) { return _estN(f[k]); }).join(" , ").replace(/ambar gris/g, "ambergris");
  if (t.replace(/[ ,]/g, "")) {
    var d = _estCount(t, EST_FRESH) - _estCount(t, EST_WARM);
    d = Math.max(-3, Math.min(3, d));
    s += d * (datos ? 0.75 : 1);
    datos = true;
  }
  return datos ? s : null;
}
function estClase(s) { return s === null ? "" : s >= 1.5 ? "calor" : s <= -1.5 ? "frio" : "todo"; }

var _estCache = null;
function _estDe(p) {
  if (!_estCache) _estCache = {};
  if (!(p.id in _estCache)) {
    var s = (typeof isKids === "function" && isKids(p)) ? null : estScore(typeof getFicha === "function" ? getFicha(p) : null);
    _estCache[p.id] = { s: s, c: estClase(s) };
  }
  return _estCache[p.id];
}

function setEstacion(v) {
  cEstacion = (v === "calor" || v === "frio" || v === "todo") ? v : "";
  var s = document.getElementById("estSel"); if (s) s.value = cEstacion;
  if (typeof cPg !== "undefined") cPg = 1;
  renderProds();
  try {
    if (cEstacion && window.goatcounter && window.goatcounter.count) {
      var t = { calor: "para el calor", frio: "para el frio", todo: "todo el anio" }[cEstacion];
      window.goatcounter.count({ path: "estacion: " + t, title: "Filtro estación: " + t, event: true });
    }
  } catch (e) {}
}

(function () {
  if (typeof window.getList === "function") {
    var _getList = window.getList;
    window.getList = function () {
      var l = _getList.apply(this, arguments);
      if (!cEstacion) return l;
      l = l.filter(function (p) { return _estDe(p).c === cEstacion; });
      // Más típicos primero, salvo con rango de precio (ordena por precio) o buscador por notas
      var ordenUsuario = (typeof cNotesMode !== "undefined" && cNotesMode) || (typeof cPrecio !== "undefined" && !!cPrecio);
      if (!ordenUsuario) {
        var k = cEstacion === "calor" ? function (p) { return -_estDe(p).s; }
              : cEstacion === "frio" ? function (p) { return _estDe(p).s; }
              : function (p) { return Math.abs(_estDe(p).s); };
        l = l.map(function (p, i) { return [p, k(p), i]; })
             .sort(function (a, b) { return a[1] - b[1] || a[2] - b[2]; })
             .map(function (x) { return x[0]; });
      }
      return l;
    };
  }
  // Ocultar "Nuevos ingresos" mientras el filtro esté activo (igual que los demás filtros)
  if (typeof window._novedadesFiltroActivo === "function") {
    var _nf = window._novedadesFiltroActivo;
    window._novedadesFiltroActivo = function () { return !!cEstacion || _nf.apply(this, arguments); };
  }
})();

