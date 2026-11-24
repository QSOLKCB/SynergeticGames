/* SPDX-License-Identifier: Apache-2.0 */
const PREFIX='concentric-'+new URL(self.registration.scope).pathname+'-';
const CACHE=PREFIX+'v1.0.0-authoring-1';
const ASSETS=['./','./index.html','./workshop.html','./assets/example-pack.json','./style.css','./assets/icon.svg',
  './js/app.js','./js/game.js','./js/world.js','./js/render.js','./js/music.js',
  './js/museum/registry.js','./js/museum/catalogue.js','./js/museum/founding.js','./js/museum/topology.js',
  './js/museum/volume-exchange.js','./js/museum/measurement.js','./js/museum/measurement-tools.js',
  './js/museum/conversion-desk.js','./js/museum/pythagoras.js','./js/museum/tetrabook.js',
  './js/museum/quadray-model.js','./js/museum/geometry-workshop.js',
  './js/museum/epistemic-model.js','./js/museum/information-gallery.js',
  './js/museum/inference-model.js','./js/museum/inference-gallery.js',
  './js/museum/simplex-model.js','./js/museum/topology-gallery.js',
  './js/museum/research-model.js','./js/museum/research-evidence.js','./js/museum/research-gallery.js',
  './js/museum/museum-config.js','./js/museum/contributions.js','./js/museum/exhibit-packs.js','./js/museum/workshop.js',
  './vendor/vanillajs/modules/exact-graph/index.js','./vendor/vanillajs/modules/exact-rational/index.js',
  './vendor/rayshare/raycast.js','./vendor/synergetics95/js/math.js',
  './vendor/vanillajs/modules/math/index.js','./vendor/vanillajs/modules/time/index.js',
  './vendor/vanillajs/modules/audio2d/index.js','./vendor/vanillajs/modules/soundtrack/index.js',
  './vendor/vanillajs/api/audio/index.js','./vendor/vanillajs/api/audio/effects.js',
  './vendor/vanillajs/api/display/index.js'];
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
