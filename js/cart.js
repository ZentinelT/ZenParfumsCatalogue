var WA = "543515911990";

var cart = [];
try { cart = JSON.parse(localStorage.getItem("zp2") || "[]"); } catch(e) {}
cart = cart.map(function(i){ return {id:i.id, qty:i.qty}; });

/* ---- CART ---- */
function saveCart() {
  try { localStorage.setItem("zp2", JSON.stringify(cart)); } catch(e) {}
  renderCart();
}
function addCart(id) {
  var p = PRODS.find(function(x){ return x.id === id; });
  if (!p || p.st === "out") return;
  var it = cart.find(function(x){ return x.id === id; });
  if (it) { it.qty++; } else { cart.push({id:p.id,qty:1}); }
  saveCart();
  var nm = p.n.indexOf("-") > -1 ? p.n.split("-").slice(1).join("-").split("|")[0].trim() : p.n.split("|")[0].trim();
  notify(nm + " agregado al carrito");
}
function chgQty(id, d) {
  var it = cart.find(function(x){ return x.id === id; });
  if (!it) return;
  it.qty += d;
  if (it.qty <= 0) cart = cart.filter(function(x){ return x.id !== id; });
  saveCart();
}
function cartItems() {
  var out = [];
  var changed = false;
  cart.forEach(function(i){
    var p = PRODS.find(function(x){ return x.id === i.id; });
    if (!p) { changed = true; return; }
    out.push({id:p.id, qty:i.qty, b:p.b, n:p.n, s:p.s, i:p.i, p:p.p});
  });
  if (changed) { cart = out.map(function(o){ return {id:o.id, qty:o.qty}; }); try { localStorage.setItem("zp2", JSON.stringify(cart)); } catch(e) {} }
  return out;
}
function renderCart() {
  var items = cartItems();
  var cnt = items.reduce(function(s,i){ return s+i.qty; }, 0);
  var tot = items.reduce(function(s,i){ return s+i.p*i.qty; }, 0);
  var b = $("cbadge");
  b.textContent = cnt;
  b.style.display = cnt > 0 ? "flex" : "none";
  var bm = $("cbadgeMobile");
  if (bm) { bm.textContent = cnt; bm.style.display = cnt > 0 ? "flex" : "none"; }
  $("cdtv").textContent = fmt(tot);
  if (!items.length) {
    $("cde").style.display = "flex";
    $("cdItems").style.display = "none";
    $("cdf").style.display = "none";
  } else {
    $("cde").style.display = "none";
    $("cdItems").style.display = "block";
    $("cdf").style.display = "block";
    $("cdItems").innerHTML = items.map(function(i) {
      var nm = i.n.indexOf("-") > -1 ? i.n.split("-").slice(1).join("-").split("|")[0].trim() : i.n.split("|")[0].trim();
      return "<div class=\"cdi\">" +
        "<div class=\"cdi-ig\">" +
          (i.i ? "<img src=\"" + i.i + "\" referrerpolicy=\"no-referrer\" alt=\"\" loading=\"lazy\" onerror=\"this.style.display=&quot;none&quot;\">" : "") +
        "</div>" +
        "<div class=\"cdi-inf\">" +
          "<div class=\"cdi-b\">" + esc(i.b) + "</div>" +
          "<div class=\"cdi-n\">" + esc(nm) + "</div>" +
          "<div class=\"cdi-s\">" + esc(i.s) + "</div>" +
          "<div class=\"cdi-r\">" +
            "<button class=\"qb\" onclick=\"chgQty(" + i.id + ",-1)\">&#8722;</button>" +
            "<span class=\"qv\">" + i.qty + "</span>" +
            "<button class=\"qb\" onclick=\"chgQty(" + i.id + ",1)\">+</button>" +
          "</div>" +
        "</div>" +
        "<div class=\"cdi-p\">" + fmt(i.p * i.qty) + "</div>" +
      "</div>";
    }).join("");
  }
}
function checkoutWA() {
  var items = cartItems();
  if (!items.length) return;
  var lines = items.map(function(i) {
    var nm = i.n.indexOf("-") > -1 ? i.n.split("-").slice(1).join("-").split("|")[0].trim() : i.n.split("|")[0].trim();
    return "- " + i.b + " " + nm + " (" + i.s + ") x" + i.qty + " = " + fmt(i.p*i.qty);
  }).join("\n");
  var tot = items.reduce(function(s,i){ return s+i.p*i.qty; }, 0);
  var msg = "Hola! Quisiera hacer el siguiente pedido:\n\n" + lines + "\n\nTotal: " + fmt(tot) + "\n\n\xBFC\xF3mo procedo con el pago?";
  window.open("https://wa.me/" + WA + "?text=" + encodeURIComponent(msg), "_blank", "noopener");
}
function openCart()  { $("cartOv").classList.add("on"); $("cartD").classList.add("on"); document.body.style.overflow="hidden"; }
function closeCart() { $("cartOv").classList.remove("on"); $("cartD").classList.remove("on"); document.body.style.overflow=""; }
$("cartBtn").addEventListener("click", openCart);
$("cartBtnMobile").addEventListener("click", openCart);
