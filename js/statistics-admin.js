(function () {
  'use strict';
  var status = document.getElementById('statistics-status');
  var message = document.getElementById('statistics-message');
  fetch('/config/analytics.json', {cache: 'no-cache', credentials: 'omit'}).then(function (response) {
    if (!response.ok) throw new Error('configuration unavailable');
    return response.json();
  }).then(function (config) {
    if (config.enabled === true && typeof config.siteCode === 'string' && /^[a-z0-9](?:[a-z0-9-]{0,58}[a-z0-9])?$/.test(config.siteCode)) {
      status.textContent = 'Statistik-Anbindung aktiviert';
      var link = document.getElementById('statistics-dashboard');
      link.href = 'https://' + config.siteCode + '.goatcounter.com/';
      link.hidden = false;
    } else {
      status.textContent = 'Noch nicht verbunden';
      message.textContent = 'Derzeit werden keine Besucherzahlen erfasst. Die Einrichtung ist vorbereitet; das Statistik-Konto fehlt noch.';
      document.getElementById('statistics-setup').hidden = false;
    }
  }).catch(function () {
    status.textContent = 'Status derzeit nicht verfügbar';
    message.textContent = 'Die Konfiguration konnte nicht geladen werden. Bitte lade die Seite später erneut.';
  });
})();
