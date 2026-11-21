# Besuchsstatistik

## Stand

Die Integration ist implementiert, aber bewusst **nicht aktiviert**. Es wurde
kein GoatCounter-Konto erfunden oder ungeprüft einer fremden Kennung zugeordnet.
`config/analytics.json` enthält `enabled: false` und einen leeren `siteCode`.
Ohne aktivierte, gültige Konfiguration erfolgen keine Provider-Anfragen.

Die Verwaltungsseite liegt unter `/verwaltung/statistik.html`. Sie zeigt den
tatsächlichen Konfigurationszustand, keine erfundenen Besucherzahlen. Nach der
Aktivierung verlinkt sie das private, anmeldepflichtige GoatCounter-Dashboard.
Die Website selbst enthält weder API-Schlüssel noch Dashboard-Zugangsdaten.

## Einmalige Aktivierung

1. Die Eigentümerin legt unter https://www.goatcounter.com/signup ihr Konto an
   oder nennt ihr bestehendes Konto. Website: `tussy-van.de`.
2. Im Konto Domain und Dashboard-Sichtbarkeit prüfen: nur angemeldete Nutzer.
   Einzelne Pageviews und öffentliche Besucherzähler nicht aktivieren.
   Nicht benötigte Browser-, System-, Standort-, Sprach- und Bildschirmdetails
   können in den GoatCounter-Einstellungen abgeschaltet werden.
3. Nur den bestätigten Kontonamen in `config/analytics.json` als `siteCode`
   eintragen und `enabled` auf `true` setzen. Keine Kennung erraten und keine
   Zugangsdaten im Repository ablegen.
4. **Im gleichen Commit** den Absatz „keine Analyse-Werkzeuge“ und den
   deaktivierten Statistik-Hinweis in `datenschutz.html` aktualisieren. Die
   bisherige YouTube-Einwilligung gilt ausdrücklich nicht für Statistik.
   Die dann aktive Verarbeitung muss genannt werden: GoatCounter, Anbieter
   Martin Tournoij (Irland), Seitenpfad ohne Query/Fragment, Seitentitel,
   technische Verbindungs-/Browserdaten; statistische Verarbeitung laut
   https://www.goatcounter.com/help/privacy. Einwilligung und Widerruf über
   „Statistik-Einstellungen“; Speicherung dieser Entscheidung unter
   `tv-statistics-consent-v1`. Keine Tracking-Cookies; Hosting des Dienstes laut
   Anbieter bei Hetzner in Finnland/Deutschland. Keine pauschale Behauptung,
   dass überhaupt keine IP-Adresse verarbeitet wird.
5. Katalog und Checks ausführen, veröffentlichen, dann im echten Dashboard
   einen bewusst erlaubten Testaufruf prüfen. Erst danach „Zähler aktiv“ melden.

## Was gezählt wird

- Öffentliche HTML-Seiten von `https://tussy-van.de` und `www.tussy-van.de`.
- Ein Aufruf pro geladenem Dokument nach ausdrücklicher Statistik-Einwilligung.
  Erneutes Laden zählt erneut (`no_session: true`). Das ist **keine Messung
  unterschiedlicher Personen** und keine Aussage über vollständig gelesene Texte.
- Erst bei sichtbarem Dokument. GPC und Do Not Track verhindern die Erfassung.
- Sprachversionen werden derselben deutschen URL zugeordnet, mit einem stabilen
  deutschen Seitentitel. Keine personenbezogenen Query-Parameter, Fragmente oder
  Referrer werden absichtlich an die Statistik übergeben.
- Nur vorhandene öffentliche Seiten im automatisch erzeugten Katalog.
  `noindex`, Verwaltungsseiten und lokale Vorschauen werden nicht gezählt.
- Der Katalog wird bei jeder Veröffentlichung und Sprachgenerierung erneuert.

Ablehnung, Werbeblocker, JavaScript-Deaktivierung und Netzausfälle fehlen in den
Zahlen. Bots können einzelne Aufrufe verfälschen. Frühere Zugriffe lassen sich
nicht rückwirkend aus dieser Integration rekonstruieren.

## Prüfen

```sh
python3 scripts/build_analytics_catalog.py
node scripts/test_analytics.mjs
python3 scripts/generate_languages.py --validate-only
```

In GoatCounter die Seitenliste mit `/blog/` filtern, Zeitraum wählen, nach
Aufrufen sortieren und bei Bedarf CSV exportieren. Bedienungsgrundlagen:
https://www.goatcounter.com/help/start und https://www.goatcounter.com/help/js.
