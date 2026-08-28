#!/usr/bin/env python3
"""Generate the complete English mirror of the static Tussy Van website.

The script keeps the German source pages authoritative, translates their
visible copy into /en/, rewrites local links so the selected language is kept,
and builds a small runtime dictionary for content rendered by JavaScript.
Translations are cached locally to make future runs fast and reproducible.
"""

from __future__ import annotations

import argparse
import ast
import html as html_stdlib
import json
import os
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path, PurePosixPath
from typing import Iterable

from lxml import etree, html


ROOT = Path(__file__).resolve().parents[1]
EN_ROOT = ROOT / "en"
CACHE_PATH = ROOT / "scripts" / "translations-de-en.json"
I18N_PATH = ROOT / "js" / "i18n-en.js"
TRANSLATE_URL = "https://translate.google.com/translate_a/single"
SITE_ORIGIN = "https://tussy-van.de"

LEGAL_PAGES = {
    "impressum.html": {
        "title": "Legal notice",
        "description": "Legal information for the Tussy Van website.",
        "message": "The complete and legally authoritative legal notice is available on the German original page.",
        "link_text": "Open the German legal notice",
    },
    "datenschutz.html": {
        "title": "Privacy policy",
        "description": "Privacy information for the Tussy Van website.",
        "message": "The complete and legally authoritative privacy policy is available on the German original page.",
        "link_text": "Open the German privacy policy",
    },
}

SKIP_TAGS = {"script", "style", "code", "pre", "noscript", "svg", "path"}
TEXT_ATTRS = {"alt", "aria-label", "placeholder", "title"}
URL_ATTRS = {
    "href", "src", "poster", "data-map", "data-points", "data-dest-base",
    "data-eu-map", "data-pl-map",
}

PROTECTED_TERMS = {
    "Tussy Van": "ZXQTVBRANDQXZ",
    "Tussy": "ZXQTVNAMEQXZ",
    "Tussi": "ZXQTUSSINAMEQXZ",
    "VW T4": "ZXQVWTFOURQXZ",
}

MANUAL_TRANSLATIONS = {
    "Start": "Home",
    "Startseite": "Home",
    "Reiseziele": "Destinations",
    "Polen": "Poland",
    "Entsorgung": "Waste disposal",
    "Entsorgung 🚽": "Waste disposal 🚽",
    "Ratgeber": "Guides",
    "Über mich": "About me",
    "Abonnieren": "Subscribe",
    "Impressum": "Legal notice",
    "Datenschutz": "Privacy",
    "Datenschutzerklärung": "Privacy policy",
    "Menü öffnen": "Open menu",
    "Alles okay": "Accept all",
    "Nur notwendig": "Essential only",
    "Alle Regionen": "All regions",
    "Alle Länder": "All countries",
    "Ort": "place",
    "Orte": "places",
    "Ort gefunden": "place found",
    "Orte gefunden": "places found",
    "Mehr dazu →": "Read more →",
    "Mein Reisebericht": "My travel story",
    "Sehenswertes": "Worth seeing",
    "Reiseziel": "Destination",
    "Deutschland": "Germany",
    "Albanien": "Albania",
    "Bosnien und Herzegowina": "Bosnia and Herzegovina",
    "Österreich": "Austria",
    "Schweiz": "Switzerland",
    "Niederlande": "Netherlands",
    "Belgien": "Belgium",
    "Frankreich": "France",
    "Spanien": "Spain",
    "Portugal": "Portugal",
    "Italien": "Italy",
    "Dänemark": "Denmark",
    "Schweden": "Sweden",
    "Norwegen": "Norway",
    "Finnland": "Finland",
    "Färöer": "Faroe Islands",
    "Estland": "Estonia",
    "Vereinigtes Königreich": "United Kingdom",
    "Griechenland": "Greece",
    "Irland": "Ireland",
    "Island": "Iceland",
    "Liechtenstein": "Liechtenstein",
    "Litauen": "Lithuania",
    "Luxemburg": "Luxembourg",
    "Lettland": "Latvia",
    "Nordmazedonien": "North Macedonia",
    "Tschechien": "Czechia",
    "Slowakei": "Slovakia",
    "Ungarn": "Hungary",
    "Kroatien": "Croatia",
    "Rumänien": "Romania",
    "Serbien": "Serbia",
    "San Marino": "San Marino",
    "Türkei": "Türkiye",
    "Slowenien": "Slovenia",
    "…und ja, geschraubt wird selbst!": "…and yes, I do the wrenching myself!",
    "Komm mit auf Tour.": "Join me on the road.",
    "Roadtrips, Pannen, Traumbuchten und ehrliche Kosten — alles ungeschönt auf meinem Kanal.": "Road trips, breakdowns, dream coves and honest costs — the unfiltered version is all on my channel.",
    "Der Kanal zum Bulli": "The channel behind the van",
    "Reisefolgen, Schrauber-Tutorials und Q&As aus dem Van — schau vorbei und sag hallo in den Kommentaren!": "Travel episodes, hands-on repair tutorials and Q&As from the van — stop by and say hello in the comments!",
    "Nichts mehr verpassen": "Never miss an update",
    "Glocke aktivieren und jeden Sonntag mitreisen.": "Turn on notifications and join me every Sunday.",
    "Wo der Blaue schon überall war.": "Everywhere the Blue Van has been.",
    "Alle Reiseziele ansehen": "View all destinations",
    "Frisch aus dem Van.": "Fresh from the van.",
    "Reiseberichte & Schrauberwissen": "Travel stories & hands-on know-how",
}

