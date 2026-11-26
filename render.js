/* Zeichnen: Hintergründe, Fotos, Stile, Text, Aufkleber */
(function (VB) {
  "use strict";
  var s = VB.s, W = VB.W, FB = "'DM Sans', system-ui, sans-serif", FD = "'Bricolage Grotesque', 'DM Sans', sans-serif";
  var EMOJI_FONT = "'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif";
  var ACCENT = "#e8806c", FRAME = 14;

  /* Fotos mit Korrektur */
  var reg = {}, pid = 0;
  function buildWork(p) {
    var im = p.img, sc = Math.min(1, 2000 / Math.max(im.width, im.height));
    var w = Math.max(1, Math.round(im.width * sc)), h = Math.max(1, Math.round(im.height * sc));
    var c = document.createElement("canvas"); c.width = w; c.height = h;
    var x = c.getContext("2d", { willReadFrequently: true });
    x.drawImage(im, 0, 0, w, h);
    var a = p.adj;
    if (a.b || a.c || a.s) {
      var d = x.getImageData(0, 0, w, h), px = d.data, b = a.b * 2.55, k = 1 + a.c / 100, sa = 1 + a.s / 100;
      for (var i = 0; i < px.length; i += 4) {
        var r = (px[i] + b - 128) * k + 128, g = (px[i + 1] + b - 128) * k + 128, bl = (px[i + 2] + b - 128) * k + 128;
        var gr = 0.299 * r + 0.587 * g + 0.114 * bl;
        px[i] = gr + (r - gr) * sa; px[i + 1] = gr + (g - gr) * sa; px[i + 2] = gr + (bl - gr) * sa;
      }
      x.putImageData(d, 0, 0);
    }
    p.work = c;
  }
  function newPhoto(img) {
    var p = { id: ++pid, img: img, work: null, zoom: 1, px: 0, py: 0, fit: false, adj: { b: 0, c: 0, s: 0 } };
    buildWork(p); reg[p.id] = p; return p;
  }
  function makeSample() {
    var c = document.createElement("canvas"); c.width = 800; c.height = 1000;
    var x = c.getContext("2d");
    var gr = x.createLinearGradient(0, 0, 0, 1000); gr.addColorStop(0, "#d9d2ca"); gr.addColorStop(1, "#b9b0a6");
    x.fillStyle = gr; x.fillRect(0, 0, 800, 1000);
    x.save(); x.shadowColor = "rgba(0,0,0,.25)"; x.shadowBlur = 40; x.shadowOffsetY = 24;
    x.beginPath();
    x.moveTo(325, 150); x.quadraticCurveTo(400, 225, 475, 150); x.lineTo(610, 190); x.lineTo(750, 500);
    x.lineTo(655, 540); x.lineTo(610, 410); x.lineTo(618, 780); x.lineTo(182, 780); x.lineTo(190, 410);
    x.lineTo(145, 540); x.lineTo(50, 500); x.lineTo(190, 190); x.closePath();
    x.fillStyle = "#8fae9b"; x.fill(); x.restore();
    x.fillStyle = "#7c9c89"; x.fillRect(182, 740, 436, 40);
    x.fillStyle = "rgba(60,55,50,.6)"; x.font = "500 26px " + FB; x.textAlign = "center";
    x.fillText("Beispielfoto", 400, 60);
    return c;
  }
  var samplePhoto = newPhoto(makeSample());
  function photoFor(it, i) { return it.photos[i] || (i === 0 && !VB.anyPhoto(it) ? samplePhoto : null); }

  function baseScale(p, w, h) {
    return p.fit ? Math.min(w / p.work.width, h / p.work.height) : Math.max(w / p.work.width, h / p.work.height);
  }
  function panRange(p, w, h) {
    var sc = baseScale(p, w, h) * p.zoom;
    return { rx: Math.max(0, (p.work.width * sc - w) / 2), ry: Math.max(0, (p.work.height * sc - h) / 2) };
  }
  /* Bei "ganzes Foto" füllt eine weichgezeichnete Kopie des Fotos den Rest der Fläche */
  var blurTmp = document.createElement("canvas");
  function drawBackdrop(g, im, x, y, w, h) {
    var bw = Math.max(2, Math.ceil(w / 28)), bh = Math.max(2, Math.ceil(h / 28));
    blurTmp.width = bw; blurTmp.height = bh;
    var b = blurTmp.getContext("2d"), sc = Math.max(bw / im.width, bh / im.height);
    b.imageSmoothingQuality = "high"; b.drawImage(im, (bw - im.width * sc) / 2, (bh - im.height * sc) / 2, im.width * sc, im.height * sc);
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = "high"; g.drawImage(blurTmp, x, y, w, h);
    g.fillStyle = "rgba(0,0,0,.10)"; g.fillRect(x, y, w, h);
  }
  function drawPhotoIn(g, p, x, y, w, h) {
    var im = p.work, sc = baseScale(p, w, h) * p.zoom, dw = im.width * sc, dh = im.height * sc;
    var rx = Math.max(0, (dw - w) / 2), ry = Math.max(0, (dh - h) / 2);
    var dx = x + (w - dw) / 2 + p.px * rx, dy = y + (h - dh) / 2 + p.py * ry;
    g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
    if (p.fit && (dw < w - 1 || dh < h - 1)) drawBackdrop(g, im, x, y, w, h);
    g.drawImage(im, dx, dy, dw, dh); g.restore();
  }
  /* Einzelfoto ohne Text und Aufkleber (mittig, bei "ganzes Foto" ohne Zuschnitt) */
  function drawPlain(g, p) {
    g.clearRect(0, 0, W, VB.H());
    drawPhotoIn(g, { work: p.work, zoom: 1, px: 0, py: 0, fit: p.fit }, 0, 0, W, VB.H());
  }

  /* Zellen der Collage */
  function cellRects(coll, a, gap) {
    var x = a.x, y = a.y, w = a.w, h = a.h;
    function r(rx, ry, rw, rh, rot, frame) { return { x: rx, y: ry, w: rw, h: rh, rot: rot || 0, frame: !!frame }; }
    var hw, hh, lw, rw, cw, ch, out;
    switch (coll) {
      case "2h": case "ba":
        hw = (w - gap) / 2; out = [r(x, y, hw, h), r(x + hw + gap, y, hw, h)];
        if (coll === "ba") { out[0].label = "Vorher"; out[1].label = "Nachher"; }
        return out;
      case "2v": hh = (h - gap) / 2; return [r(x, y, w, hh), r(x, y + hh + gap, w, hh)];
      case "3": lw = (w - gap) * 0.58; rw = w - gap - lw; hh = (h - gap) / 2;
        return [r(x, y, lw, h), r(x + lw + gap, y, rw, hh), r(x + lw + gap, y + hh + gap, rw, hh)];
      case "4": hw = (w - gap) / 2; hh = (h - gap) / 2;
        return [r(x, y, hw, hh), r(x + hw + gap, y, hw, hh), r(x, y + hh + gap, hw, hh), r(x + hw + gap, y + hh + gap, hw, hh)];
      case "2o": cw = w * 0.66; ch = h * 0.72;
        return [r(x + w * 0.03, y + h * 0.03, cw, ch, -5, true), r(x + w - cw - w * 0.03, y + h - ch - h * 0.03, cw, ch, 4, true)];
      case "3o": cw = w * 0.6; ch = h * 0.56;
        return [r(x + w * 0.03, y + h * 0.03, cw, ch, -6, true), r(x + w - cw - w * 0.03, y + h * 0.1, cw, ch, 5, true), r(x + (w - cw) / 2, y + h - ch - h * 0.02, cw, ch, -2, true)];
      default: return [r(x, y, w, h)];
    }
  }

  /* Hintergründe (Muster werden einmal gezeichnet und gemerkt) */
  var bgCache = {};
  function rng(seed) { return function () { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; }
  function bgCanvas(kind, col, H) {
    var key = kind + "|" + col + "|" + H;
    if (bgCache[key]) return bgCache[key];
    if (Object.keys(bgCache).length > 6) bgCache = {};
    var c = document.createElement("canvas"); c.width = W; c.height = H;
    var x = c.getContext("2d"), r = rng(11), i, dark = VB.lum(col) < 0.5, contrast = dark ? "#ffffff" : "#000000";
    if (kind === "papier") {
      x.fillStyle = col; x.fillRect(0, 0, W, H);
      for (i = 0; i < 9000; i++) { x.fillStyle = r() < 0.5 ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.05)"; x.fillRect(r() * W, r() * H, 1 + r() * 2, 1 + r() * 2); }
      x.lineWidth = 1; for (i = 0; i < 260; i++) { x.strokeStyle = r() < 0.5 ? "rgba(255,255,255,.07)" : "rgba(0,0,0,.05)"; x.beginPath(); var sx = r() * W, sy = r() * H, an = r() * 6.28, ln = 20 + r() * 50; x.moveTo(sx, sy); x.lineTo(sx + Math.cos(an) * ln, sy + Math.sin(an) * ln); x.stroke(); }
      var vg = x.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.8); vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,.14)"); x.fillStyle = vg; x.fillRect(0, 0, W, H);
    } else if (kind === "holz") {
      var tones = ["#c8a273", "#bf9768", "#cfab7c", "#b98f61", "#c49c6e"], ph = 190, y = 0, n = 0;
      while (y < H) {
        x.fillStyle = tones[n % tones.length]; x.fillRect(0, y, W, ph);
        for (i = 0; i < 70; i++) {
          x.strokeStyle = r() < 0.6 ? "rgba(90,55,25,.10)" : "rgba(255,235,200,.10)"; x.lineWidth = 1 + r() * 2; x.beginPath();
          var gy = y + r() * ph, amp = 2 + r() * 5, ph0 = r() * 6; x.moveTo(0, gy);
          for (var gx = 0; gx <= W; gx += 40) x.lineTo(gx, gy + Math.sin(gx / 160 + ph0) * amp);
          x.stroke();
        }
        if (r() < 0.6) { var kx = 100 + r() * (W - 200), ky = y + 40 + r() * (ph - 80), kg = x.createRadialGradient(kx, ky, 2, kx, ky, 34); kg.addColorStop(0, "rgba(80,45,20,.55)"); kg.addColorStop(1, "rgba(80,45,20,0)"); x.fillStyle = kg; x.beginPath(); x.ellipse(kx, ky, 46, 22, 0, 0, 6.3); x.fill(); }
        x.fillStyle = "rgba(0,0,0,.28)"; x.fillRect(0, y + ph - 3, W, 3);
        y += ph; n++;
      }
    } else if (kind === "leinen") {
      x.fillStyle = col; x.fillRect(0, 0, W, H);
      for (i = 0; i < H; i += 3) { x.fillStyle = r() < 0.5 ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.05)"; x.fillRect(0, i, W, 1 + (r() < 0.3 ? 1 : 0)); }
      for (i = 0; i < W; i += 3) { x.fillStyle = r() < 0.5 ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.05)"; x.fillRect(i, 0, 1 + (r() < 0.3 ? 1 : 0), H); }
    } else if (kind === "punkte") {
      x.fillStyle = col; x.fillRect(0, 0, W, H); x.fillStyle = VB.mix(col, contrast, 0.13);
      for (var row = 0; row * 64 < H + 64; row++) for (var cl = 0; cl * 64 < W + 64; cl++) { x.beginPath(); x.arc(cl * 64 + (row % 2 ? 32 : 0), row * 64, 13, 0, 6.3); x.fill(); }
    } else if (kind === "streifen") {
      x.fillStyle = col; x.fillRect(0, 0, W, H); x.fillStyle = VB.mix(col, contrast, 0.11);
      for (i = 0; i < W; i += 108) x.fillRect(i, 0, 54, H);
    } else if (kind === "karo") {
      x.fillStyle = col; x.fillRect(0, 0, W, H); x.fillStyle = VB.rgba(contrast, 0.09);
      for (i = 0; i < W; i += 120) x.fillRect(i, 0, 60, H);
      for (i = 0; i < H; i += 120) x.fillRect(0, i, W, 60);
    } else {
      var gr = x.createLinearGradient(0, 0, W * 0.5, H); gr.addColorStop(0, VB.mix(col, "#ffffff", 0.16)); gr.addColorStop(1, col);
      x.fillStyle = gr; x.fillRect(0, 0, W, H);
    }
    bgCache[key] = c; return c;
  }

  function ls(g, px) { try { g.letterSpacing = px + "px"; } catch (e) {} }
  function wrapTitle(g, title, maxW, fs) {
    g.font = VB.fontStr(fs);
    var words = title.split(/\s+/).filter(Boolean), out = [], cur = "";
    words.forEach(function (w) {
      var t = cur ? cur + " " + w : w;
      if (g.measureText(t).width <= maxW || !cur) cur = t; else { out.push(cur); cur = w; }
    });
    if (cur) out.push(cur);
    return out;
  }
  function drawParts(g, parts, align, x, y, ink) {
    g.font = "700 46px " + FB; ls(g, 1);
    var ws = parts.map(function (p) { return g.measureText(p.t).width; }), total = ws.reduce(function (a, b) { return a + b; }, 0);
    var cx = align === "center" ? x - total / 2 : x;
    g.fillStyle = ink; g.textAlign = "left"; g.textBaseline = "alphabetic";
    parts.forEach(function (p, i) { g.fillText(p.t, cx, y); if (p.strike) g.fillRect(cx, y - 16, ws[i], 3); cx += ws[i]; });
    ls(g, 0);
  }
  /* Titel + Untertitel; anchor "top": y = Oberkante, "bottom": y = Grundlinie des Untertitels */
  function textBlock(g, o) {
    ls(g, VB.FONTS[s.font].ls);
    var fs = o.fsMax, lines = wrapTitle(g, o.title, o.maxW, fs), hasSub = o.parts.length > 0;
    while ((lines.length > o.maxLines || lines.some(function (l) { return g.measureText(l).width > o.maxW; })) && fs > 40) {
      fs -= 4; lines = wrapTitle(g, o.title, o.maxW, fs);
    }
    if (lines.length > o.maxLines) lines = lines.slice(0, o.maxLines);
    var lh = fs * 1.02, n = lines.length, first, last, subY;
    if (o.anchor === "bottom") { subY = o.y; last = subY - (hasSub ? 84 : 20); first = last - (n - 1) * lh; }
    else { first = o.y + fs * 0.85; last = first + (n - 1) * lh; subY = last + 84; }
    g.fillStyle = o.ink; g.textAlign = o.align; g.textBaseline = "alphabetic"; g.font = VB.fontStr(fs);
    lines.forEach(function (l, i) { g.fillText(l, o.x, first + i * lh); });
    ls(g, 0);
    if (hasSub) drawParts(g, o.parts, o.align, o.x, subY, o.ink);
    return { bottom: (hasSub ? subY : last) + 16 };
  }

  /* Aufkleber */
  function splitTwo(text) {
    var sp = text.split(" ");
    if (sp.length < 2) return [text];
    var best = 1, bd = 1e9;
    for (var i = 1; i < sp.length; i++) {
      var d = Math.abs(sp.slice(0, i).join(" ").length - sp.slice(i).join(" ").length);
      if (d < bd) { bd = d; best = i; }
    }
    return [sp.slice(0, best).join(" "), sp.slice(best).join(" ")];
  }
  function stickerText(st, it) {
    it = it || VB.item();
    if (st.auto === "price") { var p = it.texts.price.trim(); return p ? p + " €" : ""; }
    if (st.auto === "discount") { var d = VB.discount(it); return d ? "-" + d + "%" : ""; }
    return st.text || "";
  }
  function drawSticker(g, st, selected, it) {
    var H = VB.H(), text = stickerText(st, it);
    g.save(); g.translate(st.x * W, st.y * H); g.rotate(st.rot * Math.PI / 180); g.scale(st.size, st.size);
    var hw = 90, hh = 90;
    if (st.kind === "emoji") {
      g.font = "150px " + EMOJI_FONT; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(st.text, 0, 8);
    } else if (text) {
      var fill = st.color, ink = VB.lum(fill) > 0.6 ? "#1b1b1b" : "#ffffff";
      g.shadowColor = "rgba(0,0,0,.28)"; g.shadowBlur = 24; g.shadowOffsetY = 10; g.fillStyle = fill;
      var round = st.kind === "kreis" || st.kind === "stern", oldTxt = st.auto === "price" && round && VB.oldValid(it) ? it.texts.old.trim() + " €" : "";
      var lines = round && !st.auto ? splitTwo(text) : [text];
      var maxTw = st.kind === "kreis" ? 190 : st.kind === "stern" ? 170 : 1e4, fs = oldTxt ? 60 : lines.length > 1 ? 54 : 72;
      function fit() { g.font = "800 " + fs + "px " + FD; return Math.max.apply(null, lines.map(function (l) { return g.measureText(l).width; })); }
      var tw = fit();
      while (tw > maxTw && fs > 24) { fs -= 2; tw = fit(); }
      if (st.kind === "kreis") {
        g.beginPath(); g.arc(0, 0, 118, 0, Math.PI * 2); g.fill(); hw = hh = 118;
      } else if (st.kind === "stern") {
        g.beginPath();
        for (var i = 0; i < 32; i++) { var rr = i % 2 ? 108 : 132, a = i * Math.PI / 16; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
        g.closePath(); g.fill(); g.lineJoin = "round"; g.lineWidth = 14; g.strokeStyle = fill; g.stroke(); hw = hh = 134;
      } else if (st.kind === "pille") {
        var pw = tw + 90, ph = 112; g.beginPath(); g.roundRect(-pw / 2, -ph / 2, pw, ph, ph / 2); g.fill(); hw = pw / 2; hh = ph / 2;
      } else {
        var ew = tw + 150, eh = 120, hx = -ew / 2 + 38;
        g.beginPath(); g.roundRect(-ew / 2, -eh / 2, ew, eh, 22); g.moveTo(hx + 13, 0); g.arc(hx, 0, 13, 0, Math.PI * 2); g.fill("evenodd");
        hw = ew / 2; hh = eh / 2;
      }
      g.shadowColor = "transparent"; g.fillStyle = ink; g.textAlign = "center"; g.textBaseline = "middle";
      var cx = st.kind === "etikett" ? 24 : 0, lh = fs * 1.05;
      if (oldTxt) {
        g.font = "800 38px " + FD; var ow = g.measureText(oldTxt).width;
        g.fillText(oldTxt, 0, -38); g.fillRect(-ow / 2, -39, ow, 4);
        g.font = "800 " + fs + "px " + FD; g.fillText(text, 0, 22);
      } else lines.forEach(function (l, i) { g.fillText(l, cx, 4 + (i - (lines.length - 1) / 2) * lh); });
    }
    st._hw = hw; st._hh = hh;
    if (selected) {
      g.shadowColor = "transparent"; g.setLineDash([14, 10]); g.lineWidth = 5; g.strokeStyle = ACCENT;
      g.strokeRect(-hw - 10, -hh - 10, hw * 2 + 20, hh * 2 + 20);
    }
    g.restore();
  }

  /* Bild zeichnen. o.export = ohne Auswahlrahmen, o.item = Artikel (sonst der aktuelle) */
  var hit = { cells: [] };
  function draw(g, o) {
    o = o || {};
    var it = o.item || VB.item(), H = VB.H(), st = s.style, none = VB.colNone(), T = it.texts, coll = it.collage, free = !!VB.FREE[coll];
    var safeB = H >= 1900 ? 230 : 0, safeT = H >= 1900 ? 120 : 0;
    var title = T.title.trim(), parts = VB.subtitleParts(it);
    var area, shape, gap = st === "tise" ? 6 : 10, bgFill = "#ffffff", textInk = s.t;
    g.clearRect(0, 0, W, H);
    function background() { g.drawImage(bgCanvas(s.bg, s.g, H), 0, 0); }
    function titleStr() { return st === "polaroid" ? title : title.toUpperCase(); }

    if (st === "tise") {
      if (free) { background(); area = { x: 70, y: 80 + safeT, w: W - 140, h: Math.round(H * 0.58) }; }
      else { area = { x: 0, y: 0, w: W, h: H }; bgFill = "#111111"; }
      shape = function () { g.rect(area.x, area.y, area.w, area.h); };
    } else {
      background();
      if (st === "leiste") {
        area = { x: 0, y: 0, w: W, h: H - 330 - safeB };
        shape = function () { g.rect(area.x, area.y, area.w, area.h); };
      } else if (st === "karte") {
        var top = Math.round(H * 0.05) + safeT;
        area = { x: Math.round(W * 0.12), y: top, w: Math.round(W * 0.76), h: H - top - 340 - safeB };
        shape = function () { g.roundRect(area.x, area.y, area.w, area.h, s.radius); };
      } else if (st === "bogen") {
        var tb = Math.round(H * 0.05) + safeT, aw = Math.round(W * 0.7);
        area = { x: (W - aw) / 2, y: tb, w: aw, h: H - tb - 340 - safeB };
        shape = function () { g.roundRect(area.x, area.y, area.w, area.h, [aw / 2, aw / 2, Math.min(s.radius, 60), Math.min(s.radius, 60)]); };
      } else if (st === "polaroid") {
        var pt = Math.round(H * 0.05) + safeT * 0.6, pw = Math.round(W * 0.84), ph = H - pt - Math.round(H * 0.04) - safeB;
        var paper = { x: (W - pw) / 2, y: pt, w: pw, h: ph }, m = Math.round(pw * 0.05);
        area = { x: paper.x + m, y: paper.y + m, w: pw - 2 * m, h: ph - m - 270 };
        shape = function () { g.rect(area.x, area.y, area.w, area.h); };
        g.save(); g.shadowColor = "rgba(0,0,0,.28)"; g.shadowBlur = 50; g.shadowOffsetY = 26; g.fillStyle = "#fffdf8";
        g.fillRect(paper.x, paper.y, paper.w, paper.h); g.restore();
        textInk = VB.lum(s.t) < 0.5 ? s.t : "#2a2623";
      } else {
        var mag = textBlock(g, { title: titleStr(), parts: parts, align: "left", x: 70, maxW: W - 140, fsMax: 130, maxLines: 2, ink: s.t, anchor: "top", y: 60 + safeT });
        var ay = mag.bottom + 36;
        area = { x: 50, y: ay, w: W - 100, h: H - ay - 56 - safeB };
        shape = function () { g.roundRect(area.x, area.y, area.w, area.h, s.radius); };
      }
      if (!free && st !== "polaroid" && st !== "leiste") { g.save(); g.shadowColor = "rgba(0,0,0,.28)"; g.shadowBlur = 60; g.shadowOffsetY = 30; g.fillStyle = "#fff"; g.beginPath(); shape(); g.fill(); g.restore(); }
    }

    /* Fotos / Collage */
    var cells = cellRects(coll, area, gap);
    var hc = [];
    g.save();
    if (!free) { g.beginPath(); shape(); g.clip(); g.fillStyle = bgFill; g.fillRect(area.x, area.y, area.w, area.h); }
    cells.forEach(function (c, i) {
      var p = photoFor(it, i), cx = c.x + c.w / 2, cy = c.y + c.h / 2;
      g.save();
      if (c.rot) { g.translate(cx, cy); g.rotate(c.rot * Math.PI / 180); g.translate(-cx, -cy); }
      if (c.frame) { g.shadowColor = "rgba(0,0,0,.3)"; g.shadowBlur = 30; g.shadowOffsetY = 14; g.fillStyle = "#fff"; g.fillRect(c.x - FRAME, c.y - FRAME, c.w + 2 * FRAME, c.h + 2 * FRAME); g.shadowColor = "transparent"; }
      if (p) drawPhotoIn(g, p, c.x, c.y, c.w, c.h);
      else {
        g.fillStyle = "#cfc8bf"; g.fillRect(c.x, c.y, c.w, c.h);
        g.fillStyle = "#6d675f"; g.textAlign = "center"; g.textBaseline = "middle"; g.font = "700 90px " + FB;
        g.fillText("+", cx, cy - 20); g.font = "500 34px " + FB; g.fillText("Foto " + (i + 1), cx, cy + 50);
      }
      if (c.label) {
        g.font = "700 34px " + FB; ls(g, 2);
        var lt = c.label.toUpperCase(), lw = g.measureText(lt).width + 44;
        g.fillStyle = "rgba(0,0,0,.6)"; g.beginPath(); g.roundRect(c.x + 22, c.y + c.h - 82, lw, 58, 29); g.fill();
        g.fillStyle = "#fff"; g.textAlign = "left"; g.textBaseline = "middle"; g.fillText(lt, c.x + 44, c.y + c.h - 52); ls(g, 0);
      }
      g.restore();
      hc.push({ i: i, x: c.x, y: c.y, w: c.w, h: c.h, rot: c.rot, cx: cx, cy: cy, frame: c.frame });
    });
    g.restore();
    if (!o.export) hit.cells = hc;

    /* Text */
    if (st === "tise") {
      if (!none) {
        var gr = g.createLinearGradient(0, H * 0.52, 0, H);
        gr.addColorStop(0, VB.rgba(s.g, 0)); gr.addColorStop(0.35, VB.rgba(s.g, 0.4));
        gr.addColorStop(0.7, VB.rgba(s.g, 0.82)); gr.addColorStop(1, VB.rgba(s.g, 0.96));
        g.fillStyle = gr; g.fillRect(0, H * 0.5, W, H * 0.5);
        textBlock(g, { title: titleStr(), parts: parts, align: "center", x: W / 2, maxW: W * 0.82, fsMax: 110, maxLines: 2, ink: s.t, anchor: "bottom", y: H - 96 - safeB });
      }
    } else if (!none) {
      var ay0 = area.y + area.h;
      if (st === "leiste") textBlock(g, { title: titleStr(), parts: parts, align: "center", x: W / 2, maxW: W * 0.84, fsMax: 92, maxLines: 2, ink: s.t, anchor: "bottom", y: H - 64 - safeB });
      else if (st === "karte") textBlock(g, { title: titleStr(), parts: parts, align: "left", x: area.x, maxW: area.w, fsMax: 92, maxLines: 2, ink: s.t, anchor: "top", y: ay0 + 22 });
      else if (st === "bogen") textBlock(g, { title: titleStr(), parts: parts, align: "center", x: W / 2, maxW: W * 0.84, fsMax: 92, maxLines: 2, ink: s.t, anchor: "top", y: ay0 + 22 });
      else if (st === "polaroid") textBlock(g, { title: titleStr(), parts: parts, align: "center", x: W / 2, maxW: area.w, fsMax: 96, maxLines: 2, ink: textInk, anchor: "top", y: ay0 + 14 });
    }

    if (s.shop.trim()) {
      g.save(); g.shadowColor = "rgba(0,0,0,.4)"; g.shadowBlur = 14;
      g.fillStyle = "#fff"; g.font = "400 70px 'Pacifico', cursive"; g.textAlign = "left"; g.textBaseline = "alphabetic";
      g.fillText(s.shop.trim(), area.x + (st === "tise" ? 64 : 36), area.y + 100 + (st === "tise" ? 50 + safeT : 0));
      g.restore();
    }

    it.stickers.forEach(function (k) { drawSticker(g, k, !o.export && k.id === it.selSticker, it); });

    /* Auswahlrahmen der Foto-Zelle */
    if (!o.export && VB.nCells(it) > 1 && it.selSticker == null) {
      var c = cells[Math.min(it.sel, cells.length - 1)], ccx = c.x + c.w / 2, ccy = c.y + c.h / 2;
      g.save(); g.translate(ccx, ccy); g.rotate((c.rot || 0) * Math.PI / 180); g.translate(-ccx, -ccy);
      g.setLineDash([16, 10]); g.lineWidth = 6; g.strokeStyle = ACCENT; g.strokeRect(c.x + 4, c.y + 4, c.w - 8, c.h - 8); g.restore();
    }
  }

  VB.render = { draw: draw, drawPlain: drawPlain, buildWork: buildWork, newPhoto: newPhoto, photoFor: photoFor, panRange: panRange,
    cellRects: cellRects, hit: hit, stickerText: stickerText, reg: reg, FRAME: FRAME };
})(window.VB);
