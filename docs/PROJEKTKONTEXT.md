# Tussy Van: Chat-Anforderungen und Arbeitsstand

Stand der Zusammenführung: 19.10.2026.
Geprüfte Codebasis: `main`, Commit `b8c7d86127a3ada3710d73258185859a9b9d6b4c`.

## Herkunft und Umfang

Dieses Dokument überträgt die im aktuellen Gespräch verfügbaren Projektangaben
in das Repository. Als Chatquelle liegt eine Zusammenfassung mit zwei früheren
Aufträgen vor. Der vollständige Verlauf, damalige Anhänge und konkrete
Kartenkorrekturen waren beim Abgleich nicht zugänglich. Die folgende Liste ist
daher eine belegte Teilübernahme, kein vollständiges Chatarchiv.

Die Aufträge aus dem Chat, Befunde aus dem Code und vorgeschlagene
Umsetzungsschritte werden getrennt aufgeführt. Ein dokumentierter Auftrag gilt
erst nach Umsetzung und Prüfung als erledigt.

## Belegte Aufträge aus dem Chat

| Datum | Thema | Verfügbarer Auftrag | Status dieses Abgleichs |
|---|---|---|---|
| 02.09.2026 | Polen-Kartenpunkte prüfen | Die Aktualisierung der Kartenpunkte wurde bestätigt. | Als offene Arbeit erfasst; die konkrete damalige Punkteliste fehlt. |
| 24.09.2026 | Website übersetzen | Bei tussy-van.de prüfen, warum Französisch, Polnisch und Spanisch fehlen, und diese Sprachen ergänzen. Im Zusammenhang mit diesem Auftrag wurde „Google nutzen“ bestätigt. | Technische Lücke im Repository festgestellt; Übersetzungen noch offen. |

Die Google-Bestätigung belegt keine konkrete technische Integrationsart.
Der vorhandene Englisch-Generator verwendet bereits einen Google-
Übersetzungsendpunkt; ob dieser Ansatz auch für die drei weiteren Sprachen
gewünscht war, lässt sich aus dem verfügbaren Ausschnitt nicht bestimmen.

## Mehrsprachigkeit

### Im Repository geprüft

| Sprache | HTML-Dateien | Umsetzung |
|---|---:|---|
| Deutsch | 57 | Quelldateien im Hauptverzeichnis, `blog/` und `ratgeber/` |
| Englisch | 43 | Statische Seiten unter `en/`, Generator und Laufzeit-Wörterbuch vorhanden |
| Französisch | 0 | Kein Verzeichnis `fr/` vorhanden |
| Polnisch | 0 | Kein Verzeichnis `pl/` vorhanden |
| Spanisch | 0 | Kein Verzeichnis `es/` vorhanden |

- [scripts/generate_english_site.py](../scripts/generate_english_site.py) ist auf
  Englisch ausgerichtet: Ausgabe nach `en/`, Cache
  `scripts/translations-de-en.json`, Wörterbuch `js/i18n-en.js`.
- [js/site.js](../js/site.js), Funktion `setupLanguageSwitch`, bietet nur
  Deutsch und Englisch an und bildet die Zieladresse aus dem aktuellen Pfad.
- Für 14 deutsche Seiten fehlt ein englisches Gegenstück.
  Der Sprachwechsel kann deshalb auf diesen Seiten auf nicht vorhandene
  Dateien zeigen.
- [js/polen-map-app.js](../js/polen-map-app.js) verwendet ebenfalls eine
  Deutsch-/Englisch-Unterscheidung für dynamische Texte.

Damit ist das Fehlen der drei gewünschten Sprachen im geprüften Code erklärt.
Dies ist ein Repository-Befund; die ausgelieferte Website wurde bei dieser
Zusammenführung nicht separat im Browser geprüft.

### Offene Umsetzung

- [ ] Französisch, Polnisch und Spanisch für die Website ergänzen.
- [ ] Dafür die bestehende Generierung und Sprachumschaltung erweitern oder
      die Integrationsart anhand des vollständigen Übersetzungs-Chats festlegen.
- [ ] Navigation, Seiteninhalte, Metadaten, Bildbeschreibungen und dynamisch
      erzeugte Karten-/Filtertexte in der Sprachabdeckung berücksichtigen.
- [ ] Interne Links und Sprachwechsel auf existierende Zielseiten prüfen;
      Sprache beim Wechsel zwischen Beiträgen erhalten.