EXTRA_RUNTIME_PHRASES = {
    "Tussy Van auf YouTube",
    "Danke! Der Newsletter startet bald — die Anmeldung wird freigeschaltet, sobald ein Anbieter (z. B. Brevo/Mailchimp) in js/site.js eingetragen ist.",
    "Highlights",
    "Camper-Stellplätze",
    "filter nach Kategorie/Region oder such deinen Ort",
    "bald mehr",
    "Ergebnisse werden beim Tippen aktualisiert.",
    "Kartenposition öffnen",
    "Weitere Stationen anzeigen",
    "Keine Station gefunden.",
}


def html_sources() -> list[Path]:
    sources = list(ROOT.glob("*.html"))
    sources.extend((ROOT / "blog").glob("*.html"))
    sources.extend((ROOT / "ratgeber").glob("*.html"))
    return sorted(path for path in sources if EN_ROOT not in path.parents)


def is_legal_source(path: Path) -> bool:
    return path.parent == ROOT and path.name in LEGAL_PAGES


def replace_legal_content(tree: etree._Element, source_rel: Path) -> None:
    """Keep personal legal data in the authoritative German pages only."""
    page = LEGAL_PAGES.get(source_rel.as_posix())
    if page is None:
        return

    for script in list(tree.xpath('//script[@type="application/ld+json"]')):
        parent = script.getparent()
        if parent is not None:
            parent.remove(script)

    sections = tree.xpath(
        '//body//section[contains(concat(" ", normalize-space(@class), " "), " section ")]'
    )
    if not sections:
        raise RuntimeError(f"missing legal content section: {source_rel}")

    section = sections[0]
    section.clear()
    section.set("class", "section")
    container = etree.SubElement(section, "div", {"class": "container narrow"})
    heading = etree.SubElement(container, "h1")
    heading.text = page["title"]
    notice = etree.SubElement(container, "p", {"class": "box"})
    notice.text = page["message"]
    action = etree.SubElement(container, "p")
    link = etree.SubElement(
        action,
        "a",
        {"class": "btn", "href": f"../{source_rel.name}", "hreflang": "de"},
    )
    link.text = page["link_text"]

    title_nodes = tree.xpath("//head/title")
    if title_nodes:
        title_nodes[0].text = f'{page["title"]} | Tussy Van'
    for meta in tree.xpath("//head/meta[@content]"):
        meta_key = (meta.get("name") or meta.get("property") or "").lower()
        if "description" in meta_key:
            meta.set("content", page["description"])


def has_translatable_text(value: str) -> bool:
    value = value.strip()
    if len(value) < 2 or not re.search(r"[A-Za-zÄÖÜäöüß]", value):
        return False
    if re.fullmatch(r"[\d\W_]+", value, flags=re.UNICODE):
        return False
    return True


def element_is_skipped(element: etree._Element | None) -> bool:
    while element is not None:
        tag = element.tag
        if isinstance(tag, str) and tag.lower() in SKIP_TAGS:
            return True
        if element.get("translate") == "no" or "notranslate" in (element.get("class") or "").split():
            return True
        element = element.getparent()
    return False


