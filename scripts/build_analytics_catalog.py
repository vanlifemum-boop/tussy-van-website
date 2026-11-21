#!/usr/bin/env python3
"""Index real public pages; translated URLs share the German article counter."""
import json
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_title = False
        self.title = ''
        self.noindex = False

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'title':
            self.in_title = True
        if tag == 'meta' and attrs.get('name', '').lower() == 'robots':
            self.noindex = 'noindex' in attrs.get('content', '').lower()

    def handle_endtag(self, tag):
        if tag == 'title':
            self.in_title = False

    def handle_data(self, data):
        if self.in_title:
            self.title += data


def build(root=ROOT):
    catalog = {}
    for pattern in ('*.html', 'blog/*.html', 'ratgeber/*.html'):
        for path in sorted(root.glob(pattern)):
            page = Page()
            page.feed(path.read_text())
            if page.noindex:
                continue
            url = '/' + path.relative_to(root).as_posix()
            if url == '/index.html':
                url = '/'
            catalog[url] = page.title.strip()
    target = root / 'data' / 'analytics-pages.json'
    target.parent.mkdir(exist_ok=True)
    target.write_text(json.dumps(catalog, ensure_ascii=False, indent=2, sort_keys=True) + '\n')
    print(f'Analytics catalog: {len(catalog)} public pages')


if __name__ == '__main__':
    build()
