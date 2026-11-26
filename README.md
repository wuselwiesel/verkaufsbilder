# Verkaufsbild Studio

Web-App, die aus Fotos Verkaufsbilder im Tise-Stil macht und als PNG speichert. Reines HTML, CSS und JavaScript, kein Build, kein Server.

## Funktionen

- **Stile:** Tise (Foto mit Verlauf), Karte, Bogen, Polaroid, Magazin
- **Collagen:** ein bis vier Fotos. Jedes Foto hat eigenen Zoom, Ausschnitt und eigene Korrektur.
- **Formate:** 4:5, 1:1 und Story (9:16)
- **Artikelart:** Kleidung, Schuhe, Taschen, Kinder, Bücher, Technik, Möbel, Spielzeug, Sonstiges. Felder, Schnellwahl und passende Aufkleber ändern sich mit der Art.
- **Aufkleber:** Preis, NEU, SALE, Neuwertig, Reserviert, Verkauft, Versand inklusive und mehr, dazu Emojis. Frei verschieben, drehen, vergrößern.
- **Foto verbessern:** Helligkeit, Kontrast, Farbe, „Automatisch verbessern“
- **Farben und Schrift:** Paletten, eigene Farben, „Passend zum Foto“, sechs Schriften
- Läuft als installierbare App (PWA) und nach dem ersten Laden offline. Auf dem Handy gibt es „Teilen“.
- Fotos bleiben im Browser. Gemerkt werden nur Stil, Farben, Texte und Aufkleber.

## Dateien

- `core.js` Zustand und Konstanten
- `render.js` Zeichnen auf dem Canvas
- `ui.js` Bedienung
- `sw.js`, `manifest.webmanifest` App-Installation und Offline-Betrieb

## Lokal starten

    python3 -m http.server 8080

Dann http://localhost:8080 öffnen.

## Veröffentlichen (GitHub Pages)

Einmalig im Repo: **Settings → Pages → Build and deployment → Source: „GitHub Actions“**. Danach veröffentlicht `.github/workflows/pages.yml` die Seite bei jeder Änderung auf `main` automatisch. Die Adresse steht oben im Lauf unter dem Reiter Actions.
