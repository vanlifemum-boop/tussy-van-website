#!/usr/bin/env node
"use strict";

/*
 * Importiert öffentlich sichtbare GPS-Punkte für Waldparkplätze, Duschen,
 * Waschsalons und Camper-System-Stationen. Die Ausgabe bleibt absichtlich
 * kompakt: [Kategorie, Breitengrad, Längengrad, Region, nächster Ort, Typ].
 * Ungültige, doppelte und außerhalb Polens liegende Punkte werden verworfen.
 *
 * Standard: Daten direkt laden.
 * Offline:  WYPRAWOMANIAK_DATA_DIR=/pfad/zum/ordner node scripts/import_wyprawomaniak_services.js
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const TARGET = path.join(ROOT, "js", "polen-services.js");
const SOURCE_DIR = process.env.WYPRAWOMANIAK_DATA_DIR || "";
const RETRIEVED_AT = new Date().toISOString().slice(0, 10);

const SOURCES = [
  {
    file: "punktyzvideo.json",
    url: "https://wyprawomaniak.pl/wp-content/plugins/magic-leaflet/locals/leaflet-database-punktyzvideo.json"
  },
  {
    file: "punktyodklubowiczow.json",
    url: "https://wyprawomaniak.pl/wp-content/plugins/magic-leaflet/locals/leaflet-database-punktyodklubowiczow.json"
  },
  {
    file: "punkty.json",
    url: "https://wyprawomaniak.pl/wp-content/plugins/magic-leaflet/locals/leaflet-database-punkty.json"
  }
];
const CITIES = {
  file: "cities_pl_min.json",
  url: "https://wyprawomaniak.pl/wp-content/plugins/magic-leaflet/locals/cities_pl_min.json"
};
const POLAND = {
  file: "poland.geo.json",
  url: "https://raw.githubusercontent.com/johan/world.geo.json/master/countries/POL.geo.json"
};

async function getJson(source) {
  if (SOURCE_DIR) {
    return JSON.parse(fs.readFileSync(path.join(SOURCE_DIR, source.file), "utf8"));
  }
  const controller = new AbortController();
  const timeout = setTimeout(function () { controller.abort(); }, 60000);
  try {
    const response = await fetch(source.url, {
      signal: controller.signal,
      headers: { "User-Agent": "Tussy-Van map data importer" }
    });
    if (!response.ok) {
      throw new Error(response.status + " " + response.statusText + " — " + source.url);
    }
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

function nearestCity(lat, lon, cities) {
  let best = null;
  let bestDistance = Infinity;
  const lonScale = Math.cos(lat * Math.PI / 180);
  cities.forEach(function (city) {
    const dx = (city.lon - lon) * lonScale;
    const dy = city.lat - lat;
    const distance = dx * dx + dy * dy;
    if (distance < bestDistance) {
      best = city;
      bestDistance = distance;
    }
  });
  return best ? best.name : "Polen";
}

function regionFor(lat, lon) {
  if (lat >= 53.0 && lon >= 19.3) return "masuren";
  if (lat >= 53.0) return "norden";
  if (lon <= 18.5) return "westen";
  if (lat <= 51.5) return "sueden";
  return "zentral";
}

function categoryFor(amenity) {
  const values = String(amenity || "").split(",");
  if (amenity === "GrupaParking") return "waldpark";
  if (values.indexOf("GrupaPrysznice") !== -1) return "dusche";
  if (amenity === "GrupaPralkomat") return "waschsalon";
  if (amenity === "GrupaCamperSystem") return "campersystem";
  return "";
}

function showerType(amenity) {
  return String(amenity || "").split(",").indexOf("GrupaMOP") !== -1 ? "mop" : "";
}

async function main() {
  const responses = await Promise.all([
    ...SOURCES.map(getJson),
    getJson(CITIES),
    getJson(POLAND)
  ]);
  const sourceCollections = responses.slice(0, SOURCES.length);
  const cities = responses[SOURCES.length].map(function (city) {
    return { name: city.name, lat: Number(city.lat), lon: Number(city.lon) };
  }).filter(function (city) {
    return city.name && Number.isFinite(city.lat) && Number.isFinite(city.lon);
  });
  const polandFile = responses[SOURCES.length + 1];
  const poland = polandFile.features ? polandFile.features[0].geometry : polandFile.geometry;

  const rawCounts = {};
  const unique = new Map();
  sourceCollections.forEach(function (collection) {
    (collection.features || []).forEach(function (feature) {
      const category = categoryFor(feature.properties && feature.properties.amenity);
      if (!category) return;
      rawCounts[category] = (rawCounts[category] || 0) + 1;
      const coordinates = feature.geometry && feature.geometry.coordinates;
      if (!Array.isArray(coordinates) || coordinates.length < 2) return;
      const lon = Number(coordinates[0]);
      const lat = Number(coordinates[1]);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
      if (!pointInGeometry([lon, lat], poland)) return;
      const key = category + ":" + lat.toFixed(5) + "," + lon.toFixed(5);
      if (!unique.has(key)) unique.set(key, { category: category, feature: feature, lat: lat, lon: lon });
    });
  });

  const records = Array.from(unique.values()).map(function (point) {
    const city = nearestCity(point.lat, point.lon, cities);
    const tuple = [
      point.category,
      Number(point.lat.toFixed(5)),
      Number(point.lon.toFixed(5)),
      regionFor(point.lat, point.lon),
      city
    ];
    if (point.category === "dusche") {
      const type = showerType(point.feature.properties.amenity);
      if (type) tuple.push(type);
    }
    return tuple;
  }).sort(function (a, b) {
    return a[0].localeCompare(b[0]) || a[4].localeCompare(b[4], "pl") || a[1] - b[1] || a[2] - b[2];
  });

  const counts = records.reduce(function (result, row) {
    result[row[0]] = (result[row[0]] || 0) + 1;
    return result;
  }, {});
  const minimums = { waldpark: 3000, dusche: 250, waschsalon: 70, campersystem: 100 };
  Object.keys(minimums).forEach(function (category) {
    if ((counts[category] || 0) < minimums[category]) {
      throw new Error("Import abgebrochen: nur " + (counts[category] || 0) + " Punkte für " + category);
    }
  });

  const header = [
    "/* Automatisch erzeugt mit scripts/import_wyprawomaniak_services.js.",
    "   Stand: " + RETRIEVED_AT + " · " + records.length + " gültige, eindeutige GPS-Punkte in Polen.",
    "   Schema: [Kategorie, Breitengrad, Längengrad, Region, nächster Ort, optionaler Typ]. */"
  ].join("\n");
  const rows = records.map(function (row) { return "  " + JSON.stringify(row); }).join(",\n");
  fs.writeFileSync(TARGET, header + "\nwindow.POLEN_SERVICE_POINTS = [\n" + rows + "\n];\n", "utf8");

  console.log("Geprüft:", rawCounts);
  console.log("Für Polen geschrieben:", counts, "Gesamt:", records.length);
}

main().catch(function (error) {
  console.error(error.stack || error.message || error);
  process.exitCode = 1;
});
