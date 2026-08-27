
/* ---- SCROLL REVEAL ---- */
var revObs = new IntersectionObserver(function(es) {
  es.forEach(function(e) { if (e.isIntersecting) { e.target.classList.add("on"); revObs.unobserve(e.target); } });
}, { threshold: 0.08, rootMargin: "0px 0px -30px 0px" });

/* ---- STICKY ---- */


/* ---- NOTIFY ---- */
var nTimer;
function notify(txt) {
  $("ntxt").textContent = txt;
  var n = $("notif");
  n.classList.add("on");
  clearTimeout(nTimer);
  nTimer = setTimeout(function(){ n.classList.remove("on"); }, 3000);
}

/* ---- INIT ---- */
document.addEventListener("DOMContentLoaded", function() {
  loadCatalogData().then(function() {
    populateBrandOptions();
    /* Sincronizar checkbox del filtro "Solo en stock" con estado persistido */
    var stockChk = document.getElementById("stockToggle");
    if (stockChk) stockChk.checked = cOnlyStock;
    renderProds();
    renderCart();
    renderWish();
    document.querySelectorAll(".rev").forEach(function(el){ revObs.observe(el); });

    /* Deep-link: /?product=ID abre el modal del producto */
    try {
      var params = new URLSearchParams(window.location.search);
      var pid = params.get("product");
      if (pid && typeof openProduct === "function") {
        var id = parseInt(pid, 10);
        if (!isNaN(id)) {
          setTimeout(function(){
            var cat = document.getElementById("catalogo");
            if (cat) cat.scrollIntoView({behavior:"smooth", block:"start"});
            openProduct(id);
          }, 200);
        }
      }
    } catch(e) {}
  });
});
