#!/usr/bin/env python3
"""Build complete static language mirrors from the German source and cached copy.

The checked-in dictionaries make --offline reproducible. Translation requests
only contain public website copy; legal pages link to the German originals.
"""
import argparse
import gzip
import json
import os
import re
import time
import urllib.parse
import urllib.request
from pathlib import Path

from lxml import etree, html
import generate_english_site as source

ROOT = source.ROOT
LANGUAGES = {"de": "Deutsch", "en": "English", "es": "Español", "fr": "Français", "pl": "Polski"}
LABELS = {"de": "Sprache wählen", "en": "Choose language", "es": "Elegir idioma", "fr": "Choisir la langue", "pl": "Wybierz język"}
LEGAL = {
    "de": ["Impressum", "Datenschutz", "Die vollständigen rechtlichen Informationen stehen auf der deutschen Originalseite.", "Deutsches Original öffnen"],
    "en": ["Legal notice", "Privacy policy", "The complete and legally authoritative information is available on the original German page.", "Open the German original"],
    "es": ["Aviso legal", "Política de privacidad", "La información completa y legalmente vinculante está disponible en la página original en alemán.", "Abrir el original en alemán"],
    "fr": ["Mentions légales", "Politique de confidentialité", "Les informations complètes faisant foi sont disponibles sur la page originale en allemand.", "Consulter l’original en allemand"],
    "pl": ["Informacje prawne", "Polityka prywatności", "Pełne i prawnie wiążące informacje znajdują się na oryginalnej stronie w języku niemieckim.", "Otwórz niemiecki oryginał"],
}


def url(rel, lang):
    suffix = "" if str(rel) == "index.html" else str(rel)
    return source.SITE_ORIGIN + "/" + (lang + "/" if lang != "de" else "") + suffix


def legal_content(tree, rel, lang):
    if str(rel) not in source.LEGAL_PAGES:
        return
    title, message, link_text = LEGAL[lang][0 if rel.name == "impressum.html" else 1], LEGAL[lang][2], LEGAL[lang][3]
    section = tree.xpath('//body//section[contains(concat(" ",normalize-space(@class)," ")," section ")]')[0]
    section.clear()
    section.set("class", "section")
    div = etree.SubElement(section, "div", {"class": "container narrow", "translate": "no"})
    etree.SubElement(div, "h1").text = title
    etree.SubElement(div, "p", {"class": "box"}).text = message
    etree.SubElement(div, "a", {"class": "btn", "href": "/" + str(rel), "hreflang": "de"}).text = link_text
    tree.find("head/title").text = title + " | Tussy Van"
    for element in tree.xpath('//head/meta[@content]'):
        key = element.get("name", element.get("property", ""))
        if "description" in key:
            element.set("content", message)
        elif key.endswith("title"):
            element.set("content", title + " | Tussy Van")
    for element in tree.xpath('//script[@type="application/ld+json"]'):
        element.getparent().remove(element)


def phrases_for_site(pages):
    phrases = set()
    for page in pages:
        tree = html.document_fromstring(page.read_bytes())
        if source.is_legal_source(page):
            legal_content(tree, page.relative_to(ROOT), "de")
        phrases.update(source.collect_html_phrases(tree))
        for element in tree.xpath('//script[@type="application/ld+json"]'):
            def collect(value):
                if isinstance(value, dict):
                    for key, item in value.items():
                        if key in {"description", "headline", "name"} and isinstance(item, str):
                            phrases.add(item.strip())
                        else:
                            collect(item)
                elif isinstance(value, list):
                    for item in value:
                        collect(item)
            collect(json.loads(element.text))
    runtime = source.collect_runtime_phrases()
    for name in ["site.js", "game.js", "polen.js", "polen-map-app.js", "entsorgung-europa.js"]:
        path = ROOT / "js" / name
        runtime.update(source.generic_js_phrases(path))
        for match in source.JS_STRING_RE.finditer(path.read_text()):
            value = source.decode_js_string(match.group(0))
            if not isinstance(value, str):
                continue
            value = value.strip()
            if re.fullmatch(r"[A-ZÄÖÜ][A-Za-zÄÖÜäöüß -]+[!?.]?", value):
                runtime.add(value)
            if value.startswith("<") and ">" in value:
                runtime.update(source.visible_text_from_html_fragment(value))
    runtime.update(source.property_js_phrases(ROOT / "js/polen-naturplaetze.js", ("blurb", "meta")))
    runtime.update(source.property_js_phrases(ROOT / "js/entsorgung-europa-daten.js", ("t",)))
    runtime.update({"Ladung", "ausgewählt", "Felder", "Reihe", "Spalte", "Spiel 🎮", "Beitrag gefunden", "Beiträge gefunden", "Stationen", "Station", "Land", "Länder", "Orte", "Ort"})
    runtime = {p for p in runtime if not any(token in p for token in ("window.", "document.", "function (", "return "))}
    return {p for p in phrases | runtime if source.has_translatable_text(p)}, runtime