def collect_html_phrases(tree: etree._Element) -> set[str]:
    phrases: set[str] = set()
    for element in tree.iter():
        if not isinstance(element.tag, str):
            continue
        if not element_is_skipped(element) and element.text and has_translatable_text(element.text):
            phrases.add(element.text.strip())
        parent = element.getparent()
        if element.tail and not element_is_skipped(parent) and has_translatable_text(element.tail):
            phrases.add(element.tail.strip())
        if element_is_skipped(element):
            continue
        for attr in TEXT_ATTRS:
            value = element.get(attr)
            if value and has_translatable_text(value):
                phrases.add(value.strip())
        if element.tag.lower() == "meta":
            meta_key = (element.get("name") or element.get("property") or "").lower()
            value = element.get("content")
            if value and ("description" in meta_key or meta_key.endswith("title")) and has_translatable_text(value):
                phrases.add(value.strip())
    return phrases


JS_STRING_RE = re.compile(r"(?P<quote>[\"'])(?P<body>(?:\\.|(?!\1).)*)(?P=quote)", re.DOTALL)


def decode_js_string(literal: str) -> str | None:
    try:
        return ast.literal_eval(literal)
    except (SyntaxError, ValueError):
        return None


def visible_text_from_html_fragment(value: str) -> set[str]:
    try:
        fragments = html.fragments_fromstring(value)
    except (etree.ParserError, ValueError):
        return set()
    phrases: set[str] = set()
    for fragment in fragments:
        if isinstance(fragment, str):
            if has_translatable_text(fragment):
                phrases.add(fragment.strip())
            continue
        for text in fragment.itertext():
            if has_translatable_text(text):
                phrases.add(text.strip())
    return phrases


def generic_js_phrases(path: Path) -> set[str]:
    text = path.read_text(encoding="utf-8")
    phrases: set[str] = set()
    excluded_bits = (
        "http://", "https://", "querySelector", "getAttribute", "setAttribute",
        "classList", "data-", ".html", ".svg", ".json", "image/svg+xml",
        "application/", "prefers-reduced-motion", "translate(", "viewBox",
        "link[",
    )
    for match in JS_STRING_RE.finditer(text):
        value = decode_js_string(match.group(0))
        if not isinstance(value, str) or not has_translatable_text(value):
            continue
        stripped = value.strip()
        if any(bit in stripped for bit in excluded_bits):
            continue
        if stripped.startswith((".", "#", "[", "{", "/", "<")):
            continue
        if "<" in stripped and ">" in stripped:
            phrases.update(visible_text_from_html_fragment(stripped))
            continue
        if " " in stripped or re.search(r"[ÄÖÜäöüß]", stripped) or len(stripped) > 9:
            phrases.add(stripped)
    return phrases


def property_js_phrases(path: Path, keys: Iterable[str]) -> set[str]:
    text = path.read_text(encoding="utf-8")
    key_group = "|".join(re.escape(key) for key in keys)
    pattern = re.compile(
        rf"(?:[\"']?(?:{key_group})[\"']?)\s*:\s*(?P<literal>(?P<quote>[\"'])(?:\\.|(?!\2).)*(?P=quote))",
        re.DOTALL,
    )
    phrases: set[str] = set()
    for match in pattern.finditer(text):
        value = decode_js_string(match.group("literal"))
        if isinstance(value, str) and has_translatable_text(value):
            phrases.add(value.strip())
    return phrases


def collect_runtime_phrases() -> set[str]:
    phrases = set(EXTRA_RUNTIME_PHRASES)
    phrases.update(MANUAL_TRANSLATIONS)
    phrases.update(generic_js_phrases(ROOT / "js" / "site.js"))
    phrases.update(generic_js_phrases(ROOT / "js" / "entsorgung-europa.js"))
    phrases.update(generic_js_phrases(ROOT / "js" / "polen.js"))
    phrases.update(property_js_phrases(
        ROOT / "js" / "destinations.js",
        ("region", "blurb", "stellplatz", "zeit", "tipp"),
    ))
    phrases.update(property_js_phrases(
        ROOT / "js" / "polen.js",
        ("blurb", "meta", "label", "group"),
    ))
    phrases.update(property_js_phrases(
        ROOT / "js" / "polen-camper.js",
        ("blurb", "meta"),
    ))
    return {phrase for phrase in phrases if has_translatable_text(phrase)}


