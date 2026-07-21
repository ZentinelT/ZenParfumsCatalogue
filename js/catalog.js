var PS = 48;
var cFil = "todos", cSrch = "", cPg = 1, cSort = "none";


/* ---- SEGMENTED CONTROL FEEDBACK ---- */
function flashSeg(el) {
  if (!el || el.classList.contains("sel")) return;
  el.classList.add("sel");
  setTimeout(function(){ el.classList.remove("sel"); }, 260);
}


/* ---- PRODUCTS ---- */
function esc(s) {
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
function noteLine(label, content) {
  return content ? '<div class="note-row"><span class="note-lbl">'+label+':</span> <span class="note-txt">'+esc(content)+'</span></div>' : '';
}
function parseNotes(nt) {
  if (!nt || nt === "\u2014") return null;
  var re = /(salida|coraz[oó]n|fondo)/gi;
  var idx = [], m;
  while ((m = re.exec(nt)) !== null) idx.push({kw:m[1].toLowerCase(), i:m.index});
  if (!idx.length) return null;
  var out = {salida:"", corazon:"", fondo:""};
  for (var i=0;i<idx.length;i++){
    var end = i+1<idx.length ? idx[i+1].i : nt.length;
    var chunk = nt.slice(idx[i].i, end);
    chunk = chunk.replace(/^(salida|coraz[oó]n|fondo)/i,'')
                 .replace(/^\s*de\s*/i,'')
                 .replace(/^[:\s·-]+/,'')
                 .replace(/\s*notas?\s+de\s*$/i,'')
                 .replace(/[·\s]+$/,'')
                 .trim();
    var key = idx[i].kw.indexOf('coraz')>-1 ? 'corazon' : (idx[i].kw==='fondo' ? 'fondo' : 'salida');
    if (chunk.length > out[key].length) out[key] = chunk;
  }
  return out;
}
function getType(n) {
  var parts = n.split("|").map(function(s){ return s.trim(); }).filter(Boolean);
  for (var i = parts.length - 1; i >= 0; i--) {
    var t = parts[i].toLowerCase();
    if (t === "edp") return "EDP";
    if (t === "edt") return "EDT";
    if (t === "elixir") return "Elixir";
    if (t === "parfum") return "Parfum";
    if (t === "extrait de parfum" || t === "extrait de parfum") return "Extrait de Parfum";
  }
  return null;
}
function cleanName(n) {
  var s = n.indexOf("-") > -1 ? n.split("-").slice(1).join("-") : n;
  s = s.indexOf("|") > -1 ? s.split("|")[0] : s;
  return s.trim();
}
function getList() {
  var l = PRODS.filter(function(p){ return p.c !== "accesorios"; });
  if (cFil === "hombre")       l = l.filter(function(p){ return p.g === "hombre"; });
  else if (cFil === "mujer")   l = l.filter(function(p){ return p.g === "mujer"; });
  else if (cFil === "unisex")  l = l.filter(function(p){ return p.g === "unisex"; });
  else if (cFil === "arabes")  l = l.filter(function(p){ return p.c === "arabes"; });
  else if (cFil === "internacional") l = l.filter(function(p){ return p.c === "internacional"; });
  else if (cFil.indexOf("marca:") === 0) { var brand = cFil.slice(6); l = l.filter(function(p){ return p.b === brand; }); }
  if (cSrch) {
    var q = cSrch;
    l = l.filter(function(p){ return (p.b+" "+p.n+" "+p.nt).toLowerCase().indexOf(q) > -1; });
  }
  if (cSort === "asc" || cSort === "desc") {
    l = l.slice().sort(function(a,b){
      var ap = a.p > 0 ? a.p : Infinity;
      var bp = b.p > 0 ? b.p : Infinity;
      if (ap === Infinity && bp === Infinity) return 0;
      if (ap === Infinity) return 1;
      if (bp === Infinity) return -1;
      return cSort === "asc" ? ap - bp : bp - ap;
    });
  }
  return l;
}
function renderProds() {
  var list  = getList();
  var tot   = list.length;
  var pages = Math.max(1, Math.ceil(tot / PS));
  if (cPg > pages) cPg = 1;
  var sl    = list.slice((cPg-1)*PS, cPg*PS);
  var start = (cPg-1)*PS + 1;

  $("pcount").textContent = tot > 0
    ? tot + " producto" + (tot !== 1 ? "s" : "") + " \u00B7 mostrando " + start + "\u2013" + Math.min(cPg*PS, tot)
    : "Sin resultados.";

  var svg = "<svg class=\"pc-svg\" width=\"44\" height=\"74\" viewBox=\"0 0 200 320\" fill=\"none\"><rect x=\"78\" y=\"10\" width=\"44\" height=\"22\" rx=\"5\" fill=\"#B8965A\" opacity=\".55\"/><path d=\"M58 72C58 42 142 42 142 72L150 280C150 296 50 296 50 280Z\" fill=\"none\" stroke=\"#B8965A\" stroke-width=\"2\" opacity=\".35\"/><path d=\"M64 76C64 52 136 52 136 76L144 278C144 290 56 290 56 278Z\" fill=\"rgba(184,150,90,.06)\"/><text x=\"100\" y=\"175\" text-anchor=\"middle\" font-family=\"serif\" font-size=\"12\" fill=\"#C9A96E\" opacity=\".6\" letter-spacing=\"3\">ZEN</text></svg>";

  $("pg").innerHTML = sl.map(function(p) {
    var sdot = p.st === "ok" ? "s-ok" : p.st === "low" ? "s-low" : "s-out";
    var stxt = p.st === "ok" ? "En stock" : p.st === "low" ? "&#218;ltimas unidades" : "Sin stock";
    var nm   = cleanName(p.n);
    var dis  = p.st === "out" ? " disabled" : "";
    var imgH = p.i
      ? "<img src=\"" + p.i + "\" referrerpolicy=\"no-referrer\" alt=\"" + esc(p.b) + "\" loading=\"lazy\" onerror=\"this.style.display=&quot;none&quot;\">"
      : "";
    var cardNotes = parseNotes(p.nt);
    var ntH = "";
    if (cardNotes) {
      ntH = "<div class=\"pc-nt note-box-sm\">" +
        (cardNotes.salida ? "<div class=\"note-row-sm\"><b>Salida:</b> " + esc(cardNotes.salida) + "</div>" : "") +
        (cardNotes.corazon ? "<div class=\"note-row-sm\"><b>Coraz\u00F3n:</b> " + esc(cardNotes.corazon) + "</div>" : "") +
        (cardNotes.fondo ? "<div class=\"note-row-sm\"><b>Fondo:</b> " + esc(cardNotes.fondo) + "</div>" : "") +
        "</div>";
    } else if (p.nt && p.nt !== "\u2014") {
      ntH = "<div class=\"pc-nt\">" + esc(p.nt) + "</div>";
    }
    var priceHtml = p.st === "out"
      ? "<div><span class=\"pc-pr\" style=\"font-size:13px;letter-spacing:.08em;color:var(--gr);font-weight:600\">SIN STOCK</span></div>"
      : "<div><span class=\"pc-pr\">" + (p.p > 0 ? fmt(p.p) : esc(p.p1)) + "</span></div>";
    var fichaBtn = getFicha(p)
      ? "<button class=\"pc-seg-i\" title=\"Ficha t\u00E9cnica\" onclick=\"event.stopPropagation();openFicha(" + p.id + ")\"><svg width=\"15\" height=\"15\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><circle cx=\"12\" cy=\"12\" r=\"10\"/><line x1=\"12\" y1=\"11\" x2=\"12\" y2=\"16\"/><circle cx=\"12\" cy=\"7.5\" r=\"0.6\" fill=\"currentColor\" stroke=\"none\"/></svg></button>"
      : "";
    return "<article class=\"pc\" onclick=\"openProduct(" + p.id + ")\" style=\"cursor:pointer\">" +
      "<div class=\"pc-img\">" + imgH + svg + "</div>" +
      "<div class=\"pc-bd\">" +
        "<div class=\"pc-br\">" + esc(p.b) + "</div>" +
        "<div class=\"pc-nm\">" + esc(nm) + "</div>" +
        "<div class=\"pc-badges\">" +
          (getType(p.n) ? "<span class=\"type-badge\">" + esc(getType(p.n)) + "</span>" : "") +
          (p.s ? "<span class=\"size-badge\">" + esc(p.s) + "</span>" : "") +
        "</div>" +
        ntH +
        "<div class=\"pc-stk\"><span class=\"sdot " + sdot + "\"></span><span class=\"stxt\">" + stxt + "</span></div>" +
        "<div class=\"pc-ft\">" +
          priceHtml +
          "<div class=\"pc-seg\" role=\"group\" aria-label=\"Acciones\">" +
            "<button class=\"pw pc-seg-i" + (isWished(p.id) ? " sel" : "") + "\" data-id=\"" + p.id + "\" title=\"Favoritos\" onclick=\"event.stopPropagation();toggleWish(" + p.id + ")\"><svg width=\"15\" height=\"15\" viewBox=\"0 0 24 24\" fill=\"" + (isWished(p.id) ? "currentColor" : "none") + "\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M12 21s-7-4.35-9.5-8.5C.5 8.5 2.5 5 6 5c2 0 3.5 1 6 3.5C14.5 6 16 5 18 5c3.5 0 5.5 3.5 3.5 7.5C19 16.65 12 21 12 21z\"/></svg></button>" +
            fichaBtn +
            "<button class=\"badd pc-seg-i\" onclick=\"event.stopPropagation();flashSeg(this);addCart(" + p.id + ")\"" + dis + " title=\"Agregar al carrito\">" +
              "<svg width=\"15\" height=\"15\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z\"/><line x1=\"3\" y1=\"6\" x2=\"21\" y2=\"6\"/><path d=\"M16 10a4 4 0 0 1-8 0\"/></svg>" +
            "</button>" +
          "</div>" +
        "</div>" +
      "</div>" +
    "</article>";
  }).join("");

  /* re-observe */
  $("pg").querySelectorAll(".pc").forEach(function(el){ revObs.observe(el); });

  /* pagination */
  var pag = $("pag");
  pag.innerHTML = "";
  if (pages > 1) {
    function mkBtn(lbl, pg, dis2) {
      var b = document.createElement("button");
      b.className = "pag-btn" + (pg === cPg ? " cur" : "");
      b.innerHTML = lbl;
      b.disabled = !!dis2;
      if (!dis2) b.onclick = function() { cPg = pg; renderProds(); $("catalogo").scrollIntoView({behavior:"smooth",block:"start"}); };
      return b;
    }
    function mkDots() { var s=document.createElement("span"); s.className="pag-dots"; s.textContent="\u2026"; return s; }
    if (cPg > 1) pag.appendChild(mkBtn("&#8249;", cPg-1));
    var shown = {};
    for (var i = 1; i <= pages; i++) {
      if (i === 1 || i === pages || Math.abs(i - cPg) <= 1) {
        pag.appendChild(mkBtn(String(i), i));
        shown[i] = true;
      } else if (Math.abs(i - cPg) === 2 && !shown[i]) {
        pag.appendChild(mkDots());
        shown[i] = true;
      }
    }
    if (cPg < pages) pag.appendChild(mkBtn("&#8250;", cPg+1));
  }
}

function openProduct(id) {
  var p = PRODS.find(function(x){ return x.id === id; });
  if (!p) return;
  var sdot = p.st === "ok" ? "s-ok" : p.st === "low" ? "s-low" : "s-out";
  var stxt = p.st === "ok" ? "En stock" : p.st === "low" ? "\u00DAltimas unidades" : "Sin stock";
  var nm   = cleanName(p.n);
  var dis  = p.st === "out" ? " disabled" : "";
  var imgH = p.i
    ? "<img src=\"" + p.i + "\" referrerpolicy=\"no-referrer\" alt=\"" + esc(p.b) + "\" onerror=\"this.style.display='none'\">"
    : "";
  var notesParsed = parseNotes(p.nt);
  var ntH = "";
  if (notesParsed) {
    ntH = "<div class=\"pm-nt-t\">Pir\u00E1mide olfativa</div><div class=\"pm-nt note-box\">" +
      noteLine("Notas de salida", notesParsed.salida) +
      noteLine("Notas de coraz\u00F3n", notesParsed.corazon) +
      noteLine("Notas de fondo", notesParsed.fondo) +
      "</div>";
  } else if (p.nt && p.nt !== "\u2014") {
    ntH = "<div class=\"pm-nt-t\">Pir\u00E1mide olfativa</div><div class=\"pm-nt\">" + esc(p.nt) + "</div>";
  }
  var priceHtml = p.st === "out"
    ? "<span class=\"pm-pr\" style=\"font-size:15px;letter-spacing:.06em;color:var(--gr)\">SIN STOCK</span>"
    : "<span class=\"pm-pr\">" + (p.p > 0 ? fmt(p.p) : esc(p.p1)) + "</span>";

  $("pmBox").innerHTML =
    "<button class=\"pm-cl\" onclick=\"closeProduct()\"><svg width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\"><path d=\"M18 6 6 18M6 6l12 12\"/></svg></button>" +
    "<div class=\"pm-img\">" + imgH + "<button class=\"pw" + (isWished(p.id) ? " on" : "") + "\" data-id=\"" + p.id + "\" style=\"opacity:1\" onclick=\"toggleWish(" + p.id + ")\">" + (isWished(p.id) ? "&#9829;" : "&#9825;") + "</button></div>" +
    "<div class=\"pm-bd\">" +
      "<div class=\"pm-br\">" + esc(p.b) + "</div>" +
      "<div class=\"pm-nm\">" + esc(nm) + "</div>" +
      "<div class=\"pm-badges\">" +
        (getType(p.n) ? "<span class=\"type-badge\">" + esc(getType(p.n)) + "</span>" : "") +
        (p.s ? "<span class=\"size-badge\">" + esc(p.s) + "</span>" : "") +
        (getFicha(p) ? "<button class=\"pm-ficha-ico\" title=\"Ficha t\u00E9cnica\" aria-label=\"Ficha t\u00E9cnica\" onclick=\"openFicha(" + p.id + ")\"><svg width=\"15\" height=\"15\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><circle cx=\"12\" cy=\"12\" r=\"10\"/><line x1=\"12\" y1=\"11\" x2=\"12\" y2=\"16\"/><circle cx=\"12\" cy=\"7.5\" r=\"0.6\" fill=\"currentColor\" stroke=\"none\"/></svg></button>" : "") +
        "<button class=\"pw pm-wish-badges" + (isWished(p.id) ? " on" : "") + "\" data-id=\"" + p.id + "\" title=\"Favoritos\" onclick=\"toggleWish(" + p.id + ")\"><svg width=\"15\" height=\"15\" viewBox=\"0 0 24 24\" fill=\"" + (isWished(p.id) ? "currentColor" : "none") + "\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M12 21s-7-4.35-9.5-8.5C.5 8.5 2.5 5 6 5c2 0 3.5 1 6 3.5C14.5 6 16 5 18 5c3.5 0 5.5 3.5 3.5 7.5C19 16.65 12 21 12 21z\"/></svg></button>" +
      "</div>" +
      "<div class=\"pm-stk\"><span class=\"sdot " + sdot + "\"></span><span class=\"stxt\">" + stxt + "</span></div>" +
      ntH +
      "<div class=\"pm-ft\">" +
        priceHtml +
        "<button class=\"pm-add\" onclick=\"addCart(" + p.id + ")\"" + dis + ">" +
          "<svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z\"/><line x1=\"3\" y1=\"6\" x2=\"21\" y2=\"6\"/><path d=\"M16 10a4 4 0 0 1-8 0\"/></svg>Agregar" +
        "</button>" +
      "</div>" +
    "</div>";

  $("pmOv").classList.add("on");
  document.body.style.overflow = "hidden";
}
function closeProduct() {
  $("pmOv").classList.remove("on");
  document.body.style.overflow = "";
}

function frow(label, value) {
  if (!value) return "";
  return "<div class=\"fc-row\"><div class=\"fc-lb\">" + esc(label) + "</div><div class=\"fc-vl\">" + esc(value) + "</div></div>";
}
function openFicha(id) {
  var p = PRODS.find(function(x){ return x.id === id; });
  if (!p) return;
  var f = getFicha(p);
  if (!f) return;
  var nm = cleanName(p.n);
  var insp = "";
  if (f.inspiraciones && f.inspiraciones.length) {
    insp = f.inspiraciones.map(function(i){
      return "<div class=\"fc-insp\">" +
        (i.imagen_url ? "<img src=\"" + i.imagen_url + "\" referrerpolicy=\"no-referrer\" alt=\"\">" : "") +
        "<div><div class=\"fc-insp-nm\">" + esc(i.nombre || "") + "</div>" +
        (i.texto ? "<div class=\"fc-insp-tx\">" + esc(i.texto) + "</div>" : "") + "</div>" +
      "</div>";
    }).join("");
  } else if (f.inspirado_en_nombre) {
    insp = "<div class=\"fc-insp\">" +
      (f.inspirado_en_imagen_url ? "<img src=\"" + f.inspirado_en_imagen_url + "\" referrerpolicy=\"no-referrer\" alt=\"\">" : "") +
      "<div><div class=\"fc-insp-nm\">" + esc(f.inspirado_en_nombre) + "</div>" +
      (f.inspirado_en ? "<div class=\"fc-insp-tx\">" + esc(f.inspirado_en) + "</div>" : "") + "</div>" +
    "</div>";
  }
  var notas = "";
  if (f.notas_salida || f.notas_corazon || f.notas_fondo) {
    notas = "<div class=\"fc-nt-t\">Pir\u00E1mide olfativa</div><div class=\"fc-notes note-box\">" +
      noteLine("Notas de salida", f.notas_salida) +
      noteLine("Notas de coraz\u00F3n", f.notas_corazon) +
      noteLine("Notas de fondo", f.notas_fondo) +
    "</div>";
  }
  var rango = (f.rango_edad_min && f.rango_edad_max) ? (f.rango_edad_min + "\u2013" + f.rango_edad_max + " a\u00F1os") : "";
  $("fmBox").innerHTML =
    "<button class=\"pm-cl\" onclick=\"closeFicha()\"><svg width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\"><path d=\"M18 6 6 18M6 6l12 12\"/></svg></button>" +
    "<div class=\"fc-bd\">" +
      "<div class=\"pm-br\">" + esc(f.marca || p.b) + "</div>" +
      "<div class=\"pm-nm\">" + esc(nm) + "</div>" +
      "<div class=\"pm-badges\">" +
        (f.genero ? "<span class=\"type-badge\">" + esc(f.genero) + "</span>" : "") +
        (f.concentracion ? "<span class=\"size-badge\">" + esc(f.concentracion) + "</span>" : "") +
      "</div>" +
      insp +
      (f.descripcion ? "<div class=\"fc-nt-t\">Descripci\u00F3n</div><div class=\"fc-desc\">" + esc(f.descripcion) + "</div>" : "") +
      notas +
      (f.estilo_descripcion ? "<div class=\"fc-nt-t\">Perfil / estilo</div><div class=\"fc-desc\">" + esc(f.estilo_descripcion) + "</div>" : "") +
      "<div class=\"fc-nt-t\">Datos t\u00E9cnicos</div>" +
      "<div class=\"fc-grid\">" +
        frow("Familia olfativa", f.familia_olfativa) +
        frow("Momento del d\u00EDa", f.momento_dia) +
        frow("Estaci\u00F3n", f.estacion) +
        frow("Ocasi\u00F3n", f.ocasion) +
        frow("Clima", f.clima) +
        frow("Proyecci\u00F3n", f.proyeccion) +
        frow("Duraci\u00F3n", f.duracion) +
        frow("Estela", f.estela) +
        frow("Color del l\u00EDquido", f.color_liquido) +
        frow("Rango de edad sugerido", rango) +
      "</div>" +
    "</div>";
  $("fmOv").classList.add("on");
  document.body.style.overflow = "hidden";
}
function closeFicha() {
  $("fmOv").classList.remove("on");
  document.body.style.overflow = "";
}

function setSort(v) {
  if (v === "precio-asc") { cSort = "asc"; cFil = "todos"; }
  else if (v === "precio-desc") { cSort = "desc"; cFil = "todos"; }
  else { cSort = "none"; cFil = v; }
  cPg = 1; cSrch = "";
  var si = $("srch"); if (si) si.value = "";
  var sel = $("sortSel"); if (sel) sel.value = v;
  renderProds();
  if (v !== "todos") setTimeout(function(){ $("catalogo").scrollIntoView({behavior:"smooth",block:"start"}); }, 80);
}
function filterBy(cat) { setSort(cat); }
function populateBrandOptions() {
  var grp = $("brandGroup");
  if (!grp) return;
  var brands = PRODS
    .filter(function(p){ return p.c !== "accesorios"; })
    .map(function(p){ return p.b; })
    .filter(function(b, i, arr){ return b && arr.indexOf(b) === i; })
    .sort();
  grp.innerHTML = brands.map(function(b){
    return "<option value=\"marca:" + esc(b) + "\">" + esc(b) + "</option>";
  }).join("");
}
function onSearch(v) { cSrch = v.toLowerCase().trim(); cPg = 1; renderProds(); }
