/* Optional page statistics. No provider request until configured AND consented. */
(function () {
  'use strict';
  if (window.TV_ANALYTICS) return;
  var KEY = 'tv-statistics-consent-v1';
  var language = (document.documentElement.lang || 'de').split('-')[0];
  var copy = {
    de: ['Optionale Besuchsstatistik', 'Darf GoatCounter diesen Seitenaufruf für die Statistik erfassen? Dabei werden die gelesene Seite und technische Browserdaten übermittelt. Es werden keine Tracking-Cookies gesetzt. Deine Entscheidung gilt unabhängig von YouTube.', 'Statistik erlauben', 'Ohne Statistik', 'Statistik-Einstellungen', 'Datenschutz', 'Dein Browser hat ein Datenschutzsignal aktiviert. Deshalb wird kein Aufruf erfasst.'],
    en: ['Optional visit statistics', 'May GoatCounter record this page view for statistics? The page viewed and technical browser data will be sent. No tracking cookies are set. Your choice is separate from YouTube consent.', 'Allow statistics', 'Without statistics', 'Statistics settings', 'Privacy', 'Your browser has enabled a privacy signal. No page view will be recorded.'],
    es: ['Estadísticas opcionales', '¿Permites que GoatCounter registre esta visita? Se enviarán la página visitada y datos técnicos del navegador. No se usan cookies de seguimiento. Esta decisión es independiente del consentimiento para YouTube.', 'Permitir estadísticas', 'Sin estadísticas', 'Ajustes de estadísticas', 'Privacidad', 'Tu navegador ha activado una señal de privacidad. No se registrará esta visita.'],
    fr: ['Statistiques de visite facultatives', 'Autorisez-vous GoatCounter à compter cette consultation ? La page consultée et des données techniques du navigateur seront transmises. Aucun cookie de suivi ne sera utilisé. Ce choix est indépendant de votre consentement pour YouTube.', 'Autoriser les statistiques', 'Sans statistiques', 'Paramètres des statistiques', 'Confidentialité', 'Votre navigateur a activé un signal de confidentialité. Cette consultation ne sera pas comptabilisée.'],
    pl: ['Opcjonalne statystyki odwiedzin', 'Czy GoatCounter może uwzględnić tę odsłonę w statystykach? Przesłany zostanie adres odwiedzonej strony oraz dane techniczne przeglądarki. Nie są używane śledzące pliki cookie. Ta decyzja jest niezależna od zgody na YouTube.', 'Zezwól na statystyki', 'Bez statystyk', 'Ustawienia statystyk', 'Prywatność', 'Twoja przeglądarka wysyła sygnał ochrony prywatności. Ta odsłona nie zostanie zliczona.']
  }[language] || null;
  if (!copy) copy = ['Optional statistics', 'Allow GoatCounter to count this page view? No tracking cookies are used.', 'Allow statistics', 'Without statistics', 'Statistics settings', 'Privacy', 'Your browser privacy signal prevents counting.'];
  var choice = null;
  try { choice = localStorage.getItem(KEY); } catch (_) {}
  var config, page, panel, requested = false, sent = false;
  var blocked = navigator.globalPrivacyControl === true || navigator.doNotTrack === '1' || window.doNotTrack === '1';
  var isProduction = location.protocol === 'https:' && /^(www\.)?tussy-van\.de$/.test(location.hostname);

  function canonicalPath(path) {
    path = path.replace(/^\/(en|es|fr|pl)(?=\/|$)/, '') || '/';
    return path === '/index.html' ? '/' : path;
  }
  function validConfig(value) {
    return value && value.enabled === true && typeof value.siteCode === 'string' && /^[a-z0-9](?:[a-z0-9-]{0,58}[a-z0-9])?$/.test(value.siteCode);
  }
  function send() {
    if (sent || choice !== 'granted' || blocked || document.visibilityState !== 'visible') return;
    if (window.goatcounter && typeof window.goatcounter.count === 'function') {
      sent = true;
      window.goatcounter.count();
    }
  }
  function start() {
    if (!isProduction || !validConfig(config) || !page || choice !== 'granted' || blocked) return;
    if (requested) { send(); return; }
    requested = true;
    window.goatcounter = {
      no_onload: true,
      no_events: true,
      no_session: true,
      path: page.path,
      title: page.title,
      referrer: ''
    };
    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://gc.zgo.at/count.js';
    script.referrerPolicy = 'no-referrer';
    script.setAttribute('data-goatcounter', 'https://' + config.siteCode + '.goatcounter.com/count');
    script.onload = send;
    document.head.appendChild(script);
  }
  function setChoice(value) {
    choice = value;
    try { localStorage.setItem(KEY, value); } catch (_) {}
    if (panel) panel.remove();
    panel = null;
    if (value === 'granted') start();
  }
  function preferences() {
    if (!validConfig(config) || panel) return;
    if (document.querySelector('.cookie-banner.show')) return;
    panel = document.createElement('aside');
    panel.className = 'statistics-consent notranslate';
    panel.setAttribute('translate', 'no');
    panel.setAttribute('aria-label', copy[0]);
    var heading = document.createElement('h2'); heading.textContent = copy[0];
    var paragraph = document.createElement('p'); paragraph.textContent = blocked ? copy[6] : copy[1];
    var privacy = document.createElement('a'); privacy.href = '/datenschutz.html#besuchsstatistik'; privacy.textContent = copy[5];
    var actions = document.createElement('div'); actions.className = 'statistics-actions';
    var deny = document.createElement('button'); deny.type = 'button'; deny.className = 'btn'; deny.textContent = copy[3];
    deny.onclick = function () { setChoice('denied'); };
    actions.appendChild(deny);
    if (!blocked) {
      var allow = document.createElement('button'); allow.type = 'button'; allow.className = 'btn'; allow.textContent = copy[2];
      allow.onclick = function () { setChoice('granted'); }; actions.appendChild(allow);
    }
    panel.append(heading, paragraph, privacy, actions);
    document.body.appendChild(panel);
  }
  window.TV_ANALYTICS = { canonicalPath: canonicalPath, validConfig: validConfig, preferences: preferences };
  document.addEventListener('visibilitychange', send);
  document.addEventListener('tv-media-consent', function () {
    if (page && choice !== 'granted' && choice !== 'denied' && !blocked) preferences();
  });
  window.addEventListener('storage', function (event) {
    if (event.key === KEY) { choice = event.newValue; if (choice === 'granted') start(); }
  });
  if (!isProduction || /^\/verwaltung\//.test(location.pathname)) return;
  fetch('/config/analytics.json', {cache: 'no-cache', credentials: 'omit'}).then(function (response) {
    if (!response.ok) throw new Error('configuration unavailable');
    return response.json();
  }).then(function (value) {
    config = value;
    if (!validConfig(config)) return;
    var footer = document.querySelector('.site-footer');
    if (footer) {
      var control = document.createElement('button'); control.type = 'button';
      control.className = 'statistics-preferences notranslate'; control.setAttribute('translate', 'no');
      control.textContent = copy[4]; control.onclick = preferences; footer.appendChild(control);
    }
    return fetch('/data/analytics-pages.json', {credentials: 'omit'}).then(function (response) {
      if (!response.ok) throw new Error('catalog unavailable');
      return response.json();
    }).then(function (catalog) {
      var path = canonicalPath(location.pathname);
      if (!Object.prototype.hasOwnProperty.call(catalog, path)) return;
      page = {path: path, title: catalog[path]};
      if (choice === 'granted') start();
      else if (choice !== 'denied' && !blocked) preferences();
    });
  }).catch(function () { /* Statistics failure must never interrupt the website. */ });
})();
