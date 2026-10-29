/* ---- OWNER CAPTURE MODE (press "f" outside any text field) ---- */
(function () {
  var H2C_URL = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
  var h2cPromise = null;
  function loadHtml2Canvas() {
    if (window.html2canvas) return Promise.resolve();
    if (h2cPromise) return h2cPromise;
    h2cPromise = new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = H2C_URL;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
    return h2cPromise;
  }

  var active = false;
  var overlay, srcCanvas, drawCanvas, dctx, hint;
  var drawing = false;
  var path = [];
  var captureScale = 1;

  function isTyping(el) {
    if (!el) return false;
    var tag = el.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
  }

  document.addEventListener("keydown", function (e) {
    if (active) {
      if (e.key === "Escape") exitCapture();
      return;
    }
    if (e.key && e.key.toLowerCase() === "f" && !e.ctrlKey && !e.metaKey && !e.altKey && !e.repeat && !isTyping(document.activeElement)) {
      startCapture();
    }
  });

  function startCapture() {
    active = true;
    loadHtml2Canvas().then(shoot).catch(function () {
      active = false;
      alert("No se pudo cargar la herramienta de captura. Revisá tu conexión.");
    });
  }

  function shoot() {
    captureScale = Math.min(window.devicePixelRatio || 1, 2) * 1.5;
    window.html2canvas(document.body, {
      x: window.scrollX,
      y: window.scrollY,
      width: window.innerWidth,
      height: window.innerHeight,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      scale: captureScale,
      useCORS: true,
      backgroundColor: null
    }).then(buildOverlay).catch(function (err) {
      active = false;
      console.error(err);
      alert("No se pudo generar la captura.");
    });
  }

  function buildOverlay(canvas) {
    srcCanvas = canvas;

    overlay = document.createElement("div");
    overlay.style.cssText = "position:fixed;inset:0;z-index:99999;background:#000;cursor:crosshair;user-select:none;";

    var img = document.createElement("img");
    img.src = canvas.toDataURL();
    img.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;";
    overlay.appendChild(img);

    drawCanvas = document.createElement("canvas");
    drawCanvas.width = window.innerWidth;
    drawCanvas.height = window.innerHeight;
    drawCanvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;";
    overlay.appendChild(drawCanvas);
    dctx = drawCanvas.getContext("2d");

    hint = document.createElement("div");
    hint.textContent = "Dibujá el contorno de lo que querés capturar · Esc para cancelar";
    hint.style.cssText = "position:absolute;top:18px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,.72);color:#fff;font:500 13px/1.4 -apple-system,sans-serif;padding:9px 18px;border-radius:100px;pointer-events:none;white-space:nowrap;";
    overlay.appendChild(hint);

    document.body.appendChild(overlay);

    drawCanvas.addEventListener("pointerdown", onDown);
    drawCanvas.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  function onDown(e) {
    drawing = true;
    path = [[e.clientX, e.clientY]];
  }
  function onMove(e) {
    if (!drawing) return;
    path.push([e.clientX, e.clientY]);
    dctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    dctx.beginPath();
    dctx.moveTo(path[0][0], path[0][1]);
    for (var i = 1; i < path.length; i++) dctx.lineTo(path[i][0], path[i][1]);
    dctx.strokeStyle = "#c9a35a";
    dctx.lineWidth = 2.5;
    dctx.setLineDash([6, 5]);
    dctx.stroke();
  }
  function onUp() {
    if (!drawing) return;
    drawing = false;
    if (path.length < 3) { path = []; dctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height); return; }
    exportSelection();
  }

  function exportSelection() {
    var xs = path.map(function (p) { return p[0]; });
    var ys = path.map(function (p) { return p[1]; });
    var minX = Math.max(0, Math.min.apply(null, xs));
    var minY = Math.max(0, Math.min.apply(null, ys));
    var maxX = Math.min(window.innerWidth, Math.max.apply(null, xs));
    var maxY = Math.min(window.innerHeight, Math.max.apply(null, ys));
    var w = maxX - minX, h = maxY - minY;
    if (w < 8 || h < 8) { exitCapture(); return; }

    var s = captureScale;
    var out = document.createElement("canvas");
    out.width = Math.round(w * s);
    out.height = Math.round(h * s);
    var octx = out.getContext("2d");

    var bg = getComputedStyle(document.body).getPropertyValue("--w").trim() || "#ffffff";
    octx.fillStyle = bg;
    octx.fillRect(0, 0, out.width, out.height);

    octx.save();
    octx.beginPath();
    octx.moveTo((path[0][0] - minX) * s, (path[0][1] - minY) * s);
    for (var i = 1; i < path.length; i++) octx.lineTo((path[i][0] - minX) * s, (path[i][1] - minY) * s);
    octx.closePath();
    octx.clip();
    octx.drawImage(srcCanvas, minX * s, minY * s, w * s, h * s, 0, 0, w * s, h * s);
    octx.restore();

    out.toBlob(function (blob) {
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      var ts = new Date().toISOString().replace(/[:.]/g, "-");
      a.href = url;
      a.download = "zenparfums-captura-" + ts + ".jpg";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
    }, "image/jpeg", 0.95);

    exitCapture();
  }

  function exitCapture() {
    active = false;
    drawing = false;
    path = [];
    if (overlay) { overlay.remove(); overlay = null; }
    window.removeEventListener("pointerup", onUp);
  }
})();
