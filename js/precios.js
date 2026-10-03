/* ---- FILTRO POR RANGO DE PRECIO ----
   Se combina con los demás filtros (marca, género, búsqueda, stock). */
var cPrecio = "";
var RANGOS_PRECIO = {
  "0-60000": [0, 60000],
  "60000-80000": [60000, 80000],
  "80000-100000": [80000, 100000],
  "100000-150000": [100000, 150000],
  "150000-": [150000, Infinity]
};
function setPrecio(v) {
  cPrecio = RANGOS_PRECIO[v] ? v : "";
  var s = document.getElementById("precioSel"); if (s) s.value = cPrecio;
  cPg = 1;
  renderProds();
}
(function () {
  if (typeof window.getList !== "function") return;
  var _getList = window.getList;
  window.getList = function () {
    var l = _getList.apply(this, arguments);
    var r = RANGOS_PRECIO[cPrecio];
    if (!r) return l;
    return l.filter(function (p) { return p.p > 0 && p.p >= r[0] && p.p < r[1]; });
  };
})();
