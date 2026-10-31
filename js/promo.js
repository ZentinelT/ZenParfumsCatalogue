/* ============================================================
   CYBER MONDAY — CONFIGURACIÓN CENTRAL DE LA CAMPAÑA
   ------------------------------------------------------------
   Único interruptor de toda la promo. Para terminar la campaña
   y devolver el sitio a su estado habitual, cambiar
   CYBER_MONDAY_MODE a false (abajo) y nada más: portada,
   catálogo, búsqueda, fichas y carrito vuelven automáticamente
   a los precios y la vista normales. No se tocan los precios
   originales guardados en data/products.json ni en las fichas
   estáticas de /perfume/.
   ============================================================ */
var CYBER_MONDAY_MODE = true;
var CYBER_MONDAY_DISCOUNT = 0.20;
var CYBER_MONDAY_LABEL = "-20% CYBER MONDAY";

function cmFmt(n) { return "$" + Math.round(n).toLocaleString("es-AR"); }
function cmPrice(orig) { return Math.round(orig * (1 - CYBER_MONDAY_DISCOUNT)); }
function cmEffPrice(orig) { return CYBER_MONDAY_MODE ? cmPrice(orig) : orig; }

/* HTML de precio con tachado + oferta. fmtFn = función de formato (fmt de
   data.js); cls = clase del precio nuevo, para que herede el estilo normal. */
function cmPriceHTML(orig, fmtFn, cls) {
  cls = cls || "pc-pr";
  if (!CYBER_MONDAY_MODE) return "<span class=\"" + cls + "\">" + fmtFn(orig) + "</span>";
  return "<span class=\"cm-wrap\">" +
    "<span class=\"cm-old\">" + fmtFn(orig) + "</span>" +
    "<span class=\"" + cls + " cm-new\">" + fmtFn(cmPrice(orig)) + "</span>" +
    "<span class=\"cm-badge\">" + CYBER_MONDAY_LABEL + "</span>" +
  "</span>";
}

document.addEventListener("DOMContentLoaded", function () {
  /* Portada: banner de Cyber Monday (oculto por defecto en el HTML) */
  var b = document.getElementById("cmBanner");
  if (b) b.hidden = !CYBER_MONDAY_MODE;

  /* Fichas estáticas de /perfume/*: reescriben su precio a partir de
     data-pcm (precio original, intacto en el HTML) sin perder ese valor,
     así que esto es seguro de ejecutar en cada carga y nunca duplica
     el descuento. */
  if (CYBER_MONDAY_MODE) {
    var els = document.querySelectorAll("[data-pcm]");
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      var orig = Number(el.getAttribute("data-pcm"));
      if (!orig) continue;
      el.innerHTML = "<span class=\"cm-wrap\">" +
        "<span class=\"cm-old\">" + cmFmt(orig) + "</span>" +
        "<span class=\"cm-new\">" + cmFmt(cmPrice(orig)) + "</span>" +
        "<span class=\"cm-badge\">" + CYBER_MONDAY_LABEL + "</span>" +
      "</span>";
    }
  }
});
