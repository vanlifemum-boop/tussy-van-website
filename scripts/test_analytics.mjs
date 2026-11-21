import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../js/analytics.js', import.meta.url), 'utf8');
const configured = {enabled: true, siteCode: 'owned-test-site'};
const tick = () => new Promise(resolve => setImmediate(resolve));

async function run({config = configured, choice, path = '/pl/blog/example.html', host = 'tussy-van.de', protocol = 'https:', visible = true, privacy = false, mediaBanner = false, failed = false} = {}) {
  const external = [], requests = [], events = {}, storageEvents = {}, stored = new Map(), elements = [];
  if (choice) stored.set('tv-statistics-consent-v1', choice);
  stored.set('tv-consent', 'all'); // Existing YouTube permission must not authorize analytics.
  function element(tag) {
    const e = {tag, children: [], attrs: {}, textContent: '', removed: false,
      setAttribute(k, v) { this.attrs[k] = v; },
      appendChild(child) { this.children.push(child); return child; },
      append(...children) { this.children.push(...children); },
      remove() { this.removed = true; }};
    elements.push(e); return e;
  }
  const footer = element('footer');
  const document = {
    documentElement: {lang: 'pl'}, visibilityState: visible ? 'visible' : 'hidden',
    head: {appendChild(script) { external.push(script); }}, body: element('body'),
    createElement: element,
    querySelector(selector) { return selector === '.site-footer' ? footer : selector === '.cookie-banner.show' && mediaBanner ? {} : null; },
    addEventListener(name, fn) { events[name] = fn; }
  };
  const window = {addEventListener(name, fn) { storageEvents[name] = fn; }};
  const context = {
    window, document, navigator: {globalPrivacyControl: privacy},
    location: {protocol, hostname: host, pathname: path, search: '?email=private@example.org', hash: '#private'},
    localStorage: {getItem: k => stored.get(k) || null, setItem: (k, v) => stored.set(k, v)},
    fetch: async url => { requests.push(url); if (failed) throw new Error('offline'); return {ok: true, json: async () => url.includes('config') ? config : {'/blog/example.html': 'German article title', '/': 'Start'}}; }
  };
  vm.runInNewContext(source, context); await tick(); await tick();
  const button = text => elements.find(e => e.tag === 'button' && e.textContent === text);
  return {context, document, window, external, requests, stored, events, storageEvents, elements, button, clearMediaBanner() { mediaBanner = false; }};
}

let r = await run({config: {enabled: false, siteCode: ''}, choice: 'granted'});
assert.equal(r.external.length, 0);
assert.equal(r.elements.some(e => e.tag === 'aside'), false);
assert.equal(r.window.TV_ANALYTICS.validConfig({enabled: true, siteCode: 'x.evil.test/path'}), false);

r = await run();
assert.equal(r.external.length, 0, 'Legacy video consent is insufficient');
r.button('Zezwól na statystyki').onclick();
assert.equal(r.external.length, 1);
assert.equal(r.external[0].attrs['data-goatcounter'], 'https://owned-test-site.goatcounter.com/count');
assert.equal(r.window.goatcounter.path, '/blog/example.html');
assert.equal(r.window.goatcounter.title, 'German article title');
assert.equal(r.window.goatcounter.referrer, '');
assert.equal(r.window.goatcounter.no_session, true);
let counts = 0; r.window.goatcounter.count = () => counts++;
r.external[0].onload(); r.events.visibilitychange();
assert.equal(counts, 1, 'Only one count per document');

r = await run(); r.button('Zezwól na statystyki').onclick();
r.window.TV_ANALYTICS.preferences(); r.elements.filter(e => e.tag === 'button' && e.textContent === 'Bez statystyk').at(-1).onclick();
counts = 0; r.window.goatcounter.count = () => counts++;
r.external[0].onload(); assert.equal(counts, 0, 'Revocation while the script loads is respected');

r = await run({choice: 'granted', visible: false});
counts = 0; r.window.goatcounter.count = () => counts++;
r.external[0].onload(); assert.equal(counts, 0);
r.document.visibilityState = 'visible'; r.events.visibilitychange(); assert.equal(counts, 1);

for (const options of [{choice:'denied'}, {choice:'granted', privacy:true}, {choice:'granted', host:'localhost'}, {choice:'granted', path:'/verwaltung/statistik.html'}, {choice:'granted', path:'/impressum.html'}, {choice:'granted', failed:true}]) {
  r = await run(options); assert.equal(r.external.length, 0, JSON.stringify(options));
}
r = await run({mediaBanner:true}); assert.equal(r.elements.some(e => e.tag === 'aside'), false);
r.clearMediaBanner(); r.events['tv-media-consent'](); assert.equal(r.elements.filter(e => e.tag === 'aside').length, 1);
for (const path of ['/en/index.html', '/es/', '/fr', '/pl/']) assert.equal(r.window.TV_ANALYTICS.canonicalPath(path), '/');
console.log('Analytics: inactive state, consent, revocation, visibility, language aggregation, privacy signals, exclusions and failures passed.');
