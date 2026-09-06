function $(id) { return document.getElementById(id); }
function fmt(n) { return "$" + Number(n).toLocaleString("es-AR"); }
// El margen ya viene aplicado desde Python (calcular_precio). No se vuelve a sumar acá.
var PRODS = [];
var FICHAS = {};
var NOVEDADES = { nuevos: [], restock: [] };

function loadCatalogData() {
  return Promise.all([
    fetch("data/products.json").then(function(r){ return r.json(); }),
    fetch("data/fichas.json").then(function(r){ return r.json(); }),
    fetch("data/novedades.json")
      .then(function(r){ return r.ok ? r.json() : { nuevos: [], restock: [] }; })
      .catch(function(){ return { nuevos: [], restock: [] }; })
  ]).then(function(results){
    PRODS = results[0];
    var raw = results[1] || [];
    raw.forEach(function(f){
      if (f && f.nombre_completo) FICHAS[normName(f.nombre_completo)] = f;
    });
    var nov = results[2] || {};
    NOVEDADES = {
      nuevos: Array.isArray(nov.nuevos) ? nov.nuevos : [],
      restock: Array.isArray(nov.restock) ? nov.restock : []
    };
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

// --- Perfumes similares (notas + familia olfativa + "inspirado en") ---
function simNorm(s) {
  return (s || "").toString().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
}
function simNoteTokens(f, key) {
  var v = f[key];
  if (!v) return [];
  return v.split(",").map(function(x){ return simNorm(x); }).filter(Boolean);
}
function simAllNotes(f) {
  return simNoteTokens(f,"notas_salida").concat(simNoteTokens(f,"notas_corazon")).concat(simNoteTokens(f,"notas_fondo"));
}
function simInspiredKeys(f) {
  var GENERIC = { "composicion propia": true, "sin inspiracion": true, "original": true };
  var keys = [];
  function add(n) {
    var k = simNorm(n);
    if (k && !GENERIC[k]) keys.push(k);
  }
  if (Array.isArray(f.inspiraciones) && f.inspiraciones.length) {
    f.inspiraciones.forEach(function(i){ if (i && i.nombre) add(i.nombre); });
  } else if (f.inspirado_en_nombre) {
    add(f.inspirado_en_nombre);
  }
  return keys;
}

var FAMILY_STOPWORDS = { "de":true, "y":true, "con":true, "notas":true, "nota":true };
function simFamilyTokens(f) {
  var v = simNorm(f.familia_olfativa);
  if (!v) return [];
  return v.split(/[^a-z0-9]+/).filter(function(w){ return w.length > 2 && !FAMILY_STOPWORDS[w]; });
}

var SIM_W_INSPIRED = 12;
var SIM_W_FAMILY_WORD = 2; // por cada palabra en comun en familia olfativa (ej. "amaderada", "especiada")
var SIM_W_CORAZON_EXTRA = 1; // notas de corazon valen 1 (base) + 1 extra = 2

function simIsKids(p) {
  return /\bkids\b/i.test(p.n);
}

function getSimilarPerfumes(p, limit) {
  limit = limit || 8;
  var f0 = getFicha(p);
  if (!f0) return [];
  var kids0 = simIsKids(p);

  var notes0 = simAllNotes(f0);
  var corazon0 = simNoteTokens(f0, "notas_corazon");
  var family0 = simFamilyTokens(f0);
  var inspired0 = simInspiredKeys(f0);

  var out = [];
  PRODS.forEach(function(cand) {
    if (cand.id === p.id) return;
    if (simIsKids(cand) !== kids0) return; // no mezclar linea infantil con perfumes de adultos
    var f1 = getFicha(cand);
    if (!f1) return;

    var notes1 = simAllNotes(f1);
    var corazon1 = simNoteTokens(f1, "notas_corazon");
    var family1 = simFamilyTokens(f1);
    var inspired1 = simInspiredKeys(f1);

    var sharedNotesSet = {};
    notes0.forEach(function(n){ if (notes1.indexOf(n) > -1) sharedNotesSet[n] = true; });
    var sharedNotes = Object.keys(sharedNotesSet);

    var sharedFamily = family0.filter(function(w){ return family1.indexOf(w) > -1; });
    var sharedInspired = inspired0.filter(function(k){ return inspired1.indexOf(k) > -1; });

    if (!sharedNotes.length && !sharedFamily.length && !sharedInspired.length) {
      return; // sin ninguna señal de similitud, no entra al ranking
    }

    var sharedCorazon = corazon0.filter(function(n){ return corazon1.indexOf(n) > -1; });

    var score = sharedNotes.length + sharedCorazon.length * SIM_W_CORAZON_EXTRA;
    score += sharedFamily.length * SIM_W_FAMILY_WORD;
    if (sharedInspired.length) score += SIM_W_INSPIRED;

    if (score <= 0) return;

    out.push({
      product: cand,
      ficha: f1,
      score: score,
      sharedNotes: sharedNotes,
      sameFamily: sharedFamily.length > 0,
      sharedFamilyWords: sharedFamily,
      sharedInspired: sharedInspired
    });
  });

  out.sort(function(a,b){ return b.score - a.score; });
  return out.slice(0, limit);
}
