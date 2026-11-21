import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const source=fs.readFileSync(new URL('../js/analytics.js',import.meta.url),'utf8');
const endpoint='https://tussy-van-statistik.workspace-vo-1968.chatgpt.site/api/track';
const tick=()=>new Promise(resolve=>setImmediate(resolve));
async function run({enabled=true,path='/pl/blog/example.html',host='tussy-van.de',protocol='https:',privacy=false,off=false,legacyDenied=false,visible=true,query='',storageBlocked=false,failed=false}={}){
 const requests=[],events={},windowEvents={},stored=new Map(),elements=[],historyCalls=[];if(off)stored.set('tv_stats_opt_out','1');if(legacyDenied)stored.set('tv-statistics-consent-v1','denied');
 const footer={appendChild(e){elements.push(e)}};
 const document={documentElement:{lang:'de'},visibilityState:visible?'visible':'hidden',querySelector:s=>s==='.site-footer'?footer:null,createElement:()=>({setAttribute(){}}),addEventListener:(name,fn)=>events[name]=fn};
 const window={addEventListener:(name,fn)=>windowEvents[name]=fn};
 const location={protocol,hostname:host,pathname:path,href:protocol+'//'+host+path+query};
 const context={window,document,location,URL,history:{replaceState:(...args)=>historyCalls.push(args)},navigator:{globalPrivacyControl:privacy},localStorage:{getItem(k){if(storageBlocked)throw Error();return stored.get(k)||null},setItem(k,v){if(storageBlocked)throw Error();stored.set(k,v)},removeItem(k){if(storageBlocked)throw Error();stored.delete(k)}},fetch:async(url,options)=>{requests.push({url,options});if(failed)throw Error('offline');return{ok:true,json:async()=>url.includes('config')?{enabled,endpoint}:{'/blog/example.html':'Article','/':'Start'}}}};
 vm.runInNewContext(source,context);await tick();await tick();return{context,document,window,events,windowEvents,stored,historyCalls,elements,requests,tracks:()=>requests.filter(r=>r.url===endpoint)};
}
let r=await run();assert.equal(r.tracks().length,1);assert.deepEqual(JSON.parse(r.tracks()[0].options.body),{path:'/blog/example.html'});assert.equal(r.tracks()[0].options.credentials,'omit');assert.equal(r.tracks()[0].options.referrerPolicy,'no-referrer');r.events.visibilitychange();vm.runInNewContext(source,r.context);assert.equal(r.tracks().length,1);
for(const options of [{enabled:false},{off:true},{legacyDenied:true},{privacy:true},{host:'localhost'},{protocol:'http:'},{path:'/verwaltung/statistik.html'},{path:'/private.html'},{failed:true}]){r=await run(options);assert.equal(r.tracks().length,0,JSON.stringify(options));}
r=await run({visible:false});assert.equal(r.tracks().length,0);r.document.visibilityState='visible';r.events.visibilitychange();assert.equal(r.tracks().length,1);
r=await run({query:'?_tv_stats=off&utm_source=test#section',storageBlocked:true});assert.equal(r.tracks().length,0);assert.equal(r.historyCalls[0][2],'/pl/blog/example.html?utm_source=test#section');
r=await run({off:true,legacyDenied:true,query:'?_tv_stats=on'});assert.equal(r.tracks().length,1);assert.equal(r.stored.has('tv_stats_opt_out'),false);assert.equal(r.stored.has('tv-statistics-consent-v1'),false);
r=await run({query:'?email=private@example.org#private'});assert.deepEqual(JSON.parse(r.tracks()[0].options.body),{path:'/blog/example.html'});
r=await run({visible:false});r.elements[0].onclick();r.document.visibilityState='visible';r.events.visibilitychange();assert.equal(r.tracks().length,0);r.elements[0].onclick();assert.equal(r.tracks().length,1);
r=await run({off:true,privacy:true,query:'?_tv_stats=on'});assert.equal(r.tracks().length,0);
for(const path of ['/en/index.html','/es/','/fr','/pl/'])assert.equal(r.window.TV_ANALYTICS.canonicalPath(path),'/');
console.log('Analytics passed: canonical paths, no identifiers, one count, visibility, opt-out, re-enable, storage failure, GPC, exclusions and network failure.');
