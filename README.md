# Tussy Van — Lifestyle- & Reise-Website

Website zum YouTube-Kanal [@tussyvan](https://youtube.com/@tussyvan):
Eine Frau reist mit ihrem blauen VW T4 durch Europa — Reiseziele, Blog
(inkl. „Frau schraubt selbst"), animierte Europakarte mit mitfahrendem Bulli
und DSGVO-Grundausstattung. Statisches HTML/CSS/JS, kein Build-Schritt.

## Lokal ansehen

```bash
cd tussy-van
python3 -m http.server 8080
# → http://localhost:8080
```

(Ein Server ist nötig, weil die Europakarte per `fetch` geladen wird.)

## Wo ändere ich was?

| Was | Wo |
|---|---|
| **YouTube-Kanal-ID** (aktiviert „Neueste Videos"-Playlist) | `js/site.js` → `CONFIG.youtubeChannelId` — die ID (beginnt mit `UC…`) findest du in YouTube Studio → Einstellungen → Kanal → Erweiterte Einstellungen |
| **Newsletter-Anbieter** (Brevo, Mailchimp, …) | `js/site.js` → `CONFIG.newsletterAction` (Form-Action-URL des Anbieters eintragen) |
| **Reiseziele** (Tipps, Stellplätze, Filter) | `js/destinations.js` — einfach Einträge kopieren/ändern |
| **Blog-Beiträge** | Ordner `blog/` — bestehenden Artikel kopieren, Text ändern, auf `blog.html` und ggf. Startseite verlinken |
| **Texte der Startseite / Über mich** | direkt in `index.html` / `ueber-mich.html` |
| **Browser-Spiel „Pack & Go“** | `spiel.html`, `css/game.css` und `js/game.js` |
| **Fotos** | `img/hero-tussy.jpg` (Startseite) und `img/tussy-bulli.jpg` (Über mich) ersetzen |
| **Farben** | `css/site.css` → `:root`-Variablen (`--blue`, `--neon`, `--terra`, …) |
| **Routen-Stationen der Karte** | `js/route-points.json` (Koordinaten) + passende Einträge in `js/destinations.js` (gleiche `id`) |
| **Impressum / Datenschutz** | `impressum.html`, `datenschutz.html` — `[PLATZHALTER]` ersetzen! |

## Shop freischalten (vorbereitet)

`shop.html` existiert bereits, ist aber unverlinkt und per `noindex` versteckt.
Zum Livegang: Hinweis-Kommentar am Dateianfang befolgen (Produkte bzw.
Shopify-Buy-Button/WooCommerce-Embed einfügen, `noindex` entfernen,
Nav-Link ergänzen).

## DSGVO-Ausstattung

- Cookie-Banner (nur technisch notwendige Speicherung; Entscheidung in `localStorage`)
- YouTube als Zwei-Klick-Lösung über `youtube-nocookie.com`
- Schriften lokal gehostet (kein Google-Fonts-CDN)
- Impressum + Datenschutzerklärung als Vorlagen mit Platzhaltern

## Technik

- Statisch: HTML + CSS + Vanilla JS, Lenis Smooth Scroll (vendored)
- Europakarte: aus Natural-Earth-Daten generiert (Public Domain), Route/Bulli in `js/site.js`
- SEO: Meta/OG-Tags, JSON-LD, `sitemap.xml`, `robots.txt`
- Der kleine Bulli am rechten Seitenrand fährt mit dem Scroll-Fortschritt

## Englische Sprachversion aktualisieren

Alle deutschen HTML-Seiten haben ein vollständiges Gegenstück unter `/en/`.
Neue oder geänderte Beiträge werden samt internen Links, Metadaten und den
dynamisch erzeugten Karteninhalten mit diesem Befehl aktualisiert:

```bash
python3 scripts/generate_english_site.py
```

Die Übersetzungen werden lokal in `scripts/translations-de-en.json` gespeichert;
dieser Cache wird nicht veröffentlicht. Mit `--offline` lässt sich anschließend
prüfen, ob der lokale Übersetzungsspeicher vollständig ist, ohne eine
Netzwerkverbindung zu verwenden. Die englischen Rechtsseiten verweisen bewusst
auf die maßgeblichen deutschen Originalseiten, damit persönliche Angaben nicht
in zusätzlichen Dateien dupliziert werden.

## Europa-Entsorgungsdaten aktualisieren

`scripts/import_entsorgungsstationen.py` liest die enthaltene Bordatlas-PDF,
entfernt Dubletten und ergänzt nur Stationen, die nicht schon in der
handkuratierten Liste stehen. Für die näherungsweisen Kartenpositionen werden
lokale GeoNames-Exporte `allCountries.txt` (Postleitzahlen) und `cities1000.txt`
(Ortsnamen) benötigt:

```bash
python3 scripts/import_entsorgungsstationen.py \
  --postal-data /pfad/zu/allCountries.txt \
  --cities-data /pfad/zu/cities1000.txt
```

Die generierte Datei ist `js/entsorgung-europa-bordatlas.js`. Die Quelldaten
haben den Stand 2020; Verfügbarkeit und Ausstattung müssen vor der Anfahrt
geprüft werden.