def protect_terms(value: str) -> str:
    for term, token in PROTECTED_TERMS.items():
        value = value.replace(term, token)
    return value


def restore_terms(value: str) -> str:
    for term, token in PROTECTED_TERMS.items():
        value = value.replace(token, term)
    return value


def load_cache() -> dict[str, str]:
    if not CACHE_PATH.exists():
        return dict(MANUAL_TRANSLATIONS)
    cache = json.loads(CACHE_PATH.read_text(encoding="utf-8"))
    cache.update(MANUAL_TRANSLATIONS)
    return cache


def save_cache(cache: dict[str, str]) -> None:
    CACHE_PATH.write_text(
        json.dumps(cache, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )


def make_batches(phrases: Iterable[str], max_chars: int = 14000) -> list[list[str]]:
    batches: list[list[str]] = []
    current: list[str] = []
    current_size = 0
    for phrase in sorted(phrases, key=lambda value: (len(value), value)):
        protected = protect_terms(phrase)
        item_size = len(protected) + 40
        if current and current_size + item_size > max_chars:
            batches.append(current)
            current = []
            current_size = 0
        current.append(phrase)
        current_size += item_size
    if current:
        batches.append(current)
    return batches


def translate_batch(batch: list[str]) -> dict[str, str]:
    wrapped = "".join(
        f'<p data-tv-i="{index}">{html_stdlib.escape(protect_terms(phrase))}</p>'
        for index, phrase in enumerate(batch)
    )
    body = urllib.parse.urlencode({
        "client": "gtx",
        "sl": "de",
        "tl": "en",
        "dt": "t",
        "q": wrapped,
    }).encode("utf-8")
    request = urllib.request.Request(
        TRANSLATE_URL,
        data=body,
        headers={
            "User-Agent": "Mozilla/5.0 (Tussy Van translation generator)",
            "Content-Type": "application/x-www-form-urlencoded",
        },
    )

    last_error: Exception | None = None
    for attempt in range(4):
        try:
            with urllib.request.urlopen(request, timeout=40) as response:
                payload = json.load(response)
            translated_html = "".join(segment[0] for segment in payload[0] if segment and segment[0])
            wrapper = html.fragment_fromstring(translated_html, create_parent="div")
            by_index = {
                int(node.get("data-tv-i")): restore_terms("".join(node.itertext()).strip())
                for node in wrapper.xpath(".//*[@data-tv-i]")
            }
            translated = {
                phrase: by_index[index]
                for index, phrase in enumerate(batch)
                if index in by_index
            }
            missing = [phrase for index, phrase in enumerate(batch) if index not in by_index]
            if missing and len(batch) > 1:
                for phrase in missing:
                    translated.update(translate_batch([phrase]))
            if len(translated) != len(batch):
                raise RuntimeError(f"translation response contained {len(translated)} of {len(batch)} items")
            return translated
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, ValueError, RuntimeError) as error:
            last_error = error
            if attempt == 3:
                break
            time.sleep(1.5 * (attempt + 1))
    raise RuntimeError(f"translation request failed: {last_error}")


def ensure_translations(phrases: set[str], cache: dict[str, str], offline: bool) -> dict[str, str]:
    missing = {phrase for phrase in phrases if phrase not in cache}
    if not missing:
        print(f"translations: cache complete ({len(phrases)} phrases)", flush=True)
        return cache
    if offline:
        raise RuntimeError(f"offline mode: {len(missing)} translations are missing")

    batches = make_batches(missing)
    print(f"translations: {len(missing)} new phrases in {len(batches)} batches", flush=True)
    for index, batch in enumerate(batches, start=1):
        cache.update(translate_batch(batch))
        save_cache(cache)
        print(f"translations: batch {index}/{len(batches)} complete", flush=True)
        time.sleep(0.15)
    return cache


def translate_preserving_space(value: str, translations: dict[str, str]) -> str:
    if not has_translatable_text(value):
        return value
    leading = value[: len(value) - len(value.lstrip())]
    trailing = value[len(value.rstrip()) :]
    core = value.strip()
    return leading + translations.get(core, core) + trailing


