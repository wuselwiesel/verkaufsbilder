/* Gemeinsamer Zustand und Konstanten */
window.VB = (function () {
  "use strict";
  var W = 1080, uid = 0;

  var FORMATS = [["4x5", "4:5", 1350], ["3x4", "3:4", 1440], ["2x3", "2:3 hoch", 1620], ["1x1", "1:1", 1080], ["9x16", "Story", 1920]];
  var STYLES = [["tise", "Tise"], ["leiste", "Leiste"], ["karte", "Karte"], ["bogen", "Bogen"], ["polaroid", "Polaroid"], ["magazin", "Magazin"]];
  var COLLAGES = [["1", "Ein Foto"], ["2h", "Zwei nebeneinander"], ["2v", "Zwei untereinander"], ["3", "Drei Fotos"], ["4", "Vier Fotos"],
    ["2o", "Zwei überlappend"], ["3o", "Drei überlappend"], ["ba", "Vorher und Nachher"]];
  var COLL_N = { "1": 1, "2h": 2, "2v": 2, "3": 3, "4": 4, "2o": 2, "3o": 3, "ba": 2 };
  var FREE = { "2o": true, "3o": true }; /* Karten liegen frei auf dem Hintergrund */
  var BGS = [["verlauf", "Verlauf"], ["papier", "Papier"], ["holz", "Holz"], ["leinen", "Leinen"], ["punkte", "Punkte"], ["streifen", "Streifen"], ["karo", "Karo"]];

  var FONTS = [
    { n: "sans", css: "700 {s}px 'DM Sans', sans-serif", ls: 1, st: "font-weight:700;font-family:'DM Sans'" },
    { n: "serif", css: "800 {s}px 'Roboto Slab', serif", ls: 1, st: "font-weight:800;font-family:'Roboto Slab'" },
    { n: "classic", css: "400 {s}px 'Bodoni Moda', serif", ls: 2, st: "font-weight:400;font-family:'Bodoni Moda'" },
    { n: "chewy", css: "400 {s}px 'Chewy', cursive", ls: 1, st: "font-family:'Chewy'" },
    { n: "barlow", css: "italic 800 {s}px 'Barlow Condensed', sans-serif", ls: 1, st: "font-style:italic;font-weight:800;font-family:'Barlow Condensed'" },
    { n: "hand", css: "700 {s}px 'Caveat', cursive", ls: 0, st: "font-weight:700;font-family:'Caveat'" }
  ];

  var COLS = [
    { n: "Ohne Text", none: true },
    { n: "Creme auf Schwarz", t: "#f6efe4", g: "#000000" },
    { n: "Creme auf Dunkelgrün", t: "#f6efe4", g: "#123428" },
    { n: "Grün auf Creme", t: "#143a2c", g: "#f6efe4" },
    { n: "Bordeaux auf Creme", t: "#8a2d4a", g: "#f6efe4" },
    { n: "Grün auf Weiß", t: "#143a2c", g: "#ffffff" },
    { n: "Creme auf Bordeaux", t: "#f6efe4", g: "#6e1f3a" },
    { n: "Pfirsich", t: "#3a1d12", g: "#ffd9c7" },
    { n: "Salbei", t: "#1d3a24", g: "#d9e7d3" },
    { n: "Himmel", t: "#14304f", g: "#d6e6f7" },
    { n: "Flieder", t: "#3a2160", g: "#e6dcf5" },
    { n: "Butter", t: "#4a3a05", g: "#fff0b8" },
    { n: "Rosé", t: "#5a1a33", g: "#fbd9e3" }
  ];

  var STK_COLORS = ["#ffffff", "#1b1b1b", "#ff6b57", "#ffd23f", "#2f8f6b", "#8fb8f0", "#f6efe4", "#f4a6c1"];
  var STK_KINDS = [["kreis", "Kreis"], ["stern", "Stern"], ["pille", "Pille"], ["etikett", "Etikett"]];
  var STICKERS = [
    { label: "Preis", kind: "kreis", color: "#ffffff", auto: "price" },
    { label: "Rabatt", kind: "stern", color: "#ff6b57", auto: "discount" },
    { label: "NEU", text: "NEU", kind: "stern", color: "#ffd23f" },
    { label: "SALE", text: "SALE", kind: "stern", color: "#ff6b57" },
    { label: "Neuwertig", text: "Neuwertig", kind: "pille", color: "#2f8f6b" },
    { label: "Mit Etikett", text: "Neu mit Etikett", kind: "etikett", color: "#ffffff" },
    { label: "Reserviert", text: "Reserviert", kind: "pille", color: "#1b1b1b" },
    { label: "Verkauft", text: "Verkauft", kind: "pille", color: "#ff6b57" },
    { label: "Versand inkl.", text: "Versand inklusive", kind: "kreis", color: "#ffd23f" },
    { label: "VB", text: "VB", kind: "kreis", color: "#ffffff" },
    { label: "Vintage", text: "Vintage", kind: "etikett", color: "#f6efe4" },
    { label: "Unisex", text: "Unisex", kind: "pille", color: "#8fb8f0" },
    { label: "Nur Abholung", text: "Nur Abholung", kind: "pille", color: "#f4a6c1" },
    { label: "Tausch", text: "Tausch möglich", kind: "kreis", color: "#2f8f6b" },
    { label: "Wie neu", text: "Wie neu", kind: "pille", color: "#2f8f6b" },
    { label: "Mit OVP", text: "Mit OVP", kind: "pille", color: "#ffffff" },
    { label: "Funktioniert", text: "Funktioniert", kind: "pille", color: "#2f8f6b" },
    { label: "Set", text: "Set", kind: "kreis", color: "#ffd23f" },
    { label: "Selten", text: "Selten", kind: "stern", color: "#f4a6c1" }
  ];
  var EMOJIS = ["❤️", "⭐", "🔥", "✨", "🌿", "🎀", "🛍️", "💚"];

  var VINTED = ["Neu mit Etikett", "Neu ohne Etikett", "Sehr gut", "Gut", "Zufriedenstellend"];
  var ARTICLES = [
    { id: "kleidung", n: "Kleidung", sizeLabel: "Größe", ph: "z. B. M", titlePh: "z. B. Weisses Kleid", num: false,
      sizes: ["XS", "S", "M", "L", "XL", "XXL", "One Size", "36", "38", "40", "42"], extraLabel: "Marke oder Zustand", conds: VINTED,
      stk: ["Preis", "Rabatt", "NEU", "Mit Etikett", "Neuwertig", "Vintage", "Versand inkl.", "Unisex"] },
    { id: "schuhe", n: "Schuhe", sizeLabel: "Schuhgröße", ph: "z. B. 38", titlePh: "z. B. Weisse Sneaker", num: true,
      sizes: ["35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46"], extraLabel: "Marke oder Zustand", conds: VINTED,
      stk: ["Preis", "Rabatt", "NEU", "Neuwertig", "Versand inkl.", "Unisex"] },
    { id: "taschen", n: "Taschen & Accessoires", sizeLabel: "Größe", ph: "z. B. Klein", titlePh: "z. B. Lederhandtasche", num: false,
      sizes: ["Mini", "Klein", "Mittel", "Groß", "One Size"], extraLabel: "Marke oder Zustand", conds: VINTED,
      stk: ["Preis", "Rabatt", "NEU", "Vintage", "Neuwertig", "Versand inkl."] },
    { id: "kinder", n: "Kinder", sizeLabel: "Größe", ph: "z. B. 98", titlePh: "z. B. Regenjacke", num: true,
      sizes: ["50", "56", "62", "68", "74", "80", "86", "92", "98", "104", "110", "116", "122", "128", "134", "140"], extraLabel: "Marke oder Zustand", conds: VINTED,
      stk: ["Preis", "Rabatt", "Neuwertig", "Set", "Versand inkl.", "Unisex"] },
    { id: "buecher", n: "Bücher", sizeLabel: "Autor", ph: "Name des Autors", titlePh: "z. B. Der kleine Prinz", num: false,
      sizes: [], extraLabel: "Zustand", conds: ["Wie neu", "Sehr gut", "Gut", "Gebraucht"], stk: ["Preis", "Rabatt", "Wie neu", "Set", "Selten", "Versand inkl."] },
    { id: "technik", n: "Technik", sizeLabel: "Modell oder Speicher", ph: "z. B. 128 GB", titlePh: "z. B. iPhone 12", num: false,
      sizes: ["64 GB", "128 GB", "256 GB", "512 GB"], extraLabel: "Zustand oder Marke", conds: ["Neu", "Wie neu", "Gut", "Funktioniert"],
      stk: ["Preis", "Rabatt", "Wie neu", "Mit OVP", "Funktioniert", "Versand inkl."] },
    { id: "moebel", n: "Möbel & Deko", sizeLabel: "Maße", ph: "z. B. 80 × 120 cm", titlePh: "z. B. Holztisch", num: false,
      sizes: [], extraLabel: "Zustand", conds: ["Neuwertig", "Gut", "Gebrauchsspuren", "Selbstabholung"], stk: ["Preis", "Rabatt", "Nur Abholung", "VB", "Vintage", "Selten"] },
    { id: "spielzeug", n: "Spielzeug", sizeLabel: "Alter", ph: "z. B. ab 3 Jahren", titlePh: "z. B. Holzeisenbahn", num: false,
      sizes: ["ab 0 J.", "ab 3 J.", "ab 6 J.", "ab 10 J."], extraLabel: "Zustand oder Marke", conds: ["Neu", "Wie neu", "Gut", "Vollständig"],
      stk: ["Preis", "Rabatt", "Wie neu", "Set", "Mit OVP", "Versand inkl."] },
    { id: "sonstiges", n: "Sonstiges", sizeLabel: "Info", ph: "z. B. 30 cm", titlePh: "z. B. Kerzenhalter", num: false,
      sizes: [], extraLabel: "Zustand oder Marke", conds: ["Neu", "Neuwertig", "Gut", "Gebraucht"], stk: ["Preis", "Rabatt", "NEU", "VB", "Tausch", "Versand inkl."] }
  ];

  var s = {
    format: "4x5", style: "tise", font: 2, col: 1, t: "#f6efe4", g: "#000000", radius: 48, bg: "verlauf", shop: "",
    items: [], cur: 0, singles: false, hires: false
  };

  function nextId() { return ++uid; }
  function newItem(from) {
    var it = {
      article: from ? from.article : "kleidung", byType: {}, texts: { title: "", size: "", price: "", old: "", extra: "" },
      collage: from ? from.collage : "1", photos: [null, null, null, null], extras: [], sel: 0, stickers: [], selSticker: null
    };
    if (from) it.stickers = from.stickers.map(function (k) {
      var c = JSON.parse(JSON.stringify(k)); c.id = nextId(); delete c._hw; delete c._hh; return c;
    });
    return it;
  }
  var first = newItem(null);
  first.texts = { title: "Weisses Kleid", size: "L", price: "15", old: "", extra: "" };
  s.items.push(first);

  function item() { return s.items[Math.min(s.cur, s.items.length - 1)]; }
  function H() { for (var i = 0; i < FORMATS.length; i++) if (FORMATS[i][0] === s.format) return FORMATS[i][2]; return 1350; }
  function hexRgb(h) { return [1, 3, 5].map(function (i) { return parseInt(h.slice(i, i + 2), 16); }); }
  function rgbHex(c) { return "#" + c.map(function (v) { return Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0"); }).join(""); }
  function rgba(h, a) { var c = hexRgb(h); return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a + ")"; }
  function mix(h, o, t) { var a = hexRgb(h), b = hexRgb(o); return rgbHex(a.map(function (v, i) { return v + (b[i] - v) * t; })); }
  function lum(h) { var c = hexRgb(h); return (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255; }
  function fontStr(size) { return FONTS[s.font].css.replace("{s}", size); }
  function article(it) { it = it || item(); for (var i = 0; i < ARTICLES.length; i++) if (ARTICLES[i].id === it.article) return ARTICLES[i]; return ARTICLES[0]; }
  function nCells(it) { return COLL_N[(it || item()).collage]; }
  function anyPhoto(it) { return (it || item()).photos.some(Boolean); }
  function missing(it) { it = it || item(); var m = 0; for (var i = 0; i < nCells(it); i++) if (!it.photos[i]) m++; return m; }
  function ready(it) { it = it || item(); return anyPhoto(it) && missing(it) === 0; }
  function colNone() { return !!(COLS[s.col] && COLS[s.col].none); }

  /* Preise */
  function num(v) { var n = parseFloat(String(v).replace(",", ".")); return isFinite(n) ? n : null; }
  function oldValid(it) { var o = num(it.texts.old), p = num(it.texts.price); return o != null && p != null && o > p && p >= 0; }
  function discount(it) { return oldValid(it) ? Math.round((1 - num(it.texts.price) / num(it.texts.old)) * 100) : null; }

  /* Untertitel im Bild als Teile (der alte Preis ist durchgestrichen). Bei Schuhen und Kindergrößen wird aus "38" ein "Gr. 38". */
  function subtitleParts(it) {
    it = it || item();
    var T = it.texts, a = article(it), sz = T.size.trim(), pr = T.price.trim(), old = T.old.trim(), ex = T.extra.trim(), P = [];
    if (sz && a.num && /^\d+([.,]\d)?$/.test(sz)) sz = "Gr. " + sz;
    function sep() { if (P.length) P.push({ t: " · " }); }
    if (sz) { sep(); P.push({ t: sz }); }
    if (pr) {
      sep();
      if (old && oldValid(it)) { P.push({ t: old + " €", strike: true }); P.push({ t: " " }); }
      P.push({ t: pr + " €" });
    }
    if (ex) { sep(); P.push({ t: ex }); }
    return P;
  }

  return {
    W: W, H: H, FORMATS: FORMATS, STYLES: STYLES, COLLAGES: COLLAGES, COLL_N: COLL_N, FREE: FREE, BGS: BGS, FONTS: FONTS, COLS: COLS,
    STK_COLORS: STK_COLORS, STK_KINDS: STK_KINDS, STICKERS: STICKERS, ARTICLES: ARTICLES, EMOJIS: EMOJIS, s: s,
    item: item, newItem: newItem, nextId: nextId, article: article, subtitleParts: subtitleParts,
    num: num, oldValid: oldValid, discount: discount,
    hexRgb: hexRgb, rgbHex: rgbHex, rgba: rgba, mix: mix, lum: lum, fontStr: fontStr,
    nCells: nCells, anyPhoto: anyPhoto, missing: missing, ready: ready, colNone: colNone
  };
})();
