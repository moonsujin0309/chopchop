// 찹찹 오프라인 캐시.
// 지하철에서 열어도 백지가 되지 않게 하는 것이 전부다. 여기서 데이터를 다루지 않는다.
const CACHE='chopchop-v2';
const CORE=['./','./index.html','./icon.png?v=2','./icon-512.png?v=2','./manifest.webmanifest'];

self.addEventListener('install',e=>{
 e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',e=>{
 e.waitUntil(caches.keys()
  .then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
  .then(()=>self.clients.claim()));
});

self.addEventListener('fetch',e=>{
 const req=e.request;
 // GET만 만진다. AI 호출은 POST라 여기 걸리지 않고, 걸려서도 안 된다.
 if(req.method!=='GET')return;
 const url=new URL(req.url);
 if(url.hostname==='api.anthropic.com')return;

 // 화면 요청은 네트워크 우선 — 배포한 새 버전이 바로 보여야 한다.
 if(req.mode==='navigate'){
  e.respondWith(fetch(req)
   .then(r=>{const cp=r.clone();caches.open(CACHE).then(c=>c.put('./index.html',cp));return r;})
   .catch(()=>caches.match('./index.html').then(r=>r||caches.match('./'))));
  return;
 }

 // 나머지는 캐시 우선. 폰트 CDN처럼 안 바뀌는 것들이다.
 e.respondWith(caches.match(req).then(hit=>{
  if(hit)return hit;
  return fetch(req).then(r=>{
   if(r&&(r.ok||r.type==='opaque')){const cp=r.clone();caches.open(CACHE).then(c=>c.put(req,cp));}
   return r;
  }).catch(()=>hit);
 }));
});
