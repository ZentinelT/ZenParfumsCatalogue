
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
    renderProds();
    renderCart();
    renderWish();
    document.querySelectorAll(".rev").forEach(function(el){ revObs.observe(el); });
  });
});
