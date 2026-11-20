# Polen nach Regionen

Stand: 21. November 2026.

- `schlesien-entdecken.html`: alle 19 Städte aus dem Menü „Odkryj“ von https://slaskie.travel/; der Einstieg https://pskbb.slaskie.travel/ behandelt speziell Bielsko-Biała.
- 17 neue Artikel unter `blog/schlesien-*.html`; vorhandene Berichte zu Bielsko-Biała und Częstochowa sind eingebunden.
- Die Ortsartikel sind recherchierte Reiseideen mit Vorschlägen für den Aufenthalt. Sie behaupten keine nicht belegten persönlichen Besuche.
- `masuren-entdecken.html`: erste Übersicht mit Giżycko, Mikołajki, Ruciane-Nida und weiteren Orten der Masurischen Radrunde; weitere persönliche Reiseberichte können ergänzt werden.
- `ostsee-entdecken.html`: Reisebausteine von Świnoujście durch Pommern bis Piaski; vorhandene persönliche Berichte zu Danzig/Dreistadt und Piaski sind verlinkt.
- Neue Inhalte immer zuerst in den deutschen HTML-Dateien ändern, anschließend `python3 scripts/generate_languages.py` ausführen. Der Offline-Modus verwendet die eingecheckten Übersetzungen.

## Bielsko-Biała im Advent

`blog/bielsko-biala-weihnachtszeit.html` enthält sechs persönliche Fotografien aus der übergebenen Bildserie vom Dezember 2023. Die Jahresangabe stammt aus den Originaldateinamen. Es werden keine Markttermine oder eine identische Beleuchtung für 2026 behauptet.

Fünf Motive wurden lediglich für das Web in WebP umgewandelt. `img/blog/bielsko-weihnachten/tussy-reksio-bearbeitet.webp` ist die mit dem integrierten Bildwerkzeug bearbeitete Selfie-Fassung: Kind und weiterer Passant entfernt. Das Original mit Kind gehört nicht in das öffentliche Repository. Die Bildunterschrift kennzeichnet die Entfernung weiterer Personen.

Die sechs Assets werden sprachübergreifend verwendet; Bildbeschreibungen und Bildunterschriften sind übersetzt. Der automatische Navigationsbutton führt nach dieser Veröffentlichung zum Weihnachtsbericht.

## Prüfungen

Die Seitengenerierung prüft Sprachzuordnung, Navigation, SEO-Metadaten sowie lokale Links und Assets. Für das automatische Blogziel bestehen gesonderte Tests in `scripts/test_latest_blog.py`. Die Blogsuche erfasst auch die neuen Ortsartikel.
