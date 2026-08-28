#!/usr/bin/env python3
"""Import the Bordatlas disposal-station PDF into the static website.

The PDF contains addresses, but no coordinates. Postal-code and place-name
coordinates are therefore read from local GeoNames exports and projected onto
the existing SVG Europe map. The script keeps the hand-curated station file as
the source of truth for its existing entries and emits only missing PDF rows.
"""

from __future__ import annotations

import argparse
import collections
import hashlib
import json
import math
import re
import shutil
import statistics
import subprocess
import tempfile
import unicodedata
from dataclasses import dataclass
from difflib import SequenceMatcher
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]

SERVICES = {
    "andere",
    "Bodeneinlass",
    "Eigenbau",
    "Holiday-Clean",
    "Euro-Relais",
    "Sani Station",
    "ST-SAN",
    "Sani Service 3in1",
    "EVA",
    "Modusan",
    "Holiday Cleany",
    "Flot Bleu",
    "Hygienja",
    "Silver S/C/Max",
    "CamperClean",
    "EMS Clean",
    "Cleanstar",
    "Sani Service 2in1",
    "Ceitec/Seijsener",
    "Dumpy",
    "ST-UNI",
    "Silver xS",
    "Euro-Relais junior",
    "ST-Toi",
    "Comficamp",
}

COUNTRY_CENTERS = {
    "AL": (41.15, 20.17),
    "AT": (47.52, 14.55),
    "BA": (44.17, 17.79),
    "BE": (50.64, 4.67),
    "CH": (46.82, 8.23),
    "CZ": (49.82, 15.47),
    "DE": (51.17, 10.45),
    "DK": (56.26, 9.50),
    "EE": (58.60, 25.01),
    "ES": (40.46, -3.75),
    "FI": (64.50, 26.00),
    "FO": (62.00, -6.79),
    "FR": (46.23, 2.21),
    "GB": (54.00, -2.50),
    "GR": (39.07, 21.82),
    "HR": (45.10, 15.20),
    "HU": (47.16, 19.50),
    "IE": (53.14, -7.69),
    "IS": (64.96, -19.02),
    "IT": (42.83, 12.83),
    "LI": (47.16, 9.56),
    "LT": (55.17, 23.88),
    "LU": (49.82, 6.13),
    "LV": (56.88, 24.60),
    "MK": (41.61, 21.75),
    "NL": (52.13, 5.29),
    "NO": (60.47, 8.47),
    "PL": (51.92, 19.15),
    "PT": (39.40, -8.22),
    "RO": (45.94, 24.97),
    "RS": (44.02, 21.01),
    "SE": (60.13, 18.64),
    "SI": (46.15, 14.99),
    "SK": (48.67, 19.70),
    "SM": (43.94, 12.46),
    "TR": (39.06, 35.24),
}

HEADER_RE = re.compile(r"^([A-Z]{2}) - (.+?)\s*$")
ROW_RE = re.compile(r"^(\S(?:.{0,11}?\S)?)\s{2,}(.+?)\s*$")
CURATED_RE = re.compile(
    r'\{ cc: "([A-Z]{2})", city: "([^"]+)", name: "([^"]+)", '
    r'x: (-?[0-9.]+), y: (-?[0-9.]+), q: "([^"]+)" \}'
)


@dataclass
class GeoPoint:
    lat: float
    lon: float
    name: str
    weight: int = 0


@dataclass
class Station:
    cc: str
    postcode: str
    address: str
    service: str = ""
    page: int = 0
    lat: float | None = None
    lon: float | None = None
    geocode_method: str = ""

    @property
    def city(self) -> str:
        return self.address.split(",", 1)[0].strip()


def normalized(value: str) -> str:
    ascii_value = (
        unicodedata.normalize("NFKD", value)
        .encode("ascii", "ignore")
        .decode("ascii")
        .lower()
    )
    return re.sub(r"[^a-z0-9]+", "", ascii_value)


def normalized_postcode(value: str) -> str:
    return re.sub(r"[^A-Z0-9]+", "", value.upper())


