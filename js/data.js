function $(id) { return document.getElementById(id); }
function fmt(n) { return "$" + Number(n).toLocaleString("es-AR"); }
// El margen ya viene aplicado desde Python (calcular_precio). No se vuelve a sumar acá.
var PRODS = [];
var FICHAS = {};

function loadCatalogData() {
  return Promise.all([
    fetch("data/products.json").then(function(r){ return r.json(); }),
    fetch("data/fichas.json").then(function(r){ return r.json(); })
  ]).then(function(results){
    PRODS = results[0];
    var raw = results[1] || [];
    raw.forEach(function(f){
      if (f && f.nombre_completo) FICHAS[normName(f.nombre_completo)] = f;
    });
  });
}
function normName(n) {
  var s = (n || "").toUpperCase().replace(/\s+/g, " ").trim();
  while (/\|\s*\d+\s*ML\s*$/i.test(s)) {
    s = s.replace(/\|\s*\d+\s*ML\s*$/i, "").trim();
  }
  return s;
}
function getFicha(p) { return FICHAS[normName(p.n)] || null; }
