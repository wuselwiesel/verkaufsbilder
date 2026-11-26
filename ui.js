/* Bedienung: Serie, Fotos, Stile, Aufkleber, Rückgängig, Speichern */
(function (VB) {
  "use strict";
  var s = VB.s, R = VB.render, W = VB.W;
  var KEY = "verkaufsbilder-v3", toastT;

  function $(id) { return document.getElementById(id); }
  var cv = $("cv"), g = cv.getContext("2d");
  function it() { return VB.item(); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function toast(t) {
    var el = $("toast"); el.textContent = t; el.hidden = false;
    clearTimeout(toastT); toastT = setTimeout(function () { el.hidden = true; }, 3200);
  }
  function mkBtn(parent, label, pressed, onclick, cls) {
    var b = document.createElement("button"); b.type = "button"; b.textContent = label;
    if (cls) b.className = cls;
    if (pressed != null) b.setAttribute("aria-pressed", String(pressed));
    b.onclick = onclick; parent.appendChild(b); return b;
  }
  function slug(t) {
    return t.trim().toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "verkaufsbild";
  }
  var HEX = /^#[0-9a-f]{6}$/i;

  /* Zeichnen */
  var pending = false;
  function render() {
    if (pending) return; pending = true;
    requestAnimationFrame(function () { pending = false; R.draw(g); });
  }
  function setSize() {
    var H = VB.H(); cv.width = W; cv.height = H;
    cv.style.width = "min(100%, " + (82 * W / H).toFixed(2) + "vh)"; cv.style.aspectRatio = W + " / " + H;
  }

  /* Zustand sichern: Speicher im Browser (ohne Fotos) und Verlauf für Rückgängig (mit Fotos) */
  function pser(p) { return p ? { id: p.id, zoom: p.zoom, px: p.px, py: p.py, fit: !!p.fit, adj: { b: p.adj.b, c: p.adj.c, s: p.adj.s } } : null; }
  function iser(x, withPhotos) {
    return {
      article: x.article, byType: x.byType, texts: x.texts, collage: x.collage,
      stickers: x.stickers.map(function (k) { return { kind: k.kind, text: k.text, auto: k.auto, color: k.color, x: k.x, y: k.y, size: k.size, rot: k.rot }; }),
      photos: withPhotos ? x.photos.map(pser) : [null, null, null, null], extras: withPhotos ? x.extras.map(pser) : []
    };
  }
  function snapshot(withPhotos) {
    return JSON.stringify({
      look: { format: s.format, style: s.style, font: s.font, col: s.col, t: s.t, g: s.g, radius: s.radius, bg: s.bg, shop: s.shop },
      singles: s.singles, hires: s.hires, items: s.items.map(function (x) { return iser(x, withPhotos); })
    });
  }
  function pdes(po) {
    if (!po || typeof po.id !== "number") return null;
    var p = R.reg[po.id]; if (!p) return null;
    p.zoom = clamp(+po.zoom || 1, 1, 3); p.px = clamp(+po.px || 0, -1, 1); p.py = clamp(+po.py || 0, -1, 1); p.fit = !!po.fit;
    var a = po.adj || {}, na = { b: clamp(+a.b || 0, -50, 50), c: clamp(+a.c || 0, -50, 50), s: clamp(+a.s || 0, -100, 100) };
    if (na.b !== p.adj.b || na.c !== p.adj.c || na.s !== p.adj.s) { p.adj = na; R.buildWork(p); }
    return p;
  }
  function cleanStickers(arr) {
    return arr.slice(0, 20).filter(function (k) { return k && typeof k.kind === "string"; }).map(function (k) {
      var kind = ["kreis", "stern", "pille", "etikett", "emoji"].indexOf(k.kind) >= 0 ? k.kind : "kreis";
      return { id: VB.nextId(), kind: kind, text: String(k.text || "").slice(0, 24), auto: k.auto === "price" || k.auto === "discount" ? k.auto : undefined,
        color: HEX.test(k.color) ? k.color : "#ffffff", x: clamp(+k.x || 0.5, 0, 1), y: clamp(+k.y || 0.2, 0, 1), size: clamp(+k.size || 1, 0.4, 2.2), rot: clamp(+k.rot || 0, -45, 45) };
    });
  }
  function normItem(o) {
    var x = VB.newItem(null); if (!o || typeof o !== "object") return x;
    if (VB.ARTICLES.some(function (a) { return a.id === o.article; })) x.article = o.article;
    if (o.byType && typeof o.byType === "object") Object.keys(o.byType).forEach(function (k) {
      var v = o.byType[k]; if (v && typeof v.size === "string" && typeof v.extra === "string") x.byType[k] = { size: v.size.slice(0, 24), extra: v.extra.slice(0, 24) };
    });
    if (o.texts) Object.keys(x.texts).forEach(function (k) { if (typeof o.texts[k] === "string") x.texts[k] = o.texts[k].slice(0, 60); });
    if (VB.COLL_N[o.collage]) x.collage = o.collage;
    x.photos = [0, 1, 2, 3].map(function (i) { return pdes((o.photos || [])[i]); });
    x.extras = (o.extras || []).map(pdes).filter(Boolean);
    if (Array.isArray(o.stickers)) x.stickers = cleanStickers(o.stickers);
    return x;
  }
  function applyLook(L) {
    var has = function (list, v) { return list.some(function (x) { return x[0] === v; }); };
    L = L || {};
    if (has(VB.FORMATS, L.format)) s.format = L.format;
    if (has(VB.STYLES, L.style)) s.style = L.style;
    if (has(VB.BGS, L.bg)) s.bg = L.bg;
    if (typeof L.font === "number" && VB.FONTS[L.font]) s.font = L.font;
    if (typeof L.col === "number" && L.col >= -1 && L.col < VB.COLS.length) s.col = L.col;
    if (HEX.test(L.t)) s.t = L.t;
    if (HEX.test(L.g)) s.g = L.g;
    if (typeof L.radius === "number") s.radius = clamp(L.radius, 0, 90);
    if (typeof L.shop === "string") s.shop = L.shop.slice(0, 20);
  }
  function applyState(o) {
    applyLook(o.look);
    s.singles = !!o.singles; s.hires = !!o.hires;
    if (Array.isArray(o.items) && o.items.length) s.items = o.items.slice(0, 30).map(normItem);
    s.cur = Math.min(s.cur, s.items.length - 1);
  }
  function save() { try { localStorage.setItem(KEY, snapshot(false)); } catch (e) {} }
  function restore() { try { var o = JSON.parse(localStorage.getItem(KEY) || "null"); if (o) applyState(o); } catch (e) {} }

  var hist = [], hi = -1, histT = null;
  function histPush() {
    histT = null;
    var sn = snapshot(true); if (sn === hist[hi]) { syncUndo(); return; }
    hist = hist.slice(0, hi + 1); hist.push(sn); if (hist.length > 80) hist.shift(); hi = hist.length - 1; syncUndo();
  }
  function changed() { save(); clearTimeout(histT); histT = setTimeout(histPush, 450); syncUndo(); pendingFiles = null; setAllLabel(); scheduleWarm(); }
  function flush() { if (histT) { clearTimeout(histT); histPush(); } }
  function syncUndo() { $("undo").disabled = !(hi > 0 || histT); $("redo").disabled = !(hi < hist.length - 1); }
  function undo() { flush(); if (hi > 0) { hi--; applyState(JSON.parse(hist[hi])); refreshAll(); save(); syncUndo(); } }
  function redo() { flush(); if (hi < hist.length - 1) { hi++; applyState(JSON.parse(hist[hi])); refreshAll(); save(); syncUndo(); } }
  $("undo").onclick = undo; $("redo").onclick = redo;
  /* Jeder Klick auf einen Knopf ist ein eigener Schritt: vorher Angefangenes wird zuerst festgehalten.
     Nur Eingaben (Schieberegler, Tippen, Ziehen) werden kurz zusammengefasst. */
  document.addEventListener("click", function (e) { if (e.target.closest && e.target.closest("button, summary, label")) flush(); }, true);
  document.addEventListener("change", function (e) { if (e.target.tagName === "SELECT") flush(); }, true);
  cv.addEventListener("pointerdown", flush, true);
  document.addEventListener("keydown", function (e) {
    if (!(e.ctrlKey || e.metaKey) || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    var k = e.key.toLowerCase();
    if (k === "z" && !e.shiftKey) { e.preventDefault(); undo(); } else if (k === "y" || (k === "z" && e.shiftKey)) { e.preventDefault(); redo(); }
  });

  /* Reiter */
  var tabs = document.querySelectorAll("#tabs button");
  tabs.forEach(function (b) {
    b.onclick = function () {
      tabs.forEach(function (x) { x.setAttribute("aria-selected", String(x === b)); });
      document.querySelectorAll(".tabpane").forEach(function (p) { p.hidden = p.getAttribute("data-pane") !== b.getAttribute("data-tab"); });
    };
  });

  /* Serie */
  function buildSeries() {
    var box = $("series"); box.textContent = "";
    s.items.forEach(function (x, i) {
      var t = x.texts.title.trim() || "neu";
      mkBtn(box, (i + 1) + ". " + (t.length > 14 ? t.slice(0, 13) + "…" : t), i === s.cur, function () { s.cur = i; refreshAll(); });
    });
    $("itDel").disabled = s.items.length < 2;
  }
  $("itAdd").onclick = function () {
    if (s.items.length >= 30) { toast("Mehr als 30 Artikel gehen nicht."); return; }
    s.items.push(VB.newItem(it())); s.cur = s.items.length - 1; refreshAll(); changed();
    toast("Neuer Artikel mit demselben Look. Lade jetzt die Fotos hoch.");
  };
  $("itDup").onclick = function () {
    if (s.items.length >= 30) { toast("Mehr als 30 Artikel gehen nicht."); return; }
    var c = VB.newItem(it()); Object.keys(c.texts).forEach(function (k) { c.texts[k] = it().texts[k]; });
    c.byType = JSON.parse(JSON.stringify(it().byType));
    s.items.push(c); s.cur = s.items.length - 1; refreshAll(); changed();
  };
  $("itDel").onclick = function () {
    if (s.items.length < 2) return;
    s.items.splice(s.cur, 1); s.cur = Math.min(s.cur, s.items.length - 1); refreshAll(); changed();
  };

  /* Meine Stile: Look und Aufkleber unter einem Namen speichern (nur auf diesem Gerät) */
  var LOOKS_KEY = "verkaufsbilder-stile-v1", looks = [];
  function loadLooks() {
    try {
      var a = JSON.parse(localStorage.getItem(LOOKS_KEY) || "[]");
      if (Array.isArray(a)) looks = a.filter(function (p) { return p && typeof p.name === "string" && p.look && typeof p.look === "object"; }).slice(0, 20);
    } catch (e) {}
  }
  function saveLooks() { try { localStorage.setItem(LOOKS_KEY, JSON.stringify(looks)); return true; } catch (e) { toast("Der Stil konnte nicht gespeichert werden. Der Browser blockiert den Speicher."); return false; } }
  function stripSticker(k) { return { kind: k.kind, text: k.text, auto: k.auto, color: k.color, x: k.x, y: k.y, size: k.size, rot: k.rot }; }
  function applyPreset(p, all) {
    applyLook(p.look);
    var targets = all ? s.items : [it()], st = Array.isArray(p.stickers) ? p.stickers : [];
    targets.forEach(function (x) { x.stickers = cleanStickers(st); x.selSticker = null; });
    refreshAll(); changed();
    toast("Stil „" + p.name + "“ angewendet" + (all ? " (alle Artikel)." : "."));
  }
  function buildLooks() {
    var box = $("looks"); box.textContent = ""; $("looksEmpty").hidden = looks.length > 0;
    looks.forEach(function (p, i) {
      var row = document.createElement("div"); row.className = "look";
      var main = document.createElement("button"); main.type = "button"; main.className = "look-main"; main.title = "Stil anwenden";
      var sw = document.createElement("span"); sw.className = "lsw"; sw.style.background = HEX.test(p.look.g) ? p.look.g : "#000";
      var dot = document.createElement("i"); dot.style.background = HEX.test(p.look.t) ? p.look.t : "#fff"; sw.appendChild(dot);
      var nm = document.createElement("span"); nm.textContent = p.name;
      main.appendChild(sw); main.appendChild(nm); main.onclick = function () { applyPreset(p, false); };
      row.appendChild(main);
      if (s.items.length > 1) mkBtn(row, "Alle Artikel", null, function () { applyPreset(p, true); }, "btn small");
      var del = mkBtn(row, "✕", null, function () { looks.splice(i, 1); saveLooks(); buildLooks(); toast("Stil gelöscht."); }, "btn small danger");
      del.setAttribute("aria-label", "Stil „" + p.name + "“ löschen");
      box.appendChild(row);
    });
  }
  $("lookSave").onclick = function () {
    var name = $("lookName").value.trim() || "Stil " + (looks.length + 1), x = it();
    var p = { name: name.slice(0, 24),
      look: { format: s.format, style: s.style, font: s.font, col: s.col, t: s.t, g: s.g, radius: s.radius, bg: s.bg, shop: s.shop },
      stickers: x.stickers.map(stripSticker) };
    var at = -1; looks.forEach(function (q, i) { if (q.name.toLowerCase() === p.name.toLowerCase()) at = i; });
    if (at >= 0) looks[at] = p; else if (looks.length >= 20) { toast("Mehr als 20 Stile gehen nicht. Lösche zuerst einen."); return; } else looks.push(p);
    if (saveLooks()) { buildLooks(); $("lookName").value = ""; toast(at >= 0 ? "Stil „" + p.name + "“ aktualisiert." : "Stil „" + p.name + "“ gespeichert."); }
  };

  /* Format, Stil, Hintergrund, Schrift, Farben */
  function simpleSeg(id, list, key) {
    var box = $(id); box.textContent = "";
    list.forEach(function (f) { mkBtn(box, f[1], s[key] === f[0], function () { s[key] = f[0]; if (key === "format") setSize(); simpleSeg(id, list, key); render(); changed(); }); });
  }
  function buildFormats() { simpleSeg("formats", VB.FORMATS, "format"); }
  function buildStyles() { simpleSeg("styles", VB.STYLES, "style"); }
  function buildBgs() { simpleSeg("bgs", VB.BGS, "bg"); }
  function buildFonts() {
    var box = $("fonts"); box.textContent = "";
    VB.FONTS.forEach(function (f, i) {
      var b = mkBtn(box, f.n, s.font === i, function () {
        s.font = i; buildFonts();
        if (document.fonts && document.fonts.load) document.fonts.load(VB.fontStr(60)).then(render).catch(render);
        render(); changed();
      });
      b.style.cssText = f.st;
    });
  }
  function buildCols() {
    var box = $("cols"); box.textContent = "";
    VB.COLS.forEach(function (c, i) {
      var el = document.createElement("button"); el.type = "button"; el.className = "sw" + (c.none ? " none" : ""); el.title = c.n;
      el.setAttribute("aria-label", c.n); el.setAttribute("aria-pressed", String(s.col === i));
      if (c.none) el.textContent = "⊘";
      else { el.style.background = c.g; var d = document.createElement("i"); d.style.background = c.t; el.appendChild(d); }
      el.onclick = function () {
        s.col = i;
        if (!c.none) { s.t = c.t; s.g = c.g; $("ct").value = c.t; $("cg").value = c.g; }
        buildCols(); render(); changed();
      };
      box.appendChild(el);
    });
  }
  $("ct").addEventListener("input", function () { s.t = this.value; s.col = -1; buildCols(); render(); changed(); });
  $("cg").addEventListener("input", function () { s.g = this.value; s.col = -1; buildCols(); render(); changed(); });
  $("radius").addEventListener("input", function () { s.radius = +this.value; render(); changed(); });

  $("fromPhoto").onclick = function () {
    var x = it(), p = R.photoFor(x, x.sel) || R.photoFor(x, 0); if (!p) return;
    var w = p.work, c = document.createElement("canvas"); c.width = c.height = 16;
    var cx = c.getContext("2d", { willReadFrequently: true });
    cx.drawImage(w, 0, w.height * 0.66, w.width, w.height * 0.34, 0, 0, 16, 16);
    var d = cx.getImageData(0, 0, 16, 16).data, r = 0, gg = 0, b = 0, n = d.length / 4;
    for (var i = 0; i < d.length; i += 4) { r += d[i]; gg += d[i + 1]; b += d[i + 2]; }
    var avg = VB.rgbHex([r / n, gg / n, b / n]);
    if (s.style === "tise") {
      if (VB.lum(avg) > 0.62) { s.g = VB.mix(avg, "#ffffff", 0.8); s.t = VB.mix(avg, "#000000", 0.7); }
      else { s.g = VB.mix(avg, "#000000", 0.6); s.t = "#f6efe4"; }
    } else { s.g = VB.mix(avg, "#ffffff", 0.78); s.t = VB.mix(avg, "#000000", 0.72); }
    s.col = -1; $("ct").value = s.t; $("cg").value = s.g; buildCols(); render(); changed();
  };

  /* Collage und Fotos */
  function svgIcon(coll) {
    var rs = R.cellRects(coll, { x: 3, y: 3, w: 18, h: 24 }, 2);
    return '<svg viewBox="0 0 24 30" aria-hidden="true">' + rs.map(function (r) {
      var t = r.rot ? ' transform="rotate(' + r.rot + " " + (r.x + r.w / 2) + " " + (r.y + r.h / 2) + ')"' : "";
      return '<rect x="' + r.x + '" y="' + r.y + '" width="' + r.w + '" height="' + r.h + '" rx="2" fill="currentColor"' + (r.frame ? ' stroke="var(--panel)" stroke-width="1.2"' : "") + t + "/>";
    }).join("") + "</svg>";
  }
  function buildCollage() {
    var box = $("collage"); box.textContent = "";
    VB.COLLAGES.forEach(function (c) {
      var b = mkBtn(box, "", it().collage === c[0], function () {
        var x = it(); x.collage = c[0]; x.sel = Math.min(x.sel, VB.nCells(x) - 1); x.selSticker = null;
        buildCollage(); buildCells(); syncPhoto(); updateStatus(); render(); changed();
      });
      b.innerHTML = svgIcon(c[0]); b.title = c[1]; b.setAttribute("aria-label", c[1]);
    });
  }
  function buildCells() {
    var box = $("cells"), x = it(); box.textContent = "";
    for (var i = 0; i < VB.nCells(x); i++) (function (i) {
      var b = mkBtn(box, "Foto " + (i + 1), x.sel === i && x.selSticker == null, function () {
        x.sel = i; x.selSticker = null; buildCells(); syncPhoto(); syncSticker(); render();
      });
      if (x.photos[i]) b.className = "filled";
    })(i);
  }
  function buildExtras() {
    var x = it(), box = $("extras"); box.textContent = "";
    $("extrasBox").hidden = x.extras.length === 0;
    $("extrasInfo").textContent = x.extras.length + (x.extras.length === 1 ? " weiteres Foto" : " weitere Fotos") + " (nicht im Titelbild). Antippen tauscht es ins ausgewählte Feld. Mit „Einzelfotos mitspeichern“ wird jedes als eigenes Bild gespeichert.";
    x.extras.forEach(function (p, i) {
      mkBtn(box, "Weiteres " + (i + 1), null, function () {
        var q = x.extras.splice(i, 1)[0], old = x.photos[x.sel];
        x.photos[x.sel] = q; if (old) x.extras.splice(i, 0, old);
        buildCells(); buildExtras(); syncPhoto(); updateStatus(); render(); changed();
      });
    });
  }
  function syncPhoto() {
    var x = it(), p = R.photoFor(x, x.sel), off = !p;
    $("zoom").value = p ? p.zoom : 1;
    $("adjB").value = p ? p.adj.b : 0; $("adjC").value = p ? p.adj.c : 0; $("adjS").value = p ? p.adj.s : 0;
    ["zoom", "adjB", "adjC", "adjS", "auto", "adjReset", "resetPos"].forEach(function (id) { $(id).disabled = off; });
    $("rmPhoto").disabled = !x.photos[x.sel];
    $("fit").disabled = off; $("fit").setAttribute("aria-pressed", String(!!(p && p.fit)));
    $("autoCover").disabled = x.photos.filter(Boolean).length + x.extras.length < 2;
  }
  function updateStatus() {
    var x = it(), m = VB.missing(x), bad = -1, all = true, h = $("hint");
    s.items.forEach(function (y, i) { if (!VB.ready(y)) { all = false; if (bad < 0) bad = i + 1; } });
    h.textContent = !VB.anyPhoto(x) ? "Das ist ein Beispielfoto. Lade dein eigenes Foto hoch, dann kannst du speichern."
      : m > 0 ? "Noch " + m + (m === 1 ? " Foto fehlt." : " Fotos fehlen.")
      : !all ? "Dieser Artikel ist fertig. Bei Artikel " + bad + " fehlen noch Fotos." : "Fertig. Du kannst speichern.";
    if (typeof setAllLabel === "function") setAllLabel();
  }
  function loadImg(file) {
    return new Promise(function (res) {
      var im = new Image(); im.onload = function () { res(im); };
      im.onerror = function () { toast("„" + file.name + "“ lässt sich nicht öffnen. Versuche JPG oder PNG."); res(null); };
      im.src = URL.createObjectURL(file);
    });
  }
  function loadFiles(list) {
    var files = [].filter.call(list || [], function (f) { return f.type.indexOf("image/") === 0; });
    if (!files.length) { toast("Das ist keine Bilddatei."); return; }
    var x = it();
    if (files.length > 1 && x.collage === "1") x.collage = files.length === 2 ? "2h" : files.length === 3 ? "3" : "4";
    files = files.slice(0, 24);
    Promise.all(files.map(loadImg)).then(function (imgs) {
      var n = VB.nCells(x), pos = x.sel, first = -1, single = imgs.length === 1;
      imgs.forEach(function (im) {
        if (!im) return;
        var t = -1;
        for (var k = 0; k < n; k++) { var idx = (pos + k) % n; if (!x.photos[idx]) { t = idx; break; } }
        if (t >= 0) { x.photos[t] = R.newPhoto(im); if (first < 0) first = t; pos = (t + 1) % n; }
        else if (single) x.photos[x.sel] = R.newPhoto(im);
        else if (x.extras.length < 20) x.extras.push(R.newPhoto(im));
      });
      if (first >= 0) x.sel = first;
      var im0 = imgs[0]; if (im0 && im0.width / im0.height < 0.72) toast("Dein Foto ist sehr hoch. Mit „Ganzes Foto zeigen“ oder dem Format „2:3 hoch“ siehst du alles.");
      $("fname").textContent = files.length + (files.length === 1 ? " Foto geladen" : " Fotos geladen");
      buildCollage(); buildCells(); buildExtras(); syncPhoto(); updateStatus(); render(); changed();
    });
  }
  $("file").addEventListener("change", function () { loadFiles(this.files); this.value = ""; });
  var drop = $("drop");
  ["dragenter", "dragover"].forEach(function (e) { drop.addEventListener(e, function (ev) { ev.preventDefault(); drop.classList.add("over"); }); });
  ["dragleave", "drop"].forEach(function (e) { drop.addEventListener(e, function (ev) { ev.preventDefault(); drop.classList.remove("over"); }); });
  drop.addEventListener("drop", function (ev) { loadFiles(ev.dataTransfer.files); });

  /* Titelbild automatisch: alle Fotos verteilen sich auf die passende Collage, der Rest bleibt Einzelfoto */
  $("autoCover").onclick = function () {
    var x = it(), all = x.photos.filter(Boolean).concat(x.extras);
    if (all.length < 2) { toast("Lade zuerst mehrere Fotos."); return; }
    x.collage = all.length === 2 ? "2h" : all.length === 3 ? "3" : "4";
    var n = VB.nCells(x);
    x.photos = [0, 1, 2, 3].map(function (i) { return i < n ? all[i] : null; });
    x.extras = all.slice(n); x.sel = 0; x.selSticker = null;
    buildCollage(); buildCells(); buildExtras(); syncPhoto(); syncSticker(); updateStatus(); render(); changed();
    toast("Titelbild aus " + n + " Fotos erstellt.");
  };
  $("extrasClear").onclick = function () { it().extras = []; buildExtras(); syncPhoto(); render(); changed(); };

  $("zoom").addEventListener("input", function () { var x = it(), p = R.photoFor(x, x.sel); if (p) { p.zoom = +this.value; render(); changed(); } });
  $("fit").onclick = function () {
    var x = it(), p = R.photoFor(x, x.sel); if (!p) return;
    p.fit = !p.fit; p.px = p.py = 0; syncPhoto(); render(); changed();
  };
  $("rmPhoto").onclick = function () { var x = it(); x.photos[x.sel] = null; buildCells(); syncPhoto(); updateStatus(); render(); changed(); };
  $("resetPos").onclick = function () { var x = it(), p = R.photoFor(x, x.sel); if (p) { p.zoom = 1; p.px = p.py = 0; syncPhoto(); render(); changed(); } };

  function rebuild(p) {
    if (p._pend) return; p._pend = true;
    requestAnimationFrame(function () { p._pend = false; R.buildWork(p); render(); });
  }
  [["adjB", "b"], ["adjC", "c"], ["adjS", "s"]].forEach(function (a) {
    $(a[0]).addEventListener("input", function () { var x = it(), p = R.photoFor(x, x.sel); if (p) { p.adj[a[1]] = +this.value; rebuild(p); changed(); } });
  });
  $("adjReset").onclick = function () { var x = it(), p = R.photoFor(x, x.sel); if (p) { p.adj = { b: 0, c: 0, s: 0 }; R.buildWork(p); syncPhoto(); render(); changed(); } };
  $("auto").onclick = function () {
    var x = it(), p = R.photoFor(x, x.sel); if (!p) return;
    var c = document.createElement("canvas"); c.width = c.height = 48;
    var cx = c.getContext("2d", { willReadFrequently: true }); cx.drawImage(p.work, 0, 0, 48, 48);
    var d = cx.getImageData(0, 0, 48, 48).data, sum = 0;
    for (var i = 0; i < d.length; i += 4) sum += 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    var m = sum / (d.length / 4) / 255;
    p.adj = { b: Math.round(clamp((0.5 - m) * 80, -10, 30)), c: 10, s: 8 };
    R.buildWork(p); syncPhoto(); render(); changed();
  };

  /* Text */
  ["title", "size", "price", "old", "extra"].forEach(function (k) {
    $(k).addEventListener("input", function () {
      it().texts[k] = this.value; if (k === "title") buildSeries(); syncSticker(); render(); changed();
    });
  });
  $("shop").addEventListener("input", function () { s.shop = this.value; render(); changed(); });

  function buildChips() {
    var a = VB.article(), box = $("sizeChips"); box.textContent = "";
    $("sizeLabel").textContent = a.sizeLabel; $("size").placeholder = a.ph; $("title").placeholder = a.titlePh; $("extraLabel").textContent = a.extraLabel;
    box.hidden = a.sizes.length === 0;
    a.sizes.forEach(function (v) { mkBtn(box, v, null, function () { it().texts.size = v; $("size").value = v; render(); changed(); }); });
    box = $("condChips"); box.textContent = "";
    a.conds.forEach(function (v) { mkBtn(box, v, null, function () { it().texts.extra = v; $("extra").value = v; render(); changed(); }); });
  }
  function buildArticles() {
    var sel = $("article"); sel.textContent = "";
    VB.ARTICLES.forEach(function (a) {
      var o = document.createElement("option"); o.value = a.id; o.textContent = a.n; o.selected = a.id === it().article; sel.appendChild(o);
    });
  }
  $("article").addEventListener("change", function () {
    var x = it();
    x.byType[x.article] = { size: x.texts.size, extra: x.texts.extra };
    x.article = this.value;
    var m = x.byType[x.article] || { size: "", extra: "" };
    x.texts.size = m.size; x.texts.extra = m.extra; $("size").value = m.size; $("extra").value = m.extra;
    buildChips(); buildLib(); render(); changed();
  });

  /* Aufkleber */
  function selected() { var x = it(); for (var i = 0; i < x.stickers.length; i++) if (x.stickers[i].id === x.selSticker) return x.stickers[i]; return null; }
  function addSticker(def) {
    var x = it(), n = x.stickers.length;
    if (n >= 20) { toast("Mehr als 20 Aufkleber gehen nicht."); return; }
    var slots = [[0.78, 0.13], [0.22, 0.13], [0.78, 0.3], [0.22, 0.3], [0.5, 0.2], [0.78, 0.47], [0.22, 0.47]];
    var sl = slots[n % slots.length], off = Math.floor(n / slots.length) * 0.04, id = VB.nextId();
    x.stickers.push({
      id: id, kind: def.kind, text: def.text || "", auto: def.auto, color: def.color || "#ffffff",
      x: clamp(sl[0] + off, 0.1, 0.9), y: clamp(sl[1] + off, 0.08, 0.9), size: 1, rot: def.kind === "emoji" ? 0 : (n % 2 ? 8 : -8)
    });
    x.selSticker = id; buildCells(); syncSticker(); render(); changed();
  }
  function buildLib() {
    var box = $("stlib"), sug = VB.article().stk; box.textContent = "";
    var first = sug.map(function (l) { return VB.STICKERS.filter(function (d) { return d.label === l; })[0]; }).filter(Boolean);
    var rest = VB.STICKERS.filter(function (d) { return first.indexOf(d) < 0; });
    first.forEach(function (d) { mkBtn(box, d.label, null, function () { addSticker(d); }, "sug"); });
    rest.forEach(function (d) { mkBtn(box, d.label, null, function () { addSticker(d); }); });
    box = $("stemoji"); box.textContent = "";
    VB.EMOJIS.forEach(function (e) { mkBtn(box, e, null, function () { addSticker({ kind: "emoji", text: e }); }); });
  }
  function syncSticker() {
    var x = it(), k = selected(), list = $("stlist"); list.textContent = "";
    x.stickers.forEach(function (y) {
      var label = y.kind === "emoji" ? y.text : (R.stickerText(y, x) || (y.auto === "discount" ? "Rabatt" : "Preis"));
      mkBtn(list, label.length > 12 ? label.slice(0, 11) + "…" : label, y.id === x.selSticker, function () { x.selSticker = y.id; buildCells(); syncSticker(); render(); });
    });
    $("stempty").hidden = x.stickers.length > 0; $("sted").hidden = !k;
    if (!k) return;
    var emoji = k.kind === "emoji", t = $("sttext");
    t.value = k.auto ? "" : k.text; t.disabled = !!k.auto || emoji;
    t.placeholder = k.auto === "price" ? "Kommt aus dem Preisfeld" : k.auto === "discount" ? "Wird aus altem und neuem Preis berechnet" : "";
    $("stsize").value = k.size; $("strot").value = k.rot;
    var kb = $("stkind"); kb.textContent = ""; kb.hidden = emoji;
    VB.STK_KINDS.forEach(function (d) { mkBtn(kb, d[1], k.kind === d[0], function () { k.kind = d[0]; syncSticker(); render(); changed(); }); });
    var cb = $("stcol"); cb.textContent = ""; cb.hidden = emoji;
    VB.STK_COLORS.forEach(function (c) {
      var el = document.createElement("button"); el.type = "button"; el.className = "sw"; el.style.background = c; el.setAttribute("aria-label", "Farbe " + c);
      el.setAttribute("aria-pressed", String(k.color === c));
      el.onclick = function () { k.color = c; syncSticker(); render(); changed(); };
      cb.appendChild(el);
    });
  }
  $("sttext").addEventListener("input", function () { var k = selected(); if (k) { k.text = this.value; render(); changed(); } });
  $("stsize").addEventListener("input", function () { var k = selected(); if (k) { k.size = +this.value; render(); changed(); } });
  $("strot").addEventListener("input", function () { var k = selected(); if (k) { k.rot = +this.value; render(); changed(); } });
  $("stdel").onclick = function () {
    var x = it(); x.stickers = x.stickers.filter(function (y) { return y.id !== x.selSticker; });
    x.selSticker = null; buildCells(); syncSticker(); render(); changed();
  };
  $("stdup").onclick = function () {
    var x = it(), k = selected(); if (!k || x.stickers.length >= 20) return;
    var c = JSON.parse(JSON.stringify(k)); c.id = VB.nextId(); c.x = clamp(k.x - 0.06, 0.05, 0.95); c.y = clamp(k.y + 0.06, 0.05, 0.95);
    x.stickers.push(c); x.selSticker = c.id; syncSticker(); render(); changed();
  };

  /* Ziehen im Bild: Aufkleber verschieben, Foto verschieben, mit zwei Fingern zoomen */
  var ptrs = {}, drag = null, pinch = null;
  function pt(e) { var r = cv.getBoundingClientRect(), k = W / r.width; return { x: (e.clientX - r.left) * k, y: (e.clientY - r.top) * k }; }
  function hitSticker(p) {
    var H = VB.H(), sts = it().stickers;
    for (var i = sts.length - 1; i >= 0; i--) {
      var k = sts[i], a = k.rot * Math.PI / 180, dx = p.x - k.x * W, dy = p.y - k.y * H;
      var lx = (dx * Math.cos(a) + dy * Math.sin(a)) / k.size, ly = (-dx * Math.sin(a) + dy * Math.cos(a)) / k.size;
      if (Math.abs(lx) <= (k._hw || 90) + 12 && Math.abs(ly) <= (k._hh || 90) + 12) return k;
    }
    return null;
  }
  function cellAt(p) {
    var c = R.hit.cells;
    for (var i = c.length - 1; i >= 0; i--) {
      var q = p, m = c[i].frame ? R.FRAME : 0;
      if (c[i].rot) {
        var a = c[i].rot * Math.PI / 180, dx = p.x - c[i].cx, dy = p.y - c[i].cy;
        q = { x: c[i].cx + dx * Math.cos(a) + dy * Math.sin(a), y: c[i].cy - dx * Math.sin(a) + dy * Math.cos(a) };
      }
      if (q.x >= c[i].x - m && q.x <= c[i].x + c[i].w + m && q.y >= c[i].y - m && q.y <= c[i].y + c[i].h + m) return c[i];
    }
    return null;
  }
  function localDelta(dx, dy, rot) {
    if (!rot) return { x: dx, y: dy };
    var a = rot * Math.PI / 180;
    return { x: dx * Math.cos(a) + dy * Math.sin(a), y: -dx * Math.sin(a) + dy * Math.cos(a) };
  }
  cv.addEventListener("pointerdown", function (e) {
    var p = pt(e), x = it(); ptrs[e.pointerId] = p; cv.setPointerCapture(e.pointerId);
    var ids = Object.keys(ptrs);
    if (ids.length === 2 && drag && drag.type === "photo" && drag.ph) {
      var a = ptrs[ids[0]], b = ptrs[ids[1]];
      pinch = { d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, z0: drag.ph.zoom }; return;
    }
    var k = hitSticker(p);
    if (k) {
      x.selSticker = k.id; drag = { type: "st", k: k, ox: p.x - k.x * W, oy: p.y - k.y * VB.H(), moved: false };
      buildCells(); syncSticker(); render(); return;
    }
    var c = cellAt(p);
    if (c) {
      var had = x.selSticker != null; x.sel = c.i; x.selSticker = null;
      var ph = R.photoFor(x, c.i);
      drag = { type: "photo", ph: ph, cell: c, x: p.x, y: p.y, px: ph ? ph.px : 0, py: ph ? ph.py : 0, moved: false, empty: !ph };
      buildCells(); syncPhoto(); if (had) syncSticker(); render();
    } else { x.selSticker = null; drag = null; buildCells(); syncSticker(); render(); }
    cv.classList.add("drag");
  });
  cv.addEventListener("pointermove", function (e) {
    if (!ptrs[e.pointerId]) return;
    var p = pt(e); ptrs[e.pointerId] = p;
    if (pinch && drag && drag.ph) {
      var ids = Object.keys(ptrs); if (ids.length < 2) return;
      var a = ptrs[ids[0]], b = ptrs[ids[1]];
      drag.ph.zoom = clamp(pinch.z0 * Math.hypot(a.x - b.x, a.y - b.y) / pinch.d0, 1, 3); drag.moved = true; $("zoom").value = drag.ph.zoom; render(); return;
    }
    if (!drag) return;
    if (drag.type === "st") {
      drag.moved = true; drag.k.x = clamp((p.x - drag.ox) / W, 0, 1); drag.k.y = clamp((p.y - drag.oy) / VB.H(), 0, 1); render();
    } else if (drag.ph) {
      if (Math.hypot(p.x - drag.x, p.y - drag.y) > 8) drag.moved = true;
      var d = localDelta(p.x - drag.x, p.y - drag.y, drag.cell.rot), r = R.panRange(drag.ph, drag.cell.w, drag.cell.h);
      if (r.rx > 1) drag.ph.px = clamp(drag.px + d.x / r.rx, -1, 1);
      if (r.ry > 1) drag.ph.py = clamp(drag.py + d.y / r.ry, -1, 1);
      render();
    }
  });
  function endPtr(e) {
    delete ptrs[e.pointerId];
    if (Object.keys(ptrs).length < 2) pinch = null;
    if (Object.keys(ptrs).length === 0) {
      cv.classList.remove("drag");
      if (drag && drag.empty && !drag.moved) $("file").click();
      if (drag && drag.moved) changed();
      drag = null;
    }
  }
  cv.addEventListener("pointerup", endPtr); cv.addEventListener("pointercancel", endPtr);

  /* Speichern: Auf dem iPhone öffnet sich das Teilen-Menü ("Bild sichern" legt es in Fotos ab),
     sonst wird die Datei direkt geladen. Mehrere Bilder: iPhone Teilen-Menü, sonst ZIP. */
  var IOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  var CAN_SHARE = false;
  try { CAN_SHARE = !!(navigator.share && navigator.canShare && navigator.canShare({ files: [new File([""], "x.png", { type: "image/png" })] })); } catch (e) {}
  var SHARE_FIRST = IOS && CAN_SHARE, pendingFiles = null;

  function exportScale() { return s.hires ? 2 : 1; }
  function offscreen() { var k = exportScale(), c = document.createElement("canvas"); c.width = W * k; c.height = VB.H() * k; return c; }
  function ctx2(c) { var x = c.getContext("2d"), k = exportScale(); x.scale(k, k); return x; }
  function canvasBlob(c) { return new Promise(function (res) { c.toBlob(res, "image/png"); }); }
  function blobBytes(b) {
    if (b.arrayBuffer) return b.arrayBuffer().then(function (a) { return new Uint8Array(a); });
    return new Promise(function (res) { var fr = new FileReader(); fr.onload = function () { res(new Uint8Array(fr.result)); }; fr.readAsArrayBuffer(b); });
  }
  function saveBlob(blob, name) {
    var a = document.createElement("a"), url = URL.createObjectURL(blob);
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 8000);
  }

  /* Das Titelbild wird schon im Voraus gerechnet, damit das Teilen-Menü sofort nach dem Tippen aufgeht (iPhone verlangt das) */
  var warm = { sig: null, blob: null, t: null };
  function sigNow() { return snapshot(true) + "|" + s.cur; }
  function buildCover(x) { var c = offscreen(); R.draw(ctx2(c), { export: true, item: x }); return canvasBlob(c); }
  function coverBlob(x) { return x === it() && warm.blob && warm.sig === sigNow() ? Promise.resolve(warm.blob) : buildCover(x); }
  function scheduleWarm() {
    clearTimeout(warm.t);
    warm.t = setTimeout(function () {
      var x = it(); if (!VB.ready(x) || document.hidden) return;
      var sg = sigNow(); buildCover(x).then(function (b) { if (b && sg === sigNow()) { warm.sig = sg; warm.blob = b; } });
    }, 800);
  }

  function imageCount() {
    var n = s.items.length;
    if (s.singles) s.items.forEach(function (x) { n += x.photos.filter(Boolean).length + x.extras.length; });
    return n;
  }
  function collect() {
    var out = [], chain = Promise.resolve();
    s.items.forEach(function (x, i) {
      var base = ("0" + (i + 1)).slice(-2) + "-" + slug(x.texts.title);
      chain = chain.then(function () { return coverBlob(x); }).then(function (b) { out.push({ name: base + ".png", blob: b }); });
      if (s.singles) x.photos.filter(Boolean).concat(x.extras).forEach(function (p, k) {
        chain = chain.then(function () { var c = offscreen(); R.drawPlain(ctx2(c), p); return canvasBlob(c); })
          .then(function (b) { out.push({ name: base + "-foto" + (k + 1) + ".png", blob: b }); });
      });
    });
    return chain.then(function () { return out; });
  }
  function ensureReady(list) {
    var bad = [];
    list.forEach(function (x) { if (!VB.ready(x)) bad.push(s.items.indexOf(x) + 1); });
    if (!bad.length) return true;
    var first = s.items[bad[0] - 1];
    if (list.length === 1) toast(!VB.anyPhoto(first) ? "Lade zuerst dein Foto hoch." : "Noch " + VB.missing(first) + (VB.missing(first) === 1 ? " Foto fehlt." : " Fotos fehlen."));
    else toast("Fotos fehlen noch bei Artikel " + bad.join(", ") + ".");
    document.querySelector('#tabs [data-tab="foto"]').click();
    return false;
  }

  function setAllLabel() {
    var n = imageCount();
    $("all").hidden = n < 2;
    $("all").textContent = pendingFiles && pendingFiles.length > 1 ? "Fertig. Jetzt tippen zum Speichern" : "Alle " + n + " Bilder speichern";
    $("save").textContent = pendingFiles && pendingFiles.length === 1 ? "Fertig. Jetzt tippen zum Speichern" : "Bild speichern";
  }
  function shareFiles(files) {
    return navigator.share({ files: files }).then(function () { pendingFiles = null; setAllLabel(); })
      .catch(function (e) {
        if (e && e.name === "AbortError") return;
        if (e && e.name === "NotAllowedError") { pendingFiles = files; setAllLabel(); toast("Die Bilder sind fertig. Tippe noch einmal auf den Knopf."); return; }
        toast("Das Teilen-Menü ging nicht auf. Nutze „Alles als ZIP-Datei laden“ unter Speicher-Optionen.");
      });
  }
  function saveHelp() {
    $("saveHelp").textContent = SHARE_FIRST ? "Es öffnet sich ein Menü. Wähle dort „Bild sichern“, dann liegt das Bild in deinen Fotos."
      : IOS || /Android/.test(navigator.userAgent) ? "Das Bild landet in deinen Downloads." : "Das Bild landet in deinem Download-Ordner.";
  }

  $("save").addEventListener("click", function () {
    if (pendingFiles && pendingFiles.length === 1) { shareFiles(pendingFiles); return; }
    var x = it(); if (!ensureReady([x])) return;
    var name = slug(x.texts.title) + ".png";
    coverBlob(x).then(function (b) {
      if (!b) { toast("Das Bild konnte nicht erzeugt werden."); return; }
      if (SHARE_FIRST) return shareFiles([new File([b], name, { type: "image/png" })]);
      saveBlob(b, name); toast("Gespeichert: " + name);
    });
  });
  if (CAN_SHARE && !IOS) {
    $("share").hidden = false;
    $("share").addEventListener("click", function () {
      var x = it(); if (!ensureReady([x])) return;
      coverBlob(x).then(function (b) { if (b) shareFiles([new File([b], slug(x.texts.title) + ".png", { type: "image/png" })]); });
    });
  }

  function exportZip() {
    if (!ensureReady(s.items)) return;
    toast("ZIP wird erstellt …");
    collect().then(function (entries) {
      return Promise.all(entries.map(function (e) { return blobBytes(e.blob).then(function (d) { return { name: e.name, data: d }; }); }));
    }).then(function (files) {
      saveBlob(VB.zip(files), "verkaufsbilder.zip"); toast("ZIP gespeichert.");
    }).catch(function () { toast("Das ZIP konnte nicht erstellt werden."); });
  }
  $("zip").addEventListener("click", exportZip);
  $("all").addEventListener("click", function () {
    if (pendingFiles && pendingFiles.length > 1) { shareFiles(pendingFiles); return; }
    if (!ensureReady(s.items)) return;
    if (!SHARE_FIRST) { exportZip(); return; }
    toast("Bilder werden vorbereitet …");
    collect().then(function (entries) {
      shareFiles(entries.map(function (e) { return new File([e.blob], e.name, { type: "image/png" }); }));
    });
  });
  $("singles").addEventListener("change", function () { s.singles = this.checked; setAllLabel(); changed(); });
  $("hires").addEventListener("change", function () { s.hires = this.checked; changed(); });

  /* Vollbild-Vorschau */
  var lbUrl = null;
  function closeLb() { $("lightbox").hidden = true; if (lbUrl) { URL.revokeObjectURL(lbUrl); lbUrl = null; } $("lbimg").removeAttribute("src"); }
  $("big").onclick = function () {
    var x = it();
    buildCoverPreview(x).then(function (b) {
      if (!b) return;
      if (lbUrl) URL.revokeObjectURL(lbUrl);
      lbUrl = URL.createObjectURL(b); $("lbimg").src = lbUrl; $("lightbox").hidden = false; $("lbclose").focus();
    });
  };
  function buildCoverPreview(x) { var c = document.createElement("canvas"); c.width = W; c.height = VB.H(); R.draw(c.getContext("2d"), { export: true, item: x }); return canvasBlob(c); }
  $("lbclose").onclick = closeLb; $("lightbox").addEventListener("click", function (e) { if (e.target !== $("lbimg")) closeLb(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !$("lightbox").hidden) closeLb(); });

  /* Alles neu aufbauen (Start, Artikelwechsel, Rückgängig) */
  function refreshAll() {
    var x = it();
    ["title", "size", "price", "old", "extra"].forEach(function (k) { $(k).value = x.texts[k]; });
    $("shop").value = s.shop; $("ct").value = s.t; $("cg").value = s.g; $("radius").value = s.radius; $("singles").checked = s.singles; $("hires").checked = s.hires;
    buildArticles(); buildChips(); buildFormats(); buildStyles(); buildBgs(); buildFonts(); buildCols(); buildCollage(); buildCells(); buildExtras();
    buildLib(); buildSeries(); buildLooks(); syncPhoto(); syncSticker(); updateStatus(); setSize(); render(); saveHelp(); scheduleWarm();
  }

  restore(); loadLooks();
  refreshAll(); buildLooks(); histPush();
  if (document.fonts && document.fonts.load) {
    Promise.all(VB.FONTS.map(function (f) { return document.fonts.load(f.css.replace("{s}", 60)); })
      .concat([document.fonts.load("400 60px 'Pacifico'"), document.fonts.load("700 46px 'DM Sans'"), document.fonts.load("800 60px 'Bricolage Grotesque'")]))
      .then(render).catch(render);
  }
  if ("serviceWorker" in navigator && location.protocol !== "file:") navigator.serviceWorker.register("sw.js").catch(function () {});
})(window.VB);