def city_variants(value: str) -> list[str]:
    raw = [value]
    raw.extend(re.split(r"[/()]", value))
    raw.extend(re.split(r"\s+(?:bei|obok|in|am|an der)\s+", value, flags=re.I))
    raw.extend(re.split(r"[-–]", value))
    result: list[str] = []
    for item in raw:
        key = normalized(item)
        if key and key not in result:
            result.append(key)
    return result


def split_service(value: str) -> tuple[str, str]:
    parts = re.split(r"\s{2,}", value.rstrip())
    if len(parts) > 1 and parts[-1] in SERVICES:
        return " ".join(parts[:-1]).strip(), parts[-1]
    return " ".join(parts).strip(), ""


def extract_pdf_text(pdf_path: Path) -> str:
    converter = shutil.which("pdftotext")
    if not converter:
        raise RuntimeError("pdftotext (Poppler) is required")
    with tempfile.TemporaryDirectory(prefix="tussy-stationen-") as temp_dir:
        output = Path(temp_dir) / "stations.txt"
        subprocess.run(
            [converter, "-layout", str(pdf_path), str(output)],
            check=True,
        )
        return output.read_text(encoding="utf-8")


def parse_pdf(text: str) -> tuple[list[Station], int]:
    stations: list[Station] = []
    current_country: str | None = None
    current: Station | None = None

    def finish() -> None:
        nonlocal current
        if current:
            current.address = re.sub(r"\s+", " ", current.address).strip(" ,")
            if current.address:
                stations.append(current)
        current = None

    for page_number, page in enumerate(text.split("\f"), start=1):
        if "ENTSORGUNGSSTATI" not in page:
            finish()
            continue
        footer = False
        for line in page.splitlines():
            stripped = line.strip()
            if not stripped:
                continue

            header = HEADER_RE.match(stripped)
            if header:
                finish()
                current_country = header.group(1)
                continue

            if "www." in stripped:
                footer = True
            if footer or stripped.startswith(("ENTSORGUNGSSTATI", "ONEN NACH")):
                continue

            row = ROW_RE.match(line)
            if row and current_country:
                prefix, remainder = row.groups()
                starts_record = (
                    any(char.isdigit() for char in prefix)
                    or prefix == "-"
                    or (current_country == "IE" and prefix.startswith("Co."))
                )
                if starts_record:
                    finish()
                    body, service = split_service(remainder)
                    postcode = prefix if any(char.isdigit() for char in prefix) else ""
                    current = Station(
                        cc=current_country,
                        postcode=postcode,
                        address=body,
                        service=service,
                        page=page_number,
                    )
                    continue

            if not current_country:
                continue

            indentation = len(line) - len(line.lstrip())
            if stripped in SERVICES and indentation >= 60:
                if current:
                    current.service = stripped
                continue

            body, service = split_service(stripped)
            if current is None and "," in body and indentation >= 5:
                current = Station(
                    cc=current_country,
                    postcode="",
                    address=body,
                    service=service,
                    page=page_number,
                )
            elif current:
                current.address += " " + body
                if service:
                    current.service = service

        # Table rows never continue onto the next page. Closing the row here
        # also prevents the advertising pages after the country tables from
        # being appended to the final station.
        finish()

    finish()

    unique: list[Station] = []
    seen: set[tuple[str, str, str]] = set()
    duplicates = 0
    for station in stations:
        key = (
            station.cc,
            normalized_postcode(station.postcode),
            normalized(station.address),
        )
        if key in seen:
            duplicates += 1
            continue
        seen.add(key)
        unique.append(station)
    return unique, duplicates


def load_postal_data(
    path: Path, stations: list[Station]
) -> tuple[
    dict[tuple[str, str], list[GeoPoint]],
    dict[tuple[str, str], list[GeoPoint]],
]:
    needed_postcodes = {
        (station.cc, normalized_postcode(station.postcode))
        for station in stations
        if station.postcode
    }
    needed_cities = {
        (station.cc, variant)
        for station in stations
        for variant in city_variants(station.city)
    }
    postal: dict[tuple[str, str], list[GeoPoint]] = collections.defaultdict(list)
    cities: dict[tuple[str, str], list[GeoPoint]] = collections.defaultdict(list)

    with path.open(encoding="utf-8") as handle:
        for line in handle:
            fields = line.rstrip("\n").split("\t")
            if len(fields) < 12:
                continue
            cc, postcode, place = fields[0], fields[1], fields[2]
            postcode_key = (cc, normalized_postcode(postcode))
            city_key = (cc, normalized(place))
            if postcode_key not in needed_postcodes and city_key not in needed_cities:
                continue
            point = GeoPoint(
                lat=float(fields[9]),
                lon=float(fields[10]),
                name=place,
                weight=int(fields[11] or 0),
            )
            if postcode_key in needed_postcodes:
                postal[postcode_key].append(point)
            if city_key in needed_cities:
                cities[city_key].append(point)
    return postal, cities


