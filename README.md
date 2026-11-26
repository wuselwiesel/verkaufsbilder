# Verkaufsbild Studio

Web-App, die aus Fotos Verkaufsbilder im Tise-Stil macht und als PNG speichert. Reines HTML, CSS und JavaScript, kein Build, kein Server.

## Funktionen

- **Meine Stile:** Format, Stil, Hintergrund, Schrift, Farben, Shop-Name und Aufkleber unter einem Namen speichern und mit einem Tipp wieder anwenden (auch auf alle Artikel der Serie). Die Stile bleiben auf dem Gerät.
- **Serie:** Mehrere Artikel in einem Durchgang. Neue Artikel übernehmen Look, Collage und Aufkleber, Texte und Fotos sind frei. „Alle als ZIP speichern“ packt die Titelbilder aller Artikel zusammen. Auf Wunsch kommen alle Einzelfotos als eigene Bilder dazu.
- **Titelbild aus mehreren Fotos:** „Titelbild automatisch“ verteilt alle Fotos eines Artikels auf die passende Collage. Weitere Fotos bleiben als Einzelbilder erhalten.
- **Collagen:** ein bis vier Fotos (nebeneinander, untereinander, drei, vier), zwei oder drei überlappende Karten, Vorher und Nachher
- **Preis:** Alter Preis wird durchgestrichen. Der Aufkleber „Rabatt“ rechnet den Prozentsatz selbst aus.
- **Hintergründe:** Verlauf, Papier, Holz, Leinen, Punkte, Streifen, Karo
- **Rückgängig und Wiederholen** (auch mit Strg+Z und Strg+Y)
- **Ganzes Foto zeigen:** Schneidet nichts ab, der Rest der Fläche wird mit einer weichen Kopie des Fotos gefüllt. Gut für Ganzkörperfotos.
- **Große Bilder:** Größere Vorschau, „Vorschau in voller Größe“ und auf Wunsch Speichern in doppelter Auflösung (2160 px breit)
- **Stile:** Tise, Leiste (Foto oben, Text in einer Leiste darunter), Karte, Bogen, Polaroid, Magazin. **Formate:** 4:5, 3:4, 2:3 hoch, 1:1, Story (9:16)
- **Artikelart:** Kleidung, Schuhe, Taschen, Kinder, Bücher, Technik, Möbel, Spielzeug, Sonstiges. Felder, Schnellwahl (Größen, Zustand) und passende Aufkleber ändern sich mit der Art.
- **Aufkleber:** Preis, Rabatt, NEU, SALE, Neuwertig, Reserviert, Verkauft, Versand inklusive und mehr, dazu Emojis. Frei verschieben, drehen, vergrößern.
- **Foto verbessern:** Helligkeit, Kontrast, Farbe, „Automatisch verbessern“. **Farben und Schrift:** Paletten, eigene Farben, „Passend zum Foto“, sechs Schriften.
- Läuft als installierbare App (PWA) und nach dem ersten Laden offline. Auf dem Handy gibt es „Teilen“.
- Fotos bleiben im Browser. Gemerkt werden Stil, Farben, Texte, Aufkleber und die Artikelliste der Serie, aber nicht die Fotos selbst.

## Dateien

- `core.js` Zustand und Konstanten
- `render.js` Zeichnen auf dem Canvas
- `ui.js` Bedienung
- `zip.js` einfacher ZIP-Schreiber
- `sw.js`, `manifest.webmanifest` App-Installation und Offline-Betrieb

## Lokal starten

    python3 -m http.server 8080

Dann http://localhost:8080 öffnen.

## Veröffentlichen (GitHub Pages)

Einmalig im Repo: **Settings → Pages → Build and deployment → Source: „GitHub Actions“**. Danach veröffentlicht `.github/workflows/pages.yml` die Seite bei jeder Änderung auf `main` automatisch. Die Adresse steht oben im Lauf unter dem Reiter Actions.
