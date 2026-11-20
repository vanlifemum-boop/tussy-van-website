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

Aktualisierung vom 20.11.2026: Der aktuelle Auftrag ist die Veröffentlichung
aller Sprachversionen einschließlich Spanisch, Französisch und Polnisch.

| Sprache | HTML-Dateien | Pfad |
|---|---:|---|
| Deutsch | 57 | `/` |
| Englisch | 57 | `/en/` |
| Spanisch | 57 | `/es/` |
| Französisch | 57 | `/fr/` |
| Polnisch | 57 | `/pl/` |

Die vorher fehlenden 14 englischen Seiten sind enthalten. Die neuen Fassungen
werden aus den aktuellen deutschen Quellen erzeugt. Die Übersetzungen sind
maschinell erstellt; die rechtlichen Volltexte bleiben auf den deutschen
Originalseiten, zu denen jede Sprachfassung verlinkt.

Zuständig sind `scripts/generate_languages.py`, die gespeicherten Wörterbücher
unter `translations/` und die Laufzeitvorlage `scripts/runtime-i18n.js`.
Der frühere Google-Endpunkt war bei der Erstellung nicht verfügbar; für die
neuen statischen Übersetzungen wurde Microsoft Translator genutzt. Auf der
veröffentlichten Website ist kein externer Übersetzungsdienst eingebettet.

Die Sprachauswahl ist direkt im HTML enthalten und funktioniert ohne JavaScript.
Sie verweist auch in verschachtelten Blog- und Ratgeberpfaden auf alle fünf
Gegenstücke. Jede Seite enthält Sprachkennzeichnung, kanonische URL und
`hreflang`-Verweise; die Sitemap umfasst die indexierbaren Sprachseiten.

Die Prüfung erfolgt über `--validate-only` (alle Seiten und lokalen Verweise)
und `node scripts/check_languages.mjs` (dynamische Übersetzung, Zähler,
Spieltexte und Schutz vor wiederholter Übersetzung). Änderungen an den
Polen-Koordinaten sind nicht Teil dieser Sprachveröffentlichung.

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