def dictionaries(phrases, offline):
    directory = ROOT / "translations"
    directory.mkdir(exist_ok=True)
    result = {}
    for lang in LANGUAGES:
        if lang == "de":
            continue
        path = directory / (lang + ".json")
        compressed = path.with_suffix(".json.gz")
        result[lang] = json.loads(gzip.decompress(compressed.read_bytes()).decode()) if compressed.exists() else (json.loads(path.read_text()) if path.exists() else {})
    missing = sorted(p for p in phrases if any(p not in cache for cache in result.values()))
    if missing and offline:
        raise RuntimeError(f"Missing {len(missing)} cached phrases")
    # Multi-target request limits include the text once for every target language.
    batches = source.make_batches(missing, max_chars=8000)
    for index, batch in enumerate(batches, 1):
        query = urllib.parse.urlencode({"from": "de", "to": list(result)}, doseq=True)
        request = urllib.request.Request(
            "https://edge.microsoft.com/translate/translatetext?" + query,
            data=json.dumps([source.protect_terms(p) for p in batch], ensure_ascii=False).encode(),
            headers={"Content-Type": "application/json", "User-Agent": "Mozilla/5.0"},
        )
        with urllib.request.urlopen(request, timeout=60) as response:
            payload = json.load(response)
        if len(payload) != len(batch):
            raise RuntimeError("Incomplete translation response")
        for original, item in zip(batch, payload):
            for translated in item["translations"]:
                value = source.restore_terms(translated["text"])
                if (not value.strip() and len(original) > 20) or "ZXQ" in value:
                    raise RuntimeError("Invalid translation for " + original)
                result[translated["to"]][original] = value
        for lang, cache in result.items():
            (directory / (lang + ".json.gz")).write_bytes(gzip.compress((json.dumps(cache, ensure_ascii=False, indent=2, sort_keys=True) + "\n").encode(), mtime=0))
        print(f"Translations: {index}/{len(batches)} batches, four languages", flush=True)
        time.sleep(0.2)
    result["en"].update(source.MANUAL_TRANSLATIONS)
    overrides = json.loads((directory / "overrides.json").read_text())
    for lang, values in overrides.items():
        result[lang].update(values)
    return result


def navigation(tree, rel, lang):
    for old in tree.xpath('//*[contains(concat(" ",normalize-space(@class)," ")," lang-switch ")]'):
        old.getparent().remove(old)
    navs = tree.xpath('//nav[contains(concat(" ",normalize-space(@class)," ")," main-nav ")]')
    if not navs:
        raise RuntimeError("Missing navigation: " + str(rel))
    menu = etree.SubElement(navs[0], "details", {"class": "lang-switch notranslate", "translate": "no"})
    etree.SubElement(menu, "summary", {"aria-label": LABELS[lang]}).text = lang.upper()
    links = etree.SubElement(menu, "div", {"class": "lang-options"})
    for code, label in LANGUAGES.items():
        attrs = {"href": url(rel, code), "hreflang": code, "lang": code}
        if code == lang:
            attrs["aria-current"] = "page"
        etree.SubElement(links, "a", attrs).text = label


def metadata(tree, rel, lang, translations):
    head = tree.find("head")
    for old in head.xpath('./link[@rel="canonical" or (@rel="alternate" and @hreflang)]'):
        head.remove(old)
    etree.SubElement(head, "link", {"rel": "canonical", "href": url(rel, lang)})
    for code in [*LANGUAGES, "x-default"]:
        etree.SubElement(head, "link", {"rel": "alternate", "hreflang": code, "href": url(rel, "de" if code == "x-default" else code)})
    for element in tree.xpath('//meta[@property="og:url"]'):
        element.set("content", url(rel, lang))
    for element in tree.xpath('//script[@type="application/ld+json"]'):
        def walk(value, key=""):
            if isinstance(value, dict):
                return {k: walk(v, k) for k, v in value.items()}
            if isinstance(value, list):
                return [walk(v, key) for v in value]
            if isinstance(value, str):
                if key == "inLanguage":
                    return lang
                if key in {"name", "description", "headline"}:
                    return translations.get(value.strip(), value)
                if value.startswith(source.SITE_ORIGIN + "/"):
                    path = value[len(source.SITE_ORIGIN) + 1:]
                    if path == "" or path.endswith(".html"):
                        return url(Path(path or "index.html"), lang)
            return value
        element.text = json.dumps(walk(json.loads(element.text)), ensure_ascii=False)


def rewrite(value, rel, outrel):
    if not value or value.startswith(("#", "data:", "mailto:", "tel:", "javascript:")):
        return value
    parsed = urllib.parse.urlsplit(value)
    if parsed.netloc or parsed.scheme:
        return value
    target = Path(parsed.path.lstrip("/")) if parsed.path.startswith("/") else Path(os.path.normpath(str(rel.parent / parsed.path)))
    if target.suffix == ".html":
        target = Path(outrel.parts[0]) / target
    result = os.path.relpath(target, outrel.parent)
    return urllib.parse.urlunsplit(("", "", result, parsed.query, parsed.fragment))