def load_city_data(
    path: Path, stations: list[Station]
) -> tuple[
    dict[tuple[str, str], list[GeoPoint]],
    dict[str, dict[str, GeoPoint]],
]:
    countries = {station.cc for station in stations}
    needed = {
        (station.cc, variant)
        for station in stations
        for variant in city_variants(station.city)
    }
    exact: dict[tuple[str, str], list[GeoPoint]] = collections.defaultdict(list)
    fuzzy: dict[str, dict[str, GeoPoint]] = collections.defaultdict(dict)

    with path.open(encoding="utf-8") as handle:
        for line in handle:
            fields = line.rstrip("\n").split("\t")
            if len(fields) < 19 or fields[8] not in countries:
                continue
            cc = fields[8]
            point = GeoPoint(
                lat=float(fields[4]),
                lon=float(fields[5]),
                name=fields[1],
                weight=int(fields[14] or 0),
            )
            primary_names = {normalized(fields[1]), normalized(fields[2])}
            all_names = set(primary_names)
            all_names.update(normalized(item) for item in fields[3].split(",") if item)

            for name in all_names:
                if name and (cc, name) in needed:
                    exact[(cc, name)].append(point)
            for name in primary_names:
                if not name:
                    continue
                existing = fuzzy[cc].get(name)
                if existing is None or point.weight > existing.weight:
                    fuzzy[cc][name] = point
    return exact, fuzzy


def trigram_set(value: str) -> set[str]:
    if len(value) < 3:
        return {value}
    return {value[index : index + 3] for index in range(len(value) - 2)}


def build_trigram_index(
    city_names: dict[str, dict[str, GeoPoint]], countries: set[str]
) -> dict[str, dict[str, set[str]]]:
    result: dict[str, dict[str, set[str]]] = {}
    for cc in countries:
        index: dict[str, set[str]] = collections.defaultdict(set)
        for name in city_names.get(cc, {}):
            for gram in trigram_set(name):
                index[gram].add(name)
        result[cc] = index
    return result


def best_exact_city(
    station: Station,
    postal_cities: dict[tuple[str, str], list[GeoPoint]],
    named_cities: dict[tuple[str, str], list[GeoPoint]],
) -> GeoPoint | None:
    candidates: list[GeoPoint] = []
    for variant in city_variants(station.city):
        candidates.extend(postal_cities.get((station.cc, variant), []))
        candidates.extend(named_cities.get((station.cc, variant), []))
    if not candidates:
        return None
    return max(candidates, key=lambda point: point.weight)


