# Eigene Besuchsstatistik

Gleiches Prinzip wie Systemfehler Familie (`vanlifemum-boop/familie-tischenreut`, `js/main.js`): ein eigener Collector speichert aggregierte Seitenaufrufe, ohne Besucherprofile und ohne Registrierung bei einem zusätzlichen Statistikdienst. Die Systeme verwenden getrennte Datenbanken.

## Betrieb

- Collector: https://tussy-van-statistik.workspace-vo-1968.chatgpt.site/api/track
- Auswertung: https://tussy-van-statistik.workspace-vo-1968.chatgpt.site/
- Einstieg: https://tussy-van.de/verwaltung/statistik.html
- Sites-Projekt: `appgprj_6b01454bb3bc81919b59b6e80c6d3540`
- Quellrepository des Collectors: über die Sites-Projektverwaltung zugänglich. Gehört nicht zur GitHub-Pages-Auslieferung.
- Beginn: 21. November 2026. Vorherige Aufrufe können nicht rekonstruiert werden.

Die öffentliche Zählung benötigt keine Anmeldung. Für das private Dashboard reicht das bestehende ChatGPT-Konto der Eigentümerin. Der Server prüft die von der Hosting-Plattform gesetzte Identität gegen die serverseitige ADMIN_EMAIL-Einstellung. Diese gehört weder in dieses Repository noch in den Browsercode.

## Daten und Grenzen

Gespeichert werden nur Datum (Europe/Berlin), kanonischer Seitenpfad und Anzahl. Kein IP-/Cookie-/Referrer-/Besucherprofil in der Statistikdatenbank. Technische IP-Verarbeitung durch Hosting-Infrastruktur ist davon zu unterscheiden. Aufrufe sind keine eindeutigen Personen; Reload zählt erneut. Keine rückwirkenden Schätzwerte.

`data/analytics-pages.json` enthält veröffentlichte öffentliche Seiten. Der Build aktualisiert ihn automatisch; der Collector übernimmt neue Pfade spätestens bei seiner nächsten stündlichen Aktualisierung. Verwaltungs-/noindex-Seiten und lokale Vorschauen werden nicht gezählt. Die Sprachfassungen DE/EN/ES/FR/PL zählen für denselben Beitrag.

Pro sichtbarem Dokument sendet `js/analytics.js` höchstens einen POST, mit ausgelassenen Credentials und ohne Referrer. DNT/GPC, bestehende Ablehnung und `_tv_stats=off` werden vor dem Senden geprüft. `_tv_stats=on` hebt die gespeicherte Ablehnung wieder auf; Datenschutzsignale des Browsers bleiben vorrangig. Speicherfehler verhindern die Website-Nutzung nicht. Bei Netzfehlern keine automatischen Wiederholungen, um Doppelzählungen zu vermeiden. Adblocker, Ausfälle oder gezielt manipulierte Aufrufe begrenzen die Aussagekraft.

## Prüfung

`node scripts/test_analytics.mjs` prüft das Browserverhalten. Der Collector hat eigene Tests für Origin-/Pfadvalidierung, atomare Zählung, Berliner Tagesgrenze, Privatsphärensignale und Zugriffsschutz. `/health` prüft die Tabelle ohne einen Besuch zu zählen. Die Auswertung bietet Datumsauswahl, Seitenliste, Tageswerte und CSV-Export. Die Trennung der beiden Websites ist im Collector durch fest zugelassene Tussy-Van-Origins umgesetzt.
