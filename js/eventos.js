/* ---- ESTADÍSTICAS DE USO (GoatCounter, eventos) ----
   Registra qué notas, marcas, precios, filtros y búsquedas usa la gente.
   Se ven en zenparfums.goatcounter.com como "eventos" (no cuentan como visitas). */
(function () {
  function ev(path, title) {
    try {
      if (window.goatcounter && typeof window.goatcounter.count === "function") {
        window.goatcounter.count({ path: path, title: title || path, event: true });
      }
    } catch (e) {}
  }
  function wrap(name, after) {
    var f = window[name];
    if (typeof f !== "function") return;
    window[name] = function () {
      var r = f.apply(this, arguments);
      try { after.apply(this, arguments); } catch (e) {}
      return r;
    };
  }

  // Notas elegidas en "Buscar por notas"
  wrap("toggleNote", function (n) {
    if (typeof cSelectedNotes === "object" && cSelectedNotes[n]) ev("nota: " + n, "Nota elegida");
  });
  // Abrir el buscador por notas
  wrap("toggleNotesMode", function () {
    if (typeof cNotesMode !== "undefined" && cNotesMode) ev("abrir: buscador de notas", "Abrió buscador por notas");
  });
  // Marca (carrusel) y Ordenar por
  wrap("setSort", function (v) {
    if (!v || v === "todos") return;
    if (String(v).indexOf("marca:") === 0) ev("marca: " + v.slice(6), "Marca elegida");
    else ev("ordenar: " + v, "Ordenar por");
  });
  // Rango de precio
  wrap("setPrecio", function (v) { if (v) ev("precio: " + v, "Rango de precio"); });
  // Solo en stock
  wrap("toggleOnlyStock", function (on) { if (on) ev("filtro: solo en stock", "Solo en stock"); });

  // Búsquedas: se registra el término cuando la persona deja de escribir
  var tBus = 0, ultima = "";
  wrap("onSearch", function (v) {
    clearTimeout(tBus);
    var q = String(v || "").toLowerCase().trim().replace(/\s+/g, " ");
    if (q.length < 3) return;
    tBus = setTimeout(function () {
      if (q === ultima) return;
      ultima = q;
      ev("busqueda: " + q.slice(0, 60), "Búsqueda");
    }, 1500);
  });
})();