def assign_coordinates(
    stations: list[Station],
    postal: dict[tuple[str, str], list[GeoPoint]],
    postal_cities: dict[tuple[str, str], list[GeoPoint]],
    named_cities: dict[tuple[str, str], list[GeoPoint]],
    fuzzy_cities: dict[str, dict[str, GeoPoint]],
) -> collections.Counter[str]:
    methods: collections.Counter[str] = collections.Counter()
    unresolved: list[Station] = []

    for station in stations:
        postcode_candidates = postal.get(
            (station.cc, normalized_postcode(station.postcode)), []
        )
        exact_city = best_exact_city(station, postal_cities, named_cities)

        if postcode_candidates:
            variants = city_variants(station.city)

            def score(point: GeoPoint) -> tuple[float, int]:
                similarity = max(
                    SequenceMatcher(None, variant, normalized(point.name)).ratio()
                    for variant in variants
                )
                return similarity, point.weight

            point = max(postcode_candidates, key=score)
            postcode_score = score(point)[0]
            if postcode_score < 0.25 and exact_city:
                point = exact_city
                station.geocode_method = "city-exact"
            else:
                station.geocode_method = "postcode"
            station.lat, station.lon = point.lat, point.lon
            methods[station.geocode_method] += 1
        elif exact_city:
            station.lat, station.lon = exact_city.lat, exact_city.lon
            station.geocode_method = "city-exact"
            methods[station.geocode_method] += 1
        else:
            unresolved.append(station)

    trigram_index = build_trigram_index(
        fuzzy_cities, {station.cc for station in unresolved}
    )
    still_unresolved: list[Station] = []
    for station in unresolved:
        best: tuple[float, GeoPoint] | None = None
        names = fuzzy_cities.get(station.cc, {})
        index = trigram_index.get(station.cc, {})
        for variant in city_variants(station.city):
            candidates: set[str] = set()
            for gram in trigram_set(variant):
                candidates.update(index.get(gram, set()))
            for name in candidates:
                similarity = SequenceMatcher(None, variant, name).ratio()
                point = names[name]
                if best is None or (similarity, point.weight) > (
                    best[0],
                    best[1].weight,
                ):
                    best = similarity, point
        if best and best[0] >= 0.72:
            station.lat, station.lon = best[1].lat, best[1].lon
            station.geocode_method = "city-fuzzy"
            methods[station.geocode_method] += 1
        else:
            still_unresolved.append(station)

    known_by_country: dict[str, list[tuple[float, float]]] = collections.defaultdict(list)
    for station in stations:
        if station.lat is not None and station.lon is not None:
            known_by_country[station.cc].append((station.lat, station.lon))

    for station in still_unresolved:
        known = known_by_country.get(station.cc, [])
        if known:
            station.lat = statistics.median(item[0] for item in known)
            station.lon = statistics.median(item[1] for item in known)
        else:
            station.lat, station.lon = COUNTRY_CENTERS[station.cc]
        station.geocode_method = "country-fallback"
        methods[station.geocode_method] += 1
    return methods


def remove_near_duplicates(stations: list[Station]) -> tuple[list[Station], int]:
    """Remove spelling/address variants of the same row within one postcode."""
    grouped: dict[tuple[str, str], list[Station]] = collections.defaultdict(list)
    for station in stations:
        grouped[(station.cc, normalized_postcode(station.postcode))].append(station)

    removed_ids: set[int] = set()
    for (_, postcode), group in grouped.items():
        if not postcode or len(group) < 2:
            continue
        accepted: list[Station] = []
        for station in group:
            duplicate: Station | None = None
            for candidate in accepted:
                similarity = SequenceMatcher(
                    None, normalized(station.address), normalized(candidate.address)
                ).ratio()
                if similarity >= 0.90:
                    duplicate = candidate
                    break
            if duplicate is None:
                accepted.append(station)
                continue

            station_quality = (len(station.address), bool(station.service))
            duplicate_quality = (len(duplicate.address), bool(duplicate.service))
            if station_quality > duplicate_quality:
                removed_ids.add(id(duplicate))
                accepted.remove(duplicate)
                accepted.append(station)
            else:
                removed_ids.add(id(station))

    return [station for station in stations if id(station) not in removed_ids], len(
        removed_ids
    )


def remove_cross_country_duplicates(stations: list[Station]) -> tuple[list[Station], int]:
    quality = {
        "postcode": 4,
        "city-exact": 3,
        "city-fuzzy": 2,
        "country-fallback": 1,
    }
    grouped: dict[str, list[Station]] = collections.defaultdict(list)
    for station in stations:
        grouped[normalized(station.city)].append(station)

    removed_ids: set[int] = set()
    for group in grouped.values():
        countries = {station.cc for station in group}
        if len(countries) < 2:
            continue
        for left_index, left in enumerate(group):
            for right in group[left_index + 1 :]:
                if left.cc == right.cc:
                    continue
                similarity = SequenceMatcher(
                    None, normalized(left.address), normalized(right.address)
                ).ratio()
                if similarity < 0.94:
                    continue
                left_score = quality.get(left.geocode_method, 0)
                right_score = quality.get(right.geocode_method, 0)
                loser = right if left_score >= right_score else left
                removed_ids.add(id(loser))
    return [station for station in stations if id(station) not in removed_ids], len(
        removed_ids
    )