def german_url(source_rel: Path) -> str:
    if source_rel.as_posix() == "index.html":
        return SITE_ORIGIN + "/"
    return SITE_ORIGIN + "/" + source_rel.as_posix()


def english_url(source_rel: Path) -> str:
    if source_rel.as_posix() == "index.html":
        return SITE_ORIGIN + "/en/"
    return SITE_ORIGIN + "/en/" + source_rel.as_posix()


def rewrite_local_url(value: str, source_rel: Path, output_rel: Path) -> str:
    if not value or value.startswith(("#", "data:", "mailto:", "tel:", "javascript:")):
        return value
    parsed = urllib.parse.urlsplit(value)
    if parsed.scheme or parsed.netloc:
        return value

    raw_path = parsed.path
    if not raw_path:
        return value
    if raw_path.startswith("/"):
        target_rel = Path(raw_path.lstrip("/"))
    else:
        target_rel = Path(os.path.normpath((source_rel.parent / raw_path).as_posix()))
    if str(target_rel).startswith(".."):
        return value

    is_html_target = target_rel.suffix.lower() in {".html", ".htm"}
    if is_html_target:
        target_output = Path("en") / target_rel
    else:
        target_output = target_rel
    relative = os.path.relpath(target_output, start=output_rel.parent).replace(os.sep, "/")
    return urllib.parse.urlunsplit(("", "", relative, parsed.query, parsed.fragment))


def set_seo_links(tree: etree._Element, source_rel: Path) -> None:
    head = tree.find("head")
    if head is None:
        return
    for link in list(head.xpath('./link[@rel="canonical" or @rel="alternate"]')):
        head.remove(link)

    canonical = etree.Element("link", rel="canonical", href=english_url(source_rel))
    alternate_en = etree.Element("link", rel="alternate", hreflang="en", href=english_url(source_rel))
    alternate_de = etree.Element("link", rel="alternate", hreflang="de", href=german_url(source_rel))
    alternate_default = etree.Element("link", rel="alternate", hreflang="x-default", href=german_url(source_rel))
    insert_at = 2 if len(head) >= 2 else len(head)
    for node in (canonical, alternate_en, alternate_de, alternate_default):
        head.insert(insert_at, node)
        insert_at += 1


def update_json_ld(tree: etree._Element, translations: dict[str, str]) -> None:
    for script in tree.xpath('//script[@type="application/ld+json"]'):
        if not script.text:
            continue
        try:
            payload = json.loads(script.text)
        except json.JSONDecodeError:
            continue

        def walk(value, key: str = ""):
            if isinstance(value, dict):
                return {item_key: walk(item_value, item_key) for item_key, item_value in value.items()}
            if isinstance(value, list):
                return [walk(item, key) for item in value]
            if isinstance(value, str):
                if value.startswith(SITE_ORIGIN + "/"):
                    suffix = value[len(SITE_ORIGIN) :]
                    return SITE_ORIGIN + "/en/" + suffix.lstrip("/")
                if key in {"name", "description", "headline"}:
                    return translations.get(value.strip(), value)
            return value

        script.text = "\n  " + json.dumps(walk(payload), ensure_ascii=False, indent=2) + "\n  "


