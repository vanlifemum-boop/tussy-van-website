#!/usr/bin/env python3
"""Keep a direct, language-aware newest-post link in every static navigation.

The first Git addition marks publication, so editing an old post does not make
it newest. datePublished and the path provide a stable tie-break for posts
published together. Runs locally and during every GitHub Pages deployment.
Only Python's standard library is needed by the deployment step.
"""
import argparse
import html
import json
import os
import re
import subprocess
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LABELS = {
    'de': 'Neuester Blog',
    'en': 'Latest blog post',
    'es': 'Último artículo',
    'fr': 'Dernier article',
    'pl': 'Najnowszy wpis',
}
NAV = re.compile(r'(<nav\b[^>]*\bclass="[^"]*\bmain-nav\b[^"]*"[^>]*>)(.*?)(</nav>)', re.S)
BUTTON = re.compile(r'<a\b[^>]*\bdata-latest-blog\b[^>]*>.*?</a>\s*', re.S)
YOUTUBE = re.compile(r'<a\b(?=[^>]*\bhref="https://(?:www\.)?youtube\.com/)[^>]*>')


class PostMetadata(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.noindex = False
        self.in_json = False
        self.json_parts = []
        self.published = ''
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'meta' and attrs.get('name', '').lower() == 'robots':
            self.noindex |= 'noindex' in attrs.get('content', '').lower()
        if tag == 'script' and attrs.get('type') == 'application/ld+json':
            self.in_json = True
            self.json_parts = []

    def handle_data(self, data):
        if self.in_json:
            self.json_parts.append(data)

    def handle_endtag(self, tag):
        if tag != 'script' or not self.in_json:
            return
        self.in_json = False
        def visit(obj):
            if isinstance(obj, dict):
                if obj.get('datePublished'):
                    self.published = max(self.published, obj['datePublished'])
                for item in obj.values():
                    visit(item)
            elif isinstance(obj, list):
                for item in obj:
                    visit(item)
        try:
            visit(json.loads(''.join(self.json_parts)))
        except (ValueError, TypeError):
            pass


def newest_post(root):
    candidates = []
    for path in sorted((root / 'blog').glob('*.html')):
        metadata = PostMetadata(path.read_text())
        if metadata.noindex:
            continue
        history = subprocess.check_output(
            ['git', 'log', '--diff-filter=A', '--format=%ct', '--', path.relative_to(root).as_posix()],
            cwd=root, text=True,
        ).splitlines()
        added = int(history[-1]) if history else None
        candidates.append((path, added, metadata.published))
    if not candidates:
        raise RuntimeError('No published blog articles found')
    # New, not-yet-committed articles must also work during local preparation.
    pending = max((added or 0 for _, added, _ in candidates)) + 1
    return max(candidates, key=lambda item: (item[1] if item[1] is not None else pending, item[2], item[0].name))[0]


def update(root=ROOT):
    root = Path(root).resolve()
    latest = newest_post(root)
    count = 0
    for language, label in LABELS.items():
        directory = root if language == 'de' else root / language
        target = directory / 'blog' / latest.name
        if not target.exists():
            target = latest  # A new untranslated post remains reachable.
        pages = list(directory.glob('*.html'))
        pages += list((directory / 'blog').glob('*.html'))
        pages += list((directory / 'ratgeber').glob('*.html'))
        for page in pages:
            text = page.read_text()
            href = html.escape(Path(os.path.relpath(target, page.parent)).as_posix(), quote=True)
            current = ' aria-current="page"' if page == target else ''
            button = f'<a class="btn btn-neon nav-latest-blog notranslate" data-latest-blog translate="no" href="{href}"{current}>{label}</a>\n'
            def replace(match):
                content = BUTTON.sub('', match[2])
                youtube = YOUTUBE.search(content)
                if youtube:
                    content = content[:youtube.start()] + button + content[youtube.start():]
                else:
                    content += button
                return match[1] + content + match[3]
            result, replaced = NAV.subn(replace, text)
            if replaced != 1:
                raise RuntimeError(f'Expected one main navigation: {page}')
            if result != text:
                page.write_text(result)
            count += 1
    print(f'Latest blog: {latest.relative_to(root)}; updated {count} navigation links')
    return latest


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--root', type=Path, default=ROOT)
    update(parser.parse_args().root)