GENERIC_WORDS = {
    "aire",
    "area",
    "auto",
    "autocaravanas",
    "autocaravans",
    "bobilparkering",
    "camper",
    "camperpark",
    "camperplaats",
    "camperstop",
    "camping",
    "campingplatz",
    "campingpark",
    "caravan",
    "caravaning",
    "city",
    "havn",
    "motorhome",
    "park",
    "parking",
    "parkplatz",
    "reisemobil",
    "reisemobilhafen",
    "reisemobilpark",
    "reisemobilstellplatz",
    "service",
    "servico",
    "sosta",
    "stellplatz",
    "wohnmobil",
    "wohnmobilhafen",
    "wohnmobilpark",
    "wohnmobilplatz",
    "wohnmobilstellplatz",
}


def word_tokens(value: str) -> set[str]:
    ascii_value = (
        unicodedata.normalize("NFKD", value)
        .encode("ascii", "ignore")
        .decode("ascii")
        .lower()
    )
    result = set()
    for word in re.findall(r"[a-z0-9]+", ascii_value):
        if len(word) < 4 and not (any(char.isdigit() for char in word) and len(word) >= 3):
            continue
        if word in GENERIC_WORDS:
            continue
        result.add(word)
    return result


def city_base(value: str) -> str:
    value = re.sub(r"\([^)]*\)", "", value)
    value = re.sub(r"^[AS]\d+\s+bei\s+", "", value, flags=re.I)
    return normalized(value)


def load_curated(path: Path) -> list[dict[str, object]]:
    content = path.read_text(encoding="utf-8")
    result = []
    for cc, city, name, x, y, query in CURATED_RE.findall(content):
        result.append(
            {
                "cc": cc,
                "city": city,
                "name": name,
                "x": float(x),
                "y": float(y),
                "q": query,
            }
        )
    if not result:
        raise RuntimeError(f"No curated stations found in {path}")
    return result


def remove_curated_matches(
    stations: list[Station], curated: list[dict[str, object]]
) -> tuple[list[Station], int]:
    removed: set[int] = set()
    matched = 0
    for item in curated:
        item_city = city_base(str(item["city"]))
        city_words = word_tokens(str(item["city"]))
        distinctive = word_tokens(str(item["name"]) + " " + str(item["q"])) - city_words
        item_name = normalized(str(item["name"]))

        candidates: list[tuple[int, float, Station]] = []
        for station in stations:
            if id(station) in removed or station.cc != item["cc"]:
                continue
            station_city = city_base(station.city)
            same_city = (
                item_city == station_city
                or item_city in station_city
                or station_city in item_city
            )
            if not same_city:
                continue
            shared = distinctive & word_tokens(station.address)
            exact_name = len(item_name) >= 8 and item_name in normalized(station.address)
            if not shared and not exact_name:
                continue
            similarity = SequenceMatcher(
                None, normalized(str(item["name"])), normalized(station.address)
            ).ratio()
            candidates.append((len(shared) + (2 if exact_name else 0), similarity, station))

        if candidates:
            candidates.sort(key=lambda candidate: (candidate[0], candidate[1]), reverse=True)
            removed.add(id(candidates[0][2]))
            matched += 1
    return [station for station in stations if id(station) not in removed], matched


def project_to_svg(lat: float, lon: float) -> tuple[float, float]:
    # Lambert azimuthal equal-area projection centered on Europe, followed by
    # the affine transform used by the existing Natural Earth SVG.
    phi = math.radians(lat)
    lam = math.radians(lon)
    phi0 = math.radians(52.0)
    lam0 = math.radians(10.0)
    scale = math.sqrt(
        2.0
        / (
            1.0
            + math.sin(phi0) * math.sin(phi)
            + math.cos(phi0) * math.cos(phi) * math.cos(lam - lam0)
        )
    )
    projected_x = scale * math.cos(phi) * math.sin(lam - lam0)
    projected_y = scale * (
        math.cos(phi0) * math.sin(phi)
        - math.sin(phi0) * math.cos(phi) * math.cos(lam - lam0)
    )
    svg_x = 410.64368514289674 + 1221.9876722780164 * projected_x + 40.9252922340589 * projected_y
    svg_y = 416.4808815479078 + 64.85154356868338 * projected_x - 1277.700079019889 * projected_y
    return round(svg_x, 1), round(svg_y, 1)


