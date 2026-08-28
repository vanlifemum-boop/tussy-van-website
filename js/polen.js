/* Polen-Serie: animierte Polen-Karte + Regionen-/Kategorie-Filter + Suche + Legende.
   Neue Orte einfach in POLEN_DATA ergänzen — Karte, Filter, Suche und Legende
   aktualisieren sich automatisch.
   Felder je Ort:
     id, name, short, region (Schlüssel aus POLEN_REGIONS),
     kat  = Kategorie-Schlüssel aus POLEN_KATEGORIEN (Emoji-Icon auf dem Marker),
     status = "bericht" (💛 eigener Reisebericht) | "sehenswert" (🔵 neutrale Info) | "ziel" (⚪ Reiseziel),
     x, y (Koordinaten der Europakarte 0..820/0..940), lx/ly = Label-Versatz,
     url, blurb, meta.
   Koordinaten neuer Orte per Formel aus realer lon/lat:
     x = 13.758*lon − 0.761*lat + 311.25 ;  y = −1.117*lon − 22.948*lat + 1625.66 */
window.POLEN_DATA = [
  {
    id: "danzig", name: "Danzig / Gdańsk", short: "Danzig", region: "norden",
    kat: "stadt", status: "bericht",
    x: 528, y: 358, lx: 9, ly: -1,
    url: "blog/danzig-ehrlich-dreistadt-bernstein.html", meta: "Norden & Ostsee · 7 Min.",
    blurb: "Traumhafte Altstadt, viel grauer Beton, die Dreistadt mit Sopot & Gdynia — plus Bernstein- und WWII-Museum."
  },
  {
    id: "kolberg", name: "Kołobrzeg", short: "Kolberg", region: "norden",
    kat: "stadt", status: "ziel",
    x: 483.8, y: 365.1, lx: 9, ly: -1,
    url: "reiseziele.html#kolberg", meta: "Norden & Ostsee",
    blurb: "Weiße Ostseestrände, Kiefernwälder und der beste Sonnenuntergang direkt vor der Schiebetür."
  },
  {
    id: "posen", name: "Posen / Poznań", short: "Posen", region: "westen",
    kat: "stadt", status: "ziel",
    x: 503.9, y: 403.3, lx: -9, ly: -1,
    url: "reiseziele.html#posen", meta: "Westen",
    blurb: "Prachtvoller Marktplatz mit den kämpfenden Ziegenböckchen am Rathaus — Charme-Zwischenstopp."
  },
  {
    id: "breslau", name: "Breslau / Wrocław", short: "Breslau", region: "westen",
    kat: "stadt", status: "ziel",
    x: 507.4, y: 431.9, lx: -9, ly: 3,
    url: "reiseziele.html#breslau", meta: "Westen",
    blurb: "Bunte Altstadt, romantische Dominsel und über 300 versteckte Bronze-Zwerge zum Suchen."
  },
  {
    id: "warschau", name: "Warschau", short: "Warschau", region: "zentral",
    kat: "stadt", status: "bericht",
    x: 559.3, y: 402.1, lx: 9, ly: -1,
    url: "blog/warschau-goldene-gans-museumsnacht.html", meta: "Zentralpolen · 7 Min.",
    blurb: "Die Legende der Goldenen Gans, Stalins Kulturpalast mit 360-Grad-Blick, die Nacht der Museen & der BUW-Dachgarten."
  },
  {
    id: "tschenstochau", name: "Częstochowa", short: "Tschenstochau", region: "sueden",
    kat: "stadt", status: "bericht",
    x: 533, y: 445, lx: -9, ly: -1,
    url: "blog/tschenstochau-schwarze-madonna.html", meta: "Süden · 6 Min.",
    blurb: "Die Schwarze Madonna auf dem Klosterberg Jasna Góra und die charmante Altstadt gleich nebenan."
  },
  {
    id: "krakau", name: "Kraków", short: "Krakau", region: "sueden",
    kat: "stadt", status: "bericht",
    x: 550, y: 451.5, lx: 9, ly: 4,
    url: "blog/krakau-tuchhallen-drache.html", meta: "Süden · 6 Min.",
    blurb: "Tuchhallen, süße Markt-Sünden einer älteren Dame und der feuerspuckende Wawel-Drache samt Legende."
  },
  {
    id: "torun", name: "Toruń / Thorn", short: "Toruń", region: "zentral",
    kat: "stadt", status: "ziel",
    x: 526.8, y: 388.3, lx: -9, ly: -1,
    url: "https://www.google.com/maps/search/?api=1&query=Torun+Stare+Miasto", meta: "Zentralpolen",
    blurb: "Gotische Altstadt (UNESCO), Geburtsstadt von Kopernikus — und Heimat der berühmten Lebkuchen (Pierniki)."
  },
  {
    id: "zakopane", name: "Zakopane", short: "Zakopane", region: "sueden",
    kat: "stadt", status: "ziel",
    x: 548.2, y: 472.1, lx: -9, ly: 3,
    url: "https://www.google.com/maps/search/?api=1&query=Zakopane", meta: "Süden · Tatra",
    blurb: "Polens Wintersport-Hauptstadt am Fuß der Hohen Tatra — Holzarchitektur, Krupówki-Flaniermeile und Oscypek-Käse vom Grill."
  },
  {
    id: "szczecin", name: "Stettin / Szczecin", short: "Stettin", region: "westen",
    kat: "stadt", status: "ziel",
    x: 470.8, y: 383.3, lx: 9, ly: -1,
    url: "https://www.google.com/maps/search/?api=1&query=Szczecin+Waly+Chrobrego", meta: "Westen · Oder",
    blurb: "Hafenstadt an der Oder mit der prächtigen Hakenterrasse (Wały Chrobrego) und viel maritimem Flair — perfekt für den Grenz-Stopp."
  },
  {
    id: "lublin", name: "Lublin", short: "Lublin", region: "zentral",
    kat: "stadt", status: "ziel",
    x: 582.7, y: 424.5, lx: 9, ly: -1,
    url: "https://www.google.com/maps/search/?api=1&query=Lublin+Stare+Miasto", meta: "Osten",
    blurb: "Der Geheimtipp im Osten: verwinkelte Renaissance-Altstadt, Burg mit byzantinischen Fresken und junge Kulturszene."
  },
  {
    id: "lodz", name: "Łódź", short: "Łódź", region: "zentral",
    kat: "stadt", status: "ziel",
    x: 539.6, y: 416.2, lx: -9, ly: -1,
    url: "https://www.google.com/maps/search/?api=1&query=Lodz+Piotrkowska", meta: "Zentralpolen",
    blurb: "Vom Industrie-Manchester zur Street-Art-Stadt: die endlose Piotrkowska-Straße, Lofts in alten Fabriken und Filmgeschichte."
  },
  {
    id: "sandomierz", name: "Sandomierz", short: "Sandomierz", region: "sueden",
    kat: "stadt", status: "ziel",
    x: 571.9, y: 438.3, lx: 9, ly: -1,
    url: "https://www.google.com/maps/search/?api=1&query=Sandomierz+Rynek", meta: "Südosten",
    blurb: "Eines der schönsten Kleinstädtchen Polens: Renaissance-Marktplatz auf dem Hügel über der Weichsel, unterirdische Gänge inklusive."
  },
  {
    id: "kazimierz-dolny", name: "Kazimierz Dolny", short: "Kazimierz D.", region: "zentral",
    kat: "stadt", status: "ziel",
    x: 574.2, y: 423.3, lx: -9, ly: 3,
    url: "https://www.google.com/maps/search/?api=1&query=Kazimierz+Dolny+Rynek", meta: "Osten · Weichsel",
    blurb: "Künstlerstädtchen an der Weichsel mit Renaissance-Markt, Burgruine und dem berühmten Hahn-Gebäck (Kogut) aus der Bäckerei."
  },
  {
    id: "masuren", name: "Masuren / Mazury", short: "Masuren", region: "masuren",
    kat: "natur", status: "sehenswert",
    x: 567.1, y: 367, lx: 9, ly: -1,
    url: "reiseziele.html#masuren", meta: "Masuren · Natur & Aussicht",
    blurb: "Polens großes Seenland im Nordosten: über 2.000 Seen, Wälder und Kanäle — ein Traum zum Segeln, Kanufahren und für Natur pur. Eines der beliebtesten Reiseziele des Landes."
  },

  /* ---- 🏛️ Museen & Gedenkstätten (Sehenswertes) ---- */
  {
    id: "polin", name: "POLIN — Museum der Geschichte der polnischen Juden", region: "zentral",
    kat: "museum", status: "sehenswert", x: 560.3, y: 403.2,
    url: "https://www.google.com/maps/search/?api=1&query=POLIN+Museum+Warszawa", meta: "Warschau · Museum",
    blurb: "Preisgekröntes Museum zur 1000-jährigen Geschichte der polnischen Juden — beeindruckende Architektur und eine der besten interaktiven Ausstellungen Europas."
  },
  {
    id: "kopernik-waw", name: "Kopernikus-Wissenschaftszentrum", region: "zentral",
    kat: "museum", status: "sehenswert", x: 560.8, y: 403.3,
    url: "https://www.google.com/maps/search/?api=1&query=Centrum+Nauki+Kopernik+Warszawa", meta: "Warschau · Museum",
    blurb: "Riesiges Mitmach-Wissenschaftszentrum an der Weichsel — hunderte Experimente zum Anfassen. Ein Hit für Familien und Neugierige."
  },
  {
    id: "schindler", name: "Schindlers Fabrik (Fabryka Schindlera)", region: "sueden",
    kat: "museum", status: "sehenswert", x: 547.8, y: 454.9,
    url: "https://www.google.com/maps/search/?api=1&query=Fabryka+Schindlera+Krakow", meta: "Krakau · Museum",
    blurb: "Bewegendes Museum im ehemaligen Werk von Oskar Schindler — erzählt eindringlich vom Krakau der Besatzungsjahre 1939–1945."
  },
  {
    id: "auschwitz", name: "Gedenkstätte Auschwitz-Birkenau", region: "sueden",
    kat: "museum", status: "sehenswert", x: 537.4, y: 456.2,
    url: "https://www.google.com/maps/search/?api=1&query=Auschwitz-Birkenau+Memorial", meta: "Oświęcim · Gedenkstätte",
    blurb: "Die Gedenkstätte des früheren deutschen KZ- und Vernichtungslagers — ein stiller, erschütternder Ort des Erinnerns. Eintritt frei, Zeitfenster vorab reservieren."
  },
  {
    id: "wieliczka", name: "Salzbergwerk Wieliczka", region: "sueden",
    kat: "museum", status: "sehenswert", x: 549.1, y: 456.2,
    url: "https://www.google.com/maps/search/?api=1&query=Kopalnia+Soli+Wieliczka", meta: "Wieliczka · Bergwerk",
    blurb: "UNESCO-Welterbe: ein jahrhundertealtes Salzbergwerk mit Kammern, unterirdischen Seen und einer kompletten Kapelle aus Salz — tief unter der Erde."
  },
  {
    id: "ecs", name: "Europäisches Solidarność-Zentrum (ECS)", region: "norden",
    kat: "museum", status: "sehenswert", x: 526.5, y: 357.4,
    url: "https://www.google.com/maps/search/?api=1&query=Europejskie+Centrum+Solidarnosci+Gdansk", meta: "Danzig · Museum",
    blurb: "Modernes Museum auf der Danziger Werft zur Solidarność-Bewegung, die den Fall des Eisernen Vorhangs mit anstieß. Dachterrasse mit Werftblick."
  },
  {
    id: "wwii-danzig", name: "Museum des Zweiten Weltkriegs", region: "norden",
    kat: "museum", status: "sehenswert", x: 526.4, y: 357.6,
    url: "https://www.google.com/maps/search/?api=1&query=Muzeum+II+Wojny+Swiatowej+Gdansk", meta: "Danzig · Museum",
    blurb: "Eines der beeindruckendsten Geschichtsmuseen Europas: die große Ausstellung liegt unter der Erde, der schiefe Turm ist weithin sichtbar."
  },
  {
    id: "hydropolis", name: "Hydropolis", region: "westen",
    kat: "museum", status: "sehenswert", x: 507.0, y: 433.8,
    url: "https://www.google.com/maps/search/?api=1&query=Hydropolis+Wroclaw", meta: "Breslau · Museum",
    blurb: "Interaktives Wasser-Erlebniszentrum in einem historischen Wasserspeicher — modern, familienfreundlich und rund ums Element Wasser."
  },
  {
    id: "panorama-rac", name: "Panorama Racławicka", region: "westen",
    kat: "museum", status: "sehenswert", x: 506.9, y: 433.9,
    url: "https://www.google.com/maps/search/?api=1&query=Panorama+Raclawicka+Wroclaw", meta: "Breslau · Museum",
    blurb: "Ein gewaltiges Rundgemälde (114 × 15 m) der Schlacht von Racławice — man steht mittendrin. Ein einzigartiges Kunsterlebnis."
  },
  {
    id: "natmus-poznan", name: "Nationalmuseum Posen", region: "westen",
    kat: "museum", status: "sehenswert", x: 504.3, y: 404.1,
    url: "https://www.google.com/maps/search/?api=1&query=Muzeum+Narodowe+Poznan", meta: "Posen · Museum",
    blurb: "Bedeutende Sammlung polnischer und europäischer Malerei am Rand des Alten Markts — von Alten Meistern bis zur Moderne."
  },
  {
    id: "kopernik-torun", name: "Haus des Nikolaus Kopernikus (Toruń)", region: "zentral",
    kat: "museum", status: "sehenswert", x: 526.9, y: 388.4,
    url: "https://www.google.com/maps/search/?api=1&query=Dom+Mikolaja+Kopernika+Torun", meta: "Toruń · Museum",
    blurb: "Im Geburtshaus des Astronomen Nikolaus Kopernikus in der gotischen Altstadt von Toruń — dazu die berühmten Toruńer Lebkuchen (Pierniki)."
  },
  {
    id: "wolfsschanze", name: "Wolfsschanze / Wilczy Szaniec", region: "masuren",
    kat: "museum", status: "sehenswert", x: 565.8, y: 360.6,
    url: "https://www.google.com/maps/search/?api=1&query=Wilczy+Szaniec+Gierloz", meta: "Masuren · Gedenkort",
    blurb: "Die Ruinen von Hitlers einstigem Führerhauptquartier im masurischen Wald — riesige gesprengte Bunker, Schauplatz des Attentats vom 20. Juli 1944."
  },

  /* ---- ⛪ Kirchen, Klöster & Wallfahrt (Sehenswertes) ---- */
  {
    id: "marienk-krakau", name: "Marienkirche Krakau (Bazylika Mariacka)", region: "sueden",
    kat: "sakral", status: "sehenswert", x: 547.5, y: 454.6,
    url: "https://www.google.com/maps/search/?api=1&query=Bazylika+Mariacka+Krakow", meta: "Krakau · Kirche",
    blurb: "Gotische Backsteinkirche am Hauptmarkt mit dem weltberühmten Hochaltar von Veit Stoß — zu jeder vollen Stunde erklingt vom Turm der Hejnał."
  },
  {
    id: "wawel-kat", name: "Wawel-Kathedrale", region: "sueden",
    kat: "sakral", status: "sehenswert", x: 547.4, y: 454.8,
    url: "https://www.google.com/maps/search/?api=1&query=Katedra+Wawelska+Krakow", meta: "Krakau · Kirche",
    blurb: "Krönungs- und Grabkirche der polnischen Könige auf dem Wawel-Hügel — nationales Heiligtum mit der berühmten Sigismund-Glocke."
  },
  {
    id: "marienk-danzig", name: "Marienkirche Danzig (Bazylika Mariacka)", region: "norden",
    kat: "sakral", status: "sehenswert", x: 526.5, y: 357.7,
    url: "https://www.google.com/maps/search/?api=1&query=Bazylika+Mariacka+Gdansk", meta: "Danzig · Kirche",
    blurb: "Eine der größten Backsteinkirchen der Welt — der Turm bietet einen weiten Blick über die Altstadt und die Mottlau."
  },
  {
    id: "oliwa", name: "Kathedrale Oliwa", region: "norden",
    kat: "sakral", status: "sehenswert", x: 525.2, y: 356.3,
    url: "https://www.google.com/maps/search/?api=1&query=Katedra+Oliwska+Gdansk", meta: "Danzig · Kirche",
    blurb: "Berühmt für ihre prächtige Barockorgel — regelmäßige Orgelkonzerte lassen die Kathedrale im Danziger Stadtteil Oliwa erklingen."
  },
  {
    id: "swidnica", name: "Friedenskirche Schweidnitz (Świdnica)", region: "westen",
    kat: "sakral", status: "sehenswert", x: 499.4, y: 440.5,
    url: "https://www.google.com/maps/search/?api=1&query=Kosciol+Pokoju+Swidnica", meta: "Świdnica · Kirche",
    blurb: "UNESCO-Welterbe: eine der größten Fachwerkkirchen Europas, komplett aus Holz und Lehm — ein evangelisches Meisterwerk aus dem 17. Jahrhundert."
  },
  {
    id: "jawor", name: "Friedenskirche Jauer (Jawor)", region: "westen",
    kat: "sakral", status: "sehenswert", x: 495.2, y: 436.1,
    url: "https://www.google.com/maps/search/?api=1&query=Kosciol+Pokoju+Jawor", meta: "Jawor · Kirche",
    blurb: "UNESCO-Welterbe: prächtige barocke Fachwerkkirche mit reich bemalten Emporen — der Schwesterbau der Schweidnitzer Friedenskirche."
  },
  {
    id: "lichen", name: "Basilika Licheń", region: "zentral",
    kat: "sakral", status: "sehenswert", x: 527.1, y: 404.4,
    url: "https://www.google.com/maps/search/?api=1&query=Bazylika+Lichen+Stary", meta: "Licheń · Wallfahrt",
    blurb: "Die größte Kirche Polens und eine der größten der Welt — ein gewaltiger Wallfahrtsort mit riesiger Kuppel und hohem Turm."
  },
  {
    id: "debno", name: "Holzkirche Dębno (UNESCO)", region: "sueden",
    kat: "sakral", status: "sehenswert", x: 550.6, y: 467.6,
    url: "https://www.google.com/maps/search/?api=1&query=Kosciol+Debno+Podhalanskie", meta: "Dębno · Holzkirche",
    blurb: "UNESCO-Welterbe: eine der schönsten gotischen Holzkirchen Südpolens, innen mit farbenprächtiger Bemalung aus dem 15. Jahrhundert."
  },
  {
    id: "wang", name: "Wang-Kirche Karpacz", region: "sueden",
    kat: "sakral", status: "sehenswert", x: 489.1, y: 442.9,
    url: "https://www.google.com/maps/search/?api=1&query=Swiatynia+Wang+Karpacz", meta: "Karpacz · Kirche",
    blurb: "Eine norwegische Stabkirche aus dem 12. Jahrhundert, im 19. Jh. ins Riesengebirge versetzt — ein außergewöhnliches Holzbauwerk in Karpacz."
  },
  {
    id: "frombork", name: "Kathedrale Frombork (Frauenburg)", region: "norden",
    kat: "sakral", status: "sehenswert", x: 540.7, y: 356.3,
    url: "https://www.google.com/maps/search/?api=1&query=Bazylika+katedralna+Frombork", meta: "Frombork · Kirche",
    blurb: "Die Kathedrale von Frauenburg, Wirkungsstätte des Astronomen Nikolaus Kopernikus, der hier begraben liegt — mit Museum und Aussichtsturm."
  },
  {
    id: "gniezno", name: "Kathedrale Gniezno", region: "westen",
    kat: "sakral", status: "sehenswert", x: 513.5, y: 400.4,
    url: "https://www.google.com/maps/search/?api=1&query=Katedra+Gniezno", meta: "Gniezno · Kirche",
    blurb: "Die erste Kathedrale Polens und historische Krönungskirche — mit der berühmten bronzenen Gnesener Tür aus dem 12. Jahrhundert."
  },
  {
    id: "kalwaria", name: "Kalwaria Zebrzydowska", region: "sueden",
    kat: "sakral", status: "sehenswert", x: 544.0, y: 459.4,
    url: "https://www.google.com/maps/search/?api=1&query=Kalwaria+Zebrzydowska+Sanktuarium", meta: "Kalwaria · Wallfahrt",
    blurb: "UNESCO-Welterbe: manieristischer Wallfahrtskomplex mit Kloster und einem Weg aus Kapellen in parkartiger Landschaft."
  },

  /* ---- 🏰 Burgen & Schlösser (Sehenswertes) ---- */
  {
    id: "malbork", name: "Marienburg / Zamek w Malborku", region: "norden",
    kat: "burg", status: "sehenswert", x: 531.9, y: 364.3,
    url: "https://www.google.com/maps/search/?api=1&query=Zamek+w+Malborku", meta: "Malbork · UNESCO",
    blurb: "Die größte Backsteinburg der Welt — gewaltiger Sitz des Deutschen Ordens an der Nogat. Für die Besichtigung ruhig einen halben Tag einplanen."
  },
  {
    id: "wawel-schloss", name: "Wawel-Schloss Krakau", region: "sueden",
    kat: "burg", status: "sehenswert", x: 547.4, y: 454.8,
    url: "https://www.google.com/maps/search/?api=1&query=Zamek+Krolewski+na+Wawelu", meta: "Krakau · Schloss",
    blurb: "Die Königsresidenz auf dem Wawel-Hügel: Renaissance-Arkadenhof, Kronschatz und unten am Fluss die Drachenhöhle samt feuerspuckendem Drachen."
  },
  {
    id: "ksiaz", name: "Schloss Fürstenstein / Zamek Książ", region: "westen",
    kat: "burg", status: "sehenswert", x: 496.7, y: 440.7,
    url: "https://www.google.com/maps/search/?api=1&query=Zamek+Ksiaz+Walbrzych", meta: "Wałbrzych · Schloss",
    blurb: "Polens drittgrößtes Schloss thront über einer Waldschlucht — mit geheimnisvollen Nazi-Tunneln aus dem Projekt „Riese“ im Untergrund."
  },
  {
    id: "moszna", name: "Schloss Moszna", region: "sueden",
    kat: "burg", status: "sehenswert", x: 520.1, y: 448.0,
    url: "https://www.google.com/maps/search/?api=1&query=Zamek+Moszna", meta: "Oppelner Land · Schloss",
    blurb: "Das Märchenschloss mit 99 Türmen — sieht aus wie aus einem Disney-Film und ist ein Traum für Fotos, besonders zur Azaleen-Blüte."
  },
  {
    id: "czocha", name: "Burg Czocha (Tzschocha)", region: "westen",
    kat: "burg", status: "sehenswert", x: 483.0, y: 437.5,
    url: "https://www.google.com/maps/search/?api=1&query=Zamek+Czocha", meta: "Niederschlesien · Burg",
    blurb: "Verwinkelte Ritterburg über dem Stausee mit Geheimgängen und Falltüren — hier finden sogar echte „Zauberschul“-Events statt."
  },
  {
    id: "ogrodzieniec", name: "Burgruine Ogrodzieniec", region: "sueden",
    kat: "burg", status: "sehenswert", x: 541.9, y: 446.0,
    url: "https://www.google.com/maps/search/?api=1&query=Zamek+Ogrodzieniec", meta: "Adlerhorst-Route · Ruine",
    blurb: "Die spektakulärste Ruine der „Adlerhorst-Route“: Kalkfelsen und Mauern verschmelzen zu einer Kulisse wie aus „The Witcher“."
  },
  {
    id: "niedzica", name: "Burg Niedzica am Czorsztyn-See", region: "sueden",
    kat: "burg", status: "sehenswert", x: 553.1, y: 469.0,
    url: "https://www.google.com/maps/search/?api=1&query=Zamek+Niedzica", meta: "Pieninen · Burg",
    blurb: "Bilderbuchburg hoch über dem türkisen Czorsztyn-Stausee — mit Inka-Schatz-Legende und Blick auf die Pieninen."
  },
  {
    id: "wilanow", name: "Schloss Wilanów", region: "zentral",
    kat: "burg", status: "sehenswert", x: 561.7, y: 405.0,
    url: "https://www.google.com/maps/search/?api=1&query=Palac+w+Wilanowie", meta: "Warschau · Schloss",
    blurb: "Das „polnische Versailles“ am Stadtrand von Warschau: Barockresidenz von König Jan III. Sobieski mit prachtvollem Garten."
  },
  {
    id: "lancut", name: "Schloss Łańcut", region: "sueden",
    kat: "burg", status: "sehenswert", x: 579.0, y: 451.9,
    url: "https://www.google.com/maps/search/?api=1&query=Zamek+w+Lancucie", meta: "Karpatenvorland · Schloss",
    blurb: "Eine der prächtigsten Magnaten-Residenzen Polens — mit Kutschensammlung, Orangerie und englischem Landschaftspark."
  },
  {
    id: "lidzbark", name: "Burg Lidzbark Warmiński (Heilsberg)", region: "masuren",
    kat: "burg", status: "sehenswert", x: 553.2, y: 360.6,
    url: "https://www.google.com/maps/search/?api=1&query=Zamek+Lidzbark+Warminski", meta: "Ermland · Burg",
    blurb: "Perfekt erhaltene gotische Bischofsburg im Ermland — hier lebte und arbeitete auch Kopernikus. Ein Backstein-Juwel abseits der Massen."
  },

  /* ---- 🏞️ Natur & Aussicht (Sehenswertes) ---- */
  {
    id: "morskie-oko", name: "Morskie Oko (Hohe Tatra)", region: "sueden",
    kat: "natur", status: "sehenswert", x: 549.9, y: 474.2,
    url: "https://www.google.com/maps/search/?api=1&query=Morskie+Oko", meta: "Tatra · Bergsee",
    blurb: "Polens berühmtester Bergsee, umringt von Zweitausendern — der Weg hinauf ist breit und gut machbar. Früh starten, die Tatra ist beliebt!"
  },
  {
    id: "slowinski", name: "Wanderdünen im Słowiński-Nationalpark", region: "norden",
    kat: "natur", status: "sehenswert", x: 511.1, y: 349.6,
    url: "https://www.google.com/maps/search/?api=1&query=Wydma+Lacka+Slowinski+Park+Narodowy", meta: "Łeba · Ostsee",
    blurb: "Bis zu 40 Meter hohe Sanddünen, die jedes Jahr weiterwandern — Sahara-Feeling direkt an der Ostsee bei Łeba."
  },
  {
    id: "bialowieza", name: "Białowieża-Urwald", region: "masuren",
    kat: "natur", status: "sehenswert", x: 599.5, y: 389.6,
    url: "https://www.google.com/maps/search/?api=1&query=Bialowieski+Park+Narodowy", meta: "Podlasie · UNESCO",
    blurb: "Europas letzter Tiefland-Urwald und Heimat der freilebenden Wisente — ein Stück Wildnis, das es so nirgendwo sonst mehr gibt."
  },
  {
    id: "bieszczady", name: "Bieszczady-Berge", region: "sueden",
    kat: "natur", status: "sehenswert", x: 584.5, y: 472.5,
    url: "https://www.google.com/maps/search/?api=1&query=Polonina+Wetlinska+Bieszczady", meta: "Südosten · Berge",
    blurb: "Polens wilder Südosten: baumfreie Bergwiesen (Połoniny), Wölfe, Bären und der dunkelste Sternenhimmel des Landes."
  },
  {
    id: "sniezka", name: "Schneekoppe / Śnieżka (Riesengebirge)", region: "sueden",
    kat: "natur", status: "sehenswert", x: 489.2, y: 443.8,
    url: "https://www.google.com/maps/search/?api=1&query=Sniezka+Karpacz", meta: "Riesengebirge · Gipfel",
    blurb: "Der höchste Gipfel des Riesengebirges (1.603 m) mit den markanten „Ufo“-Bauten obendrauf — Aufstieg ab Karpacz."
  },
  {
    id: "ojcow", name: "Ojców-Nationalpark", region: "sueden",
    kat: "natur", status: "sehenswert", x: 545.9, y: 451.3,
    url: "https://www.google.com/maps/search/?api=1&query=Ojcowski+Park+Narodowy", meta: "bei Krakau · Natur",
    blurb: "Polens kleinster Nationalpark direkt vor den Toren Krakaus: Kalkfelsen, Höhlen, die „Herkuleskeule“ und eine Kapelle überm Bach."
  },
  {
    id: "dunajec", name: "Dunajec-Durchbruch (Floßfahrt)", region: "sueden",
    kat: "natur", status: "sehenswert", x: 554.2, y: 469.4,
    url: "https://www.google.com/maps/search/?api=1&query=Splyw+Dunajcem+Sromowce", meta: "Pieninen · Fluss",
    blurb: "Mit dem traditionellen Holzfloß durch die Felsenschlucht der Pieninen — seit über 180 Jahren ein Klassiker, geführt von Goralen-Flößern."
  },
  {
    id: "hel", name: "Halbinsel Hel", region: "norden",
    kat: "natur", status: "sehenswert", x: 528.5, y: 351.5,
    url: "https://www.google.com/maps/search/?api=1&query=Polwysep+Helski", meta: "Ostsee · Halbinsel",
    blurb: "35 Kilometer schmale Sandzunge in der Ostsee — Strände auf beiden Seiten, Kitesurfer-Paradies und die Robbenstation in Hel."
  },

  /* ---- ℹ️ Sehenswürdigkeiten & ⭐ Kurioses (Sehenswertes) ---- */
  {
    id: "sopot-molo", name: "Molo in Sopot", region: "norden",
    kat: "sehens", status: "sehenswert", x: 525.3, y: 355.5,
    url: "https://www.google.com/maps/search/?api=1&query=Molo+w+Sopocie", meta: "Sopot · Seebrücke",
    blurb: "Die längste Holzseebrücke Europas (über 500 m) — dazu der Kurort-Charme von Sopot und gleich daneben das schiefe „Krzywy Domek“."
  },
  {
    id: "westerplatte", name: "Westerplatte", region: "norden",
    kat: "sehens", status: "sehenswert", x: 526.7, y: 356.3,
    url: "https://www.google.com/maps/search/?api=1&query=Westerplatte+Gdansk", meta: "Danzig · Gedenkort",
    blurb: "Hier begann am 1. September 1939 der Zweite Weltkrieg — heute Gedenkstätte mit Denkmal und Ruinen an der Hafeneinfahrt Danzigs."
  },
  {
    id: "elblag-kanal", name: "Oberländischer Kanal (Kanał Elbląski)", region: "norden",
    kat: "sehens", status: "sehenswert", x: 543.4, y: 367.3,
    url: "https://www.google.com/maps/search/?api=1&query=Kanal+Elblaski+pochylnie", meta: "Ermland · Technik-Wunder",
    blurb: "Das Technikdenkmal: Hier fahren Schiffe auf Schienen über Wiesen — fünf „geneigte Ebenen“ ziehen sie über Land von See zu See."
  },
  {
    id: "krzywy-las", name: "Der Krumme Wald (Krzywy Las)", region: "westen",
    kat: "sonstige", status: "sehenswert", x: 469.9, y: 387.7,
    url: "https://www.google.com/maps/search/?api=1&query=Krzywy+Las+Gryfino", meta: "bei Gryfino · Kuriosum",
    blurb: "Rund 100 Kiefern, die alle im selben mysteriösen Bogen wachsen — bis heute weiß niemand sicher, warum. Perfekter Foto-Stopp."
  },
  {
    id: "zalipie", name: "Zalipie — das bemalte Dorf", region: "sueden",
    kat: "sonstige", status: "sehenswert", x: 559.8, y: 449.9,
    url: "https://www.google.com/maps/search/?api=1&query=Zalipie+malowana+wies", meta: "Kleinpolen · Kuriosum",
    blurb: "Im „bemalten Dorf“ sind Häuser, Brunnen und sogar Hundehütten mit Blumenmustern verziert — eine lebendige Volkskunst-Tradition."
  },
  {
    id: "energylandia", name: "Energylandia (Freizeitpark)", region: "sueden",
    kat: "sonstige", status: "sehenswert", x: 540.6, y: 456.7,
    url: "https://www.google.com/maps/search/?api=1&query=Energylandia+Zator", meta: "Zator · Freizeitpark",
    blurb: "Polens größter Freizeitpark mit einigen der schnellsten Achterbahnen Europas — der Familien-Stopp zwischen Krakau und Auschwitz."
  },

  /* ---- Neue Ausflugsziele mit exakten GPS-Koordinaten ---- */
  {
    id: "zamek-gorka", name: "Zamek Górka", region: "westen",
    kat: "burg", status: "sehenswert", x: 502.4, y: 439.2,
    lat: 50.88732, lon: 16.70901, meta: "Sobótka · Schloss",
    blurb: "Unter der Schlossfassade steckt ein über Jahrhunderte gewachsener Baukomplex — von der mittelalterlichen Kapelle bis zur Neorenaissance."
  },
  {
    id: "spichlerz-rocka-jarocin", name: "Spichlerz Polskiego Rocka", region: "westen",
    kat: "museum", status: "sehenswert", x: 512.5, y: 413.4,
    lat: 51.973736, lon: 17.500491, meta: "Jarocin · Museum",
    blurb: "Das Museum im historischen Speicher erzählt mit Konzertmitschnitten, Instrumenten, Fotos und Erinnerungsstücken die Geschichte des Jarocin-Festivals."
  },
  {
    id: "rynek-jarocin", name: "Rynek Jarocin", short: "Jarocin", region: "westen",
    kat: "stadt", status: "sehenswert", x: 512.5, y: 413.4,
    lat: 51.972345, lon: 17.501552, meta: "Jarocin · Marktplatz",
    blurb: "Historischer Markt mit dem ungewöhnlichen Arkadenrathaus, Bürgerhäusern aus dem 19. Jahrhundert und der nahen Martinskirche."
  },
  {
    id: "amfiteatr-jarocin", name: "Amfiteatr Jarocin", region: "westen",
    kat: "sehens", status: "sehenswert", x: 512.5, y: 413.4,
    lat: 51.97475, lon: 17.50496, meta: "Jarocin · Amphitheater",
    blurb: "Legendärer Schauplatz des Jarocin-Festivals im Stadtpark — gleich neben dem neugotischen Radoliński-Palais."
  },
  {
    id: "westernland", name: "WesternLand", region: "westen",
    kat: "sonstige", status: "sehenswert", x: 518.2, y: 412.6,
    lat: 51.990438, lon: 17.916989, meta: "Józefów bei Chocz · Freizeitpark",
    blurb: "Familienpark im Wildwest-Stil mit Westernstadt, Indianerdorf und saisonalen Mitmach-Attraktionen."
  },
  {
    id: "zagroda-goluchow", name: "Pokazowa Zagroda Zwierząt w Gołuchowie", region: "westen",
    kat: "natur", status: "sehenswert", x: 518.4, y: 415.6,
    lat: 51.859647, lon: 17.924362, meta: "Gołuchów · Tierpark",
    blurb: "In dem weitläufigen Waldpark lassen sich Wisente, polnische Konik-Pferde, Damhirsche und Wildschweine von Aussichtsterrassen beobachten."
  },
  {
    id: "rynek-ostrow-wielkopolski", name: "Rynek Ostrów Wielkopolski", short: "Ostrów Wlkp.", region: "westen",
    kat: "stadt", status: "sehenswert", x: 517.1, y: 420.5,
    lat: 51.64963, lon: 17.8175, meta: "Ostrów Wielkopolski · Marktplatz",
    blurb: "Marktplatz mit Rathaus, Häusern aus dem 19. und frühen 20. Jahrhundert und Blick auf die neoromanische Kirche."
  },
  {
    id: "mandoria", name: "Mandoria – Miasto Przygód", region: "zentral",
    kat: "sonstige", status: "sehenswert", x: 540.0, y: 418.7,
    lat: 51.64825, lon: 19.48331, meta: "Rzgów bei Łódź · Freizeitpark",
    blurb: "Ganzjährig überdachter Familien-Freizeitpark, gestaltet wie eine lebendige Handelsstadt aus der Renaissance."
  },
  {
    id: "palac-maltzanow", name: "Pałac Maltzanów", region: "westen",
    kat: "burg", status: "sehenswert", x: 509.6, y: 423.9,
    lat: 51.5302, lon: 17.2665, meta: "Milicz · Palast",
    blurb: "Klassizistischer Adelspalast im Barycz-Tal, umgeben von einem Landschaftspark; heute wird das Gebäude als Schule genutzt."
  },
  {
    id: "szlaban-baranowice", name: "Historischer Grenzschlagbaum Baranowice", region: "westen",
    kat: "sehens", status: "sehenswert", x: 506.8, y: 423.3,
    lat: 51.563427, lon: 17.066404, meta: "Baranowice · Grenzdenkmal",
    blurb: "Ein erhaltener Schlagbaum erinnert hier an die polnisch-deutsche Grenze der Zwischenkriegszeit."
  },
  {
    id: "rynek-rawicz", name: "Rynek w Rawiczu", short: "Rawicz", region: "westen",
    kat: "stadt", status: "sehenswert", x: 503.9, y: 422.5,
    lat: 51.609202, lon: 16.858026, meta: "Rawicz · Marktplatz",
    blurb: "Regelmäßig angelegter Markt der 1638 gegründeten Stadt, geprägt vom klassizistischen Rathaus und Bürgerhäusern des 19. Jahrhunderts."
  },
  {
    id: "palac-zmigrod", name: "Zespół Pałacowo-Parkowy w Żmigrodzie", region: "westen",
    kat: "burg", status: "sehenswert", x: 504.8, y: 425.3,
    lat: 51.482273, lon: 16.917031, meta: "Żmigród · Schlosspark",
    blurb: "Gesicherte Ruinen einer einst großen schlesischen Adelsresidenz in einem Landschaftspark mit alten Bäumen und Spazierwegen."
  },
  {
    id: "brama-wroclawska-olesnica", name: "Brama Wrocławska w Oleśnicy", region: "westen",
    kat: "sehens", status: "sehenswert", x: 511.3, y: 431.1,
    lat: 51.210917, lon: 17.376611, meta: "Oleśnica · Stadttor",
    blurb: "Das mittelalterliche Breslauer Tor ist der am besten erhaltene Teil der früheren Oleśnicaer Stadtbefestigung."
  },
  {
    id: "zaklad-karny-rawicz", name: "Zakład Karny w Rawiczu", region: "westen",
    kat: "sehens", status: "sehenswert", x: 504.0, y: 422.5,
    lat: 51.608029, lon: 16.863529, meta: "Rawicz · Historischer Gefängnisbau",
    blurb: "Der sternförmig angelegte Gefängniskomplex von 1819 gehört zu den ältesten Anlagen dieser Art in Polen."
  },
  {
    id: "muzeum-bombki-milicz", name: "Muzeum Bombki w Miliczu", region: "westen",
    kat: "museum", status: "sehenswert", x: 509.8, y: 424.1,
    lat: 51.520966, lon: 17.280594, meta: "Milicz · Museum",
    blurb: "Tausende Weihnachtsbaumkugeln und Figuren zeigen die Vielfalt und traditionelle handwerkliche Herstellung des gläsernen Schmucks."
  },
  {
    id: "rynek-trzebnica", name: "Rynek w Trzebnicy", short: "Trzebnica", region: "westen",
    kat: "stadt", status: "sehenswert", x: 506.9, y: 429.2,
    lat: 51.307795, lon: 17.059625, meta: "Trzebnica · Marktplatz",
    blurb: "Der zentrale Marktplatz von Trzebnica mit Rathaus, Brunnen und historischer Bebauung ist ein guter Ausgangspunkt für den Stadtrundgang."
  },
  {
    id: "sanktuarium-jadwigi-trzebnica", name: "Sanktuarium Świętej Jadwigi Śląskiej", region: "westen",
    kat: "sakral", status: "sehenswert", x: 507.0, y: 429.1,
    lat: 51.309567, lon: 17.067111, meta: "Trzebnica · Wallfahrt",
    blurb: "Bedeutende Wallfahrtsbasilika mit dem Grab der heiligen Hedwig von Schlesien und dem früheren Zisterzienserinnenkloster."
  },
  {
    id: "rynek-twardogora", name: "Rynek Twardogóra", short: "Twardogóra", region: "westen",
    kat: "stadt", status: "sehenswert", x: 512.5, y: 427.4,
    lat: 51.366176, lon: 17.467486, meta: "Twardogóra · Marktplatz",
    blurb: "Kompaktes historisches Zentrum mit dem Rathaus von 1902 und zwei sehenswerten Kirchen in unmittelbarer Nähe."
  },
  {
    id: "palac-goszcz", name: "Pałac w Goszczu", region: "westen",
    kat: "burg", status: "sehenswert", x: 512.6, y: 426.7,
    lat: 51.397222, lon: 17.477222, meta: "Goszcz · Schlossruine",
    blurb: "Die gesicherte Ruine einer großen barocken Residenz bewahrt Fassaden, Rokoko-Ornamente und Teile des repräsentativen Mittelbaus."
  },
  {
    id: "bazylika-jana-olesnica", name: "Bazylika św. Jana Apostoła w Oleśnicy", region: "westen",
    kat: "sakral", status: "sehenswert", x: 511.4, y: 431.1,
    lat: 51.20955, lon: 17.37809, meta: "Oleśnica · Basilika",
    blurb: "Historische Schlosskirche und heutige Basilika direkt neben dem Oleśnicaer Herzogsschloss."
  },
  {
    id: "mur-berlinski-sosnowka", name: "Fragmenty muru berlińskiego", region: "westen",
    kat: "sonstige", status: "sehenswert", x: 512.4, y: 428.6,
    lat: 51.314632, lon: 17.461977, meta: "Sosnówka bei Twardogóra · Kuriosum",
    blurb: "Auf einer Wiese stehen 30 Segmente der Berliner Mauer halbkreisförmig als Installation „Parabola“."
  },
  {
    id: "zamek-ksiazat-olesnickich", name: "Zamek Książąt Oleśnickich", region: "westen",
    kat: "burg", status: "sehenswert", x: 511.4, y: 431.1,
    lat: 51.20911, lon: 17.37699, meta: "Oleśnica · Schloss",
    blurb: "Renaissance-Residenz der Oleśnicaer Herzöge mit mittelalterlichem Ursprung, markantem Turm und Innenhof."
  },
  {
    id: "rynek-olesnica", name: "Rynek Oleśnica", short: "Oleśnica", region: "westen",
    kat: "stadt", status: "sehenswert", x: 511.4, y: 431.1,
    lat: 51.20955, lon: 17.37978, meta: "Oleśnica · Marktplatz",
    blurb: "Historischer Marktplatz der früheren Herzogsstadt mit klassizistischem Rathaus im Zentrum."
  },
  {
    id: "mauzoleum-biron-sycow", name: "Mauzoleum rodziny Biron von Curland", region: "westen",
    kat: "sehens", status: "sehenswert", x: 516.0, y: 428.5,
    lat: 51.305226, lon: 17.721838, meta: "Syców · Mausoleum",
    blurb: "Die Backsteinkapelle der Familie Biron liegt in der ruhigen historischen Parkanlage von Syców."
  },
  {
    id: "sanktuarium-wieruszow", name: "Sanktuarium Miłosiernego Jezusa Pięciorańskiego", region: "zentral",
    kat: "sakral", status: "sehenswert", x: 522.0, y: 428.2,
    lat: 51.2958, lon: 18.15234, meta: "Wieruszów · Wallfahrt",
    blurb: "Barocke Paulinerkirche mit einem verehrten Christusbild und einer Klostertradition, die bis ins Jahr 1401 zurückreicht."
  },
  {
    id: "muzeum-regionalne-pilzno", name: "Muzeum Regionalne w Pilźnie", region: "sueden",
    kat: "museum", status: "sehenswert", x: 566.1, y: 454.9,
    lat: 49.979634, lon: 21.29108, meta: "Pilzno · Museum",
    blurb: "Das Museum im ehemaligen Organistenhaus zeigt archäologische Funde, Stadtgeschichte, historische Wohnräume und regionale Sammlungen."
  },
  {
    id: "muzeum-lalek-pilzno", name: "Muzeum Lalek w Pilźnie", region: "sueden",
    kat: "museum", status: "sehenswert", x: 566.1, y: 455.0,
    lat: 49.976745, lon: 21.291686, meta: "Pilzno · Puppenmuseum",
    blurb: "Privates Puppenmuseum mit handgefertigten Figuren, historischen Puppen und Einblicken in die traditionelle Herstellung."
  },
  {
    id: "samolot-li2p-wieruszow", name: "Samolot Li-2P Wieruszów", region: "zentral",
    kat: "sonstige", status: "sehenswert", x: 521.9, y: 428.3,
    lat: 51.29563, lon: 18.14742, meta: "Wieruszów · Kuriosum",
    blurb: "Das seit den 1960er-Jahren im Stadtgebiet stehende Flugzeug ist ein ungewöhnliches Wahrzeichen von Wieruszów."
  },
  {
    id: "dworek-oborskich-mielec", name: "Muzeum Regionalne – Dworek i Park Oborskich", region: "sueden",
    kat: "museum", status: "sehenswert", x: 567.6, y: 447.8,
    lat: 50.284342, lon: 21.410844, meta: "Mielec · Museum",
    blurb: "Der repräsentative Landsitz der Familie Oborski beherbergt heute Ausstellungen zur Familien- und Regionalgeschichte von Mielec."
  },
  {
    id: "rynek-mielec", name: "Rynek Mielec", short: "Mielec", region: "sueden",
    kat: "stadt", status: "sehenswert", x: 567.7, y: 447.8,
    lat: 50.28608, lon: 21.41964, meta: "Mielec · Marktplatz",
    blurb: "Der rechteckige Markt ist seit dem 15. Jahrhundert das Zentrum der Altstadt; die barocke Matthäusbasilika liegt nur wenige Schritte entfernt."
  },

  /* ---- 🚽 MOPs mit Camper-Service (Ver-/Entsorgung & Wasser) — Auswahl, wird ergänzt ---- */
  {
    id: "mop-brwinow", name: "MOP Brwinów (A2)", region: "zentral",
    kat: "entsorgung", status: "sehenswert", x: 556.6, y: 405.9,
    url: "https://www.google.com/maps/search/?api=1&query=MOP+Brwinow+A2", meta: "A2 Ri. Warschau · Camper-Service",
    blurb: "Rastplatz an der A2 mit Camper-freundlicher Ausstattung: frisches Wasser tanken sowie Grau- und Chemie-WC-Entsorgung. Angaben ohne Gewähr — bitte vor Ort prüfen."
  },
  {
    id: "mop-wystepa", name: "MOP Występa (S7)", region: "sueden",
    kat: "entsorgung", status: "sehenswert", x: 556.1, y: 432.7,
    url: "https://www.google.com/maps/search/?api=1&query=MOP+Wystepa+S7", meta: "S7 bei Kielce · Camper-Service",
    blurb: "Rastplatz an der S7 mit Entsorgungspunkt für flüssige Abwässer — praktisch für Camper und Wohnwagen. Angaben ohne Gewähr — bitte vor Ort prüfen."
  },
  {
    id: "mop-machnacz", name: "MOP Machnacz (A1)", region: "zentral",
    kat: "entsorgung", status: "sehenswert", x: 531.5, y: 397.0,
    url: "https://www.google.com/maps/search/?api=1&query=MOP+Machnacz+A1", meta: "A1 bei Włocławek · Camper-Service",
    blurb: "Rastplatz an der A1 mit Entsorgungspunkt für Abwasser — guter Stopp auf der Nord-Süd-Route. Angaben ohne Gewähr — bitte vor Ort prüfen."
  },
  {
    id: "mop-krzyzanow", name: "MOP Krzyżanów (A1)", region: "zentral",
    kat: "entsorgung", status: "sehenswert", x: 539.4, y: 405.3,
    url: "https://www.google.com/maps/search/?api=1&query=MOP+Krzyzanow+A1", meta: "A1 bei Kutno · Camper-Service",
    blurb: "Rastplatz an der A1 mit Entsorgungspunkt für Abwasser. Angaben ohne Gewähr — bitte vor Ort prüfen."
  }
];