def generate_english_page(source: Path, translations: dict[str, str]) -> Path:
    source_rel = source.relative_to(ROOT)
    output_rel = Path("en") / source_rel
    output = ROOT / output_rel
    parser = html.HTMLParser(encoding="utf-8", remove_comments=False)
    tree = html.document_fromstring(source.read_bytes(), parser=parser)
    tree.set("lang", "en")
    replace_legal_content(tree, source_rel)

    for element in tree.iter():
        if not isinstance(element.tag, str):
            continue
        if not element_is_skipped(element) and element.text:
            element.text = translate_preserving_space(element.text, translations)
        parent = element.getparent()
        if element.tail and not element_is_skipped(parent):
            element.tail = translate_preserving_space(element.tail, translations)
        if element_is_skipped(element):
            continue
        for attr in TEXT_ATTRS:
            value = element.get(attr)
            if value:
                element.set(attr, translate_preserving_space(value, translations))
        if element.tag.lower() == "meta":
            meta_key = (element.get("name") or element.get("property") or "").lower()
            value = element.get("content")
            if value and ("description" in meta_key or meta_key.endswith("title")):
                element.set("content", translate_preserving_space(value, translations))

    for element in tree.iter():
        if not isinstance(element.tag, str):
            continue
        for attr in URL_ATTRS:
            value = element.get(attr)
            if value:
                element.set(attr, rewrite_local_url(value, source_rel, output_rel))
        if element.tag.lower() == "meta":
            meta_key = (element.get("name") or element.get("property") or "").lower()
            value = element.get("content")
            if value and meta_key in {"og:image", "twitter:image"}:
                element.set("content", rewrite_local_url(value, source_rel, output_rel))

    set_seo_links(tree, source_rel)
    update_json_ld(tree, translations)

    body = tree.find("body")
    if body is not None:
        i18n_rel = os.path.relpath(I18N_PATH, start=output.parent).replace(os.sep, "/")
        i18n_script = etree.Element("script", src=i18n_rel)
        site_scripts = [
            script for script in body.xpath(".//script[@src]")
            if (script.get("src") or "").endswith("js/site.js")
        ]
        if site_scripts:
            site_script = site_scripts[-1]
            site_script.addprevious(i18n_script)
        else:
            body.append(i18n_script)

    output.parent.mkdir(parents=True, exist_ok=True)
    rendered = "<!DOCTYPE html>\n" + etree.tostring(tree, method="html", encoding="unicode")
    output.write_text(rendered, encoding="utf-8")
    return output


def generate_runtime_i18n(runtime_phrases: set[str], translations: dict[str, str]) -> None:
    dictionary = {
        source: translations[source]
        for source in sorted(runtime_phrases)
        if source in translations and translations[source] and translations[source] != source
    }
    dictionary_json = json.dumps(dictionary, ensure_ascii=False, separators=(",", ":"))
    script = f'''/* Generated by scripts/generate_english_site.py — do not edit manually. */
(function () {{
  "use strict";
  if (document.documentElement.lang.toLowerCase().indexOf("en") !== 0) return;

  var dictionary = {dictionary_json};
  var partialKeys = Object.keys(dictionary).filter(function (key) {{
    return key.length >= 5 && key.length <= 120;
  }}).sort(function (a, b) {{ return b.length - a.length; }});
  var blocked = {{ SCRIPT: 1, STYLE: 1, CODE: 1, PRE: 1, NOSCRIPT: 1, SVG: 1 }};

  function translateValue(value) {{
    if (!value) return value;
    var leading = (value.match(/^\\s*/) || [""])[0];
    var trailing = (value.match(/\\s*$/) || [""])[0];
    var core = value.slice(leading.length, value.length - trailing.length);
    if (!core) return value;
    if (dictionary[core]) return leading + dictionary[core] + trailing;
    var translated = core;
    partialKeys.forEach(function (key) {{
      if (translated.indexOf(key) !== -1) translated = translated.split(key).join(dictionary[key]);
    }});
    return leading + translated + trailing;
  }}

  function isBlocked(node) {{
    var element = node.nodeType === 1 ? node : node.parentElement;
    while (element) {{
      if (blocked[element.tagName] || element.getAttribute("translate") === "no" || element.classList.contains("notranslate")) return true;
      element = element.parentElement;
    }}
    return false;
  }}

  function translateTextNode(node) {{
    if (isBlocked(node)) return;
    var translated = translateValue(node.nodeValue);
    if (translated !== node.nodeValue) node.nodeValue = translated;
  }}

  function translateAttributes(element) {{
    if (!element || element.nodeType !== 1 || isBlocked(element)) return;
    ["alt", "aria-label", "placeholder", "title"].forEach(function (name) {{
      if (!element.hasAttribute(name)) return;
      var value = element.getAttribute(name);
      var translated = translateValue(value);
      if (translated !== value) element.setAttribute(name, translated);
    }});
  }}

  function translateTree(root) {{
    if (!root) return;
    if (root.nodeType === 3) {{ translateTextNode(root); return; }}
    if (root.nodeType !== 1 && root.nodeType !== 9 && root.nodeType !== 11) return;
    if (root.nodeType === 1) translateAttributes(root);
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    var node;
    while ((node = walker.nextNode())) {{
      if (node.nodeType === 3) translateTextNode(node);
      else translateAttributes(node);
    }}
  }}

  translateTree(document.documentElement);
  var observer = new MutationObserver(function (mutations) {{
    mutations.forEach(function (mutation) {{
      if (mutation.type === "characterData") translateTextNode(mutation.target);
      if (mutation.type === "attributes") translateAttributes(mutation.target);
      mutation.addedNodes.forEach(translateTree);
    }});
  }});
  observer.observe(document.documentElement, {{
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ["alt", "aria-label", "placeholder", "title"]
  }});
  window.TV_translateEnglish = translateTree;
}})();
'''
    I18N_PATH.write_text(script, encoding="utf-8")


