/* Own aggregated page statistics; no visitor IDs or tracking cookies. */
(function () {
  'use strict';
  if (window.TV_ANALYTICS) return;
  var KEY='tv_stats_opt_out', config, page, sent=false, optedOut=false;
  var blocked=navigator.globalPrivacyControl===true || navigator.doNotTrack==='1' || window.doNotTrack==='1';
  var production=location.protocol==='https:' && /^(www\.)?tussy-van\.de$/.test(location.hostname);
  var lang=(document.documentElement.lang||'de').split('-')[0];
  var labels={de:['Statistik auf diesem Gerät deaktivieren','Statistik auf diesem Gerät aktivieren','Statistik deaktiviert','Statistik aktiviert'],en:['Disable statistics on this device','Enable statistics on this device','Statistics disabled','Statistics enabled'],es:['Desactivar estadísticas en este dispositivo','Activar estadísticas en este dispositivo','Estadísticas desactivadas','Estadísticas activadas'],fr:['Désactiver les statistiques sur cet appareil','Activer les statistiques sur cet appareil','Statistiques désactivées','Statistiques activées'],pl:['Wyłącz statystyki na tym urządzeniu','Włącz statystyki na tym urządzeniu','Statystyki wyłączone','Statystyki włączone']}[lang]||['Disable statistics','Enable statistics','Statistics disabled','Statistics enabled'];
  var control;
  function canonicalPath(path) {path=path.replace(/^\/(en|es|fr|pl)(?=\/|$)/,'')||'/';return path==='/index.html'?'/':path;}
  function validConfig(value) {return value && value.enabled===true && value.endpoint==='https://tussy-van-statistik.workspace-vo-1968.chatgpt.site/api/track';}
  function choice(off) {optedOut=off;try{if(off)localStorage.setItem(KEY,'1');else{localStorage.removeItem(KEY);localStorage.removeItem('tv-statistics-consent-v1');}}catch(_){}if(control){control.textContent=labels[off?1:0];control.setAttribute('aria-label',labels[off?2:3]+'. '+labels[off?1:0]);}if(!off)send();}
  function send() {
    if(sent || !production || blocked || optedOut || !page || !validConfig(config) || document.visibilityState!=='visible')return;
    sent=true;
    fetch(config.endpoint,{method:'POST',mode:'cors',credentials:'omit',keepalive:true,referrerPolicy:'no-referrer',headers:{'Content-Type':'text/plain;charset=UTF-8'},body:JSON.stringify({path:page})}).then(function(response){if(response.status===202 && window.console && window.console.debug)window.console.debug('Tussy Van: Seitenaufruf gespeichert.');}).catch(function(){});
  }
  try {optedOut=localStorage.getItem(KEY)==='1' || localStorage.getItem('tv-statistics-consent-v1')==='denied';} catch(_){}
  window.TV_ANALYTICS={canonicalPath:canonicalPath,validConfig:validConfig,setOptOut:choice};
  if(!production || /^\/verwaltung\//.test(location.pathname))return;
  var current=new URL(location.href), preference=current.searchParams.get('_tv_stats');
  if(preference==='off'||preference==='on'){choice(preference==='off');current.searchParams.delete('_tv_stats');history.replaceState(null,'',current.pathname+current.search+current.hash);}
  document.addEventListener('visibilitychange',send);
  window.addEventListener('storage',function(event){if(event.key===KEY || event.key==='tv-statistics-consent-v1'){try{optedOut=localStorage.getItem(KEY)==='1'||localStorage.getItem('tv-statistics-consent-v1')==='denied';}catch(_){}if(control)control.textContent=labels[optedOut?1:0];send();}});
  fetch('/config/analytics.json',{cache:'no-cache',credentials:'omit'}).then(function(r){if(!r.ok)throw Error();return r.json();}).then(function(value){
    config=value;if(!validConfig(config))return;
    var footer=document.querySelector('.site-footer');
    if(footer && !blocked){control=document.createElement('button');control.type='button';control.className='statistics-preferences notranslate';control.setAttribute('translate','no');control.textContent=labels[optedOut?1:0];control.onclick=function(){choice(!optedOut);};footer.appendChild(control);}
    return fetch('/data/analytics-pages.json',{credentials:'omit'}).then(function(r){if(!r.ok)throw Error();return r.json();}).then(function(catalog){var path=canonicalPath(location.pathname);if(Object.prototype.hasOwnProperty.call(catalog,path)){page=path;send();}});
  }).catch(function(){/* A statistics outage never interrupts the website. */});
})();