window.POLEN_REGIONS = [
  { key: "alle", label: "Alle Regionen" },
  { key: "norden", label: "Norden & Ostsee" },
  { key: "masuren", label: "Masuren" },
  { key: "zentral", label: "Zentralpolen" },
  { key: "westen", label: "Westen" },
  { key: "sueden", label: "Süden" }
];

/* Kategorien-Legende (Icon + Label), zwei Gruppen. */
window.POLEN_KATEGORIEN = [
  { group: "🔎 Sehenswertes", items: [
    { key: "stadt",    icon: "🏙️", label: "Städte & Regionen" },
    { key: "sehens",   icon: "ℹ️", label: "Sehenswürdigkeiten" },
    { key: "museum",   icon: "🏛️", label: "Museen & Gedenkstätten" },
    { key: "burg",     icon: "🏰", label: "Burgen & Schlösser" },
    { key: "sakral",   icon: "⛪", label: "Kirchen, Klöster & Wallfahrt" },
    { key: "natur",    icon: "🏞️", label: "Natur & Aussicht" },
    { key: "sonstige", icon: "⭐", label: "Sonstige Highlights" }
  ]},
  { group: "🚐 Für Camper", items: [
    { key: "camping",       icon: "⛺", label: "Campingplatz" },
    { key: "biwak",         icon: "🏕️", label: "Wildes Biwak / Naturplatz" },
    { key: "waldpark",      icon: "🅿️", label: "Waldparkplatz" },
    { key: "rastplatz",     icon: "🛣️", label: "Rastplatz (MOP)" },
    { key: "dusche",        icon: "🚿", label: "Dusche" },
    { key: "entsorgung",    icon: "🚽", label: "Ver-/Entsorgung" },
    { key: "werkstatt",     icon: "🔧", label: "Camper-Werkstatt" },
    { key: "waschsalon",    icon: "🧺", label: "Waschsalon" },
    { key: "camperservice", icon: "🆑", label: "Camper-Service (CS)" }
  ]}
];

