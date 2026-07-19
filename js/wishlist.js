var wish = [];
try { wish = JSON.parse(localStorage.getItem("zp-wish") || "[]"); } catch(e) {}


/* ---- WISHLIST ---- */
function isWished(id) { return wish.indexOf(id) > -1; }
function toggleWish(id) {
  var i = wish.indexOf(id);
  var added = i === -1;
  if (added) { wish.push(id); } else { wish.splice(i, 1); }
  try { localStorage.setItem("zp-wish", JSON.stringify(wish)); } catch(e) {}
  document.querySelectorAll('.pw[data-id="' + id + '"]').forEach(function(btn){
    btn.classList.toggle("on", added);
    if (btn.classList.contains("pc-seg-i")) {
      btn.classList.toggle("sel", added);
      var sv = btn.querySelector("svg");
      if (sv) sv.setAttribute("fill", added ? "currentColor" : "none");
    } else {
      btn.innerHTML = added ? "&#9829;" : "&#9825;";
    }
  });
  if (typeof renderWish === "function") renderWish();
  var p = PRODS.find(function(x){ return x.id === id; });
  if (p) {
    var nm = p.n.indexOf("-") > -1 ? p.n.split("-").slice(1).join("-").split("|")[0].trim() : p.n.split("|")[0].trim();
    notify(added ? (nm + " agregado a favoritos") : (nm + " quitado de favoritos"));
  }
}


/* ---- WISHLIST DRAWER ---- */
function renderWish() {
  var cnt = wish.length;
  var b = $("wbadge");
  if (b) { b.textContent = cnt; b.style.display = cnt > 0 ? "flex" : "none"; }
  var items = wish.map(function(id){ return PRODS.find(function(x){ return x.id === id; }); }).filter(Boolean);
  if (!items.length) {
    $("wde").style.display = "flex";
    $("wdItems").style.display = "none";
  } else {
    $("wde").style.display = "none";
    $("wdItems").style.display = "block";
    $("wdItems").innerHTML = items.map(function(p) {
      var nm = cleanName(p.n);
      var priceTxt = p.st === "out" ? "Sin stock" : (p.p > 0 ? fmt(p.p) : esc(p.p1));
      var dis = p.st === "out" ? " disabled" : "";
      return "<div class=\"cdi\">" +
        "<div class=\"cdi-ig\">" +
          (p.i ? "<img src=\"" + p.i + "\" referrerpolicy=\"no-referrer\" alt=\"\" loading=\"lazy\" onerror=\"this.style.display=&quot;none&quot;\">" : "") +
        "</div>" +
        "<div class=\"cdi-inf\">" +
          "<div class=\"cdi-b\">" + esc(p.b) + "</div>" +
          "<div class=\"cdi-n\">" + esc(nm) + "</div>" +
          "<div class=\"cdi-s\">" + esc(p.s) + "</div>" +
          "<div class=\"cdi-r\">" +
            "<button class=\"qb\" onclick=\"toggleWish(" + p.id + ")\" title=\"Quitar de favoritos\">&#10005;</button>" +
            "<button class=\"qb\" onclick=\"addCart(" + p.id + ")\"" + dis + " title=\"Agregar al carrito\"><svg width=\"12\" height=\"12\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z\"/><line x1=\"3\" y1=\"6\" x2=\"21\" y2=\"6\"/><path d=\"M16 10a4 4 0 0 1-8 0\"/></svg></button>" +
          "</div>" +
        "</div>" +
        "<div class=\"cdi-p\">" + priceTxt + "</div>" +
      "</div>";
    }).join("");
  }
}
function openWish()  { renderWish(); $("wishOv").classList.add("on"); $("wishD").classList.add("on"); document.body.style.overflow="hidden"; }
function closeWish() { $("wishOv").classList.remove("on"); $("wishD").classList.remove("on"); document.body.style.overflow=""; }
$("wishBtn").addEventListener("click", openWish);