def update_sitemap(sources: list[Path]) -> None:
    sitemap = ROOT / "sitemap.xml"
    if not sitemap.exists():
        return
    parser = etree.XMLParser(remove_blank_text=True)
    tree = etree.parse(str(sitemap), parser)
    root = tree.getroot()
    namespace = "{http://www.sitemaps.org/schemas/sitemap/0.9}"
    for url_node in list(root):
        loc = url_node.find(namespace + "loc")
        if loc is not None and loc.text and "/en/" in loc.text:
            root.remove(url_node)

    existing = {
        loc.text
        for loc in root.findall(".//" + namespace + "loc")
        if loc.text
    }
    translated = {source.relative_to(ROOT).as_posix(): source for source in sources}
    for german in sorted(existing):
        if not german.startswith(SITE_ORIGIN + "/"):
            continue
        suffix = german[len(SITE_ORIGIN) :]
        source_rel = "index.html" if suffix == "/" else suffix.lstrip("/")
        if source_rel not in translated:
            continue
        url = etree.SubElement(root, namespace + "url")
        loc = etree.SubElement(url, namespace + "loc")
        loc.text = english_url(Path(source_rel))

    tree.write(str(sitemap), encoding="utf-8", xml_declaration=True, pretty_print=True)


def validate_generated(sources: list[Path]) -> None:
    outputs = [EN_ROOT / source.relative_to(ROOT) for source in sources]
    missing = [path for path in outputs if not path.exists()]
    if missing:
        raise RuntimeError("missing English pages: " + ", ".join(str(path) for path in missing))
    for output in outputs:
        tree = html.document_fromstring(output.read_bytes())
        if tree.get("lang") != "en":
            raise RuntimeError(f"wrong language marker: {output}")
        if not tree.xpath('//script[contains(@src, "i18n-en.js")]'):
            raise RuntimeError(f"missing runtime translation: {output}")
        source_rel = output.relative_to(EN_ROOT)
        canonical = tree.xpath('string(//link[@rel="canonical"]/@href)')
        if canonical != english_url(source_rel):
            raise RuntimeError(f"wrong canonical URL: {output}")
        for element in tree.iter():
            if not isinstance(element.tag, str):
                continue
            for attr in URL_ATTRS:
                value = element.get(attr)
                if not value or value.startswith(("#", "data:", "mailto:", "tel:", "javascript:")):
                    continue
                parsed = urllib.parse.urlsplit(value)
                if parsed.scheme or parsed.netloc or not parsed.path:
                    continue
                resolved = (output.parent / parsed.path).resolve()
                if not resolved.exists():
                    raise RuntimeError(f"broken local reference in {output}: {value}")
                if (
                    attr == "href"
                    and resolved.suffix.lower() in {".html", ".htm"}
                    and EN_ROOT not in resolved.parents
                    and element.get("hreflang") != "de"
                ):
                    raise RuntimeError(f"English page links to German HTML in {output}: {value}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--offline", action="store_true", help="fail instead of requesting missing translations")
    args = parser.parse_args()

    sources = html_sources()
    parsed = [
        html.document_fromstring(path.read_bytes())
        for path in sources
        if not is_legal_source(path)
    ]
    html_phrases = set().union(*(collect_html_phrases(tree) for tree in parsed))
    runtime_phrases = collect_runtime_phrases()
    all_phrases = html_phrases | runtime_phrases | set(MANUAL_TRANSLATIONS)

    cache = ensure_translations(all_phrases, load_cache(), args.offline)
    generated = [generate_english_page(source, cache) for source in sources]
    generate_runtime_i18n(runtime_phrases, cache)
    update_sitemap(sources)
    validate_generated(sources)
    print(
        f"generated: {len(generated)} English pages, {len(runtime_phrases)} runtime phrases",
        flush=True,
    )


if __name__ == "__main__":
    main()