def write_javascript(
    output: Path,
    stations: list[Station],
    pdf_hash: str,
    source_unique: int,
    curated_count: int,
) -> None:
    stations.sort(
        key=lambda station: (
            station.cc,
            normalized_postcode(station.postcode),
            normalized(station.address),
        )
    )
    lines = [
        "/* Automatisch aus entsorgungsstationenEuropa.pdf erzeugt.",
        "   Bordatlas-Daten: Stand 2020; Kartenpositionen näherungsweise aus Postleitzahl/Ort.",
        f"   PDF-SHA256: {pdf_hash}",
        "   Nicht manuell bearbeiten; Import mit scripts/import_entsorgungsstationen.py. */",
        "(function () {",
        '  "use strict";',
        "  var imported = [",
    ]
    for station in stations:
        assert station.lat is not None and station.lon is not None
        x, y = project_to_svg(station.lat, station.lon)
        record: dict[str, object] = {
            "cc": station.cc,
            "z": station.postcode,
            "a": station.address,
            "x": x,
            "y": y,
        }
        if station.service:
            record["t"] = station.service
        lines.append(
            "    "
            + json.dumps(record, ensure_ascii=False, separators=(",", ":"))
            + ","
        )
    lines.extend(
        [
            "  ];",
            "  window.EU_STATIONEN = (window.EU_STATIONEN || []).concat(imported);",
            "  window.EU_STATIONEN_META = "
            + json.dumps(
                {
                    "source": "Bordatlas Entsorgungsstationen Europa",
                    "sourceYear": 2020,
                    "pdfUnique": source_unique,
                    "curated": curated_count,
                    "imported": len(stations),
                    "total": curated_count + len(stations),
                },
                ensure_ascii=False,
                separators=(",", ":"),
            )
            + ";",
            "})();",
            "",
        ]
    )
    output.write_text("\n".join(lines), encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--pdf", type=Path, default=ROOT / "entsorgungsstationenEuropa.pdf")
    parser.add_argument("--postal-data", type=Path, required=True)
    parser.add_argument("--cities-data", type=Path, required=True)
    parser.add_argument(
        "--curated", type=Path, default=ROOT / "js" / "entsorgung-europa-daten.js"
    )
    parser.add_argument(
        "--output", type=Path, default=ROOT / "js" / "entsorgung-europa-bordatlas.js"
    )
    args = parser.parse_args()

    pdf_bytes = args.pdf.read_bytes()
    pdf_hash = hashlib.sha256(pdf_bytes).hexdigest()
    stations, pdf_duplicates = parse_pdf(extract_pdf_text(args.pdf))
    pdf_rows_after_exact_dedupe = len(stations)

    postal, postal_cities = load_postal_data(args.postal_data, stations)
    named_cities, fuzzy_cities = load_city_data(args.cities_data, stations)
    methods = assign_coordinates(
        stations, postal, postal_cities, named_cities, fuzzy_cities
    )
    stations, near_duplicates = remove_near_duplicates(stations)
    stations, cross_country_duplicates = remove_cross_country_duplicates(stations)
    source_unique = len(stations)

    curated = load_curated(args.curated)
    stations, curated_matches = remove_curated_matches(stations, curated)
    write_javascript(args.output, stations, pdf_hash, source_unique, len(curated))

    print(
        json.dumps(
            {
                "pdf_unique": source_unique,
                "pdf_rows_after_exact_dedupe": pdf_rows_after_exact_dedupe,
                "pdf_duplicates_removed": pdf_duplicates,
                "near_duplicates_removed": near_duplicates,
                "cross_country_duplicates_removed": cross_country_duplicates,
                "curated": len(curated),
                "curated_matches": curated_matches,
                "imported_missing": len(stations),
                "website_total": len(curated) + len(stations),
                "countries": len({station.cc for station in stations} | {str(item['cc']) for item in curated}),
                "geocoding": methods,
                "output": str(args.output),
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
