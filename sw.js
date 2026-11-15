/* SPDX-License-Identifier: Apache-2.0 */
const PREFIX='concentric-'+new URL(self.registration.scope).pathname+'-';
const CACHE=PREFIX+'v0.1.0-2';
const ASSETS=['./','./index.html','./style.css','./assets/icon.svg',
  './js/app.js','./js/game.js','./js/world.js','./js/render.js','./js/music.js',
  './vendor/rayshare/raycast.js','./vendor/synergetics95/js/math.js',
  './vendor/vanillajs/modules/math/index.js','./vendor/vanillajs/modules/time/index.js',
  './vendor/vanillajs/modules/audio2d/index.js','./vendor/vanillajs/modules/soundtrack/index.js',
  './vendor/vanillajs/api/audio/index.js','./vendor/vanillajs/api/audio/effects.js'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS))));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  for(const key of await caches.keys())if(key.startsWith(PREFIX)&&key!==CACHE)await caches.delete(key);
  await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=='GET'||url.origin!==self.location.origin||!url.pathname.startsWith(new URL(self.registration.scope).pathname))return;
  event.respondWith(caches.open(CACHE).then(async cache=>{
    const cached=await cache.match(event.request,{ignoreSearch:true});
    return cached||fetch(event.request);
  }));
});