- [ ] Die 14 fehlenden englischen Gegenstücke nachziehen.
- [ ] `lang`, Sprachverweise und Sitemap mit den tatsächlich verfügbaren
      Sprachseiten abgleichen.
- [ ] Sprachwechsel auf Startseite, Blog, Ratgeber, Polenkarte und Spiel
      einschließlich verschachtelter Pfade prüfen.

Diese Prüfpunkte sind technische Folgerungen aus dem Codeabgleich und keine
zusätzlich überlieferten Nutzerwünsche.

### Fehlende englische Gegenstücke

- `en/blog/airlineschienen-roter-t4.html`
- `en/blog/blauer-t4-getriebeschaden.html`
- `en/blog/camper-packliste-was-habe-ich-dabei.html`
- `en/blog/drei-kraftstoffe-benzin-gas-dieselheizung.html`
- `en/blog/erste-camper-toilette.html`
- `en/blog/gasanlage-kofferraum-reserverad.html`
- `en/blog/kochen-backen-kleinster-raum.html`
- `en/blog/mehr-stauraum-kofferraum-t4.html`
- `en/blog/piaski-granica-weichselnehrung.html`
- `en/blog/roter-t4-motorschaden-autobahn.html`
- `en/blog/winter-energylandia-polen.html`
- `en/blog/zehn-monate-leben-kleinster-raum.html`
- `en/blog/zusatzbatterie-unterm-sitz-strom-laden.html`
- `en/spiel.html`

## Polen-Kartenpunkte

### Zuständige Dateien

| Bereich | Datei |
|---|---|
| Kartenseite und eingebundene Datensätze | [polen.html](../polen.html) |
| Basisorte und Kartenstart | [js/polen.js](../js/polen.js) |
| Camper-/Stellplatzliste | [js/polen-camper.js](../js/polen-camper.js) |
| Importierte Naturplätze | [js/polen-naturplaetze.js](../js/polen-naturplaetze.js) |
| Importierte Servicepunkte | [js/polen-services.js](../js/polen-services.js) |
| Zusammenführung, Darstellung und Filter | [js/polen-map-app.js](../js/polen-map-app.js) |
| Naturplatz-Import | [scripts/import_wyprawomaniak_naturplaetze.js](../scripts/import_wyprawomaniak_naturplaetze.js) |
| Servicepunkt-Import | [scripts/import_wyprawomaniak_services.js](../scripts/import_wyprawomaniak_services.js) |

Die Naturplatzdatei nennt im Kopf den Stand **28.08.2026** und **99 Punkte**.
Die Servicedatei nennt **29.08.2026** und **4.734 Punkte**. Das sind die Angaben
der eingecheckten Dateien, keine aktuelle Prüfung der Orte.

Die vorhandenen Imports verwerfen ungültige, doppelte und außerhalb Polens
liegende Quellpunkte. Ein erfolgreicher Import allein bestätigt weder die
Ausstattung noch die aktuelle Zugänglichkeit eines Platzes.

### Offene Umsetzung

- [ ] Die im Chat vom 02.09.2026 gemeinten Punkte oder Korrekturen übernehmen,
      sobald die konkrete Liste vorliegt.
- [ ] Betroffene Koordinaten, Namen, Kategorien und Verweise anhand ihrer
      Quellen prüfen; Herkunft und Prüfdatum festhalten.
- [ ] Falls die importierten Datensätze betroffen sind, die vorhandenen
      Imports mit erreichbaren Quellen ausführen und den erzeugten Diff prüfen.
- [ ] Marker, Suche, Kategorien und Zielverweise nach den Änderungen prüfen.

Vorhandene Importbefehle, aus dem Repository-Hauptverzeichnis:

```bash
node scripts/import_wyprawomaniak_naturplaetze.js
node scripts/import_wyprawomaniak_services.js
```

Diese Befehle schreiben die jeweiligen Datendateien neu und benötigen die im
Skript hinterlegten Quellen. Der Service-Importer unterstützt zusätzlich
`WYPRAWOMANIAK_DATA_DIR` für lokale Quelldaten. Bei dieser Zusammenführung
wurden die Imports nicht ausgeführt und keine Koordinaten verändert.

## Nächste Ergänzung aus dem Chat

Für eine vollständige Übernahme werden noch die ursprüngliche Liste der
Polen-Korrekturen und weitere relevante Chatabschnitte bzw. Anhänge benötigt.
Bestätigte Details anschließend hier und in den zuständigen Quelldateien
ergänzen; offene Aufgaben erst nach Prüfung abhaken.
