import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Exercise actual generated runtime scripts without a network or a browser.
for (const lang of ['en', 'es', 'fr', 'pl']) {
  const staticText = {nodeType: 3, nodeValue: 'Station', parentElement: {closest: () => null}};
  let observe;
  const context = {
    window: {},
    document: {
      documentElement: {lang}, body: {},
      createTreeWalker() {
        let visited = false;
        return {nextNode() { if (visited) return null; visited = true; return staticText; }};
      }
    },
    NodeFilter: {SHOW_TEXT: 4, SHOW_ELEMENT: 1},
    MutationObserver: class { constructor(callback) { observe = callback; } observe() {} },
  };
  vm.runInNewContext(fs.readFileSync(new URL('../js/i18n-' + lang + '.js', import.meta.url), 'utf8'), context);
  const translate = context.window.TV_t;
  assert.equal(typeof translate, 'function');
  assert.notEqual(translate('Über mich'), 'Über mich');
  assert.notEqual(translate('Wasserkanister'), 'Wasserkanister');
  assert.equal(translate('Tussy Van'), 'Tussy Van');
  const dynamic = {nodeType: 3, nodeValue: '3 Beiträge gefunden', parentElement: {closest: () => null}};
  observe([{type: 'childList', addedNodes: [dynamic]}]);
  assert.notEqual(dynamic.nodeValue, '3 Beiträge gefunden');
  assert.ok(dynamic.nodeValue.includes('3'));
  const translated = dynamic.nodeValue;
  for (let i = 0; i < 5; i++) observe([{type: 'characterData', target: dynamic, addedNodes: []}]);
  assert.equal(dynamic.nodeValue, translated, 'translations must not repeat on their own mutations');
  observe([{type: 'characterData', target: staticText, addedNodes: []}]);
  assert.equal(staticText.nodeValue, 'Station', 'pretranslated static HTML must stay unchanged');
  dynamic.nodeValue = '4 Beiträge gefunden';
  observe([{type: 'characterData', target: dynamic, addedNodes: []}]);
  assert.notEqual(dynamic.nodeValue, '4 Beiträge gefunden');
  assert.ok(dynamic.nodeValue.includes('4'));
  const protectedText = {nodeType: 3, nodeValue: 'Über mich', parentElement: {closest: () => ({})}};
  observe([{type: 'childList', addedNodes: [protectedText]}]);
  assert.equal(protectedText.nodeValue, 'Über mich');
  console.log(lang + ': static copy, dynamic counters, game labels and mutation stability passed');
}