def generate(page, lang, translations):
    rel = page.relative_to(ROOT)
    outrel = rel if lang == "de" else Path(lang) / rel
    tree = html.document_fromstring(page.read_bytes(), parser=html.HTMLParser(encoding="utf-8"))
    tree.set("lang", lang)
    if lang != "de":
        for element in tree.iter():
            if not isinstance(element.tag, str):
                continue
            if not source.element_is_skipped(element):
                if element.text:
                    element.text = source.translate_preserving_space(element.text, translations)
                for attr in source.TEXT_ATTRS:
                    if element.get(attr):
                        element.set(attr, source.translate_preserving_space(element.get(attr), translations))
            if element.tail and not source.element_is_skipped(element.getparent()):
                element.tail = source.translate_preserving_space(element.tail, translations)
            if element.tag == "meta":
                key = element.get("name", element.get("property", ""))
                if element.get("content") and ("description" in key or key.endswith("title")):
                    element.set("content", source.translate_preserving_space(element.get("content"), translations))
                if key in {"og:image", "twitter:image"} and element.get("content"):
                    element.set("content", rewrite(element.get("content"), rel, outrel))
            for attr in source.URL_ATTRS:
                if element.get(attr):
                    element.set(attr, rewrite(element.get(attr), rel, outrel))
        legal_content(tree, rel, lang)
        runtime = etree.Element("script", src=os.path.relpath(ROOT / "js" / ("i18n-" + lang + ".js"), (ROOT / outrel).parent))
        scripts = tree.xpath('//body//script')
        if scripts:
            scripts[0].addprevious(runtime)
        else:
            tree.find("body").append(runtime)
    navigation(tree, rel, lang)
    metadata(tree, rel, lang, translations)
    output = ROOT / outrel
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text("<!DOCTYPE html>\n" + etree.tostring(tree, method="html", encoding="unicode"))


def runtime_dictionary(lang, phrases, translations):
    dictionary = {p: translations[p] for p in sorted(phrases) if p in translations and translations[p] != p}
    template = (ROOT / "scripts/runtime-i18n.js").read_text()
    (ROOT / "js" / ("i18n-" + lang + ".js")).write_text(template.replace("__LANG__", json.dumps(lang)).replace("__DICTIONARY__", json.dumps(dictionary, ensure_ascii=False)))


def sitemap(pages):
    namespace = "http://www.sitemaps.org/schemas/sitemap/0.9"
    root = etree.Element("{" + namespace + "}urlset", nsmap={None: namespace})
    for page in pages:
        tree = html.document_fromstring(page.read_bytes())
        if tree.xpath('//meta[@name="robots" and contains(@content,"noindex")]'):
            continue
        for lang in LANGUAGES:
            entry = etree.SubElement(root, "url")
            etree.SubElement(entry, "loc").text = url(page.relative_to(ROOT), lang)
    etree.ElementTree(root).write(str(ROOT / "sitemap.xml"), encoding="utf-8", xml_declaration=True, pretty_print=True)


def validate(pages):
    count = 0
    for lang in LANGUAGES:
        for page in pages:
            rel = page.relative_to(ROOT)
            output = page if lang == "de" else ROOT / lang / rel
            tree = html.document_fromstring(output.read_bytes())
            assert tree.get("lang") == lang, output
            assert tree.xpath('string(//link[@rel="canonical"]/@href)') == url(rel, lang), output
            assert len(tree.xpath('//*[@class="lang-options"]/a')) == 5, output
            assert len(tree.xpath('//link[@rel="alternate" and @hreflang]')) == 6, output
            for element in tree.iter():
                if not isinstance(element.tag, str):
                    continue
                for attr in source.URL_ATTRS:
                    value = element.get(attr)
                    if not value or value.startswith(("#", "data:", "mailto:", "tel:", "javascript:")):
                        continue
                    parsed = urllib.parse.urlsplit(value)
                    if parsed.netloc and parsed.netloc != "tussy-van.de":
                        continue
                    if parsed.path.startswith("/"):
                        resolved = ROOT / parsed.path.lstrip("/")
                    elif parsed.scheme:
                        continue
                    else:
                        resolved = output.parent / parsed.path
                    if resolved.is_dir():
                        resolved = resolved / "index.html"
                    assert resolved.exists(), (output, attr, value)
            count += 1
    print(f"Validated {count} pages: languages, navigation, SEO, all local links and assets", flush=True)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--offline", action="store_true")
    parser.add_argument("--validate-only", action="store_true")
    args = parser.parse_args()
    pages = source.html_sources()
    if args.validate_only:
        validate(pages)
        return
    phrases, runtime = phrases_for_site(pages)
    print(f"Source: {len(pages)} pages, {len(phrases)} phrases, {len(runtime)} runtime phrases", flush=True)
    caches = dictionaries(phrases, args.offline)
    for lang, translations in caches.items():
        runtime_dictionary(lang, runtime, translations)
        for page in pages:
            generate(page, lang, translations)
    for page in pages:
        generate(page, "de", {})
    sitemap(pages)
    validate(pages)


if __name__ == "__main__":
    main()
