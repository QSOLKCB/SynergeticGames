import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
for(const prior of ['v0.4.0-measurement-1','v0.4.0-measurement-2','v0.5.0-geometry-1','v0.6.0-information-1','v0.7.0-inference-1','v0.7.0-inference-2','v0.8.0-topology-1'])test('Upgrade from '+prior+' replaces stale exhibit modules and preserves other scopes',async()=>{
  const scope='https://example.test/SynergeticGames/';
  const prefix='concentric-/SynergeticGames/-';
  const old=prefix+prior,other='concentric-/OtherGame/-v1';
  const modules=['js/museum/pythagoras.js','js/museum/conversion-desk.js','js/museum/catalogue.js'];
  const stale=new Map(modules.map(path=>[new URL(path,scope).href,'old '+path]));
  const stores=new Map([[old,stale],[other,new Map()]]);
  const handlers=new Map(),requests=[];let claimed=false;
  const fetch=async request=>{
    const url=typeof request==='string'?new URL(request,scope).href:request.url;
    requests.push(url);return 'new '+url;
  };
  const caches={
    async open(name){
      if(!stores.has(name))stores.set(name,new Map());
      const entries=stores.get(name);
      return {
        async addAll(paths){for(const path of paths){const url=new URL(path,scope).href;entries.set(url,await fetch(url));}},
        async match(request){return entries.get(request.url);}
      };
    },
    async keys(){return [...stores.keys()];},
    async delete(name){return stores.delete(name);}
  };
  runInNewContext(source,{URL,caches,fetch,self:{registration:{scope},location:{origin:new URL(scope).origin},
    clients:{async claim(){claimed=true;}},addEventListener(type,handler){handlers.set(type,handler);}}});
  // Browser lifecycle: install new worker completely before activating it.
  async function lifecycle(type){let work;handlers.get(type)({waitUntil(p){work=p;}});assert.ok(work);await work;}
  await lifecycle('install');
  assert.ok(stores.has(old),'old cache must remain until activation');
  assert.equal(stale.get(new URL(modules[0],scope).href),'old '+modules[0],'installation must not overwrite the old worker cache');
  await lifecycle('activate');
  assert.equal(stores.has(old),false,'obsolete same-scope cache must be removed');
  assert.ok(stores.has(other),'unrelated scope must be preserved');
  assert.equal(claimed,true);
  const count=requests.length;
  for(const path of [...modules,'js/museum/quadray-model.js','js/museum/geometry-workshop.js','js/museum/epistemic-model.js','js/museum/information-gallery.js','js/museum/inference-model.js','js/museum/inference-gallery.js','js/museum/simplex-model.js','js/museum/topology-gallery.js','js/museum/research-model.js','js/museum/research-evidence.js','js/museum/research-gallery.js']){
    const url=new URL(path,scope).href;let response;
    handlers.get('fetch')({request:{url,method:'GET'},respondWith(p){response=p;}});
    assert.equal(await response,'new '+url);
  }
  assert.equal(requests.length,count,'updated modules must be served from the new offline cache');
});
