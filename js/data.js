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

// --- Línea infantil (TUBBEES + Lattafa Kids): categoría propia, fuera del buscador por notas ---
function isKids(p) {
  if (!p) return false;
  if (p.b === "TUBBEES") return true;
  if (p.b === "LATTAFA" && /\bkids\b/i.test(p.n)) return true;
  return false;
}
// --- Body splash / body lotion: categoría propia, fuera del buscador por notas ---
function isBodyCare(p) {
  if (!p) return false;
  return /\bbody\s*(splash|lotion|mist)\b|\bmist\s*body\b/i.test(p.n || "");
}

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

var FAMILY_STOPWORDS = {
  "de":true, "y":true, "con":true, "notas":true, "nota":true,
  "moderno":true, "moderna":true, "azul":true, "energetico":true,
  "clasico":true, "clasica":true, "elegante":true, "sofisticado":true,
  "dna":true, "edition":true, "elixir":true, "intense":true
};
function simFamilyTokens(f) {
  var v = simNorm(f.familia_olfativa);
  if (!v) return [];
  return v.split(/[^a-z0-9]+/).filter(function(w){ return w.length > 2 && !FAMILY_STOPWORDS[w]; });
}

var SIM_W_INSPIRED = 12;
var SIM_W_FAMILY_WORD = 2; // por cada palabra en comun en familia olfativa (ej. "amaderada", "especiada")
var SIM_W_CORAZON_EXTRA = 1; // notas de corazon valen 1 (base) + 1 extra = 2

function simSegment(p) {
  if (isKids(p)) return "kids";
  if (isBodyCare(p)) return "bodycare";
  return "perfume";
}

function getSimilarPerfumes(p, limit) {
  limit = limit || 8;
  var f0 = getFicha(p);
  if (!f0) return [];
  var seg0 = simSegment(p);

  var notes0 = simAllNotes(f0);
  var corazon0 = simNoteTokens(f0, "notas_corazon");
  var family0 = simFamilyTokens(f0);
  var inspired0 = simInspiredKeys(f0);

  var out = [];
  PRODS.forEach(function(cand) {
    if (cand.id === p.id) return;
    if (simSegment(cand) !== seg0) return; // no mezclar linea infantil / body care con perfumes
    var f1 = getFicha(cand);
    if (!f1) return;

    var notes1 = simAllNotes(f1);
    var corazon1 = simNoteTokens(f1, "notas_corazon");
    var family1 = simFamilyTokens(f1);
    var inspired1 = simInspiredKeys(f1);

    var sharedNotesSet = {};
    notes0.forEach(function(n){ if (notes1.indexOf(n) > -1) sharedNotesSet[n] = true; });
    var sharedNotes = Object.keys(sharedNotesSet);

    var sharedFamilyRaw = family0.filter(function(w){ return family1.indexOf(w) > -1; });
    // una sola palabra de familia en común es demasiado débil como señal por sí sola
    // (ej. "floral" solo, o una palabra que ni siquiera describe aroma) -> exigimos 2+
    var familyMatches = sharedFamilyRaw.length >= 2;
    var sharedInspired = inspired0.filter(function(k){ return inspired1.indexOf(k) > -1; });

    if (!sharedNotes.length && !familyMatches && !sharedInspired.length) {
      return; // sin ninguna señal de similitud real, no entra al ranking
    }

    var sharedCorazon = corazon0.filter(function(n){ return corazon1.indexOf(n) > -1; });

    var score = sharedNotes.length + sharedCorazon.length * SIM_W_CORAZON_EXTRA;
    if (familyMatches) score += sharedFamilyRaw.length * SIM_W_FAMILY_WORD;
    if (sharedInspired.length) score += SIM_W_INSPIRED;

    if (score <= 0) return;

    out.push({
      product: cand,
      ficha: f1,
      score: score,
      sharedNotes: sharedNotes,
      sameFamily: familyMatches,
      sharedFamilyWords: familyMatches ? sharedFamilyRaw : [],
      sharedInspired: sharedInspired
    });
  });

  out.sort(function(a,b){ return b.score - a.score; });
  return out.slice(0, limit);
}

// --- Buscador por notas (mismo motor de arriba, sin perfume ancla) ---
var NOTE_GROUPS = [
  { label: "Dulces & Gourmand", notes: ["vainilla","canela","cardamomo"] },
  { label: "Amaderadas", notes: ["sandalo","cedro","oud"] },
  { label: "Orientales & Especiadas", notes: ["ambar","pachuli","pimienta rosa","almizcle"] },
  { label: "Cítricas & Frescas", notes: ["bergamota","limon"] },
  { label: "Florales", notes: ["jazmin","rosa","lavanda"] },
  { label: "Cuero & Animal", notes: ["cuero"] }
];

function getProductsByNotes(notesArr) {
  if (!notesArr || !notesArr.length) return [];
  var out = [];
  PRODS.forEach(function(p){
    if (p.c === "accesorios" || isKids(p) || isBodyCare(p)) return;
    var f = getFicha(p);
    if (!f) return;
    var notes = simAllNotes(f);
    var cz = simNoteTokens(f, "notas_corazon");
    var matched = notesArr.filter(function(n){ return notes.indexOf(n) > -1; });
    if (!matched.length) return;
    var score = matched.length + matched.filter(function(n){ return cz.indexOf(n) > -1; }).length;
    out.push({ product: p, score: score, matched: matched });
  });
  out.sort(function(a,b){ return b.score - a.score; });
  return out;
}
