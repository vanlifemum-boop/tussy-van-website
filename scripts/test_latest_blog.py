import contextlib
import io
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

from update_latest_blog import LABELS, newest_post, update


class LatestBlogTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.git('init', '-q')
        self.git('config', 'user.name', 'Test')
        self.git('config', 'user.email', 'test@example.invalid')

    def git(self, *args, date=None):
        env = os.environ.copy()
        if date:
            env.update(GIT_AUTHOR_DATE=date, GIT_COMMITTER_DATE=date)
        return subprocess.check_output(['git', *args], cwd=self.root, env=env, text=True)

    def page(self, relative, extra=''):
        path = self.root / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text('<html><head>' + extra + '</head><body><nav class="main-nav">'
                        '<a href="https://www.youtube.com/@tussyvan">YouTube</a>'
                        '</nav></body></html>')
        return path

    def commit(self, date):
        self.git('add', '.')
        self.git('commit', '-qm', 'fixture', date=date)

    def test_new_article_wins_but_old_article_edit_does_not(self):
        old = self.page('blog/old.html')
        self.commit('2026-10-01T12:00:00+00:00')
        latest = self.page('blog/new.html')
        self.commit('2026-11-01T12:00:00+00:00')
        old.write_text(old.read_text() + '<!-- correction -->')
        self.commit('2026-11-02T12:00:00+00:00')
        self.assertEqual(newest_post(self.root), latest)
        self.page('blog/draft.html', '<meta name="robots" content="noindex,follow">')
        self.commit('2026-11-03T12:00:00+00:00')
        self.assertEqual(newest_post(self.root), latest)

    def test_same_commit_uses_publication_date_and_stable_filename(self):
        self.page('blog/a.html', '<script type="application/ld+json">'
                  '{"@type":"BlogPosting","datePublished":"2026-11-20T09:00:00Z"}</script>')
        latest = self.page('blog/b.html', '<script type="application/ld+json">'
                          '{"@type":"BlogPosting","datePublished":"2026-11-20T10:00:00Z"}</script>')
        self.commit('2026-11-20T12:00:00+00:00')
        self.assertEqual(newest_post(self.root), latest)

    def test_direct_links_all_languages_nested_paths_and_missing_translation(self):
        self.page('blog/latest.html')
        for lang in LABELS:
            prefix = '' if lang == 'de' else lang + '/'
            self.page(prefix + 'index.html')
            self.page(prefix + 'ratgeber/example.html')
            if lang not in ('de', 'es'):
                self.page(prefix + 'blog/latest.html')
        self.commit('2026-11-20T12:00:00+00:00')
        with contextlib.redirect_stdout(io.StringIO()):
            update(self.root)
        for lang, label in LABELS.items():
            prefix = '' if lang == 'de' else lang + '/'
            page = self.root / prefix / 'index.html'
            text = page.read_text()
            href = '../blog/latest.html' if lang == 'es' else 'blog/latest.html'
            self.assertIn(f'href="{href}">{label}</a>', text)
            self.assertEqual(text.count('data-latest-blog'), 1)
            self.assertLess(text.index('data-latest-blog'), text.index('youtube.com'))
        self.assertIn('href="../blog/latest.html"', (self.root/'pl/ratgeber/example.html').read_text())
        self.assertIn('href="../../blog/latest.html"', (self.root/'es/ratgeber/example.html').read_text())
        self.assertIn('aria-current="page"', (self.root/'pl/blog/latest.html').read_text())
        snapshot = {p: p.read_bytes() for p in self.root.rglob('*.html')}
        with contextlib.redirect_stdout(io.StringIO()):
            update(self.root)
        self.assertEqual(snapshot, {p: p.read_bytes() for p in snapshot})


if __name__ == '__main__':
    unittest.main()
