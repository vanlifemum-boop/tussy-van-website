/* Performante Karten-App für große Polen-Datensätze.
   Wird von js/polen.js gestartet, nachdem Basisdaten und Legende definiert sind. */
window.POLEN_MAP_APP_V2 = function () {
  "use strict";

  var NS = "http://www.w3.org/2000/svg";
  var english = document.documentElement.lang.toLowerCase().indexOf("en") === 0;
  var RESULT_BATCH = 80;
  var MAP_CLUSTER_THRESHOLD = 220;

  function mapPosition(lat, lon) {
    return {
      x: Math.round((13.758 * lon - 0.761 * lat + 311.25) * 10) / 10,
      y: Math.round((-1.117 * lon - 22.948 * lat + 1625.66) * 10) / 10
    };
  }

  function coordinateId(value) {
    return Number(value).toFixed(5).replace(/-/g, "m").replace(".", "-");
  }

  function serviceName(category, city, subtype, useEnglish) {
    if (category === "waldpark") return (useEnglish ? "Forest parking near " : "Waldparkplatz bei ") + city;
    if (category === "dusche") {
      if (subtype === "mop") return (useEnglish ? "Shower at a rest area near " : "Dusche am Rastplatz bei ") + city;
      return (useEnglish ? "Shower near " : "Dusche bei ") + city;
    }
    if (category === "waschsalon") return (useEnglish ? "Laundromat near " : "Waschsalon bei ") + city;
    if (category === "campersystem") return (useEnglish ? "Camper System station near " : "Camper-System-Station bei ") + city;
    return (useEnglish ? "Camper point near " : "Camper-Punkt bei ") + city;
  }

  function normalizeServicePoint(row) {
    var category = String(row[0] || "");
    var lat = Number(row[1]);
    var lon = Number(row[2]);
    var city = String(row[4] || "Polen");
    var subtype = String(row[5] || "");
    var position = mapPosition(lat, lon);
    return {
      id: "service-" + category + "-" + coordinateId(lat) + "-" + coordinateId(lon),
      name: serviceName(category, city, subtype, false),
      nameEn: serviceName(category, city, subtype, true),
      city: city,
      region: String(row[3] || "zentral"),
      kat: category,
      status: "sehenswert",
      x: position.x,
      y: position.y,
      lat: lat,
      lon: lon,
      servicePoint: true,
      serviceSubtype: subtype
    };
  }

  var serviceData = (window.POLEN_SERVICE_POINTS || []).map(normalizeServicePoint);
  var data = (window.POLEN_DATA || [])
    .concat(window.POLEN_CAMPER || [])
    .concat(window.POLEN_NATURPLAETZE || [])
    .concat(serviceData);
  var STATUS = window.POLEN_STATUS || {};

  var KAT = {};
  (window.POLEN_KATEGORIEN || []).forEach(function (group) {
    group.items.forEach(function (item) { KAT[item.key] = item; });
  });

  var state = { region: "alle", kats: {}, statuses: {}, query: "" };
  var categoryButtons = {};
  var legendCategoryButtons = {};
  var legendStatusButtons = {};
  var currentMatches = [];
  var renderLimit = RESULT_BATCH;
  var mapSvg = null;
  var pinLayer = null;

  var mapStage = document.querySelector("[data-pl-map]");
  var grid = document.querySelector("[data-pl-grid]");
  var regRow = document.querySelector("[data-pl-filter]");
  var katRow = document.querySelector("[data-pl-catfilter]");
  var legendBox = document.querySelector("[data-pl-legende]");
  var search = document.querySelector("[data-pl-search]");
  var count = document.querySelector("[data-pl-count]");
  if (!grid) return;

  var empty = grid.parentElement ? grid.parentElement.querySelector(".pl-empty") : null;
  var moreButton = document.createElement("button");
  moreButton.type = "button";
  moreButton.className = "btn pl-more";
  moreButton.hidden = true;
  grid.parentNode.insertBefore(moreButton, grid.nextSibling);

  function localized(item, property) {
    if (!item) return "";
    var englishProperty = property + "En";
    return english && item[englishProperty] ? item[englishProperty] : item[property];
  }

  function katMeta(key) {
    return KAT[key] || { icon: "📍", label: key || "Ort", labelEn: key || "Place" };
  }

  function serviceMeta(place, useEnglish) {
    var near = useEnglish ? "Near " : "Nähe ";
    var suffix = {
      waldpark: useEnglish ? "GPS forest parking" : "GPS-Waldparkplatz",
      dusche: place.serviceSubtype === "mop"
        ? (useEnglish ? "Rest-area shower" : "Rastplatz-Dusche")
        : (useEnglish ? "GPS shower" : "GPS-Dusche"),
      waschsalon: useEnglish ? "GPS laundromat" : "GPS-Waschsalon",
      campersystem: useEnglish ? "Camper System station" : "Camper-System-Station"
    };
    return near + place.city + " · " +
      (suffix[place.kat] || (useEnglish ? "Camper point" : "Camper-Punkt")) + " · " +
      place.lat.toFixed(5) + ", " + place.lon.toFixed(5);
  }

  function serviceBlurb(place, useEnglish) {
    if (place.kat === "waldpark") {
      return useEnglish
        ? "GPS planning point for forest parking near " + place.city + ". Access, parking rules and possible overnight stays are not verified; check local signs and forest regulations."
        : "GPS-Planungspunkt für einen Waldparkplatz nahe " + place.city + ". Zufahrt, Parkregeln und eine mögliche Übernachtung sind nicht verifiziert — Beschilderung und örtliche Waldregeln prüfen.";
    }
    if (place.kat === "dusche") {
      return useEnglish
        ? "GPS planning point for a shower near " + place.city + ". Public access, opening hours, fees and current operation are not verified; please check on site."
        : "GPS-Planungspunkt für eine Dusche nahe " + place.city + ". Öffentlicher Zugang, Öffnungszeiten, Gebühren und aktueller Betrieb sind nicht verifiziert — bitte vor Ort prüfen.";
    }
    if (place.kat === "waschsalon") {
      return useEnglish
        ? "GPS planning point for a laundromat near " + place.city + ". Machines, opening hours and payment options may change; please check current details on site."
        : "GPS-Planungspunkt für einen Waschsalon nahe " + place.city + ". Maschinen, Öffnungszeiten und Bezahlmöglichkeiten können sich ändern — bitte aktuell vor Ort prüfen.";
    }
    return useEnglish
      ? "GPS planning point for a Camper System station near " + place.city + ". Services, access and opening hours may change; please check current details on site."
      : "GPS-Planungspunkt für eine Camper-System-Station nahe " + place.city + ". Angebot, Zugang und Betriebszeiten können sich ändern — bitte aktuell vor Ort prüfen.";
  }

  function placeName(place, useEnglish) {
    if (typeof useEnglish !== "boolean") useEnglish = english;
    return useEnglish && place.nameEn ? place.nameEn : (place.name || place.nameEn || "Ort");
  }

  function placeBlurb(place, useEnglish) {
    if (typeof useEnglish !== "boolean") useEnglish = english;
    if (place.servicePoint) return serviceBlurb(place, useEnglish);
    if (useEnglish && place.blurbEn) return place.blurbEn;
    return place.blurb || place.blurbEn || "";
  }

  function placeMeta(place, useEnglish) {
    if (typeof useEnglish !== "boolean") useEnglish = english;
    if (place.servicePoint) return serviceMeta(place, useEnglish);
    if (useEnglish && place.metaEn) return place.metaEn;
    return place.meta || place.metaEn || "";
  }

  function placeUrl(place) {
    if (typeof place.lat === "number" && typeof place.lon === "number") {
      return "https://www.google.com/maps/search/?api=1&query=" +
        encodeURIComponent(place.lat + "," + place.lon);
    }
    return place.url || "#";
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatNumber(value) {
    return Number(value).toLocaleString(english ? "en-GB" : "de-DE");
  }

  function noKatFilter() { return Object.keys(state.kats).length === 0; }
  function noStatusFilter() { return Object.keys(state.statuses).length === 0; }
  function clearFilterSet(set) {
    Object.keys(set).forEach(function (key) { delete set[key]; });
  }

  var CAMPER_KATS = {
    camping: 1,
    camperservice: 1,
    campersystem: 1,
    entsorgung: 1,
    rastplatz: 1,
    waldpark: 1,
    biwak: 1,
    dusche: 1,
    waschsalon: 1,
    werkstatt: 1
  };
  var camperTotal = data.filter(function (place) { return CAMPER_KATS[place.kat]; }).length;

  data.forEach(function (place) {
    var category = katMeta(place.kat);
    place._plSearch = [
      placeName(place, false), placeName(place, true),
      placeBlurb(place, false), placeBlurb(place, true),
      placeMeta(place, false), placeMeta(place, true),
      category.label, category.labelEn,
      place.city || "", place.lat || "", place.lon || ""
    ].join(" ").toLowerCase();
  });

  var preEl = document.querySelector("[data-preselect-kat]");
  if (preEl) {
    preEl.getAttribute("data-preselect-kat").split(",").forEach(function (key) {
      key = key.trim();
      if (key) state.kats[key] = true;
    });
  }

  function statusLabel(status) {
    return localized(status || STATUS.ziel || { label: "Reiseziel", labelEn: "Destination" }, "label");
  }

  function createCard(place) {
    var category = katMeta(place.kat);
    var status = STATUS[place.status] || STATUS.ziel || { label: "Reiseziel", labelEn: "Destination", tag: "" };
    var displayName = placeName(place);
    var displayBlurb = placeBlurb(place);
    var displayMeta = placeMeta(place);
    var card = document.createElement("a");
    var href = placeUrl(place);
    card.className = "post-card";
    card.id = "pl-card-" + place.id;
    card.href = href;
    if (/^https?:/.test(href)) { card.target = "_blank"; card.rel = "noopener"; }
    var badge = place.status === "ziel" ? (english ? " · more soon" : " · bald mehr") : "";
    card.innerHTML =
      '<span class="cat sticker ' + escapeHtml(status.tag || "") + '">' +
      escapeHtml(category.icon + " " + statusLabel(status) + badge) + "</span>" +
      "<h3>" + escapeHtml(displayName) + "</h3>" +
      "<p>" + escapeHtml(displayBlurb) + "</p>" +
      '<span class="meta">' + escapeHtml(displayMeta) + "</span>";
    return card;
  }

  function renderResults(matches) {
    grid.textContent = "";
    var fragment = document.createDocumentFragment();
    matches.slice(0, renderLimit).forEach(function (place) {
      fragment.appendChild(createCard(place));
    });
    grid.appendChild(fragment);
    var remaining = Math.max(0, matches.length - renderLimit);
    moreButton.hidden = remaining === 0;
    if (remaining) {
      var next = Math.min(RESULT_BATCH, remaining);
      moreButton.textContent = english
        ? "Show " + formatNumber(next) + " more places (" + formatNumber(remaining) + " remaining)"
        : formatNumber(next) + " weitere Orte anzeigen (noch " + formatNumber(remaining) + ")";
    }
    if (empty) empty.style.display = matches.length ? "none" : "block";
  }

  moreButton.addEventListener("click", function () {
    renderLimit = Math.min(currentMatches.length, renderLimit + RESULT_BATCH);
    renderResults(currentMatches);
  });

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

  if (regRow) {
    (window.POLEN_REGIONS || []).forEach(function (region) {
      var hasPlaces = region.key === "alle" || data.some(function (place) { return place.region === region.key; });
      if (!hasPlaces) return;
      var button = document.createElement("button");
      button.type = "button";
      button.className = "chip" + (region.key === "alle" ? " active" : "");
      button.textContent = localized(region, "label");
      button.setAttribute("data-region", region.key);
      button.addEventListener("click", function () {
        state.region = region.key;
        regRow.querySelectorAll(".chip").forEach(function (chip) { chip.classList.remove("active"); });
        button.classList.add("active");
        apply();
      });
      regRow.appendChild(button);
    });
  }

  if (katRow) {
    var present = [];
    (window.POLEN_KATEGORIEN || []).forEach(function (group) {
      group.items.forEach(function (item) {
        if (data.some(function (place) { return place.kat === item.key; })) present.push(item);
      });
    });
    present.forEach(function (item) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "chip chip-kat" + (state.kats[item.key] ? " active" : "");
      button.textContent = item.icon + " " + localized(item, "label");
      button.setAttribute("data-kat", item.key);
      button.setAttribute("aria-pressed", String(!!state.kats[item.key]));
      categoryButtons[item.key] = button;
      button.addEventListener("click", function () {
        if (state.kats[item.key]) delete state.kats[item.key];
        else state.kats[item.key] = true;
        syncLegendFilters();
        apply();
      });
      katRow.appendChild(button);
    });
  }

  if (legendBox) {
    var legendHtml = '<p class="pl-legende-hint">' +
      (english ? "Select a symbol to show only matching places on the map." : "Klick auf ein Symbol, um nur passende Orte auf der Karte anzuzeigen.") +
      '</p><div class="pl-legende-status" role="group" aria-label="' +
      (english ? "Marker status" : "Markerstatus") + '">' +
      '<button type="button" class="pl-legend-filter" data-legend-status="bericht" aria-pressed="false"><i class="pl-dot bericht"></i> 💛 ' +
      (english ? "my travel story" : "mein Reisebericht") + "</button>" +
      '<button type="button" class="pl-legend-filter" data-legend-status="sehenswert" aria-pressed="false"><i class="pl-dot sehenswert"></i> ' +
      (english ? "Worth seeing" : "Sehenswertes") + "</button>" +
      '<button type="button" class="pl-legend-filter" data-legend-status="ziel" aria-pressed="false"><i class="pl-dot ziel"></i> ' +
      (english ? "Destination" : "Reiseziel") + "</button></div>";
    (window.POLEN_KATEGORIEN || []).forEach(function (group) {
      legendHtml += '<div class="pl-legende-grp"><b>' + escapeHtml(localized(group, "group")) + "</b><ul>";
      group.items.forEach(function (item) {
        legendHtml += '<li><button type="button" class="pl-legend-filter" data-legend-kat="' +
          escapeHtml(item.key) + '" aria-pressed="false"><span class="pl-lg-icon">' +
          escapeHtml(item.icon) + "</span>" + escapeHtml(localized(item, "label")) + "</button></li>";
      });
      legendHtml += "</ul></div>";
    });
    legendHtml += '<button type="button" class="pl-legend-reset">' +
      (english ? "Reset legend filter" : "Legendenfilter zurücksetzen") + "</button>";
    legendBox.innerHTML = legendHtml;
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

  if (search) {
    search.addEventListener("input", function () {
      state.query = search.value.trim().toLowerCase();
      apply();
    });
  }

  function isFiltering() {
    return state.region !== "alle" || !noKatFilter() || !noStatusFilter() || state.query !== "";
  }

  function filteredData() {
    var filtering = isFiltering();
    var allCategories = noKatFilter();
    var allStatuses = noStatusFilter();
    return data.filter(function (place) {
      if (state.region !== "alle" && place.region !== state.region) return false;
      if (!allCategories && !state.kats[place.kat]) return false;
      if (!allStatuses && !state.statuses[place.status]) return false;
      if (state.query && place._plSearch.indexOf(state.query) === -1) return false;
      if (CAMPER_KATS[place.kat] && !filtering) return false;
      return true;
    });
  }

  function updateCount(matches) {
    if (!count) return;
    if (isFiltering()) {
      count.textContent = english
        ? formatNumber(matches.length) + (matches.length === 1 ? " place found" : " places found")
        : formatNumber(matches.length) + (matches.length === 1 ? " Ort gefunden" : " Orte gefunden");
      return;
    }
    count.textContent = english
      ? formatNumber(matches.length) + " highlights · + " + formatNumber(camperTotal) + " camper points (filter by category/region or search for your place)"
      : formatNumber(matches.length) + " Highlights · + " + formatNumber(camperTotal) + " Camper-Punkte (filter nach Kategorie/Region oder such deinen Ort)";
  }

  function spreadPositions(points) {
    var positions = {};
    var clusters = [];
    points.forEach(function (place) {
      var found = null;
      for (var i = 0; i < clusters.length; i++) {
        var center = clusters[i][0];
        var dx = center.x - place.x;
        var dy = center.y - place.y;
        if (dx * dx + dy * dy <= 25) { found = clusters[i]; break; }
      }
      if (found) found.push(place); else clusters.push([place]);
    });
    clusters.forEach(function (group) {
      if (group.length === 1) {
        positions[group[0].id] = { x: group[0].x, y: group[0].y };
        return;
      }
      var center = group.filter(function (place) { return place.kat === "stadt"; })[0] || group[0];
      positions[center.id] = { x: center.x, y: center.y };
      var others = group.filter(function (place) { return place !== center; });
      others.forEach(function (place, index) {
        var ring = Math.floor(index / 12) + 1;
        var firstInRing = (ring - 1) * 12;
        var itemsInRing = Math.min(12, others.length - firstInRing);
        var slot = index - firstInRing;
        var angle = Math.PI * 2 * slot / itemsInRing - Math.PI / 2;
        var radius = 8 * ring;
        positions[place.id] = {
          x: center.x + radius * Math.cos(angle),
          y: center.y + radius * Math.sin(angle)
        };
      });
    });
    return positions;
  }

  function renderPin(place, position) {
    var category = katMeta(place.kat);
    var group = document.createElementNS(NS, "g");
    group.setAttribute("class", "pl-pin " + (place.status || "ziel"));
    group.setAttribute("id", "pl-pin-" + place.id);
    group.setAttribute("transform", "translate(" + position.x + "," + position.y + ")");

    var isCity = place.kat === "stadt";
    var circle = document.createElementNS(NS, "circle");
    circle.setAttribute("class", "pl-pin-bg");
    circle.setAttribute("r", isCity ? "8.5" : "6.5");
    group.appendChild(circle);

    var icon = document.createElementNS(NS, "text");
    icon.setAttribute("class", "pl-icon");
    icon.setAttribute("text-anchor", "middle");
    icon.setAttribute("y", isCity ? "3.4" : "2.6");
    if (!isCity) icon.style.fontSize = "6.5px";
    icon.textContent = category.icon;
    group.appendChild(icon);

    var title = document.createElementNS(NS, "title");
    title.textContent = placeName(place) + " — " + localized(category, "label") + " (" +
      statusLabel(STATUS[place.status] || STATUS.ziel) + ")";
    group.appendChild(title);

    if (isCity) {
      var right = (place.lx || 9) > 0;
      var label = document.createElementNS(NS, "text");
      label.setAttribute("class", "pl-lbl");
      label.setAttribute("x", right ? 11 : -11);
      label.setAttribute("y", (place.ly || 0) + 2.2);
      label.setAttribute("text-anchor", right ? "start" : "end");
      label.textContent = place.short || placeName(place);
      group.appendChild(label);
    }

    group.addEventListener("click", function () {
      var matchIndex = currentMatches.indexOf(place);
      if (matchIndex >= renderLimit) {
        renderLimit = Math.min(currentMatches.length, matchIndex + 1);
        renderResults(currentMatches);
      }
      var card = document.getElementById("pl-card-" + place.id);
      if (!card) return;
      pinLayer.querySelectorAll(".pl-pin.active").forEach(function (pin) { pin.classList.remove("active"); });
      group.classList.add("active");
      card.classList.remove("flash");
      void card.offsetWidth;
      card.classList.add("flash");
      card.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    pinLayer.appendChild(group);
  }

  function renderClusters(points) {
    var cellSize = points.length > 3000 ? 9 : (points.length > 900 ? 7 : 5.5);
    var buckets = {};
    points.forEach(function (place) {
      var key = Math.floor(place.x / cellSize) + ":" + Math.floor(place.y / cellSize);
      if (!buckets[key]) buckets[key] = { x: 0, y: 0, places: [] };
      buckets[key].x += place.x;
      buckets[key].y += place.y;
      buckets[key].places.push(place);
    });
    Object.keys(buckets).forEach(function (key) {
      var bucket = buckets[key];
      var size = bucket.places.length;
      var group = document.createElementNS(NS, "g");
      group.setAttribute("class", "pl-map-cluster");
      group.setAttribute("transform", "translate(" + (bucket.x / size) + "," + (bucket.y / size) + ")");
      group.setAttribute("role", "img");
      var circle = document.createElementNS(NS, "circle");
      circle.setAttribute("r", size > 99 ? "9" : "7.5");
      group.appendChild(circle);
      var label = document.createElementNS(NS, "text");
      label.setAttribute("text-anchor", "middle");
      label.setAttribute("y", "2.2");
      label.textContent = formatNumber(size);
      group.appendChild(label);
      var title = document.createElementNS(NS, "title");
      title.textContent = size === 1
        ? placeName(bucket.places[0])
        : (english ? formatNumber(size) + " matching places in this area" : formatNumber(size) + " passende Orte in diesem Kartenausschnitt");
      group.appendChild(title);
      pinLayer.appendChild(group);
    });
  }

  function renderMap(matches) {
    if (!pinLayer) return;
    pinLayer.textContent = "";
    var points = matches.filter(function (place) {
      return Number.isFinite(place.x) && Number.isFinite(place.y);
    });
    if (points.length > MAP_CLUSTER_THRESHOLD) {
      renderClusters(points);
      return;
    }
    var positions = spreadPositions(points);
    points.forEach(function (place) {
      renderPin(place, positions[place.id] || { x: place.x, y: place.y });
    });
  }

  function apply() {
    renderLimit = RESULT_BATCH;
    currentMatches = filteredData();
    renderResults(currentMatches);
    updateCount(currentMatches);
    renderMap(currentMatches);
  }

  if (mapStage) {
    fetch(mapStage.getAttribute("data-pl-map")).then(function (response) {
      if (!response.ok) throw new Error(response.status + " " + response.statusText);
      return response.text();
    }).then(function (svgText) {
      var holder = document.createElement("div");
      holder.innerHTML = svgText;
      mapSvg = holder.querySelector("svg");
      if (!mapSvg) throw new Error("SVG fehlt");
      mapSvg.setAttribute("class", "pl-map");
      mapSvg.setAttribute("viewBox", "450 332 182 162");
      var poland = mapSvg.querySelector("#c-PL");
      if (poland) poland.classList.add("pl");
      pinLayer = document.createElementNS(NS, "g");
      pinLayer.setAttribute("data-pl-pins", "");
      mapSvg.appendChild(pinLayer);
      mapStage.appendChild(mapSvg);
      renderMap(currentMatches);
    }).catch(function (error) {
      console.error("Polen-Karte konnte nicht geladen werden:", error);
    });
  }

  apply();
};
