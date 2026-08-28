#!/usr/bin/env node
"use strict";

/*
 * Importiert ausschließlich öffentlich sichtbare GPS-Punkte der Kategorie
 * „GrupaDzikie“ und erzeugt daraus eine eigenständige, zweisprachige Datei
 * für die Tussy-Van-Polenkarte. Beschreibungen der Quellseite werden nicht
 * übernommen. Ungültige, doppelte und außerhalb Polens liegende Punkte
 * werden verworfen.
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const TARGET = path.join(ROOT, "js", "polen-naturplaetze.js");
const RETRIEVED_AT = new Date().toISOString().slice(0, 10);

const DATA_URLS = [
  "https://wyprawomaniak.pl/wp-content/plugins/magic-leaflet/locals/leaflet-database-punktyzvideo.json",
  "https://wyprawomaniak.pl/wp-content/plugins/magic-leaflet/locals/leaflet-database-punktyodklubowiczow.json",
  "https://wyprawomaniak.pl/wp-content/plugins/magic-leaflet/locals/leaflet-database-punkty.json"
];
const CITIES_URL = "https://wyprawomaniak.pl/wp-content/plugins/magic-leaflet/locals/cities_pl_min.json";
const POLAND_URL = "https://raw.githubusercontent.com/johan/world.geo.json/master/countries/POL.geo.json";

async function getJson(url) {
  const controller = new AbortController();
  const timeout = setTimeout(function () { controller.abort(); }, 60000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Tussy-Van map data importer" }
    });
    if (!response.ok) throw new Error(response.status + " " + response.statusText + " — " + url);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

function pointInRing(point, ring) {
  const x = point[0];
  const y = point[1];
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    const crosses = (yi > y) !== (yj > y) &&
      x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (crosses) inside = !inside;
  }
  return inside;
}

function pointInPolygon(point, polygon) {
  if (!pointInRing(point, polygon[0])) return false;
  return !polygon.slice(1).some(function (hole) { return pointInRing(point, hole); });
}

function pointInGeometry(point, geometry) {
  if (geometry.type === "Polygon") return pointInPolygon(point, geometry.coordinates);
  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.some(function (polygon) { return pointInPolygon(point, polygon); });
  }
  return false;
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = Math.PI / 180;
  const dLat = (lat2 - lat1) * toRad;
  const dLon = (lon2 - lon1) * toRad;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.sin(dLon / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(a));
}

function nearestCity(lat, lon, cities) {
  let best = null;
  let distance = Infinity;
  cities.forEach(function (city) {
    const candidate = haversineKm(lat, lon, city.lat, city.lon);
    if (candidate < distance) {
      best = city;
      distance = candidate;
    }
  });
  return { name: best ? best.name : "Polen", distance: distance };
}

function kindFor(sourceName) {
  const name = String(sourceName || "").toLocaleLowerCase("pl-PL");
  if (/nad rzek|przy rze/.test(name)) return { de: "Naturplatz am Fluss", en: "Riverside nature spot" };
  if (/nad jezior|przy jezior/.test(name)) return { de: "Naturplatz am See", en: "Lakeside nature spot" };
  if (/nad staw|przy staw/.test(name)) return { de: "Naturplatz am Teich", en: "Pondside nature spot" };
  if (/nad zalew|przy zalew/.test(name)) return { de: "Naturplatz am Stausee", en: "Reservoir nature spot" };
  if (/nad zatok|przy zatok/.test(name)) return { de: "Naturplatz an der Bucht", en: "Bay nature spot" };
  if (/przy pla|nad morz/.test(name)) return { de: "Naturplatz am Strand", en: "Beach nature spot" };
  if (/nad wod/.test(name)) return { de: "Naturplatz am Wasser", en: "Waterside nature spot" };
  if (/polana/.test(name)) return { de: "Naturwiese", en: "Nature meadow" };
  if (/parking|kamper plac/.test(name)) return { de: "Naturparkplatz", en: "Nature parking spot" };
  return { de: "Naturplatz", en: "Nature spot" };
}

function regionFor(lat, lon) {
  if (lat >= 53.0 && lon >= 19.3) return "masuren";
  if (lat >= 53.0) return "norden";
  if (lon <= 18.5) return "westen";
  if (lat <= 51.5) return "sueden";
  return "zentral";
}

function mapPosition(lat, lon) {
  return {
    x: Math.round((13.758 * lon - 0.761 * lat + 311.25) * 10) / 10,
    y: Math.round((-1.117 * lon - 22.948 * lat + 1625.66) * 10) / 10
  };
}

function coordinateId(lat, lon) {
  return "natur-" + lat.toFixed(5).replace(".", "-") + "-" + lon.toFixed(5).replace(".", "-");
}

function sourceReference(feature) {
  const properties = feature.properties || {};
  return properties.description || properties.google || "https://wyprawomaniak.pl/";
}

async function main() {
  const responses = await Promise.all([
    ...DATA_URLS.map(getJson),
    getJson(CITIES_URL),
    getJson(POLAND_URL)
  ]);
  const sourceCollections = responses.slice(0, DATA_URLS.length);
  const cities = responses[DATA_URLS.length].map(function (city) {
    return { name: city.name, lat: Number(city.lat), lon: Number(city.lon) };
  }).filter(function (city) {
    return city.name && Number.isFinite(city.lat) && Number.isFinite(city.lon);
  });
  const poland = responses[DATA_URLS.length + 1].features[0].geometry;

  const sourcePoints = sourceCollections.flatMap(function (collection) {
    return collection.features || [];
  }).filter(function (feature) {
    return feature.properties && feature.properties.amenity === "GrupaDzikie";
  });

  const unique = new Map();
  sourcePoints.forEach(function (feature) {
    const coordinates = feature.geometry && feature.geometry.coordinates;
    if (!Array.isArray(coordinates) || coordinates.length < 2) return;
    const lon = Number(coordinates[0]);
    const lat = Number(coordinates[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
    if (!pointInGeometry([lon, lat], poland)) return;
    const key = lat.toFixed(5) + "," + lon.toFixed(5);
    if (!unique.has(key)) unique.set(key, feature);
  });

  const drafts = Array.from(unique.values()).map(function (feature) {
    const lon = Number(feature.geometry.coordinates[0]);
    const lat = Number(feature.geometry.coordinates[1]);
    const city = nearestCity(lat, lon, cities);
    const kind = kindFor(feature.properties.name);
    const position = mapPosition(lat, lon);
    return {
      baseDe: kind.de + " bei " + city.name,
      baseEn: kind.en + " near " + city.name,
      city: city.name,
      feature: feature,
      lat: lat,
      lon: lon,
      x: position.x,
      y: position.y
    };
  }).sort(function (a, b) {
    return a.baseDe.localeCompare(b.baseDe, "de") || a.lat - b.lat || a.lon - b.lon;
  });

  const totals = {};
  drafts.forEach(function (draft) { totals[draft.baseDe] = (totals[draft.baseDe] || 0) + 1; });
  const seen = {};
  const records = drafts.map(function (draft) {
    seen[draft.baseDe] = (seen[draft.baseDe] || 0) + 1;
    const suffix = totals[draft.baseDe] > 1 ? " · " + seen[draft.baseDe] : "";
    const englishSuffix = totals[draft.baseDe] > 1 ? " · " + seen[draft.baseDe] : "";
    return {
      id: coordinateId(draft.lat, draft.lon),
      name: draft.baseDe + suffix,
      nameEn: draft.baseEn + englishSuffix,
      region: regionFor(draft.lat, draft.lon),
      kat: "biwak",
      status: "sehenswert",
      x: draft.x,
      y: draft.y,
      lat: draft.lat,
      lon: draft.lon,
      meta: "Nähe " + draft.city + " · GPS-Naturplatz",
      metaEn: "Near " + draft.city + " · GPS nature spot",
      blurb: "Planungspunkt in der Nähe von " + draft.city + ". Ausstattung und Zufahrt sind nicht verifiziert; Schilder, Schutzgebiete und aktuelle Übernachtungsregeln bitte vor Ort prüfen.",
      blurbEn: "Planning point near " + draft.city + ". Facilities and access are not verified; check signs, protected areas and current overnight rules on site.",
      sourceRef: sourceReference(draft.feature)
    };
  });

  if (records.length < 80) {
    throw new Error("Import abgebrochen: nur " + records.length + " gültige Polen-Punkte gefunden");
  }

  const header = [
    "/* Automatisch erzeugt mit scripts/import_wyprawomaniak_naturplaetze.js.",
    "   Stand: " + RETRIEVED_AT + " · " + records.length + " gültige, eindeutige Punkte in Polen.",
    "   Die sichtbaren Texte sind eigenständig formuliert; sourceRef dient nur der internen Herkunftskontrolle. */"
  ].join("\n");
  fs.writeFileSync(
    TARGET,
    header + "\nwindow.POLEN_NATURPLAETZE = " + JSON.stringify(records, null, 2) + ";\n",
    "utf8"
  );
  console.log("Naturplätze: " + sourcePoints.length + " geprüft, " + records.length + " für Polen geschrieben");
}

main().catch(function (error) {
  console.error(error.stack || error.message || error);
  process.exitCode = 1;
});