window.POLEN_STATUS = {
  bericht:    { label: "Mein Reisebericht", tag: "terra" },
  sehenswert: { label: "Sehenswertes",      tag: "blue" },
  ziel:       { label: "Reiseziel",         tag: "" }
};

(function () {
  "use strict";
  var NS = "http://www.w3.org/2000/svg";
  var data = (window.POLEN_DATA || []).concat(window.POLEN_CAMPER || []);
  var STATUS = window.POLEN_STATUS;

  // Kategorie-Lookup key -> {icon,label}
  var KAT = {};
  (window.POLEN_KATEGORIEN || []).forEach(function (grp) {
    grp.items.forEach(function (it) { KAT[it.key] = it; });
  });

  var state = { region: "alle", kats: {}, statuses: {}, query: "" }; // Filter-Sets als Objekt, leer = alle
  var categoryButtons = {};
  var legendCategoryButtons = {};
  var legendStatusButtons = {};
  // data-preselect-kat="entsorgung" (auch kommagetrennt) am Karten-Container
  // aktiviert Kategorien schon beim Laden — z. B. für die Entsorgungs-Seite.
  var preEl = document.querySelector("[data-preselect-kat]");
  if (preEl) {
    preEl.getAttribute("data-preselect-kat").split(",").forEach(function (k) {
      k = k.trim();
      if (k) state.kats[k] = true;
    });
  }
  // Camper-Kategorien: erscheinen auf der Karte erst beim Filtern/Suchen (sonst zu voll).
  var CAMPER_KATS = { camping: 1, camperservice: 1, entsorgung: 1, rastplatz: 1, waldpark: 1, biwak: 1, dusche: 1, waschsalon: 1 };
  var camperTotal = data.filter(function (d) { return CAMPER_KATS[d.kat]; }).length;

  var mapStage = document.querySelector("[data-pl-map]");
  var grid = document.querySelector("[data-pl-grid]");
  var regRow = document.querySelector("[data-pl-filter]");
  var katRow = document.querySelector("[data-pl-catfilter]");
  var legendBox = document.querySelector("[data-pl-legende]");
  var search = document.querySelector("[data-pl-search]");
  var count = document.querySelector("[data-pl-count]");
  if (!grid) return;

  function katMeta(k) { return KAT[k] || { icon: "📍", label: k || "Ort" }; }
  function noKatFilter() { return Object.keys(state.kats).length === 0; }
  function noStatusFilter() { return Object.keys(state.statuses).length === 0; }
  function clearFilterSet(set) {
    Object.keys(set).forEach(function (key) { delete set[key]; });
  }
  function syncLegendFilters() {
    Object.keys(categoryButtons).forEach(function (key) {
      var active = !!state.kats[key];
      categoryButtons[key].classList.toggle("active", active);
      categoryButtons[key].setAttribute("aria-pressed", String(active));
    });
    Object.keys(legendCategoryButtons).forEach(function (key) {
      var active = !!state.kats[key];
      legendCategoryButtons[key].classList.toggle("active", active);
      legendCategoryButtons[key].setAttribute("aria-pressed", String(active));
    });
    Object.keys(legendStatusButtons).forEach(function (key) {
      var active = !!state.statuses[key];
      legendStatusButtons[key].classList.toggle("active", active);
      legendStatusButtons[key].setAttribute("aria-pressed", String(active));
    });
  }
  function selectLegendCategory(key) {
    var alreadyOnly = Object.keys(state.kats).length === 1 && !!state.kats[key] && noStatusFilter();
    clearFilterSet(state.kats);
    clearFilterSet(state.statuses);
    if (!alreadyOnly) state.kats[key] = true;
    syncLegendFilters();
    apply();
  }
  function selectLegendStatus(key) {
    var alreadyOnly = Object.keys(state.statuses).length === 1 && !!state.statuses[key] && noKatFilter();
    clearFilterSet(state.kats);
    clearFilterSet(state.statuses);
    if (!alreadyOnly) state.statuses[key] = true;
    syncLegendFilters();
    apply();
  }
  function placeUrl(place) {
    if (typeof place.lat === "number" && typeof place.lon === "number") {
      return "https://www.google.com/maps/search/?api=1&query=" +
        encodeURIComponent(place.lat + "," + place.lon);
    }
    return place.url || "#";
  }

  /* --- Kacheln (Beiträge / Ziele) rendern --- */
  data.forEach(function (d) {
    var km = katMeta(d.kat);
    var st = STATUS[d.status] || STATUS.ziel;
    var a = document.createElement("a");
    var href = placeUrl(d);
    a.className = "post-card";
    a.id = "pl-card-" + d.id;
    a.href = href;
    if (/^https?:/.test(href)) { a.target = "_blank"; a.rel = "noopener"; }
    a.setAttribute("data-region", d.region);
    a.setAttribute("data-kat", d.kat || "");
    a.setAttribute("data-text", (d.name + " " + d.blurb + " " + d.meta + " " + km.label + " " +
      (d.lat || "") + " " + (d.lon || "")).toLowerCase());
    var badge = d.status === "ziel" ? " · bald mehr" : "";
    a.innerHTML =
      '<span class="cat sticker ' + st.tag + '">' + km.icon + " " + st.label + badge + "</span>" +
      "<h3>" + d.name + "</h3>" +
      "<p>" + d.blurb + "</p>" +
      '<span class="meta">' + d.meta + "</span>";
    grid.appendChild(a);
  });

  /* --- Regionen-Chips (Einfachauswahl) --- */
  if (regRow) {
    (window.POLEN_REGIONS || []).forEach(function (r) {
      var has = r.key === "alle" || data.some(function (d) { return d.region === r.key; });
      if (!has) return;
      var b = document.createElement("button");
      b.type = "button";
      b.className = "chip" + (r.key === "alle" ? " active" : "");
      b.textContent = r.label;
      b.setAttribute("data-region", r.key);
      b.addEventListener("click", function () {
        state.region = r.key;
        regRow.querySelectorAll(".chip").forEach(function (c) { c.classList.remove("active"); });
        b.classList.add("active");
        apply();
      });
      regRow.appendChild(b);
    });
  }

  /* --- Kategorie-Chips (Mehrfachauswahl, nur vorhandene Kategorien) --- */
  if (katRow) {
    var present = [];
    (window.POLEN_KATEGORIEN || []).forEach(function (grp) {
      grp.items.forEach(function (it) {
        if (data.some(function (d) { return d.kat === it.key; })) present.push(it);
      });
    });
    present.forEach(function (it) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "chip chip-kat" + (state.kats[it.key] ? " active" : "");
      b.innerHTML = it.icon + " " + it.label;
      b.setAttribute("data-kat", it.key);
      b.setAttribute("aria-pressed", String(!!state.kats[it.key]));
      categoryButtons[it.key] = b;
      b.addEventListener("click", function () {
        if (state.kats[it.key]) delete state.kats[it.key];
        else state.kats[it.key] = true;
        syncLegendFilters();
        apply();
      });
      katRow.appendChild(b);
    });
  }

  /* --- Legende rendern --- */
  if (legendBox) {
    var english = document.documentElement.lang === "en";
    var html = '<p class="pl-legende-hint">' +
      (english ? "Select a symbol to show only matching places on the map." : "Klick auf ein Symbol, um nur passende Orte auf der Karte anzuzeigen.") +
      '</p><div class="pl-legende-status" role="group" aria-label="Markerstatus">' +
      '<button type="button" class="pl-legend-filter" data-legend-status="bericht" aria-pressed="false"><i class="pl-dot bericht"></i> 💛 mein Reisebericht</button>' +
      '<button type="button" class="pl-legend-filter" data-legend-status="sehenswert" aria-pressed="false"><i class="pl-dot sehenswert"></i> Sehenswertes</button>' +
      '<button type="button" class="pl-legend-filter" data-legend-status="ziel" aria-pressed="false"><i class="pl-dot ziel"></i> Reiseziel</button>' +
      '</div>';
    (window.POLEN_KATEGORIEN || []).forEach(function (grp) {
      html += '<div class="pl-legende-grp"><b>' + grp.group + '</b><ul>';
      grp.items.forEach(function (it) {
        html += '<li><button type="button" class="pl-legend-filter" data-legend-kat="' + it.key + '" aria-pressed="false"><span class="pl-lg-icon">' + it.icon + '</span>' + it.label + "</button></li>";
      });
      html += "</ul></div>";
    });
    html += '<button type="button" class="pl-legend-reset">' +
      (english ? "Reset legend filter" : "Legendenfilter zurücksetzen") +
      '</button>';
    legendBox.innerHTML = html;
    legendBox.querySelectorAll("[data-legend-kat]").forEach(function (button) {
      var key = button.getAttribute("data-legend-kat");
      legendCategoryButtons[key] = button;
      button.addEventListener("click", function () { selectLegendCategory(key); });
    });
    legendBox.querySelectorAll("[data-legend-status]").forEach(function (button) {
      var key = button.getAttribute("data-legend-status");
      legendStatusButtons[key] = button;
      button.addEventListener("click", function () { selectLegendStatus(key); });
    });
    var resetLegend = legendBox.querySelector(".pl-legend-reset");
    if (resetLegend) {
      resetLegend.addEventListener("click", function () {
        clearFilterSet(state.kats);
        clearFilterSet(state.statuses);
        syncLegendFilters();
        apply();
      });
    }
    syncLegendFilters();
  }

  /* --- Suche --- */
  if (search) {
    search.addEventListener("input", function () {
      state.query = search.value.trim().toLowerCase();
      apply();
    });
  }

  function apply() {
    var filtering = state.region !== "alle" || !noKatFilter() || !noStatusFilter() || state.query !== "";
    var visible = 0;
    data.forEach(function (d) {
      var card = document.getElementById("pl-card-" + d.id);
      var okRegion = state.region === "alle" || d.region === state.region;
      var okKat = noKatFilter() || !!state.kats[d.kat];
      var okStatus = noStatusFilter() || !!state.statuses[d.status];
      var okQuery = !state.query || card.getAttribute("data-text").indexOf(state.query) !== -1;
      // Camper-Punkte nur zeigen, wenn gefiltert/gesucht wird — sonst nur die Highlights.
      var camperOk = !CAMPER_KATS[d.kat] || filtering;
      var show = okRegion && okKat && okStatus && okQuery && camperOk;
      card.classList.toggle("hide", !show);
      if (show) visible++;
      var pin = document.getElementById("pl-pin-" + d.id);
      if (pin) pin.classList.toggle("pl-off", !show);
    });
    if (count) {
      count.textContent = filtering
        ? visible + (visible === 1 ? " Ort" : " Orte") + " gefunden"
        : visible + " Highlights · + " + camperTotal + " Camper-Stellplätze (filter nach Kategorie/Region oder such deinen Ort)";
    }
    var empty = document.querySelector(".pl-empty");
    if (empty) empty.style.display = visible ? "none" : "block";
  }

  /* --- Animierte Polen-Karte aus der Europakarte ableiten --- */
  if (mapStage) {
    fetch(mapStage.getAttribute("data-pl-map")).then(function (r) { return r.text(); }).then(function (svgText) {
      var holder = document.createElement("div");
      holder.innerHTML = svgText;
      var svg = holder.querySelector("svg");
      svg.setAttribute("class", "pl-map");
      svg.setAttribute("viewBox", "450 332 182 162"); // auf Polen zugeschnitten (mit Rand für Beschriftung)
      var pl = svg.querySelector("#c-PL");
      if (pl) pl.classList.add("pl");
      mapStage.appendChild(svg);

      // De-Clustering: Punkte am selben Ort fächern in einem kleinen Ring auf.
      // Abstandsbasiertes Gruppieren (Schwelle 5 Einheiten) — robust an Zellgrenzen.
      var pos = {};
      var clusters = [];
      data.forEach(function (d) {
        var found = null;
        for (var i = 0; i < clusters.length; i++) {
          var m = clusters[i][0], dx = m.x - d.x, dy = m.y - d.y;
          if (dx * dx + dy * dy <= 25) { found = clusters[i]; break; }
        }
        if (found) found.push(d); else clusters.push([d]);
      });
      clusters.forEach(function (g) {
        if (g.length === 1) { pos[g[0].id] = { x: g[0].x, y: g[0].y }; return; }
        var center = null;
        g.forEach(function (d) { if (!center && d.kat === "stadt") center = d; });
        if (!center) center = g[0];
        pos[center.id] = { x: center.x, y: center.y };
        var others = g.filter(function (d) { return d !== center; });
        var R = 9 + others.length * 1.1;
        others.forEach(function (d, i) {
          var ang = (Math.PI * 2 * i / others.length) - Math.PI / 2;
          pos[d.id] = { x: center.x + R * Math.cos(ang), y: center.y + R * Math.sin(ang) };
        });
      });

      data.forEach(function (d) {
        var km = katMeta(d.kat);
        var pp = pos[d.id] || { x: d.x, y: d.y };
        var g = document.createElementNS(NS, "g");
        g.setAttribute("class", "pl-pin " + (d.status || "ziel"));
        g.setAttribute("id", "pl-pin-" + d.id);
        g.setAttribute("transform", "translate(" + pp.x + "," + pp.y + ")");

        // Städte-Pins etwas größer als POI-Pins — hält die volle Karte lesbar.
        var isCity = d.kat === "stadt";
        var c = document.createElementNS(NS, "circle");
        c.setAttribute("class", "pl-pin-bg");
        c.setAttribute("r", isCity ? "8.5" : "6.5");
        g.appendChild(c);

        var icon = document.createElementNS(NS, "text");
        icon.setAttribute("class", "pl-icon");
        icon.setAttribute("text-anchor", "middle");
        icon.setAttribute("y", isCity ? "3.4" : "2.6");
        if (!isCity) icon.style.fontSize = "6.5px";
        icon.textContent = km.icon;
        g.appendChild(icon);

        var title = document.createElementNS(NS, "title");
        var stLabel = (STATUS[d.status] || STATUS.ziel).label;
        title.textContent = d.name + " — " + km.label + " (" + stLabel + ")";
        g.appendChild(title);

        // Dauer-Label nur für Städte; POIs zeigen den Namen per Tooltip + in der Kachel.
        if (d.kat === "stadt") {
          var right = (d.lx || 9) > 0;
          var t = document.createElementNS(NS, "text");
          t.setAttribute("class", "pl-lbl");
          t.setAttribute("x", right ? 11 : -11);
          t.setAttribute("y", (d.ly || 0) + 2.2);
          t.setAttribute("text-anchor", right ? "start" : "end");
          t.textContent = d.short || d.name;
          g.appendChild(t);
        }

        g.style.cursor = "pointer";
        g.addEventListener("click", function () {
          var card = document.getElementById("pl-card-" + d.id);
          if (!card) return;
          svg.querySelectorAll(".pl-pin.active").forEach(function (p) { p.classList.remove("active"); });
          g.classList.add("active");
          card.classList.remove("flash");
          void card.offsetWidth;
          card.classList.add("flash");
          card.scrollIntoView({ behavior: "smooth", block: "center" });
        });
        svg.appendChild(g);
      });
      apply(); // Pins existieren jetzt — Sichtbarkeit (u. a. Camper ausblenden) anwenden
    }).catch(function (err) { console.error("Polen-Karte konnte nicht geladen werden:", err); });
  }

  apply();
})();
