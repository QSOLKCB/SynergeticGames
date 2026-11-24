import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {registry} from '../js/museum/catalogue.js';
import {createRegistry,createSession,validateRoute,parseData} from '../js/museum/registry.js';
import {validatePack,packDefinition,createPackCatalogue,TEMPLATE_IDS} from '../js/museum/exhibit-packs.js';
import {counterExample} from '../js/museum/examples/counter.js';
const example=JSON.parse(readFileSync(new URL('../assets/example-pack.json',import.meta.url),'utf8'));
test('reviewed templates validate, create independent instances and reject incompatible saves',()=>{
  for(const id of TEMPLATE_IDS){const p={...example,template:id,initial:registry.get(id).initial()};const d=packDefinition(registry,p),s=createSession(createRegistry([d]));s.mount(p.id);assert.deepEqual(s.snapshot().modelState,p.initial);assert.equal(typeof s.describe().readout,'string');const record=s.export();s.reset();s.restore(record);assert.deepEqual(s.export(),record);}
  const a=createPackCatalogue(registry),b=createPackCatalogue(registry),s=createSession(a.registry);s.mount('concentric.tetra');s.dispatch({type:'edge',value:'AB'});const old=s.export();a.install(example);assert.deepEqual(s.export(),old);
  s.mount(example.id);s.dispatch({type:'predict',value:'cube'});s.dispatch({type:'measure',value:null});assert.equal(s.describe().done,true);const saved=s.export();b.install({...example,title:'Different pack'});const other=createSession(b.registry);assert.throws(()=>other.restore(saved));assert.equal(other.active,null);
  assert.throws(()=>a.install(example));assert.equal(a.registry.list.length,26);assert.equal(registry.list.length,25);
  const route=validateRoute(a.registry,{kind:'museum.route.v1',schema:1,id:'custom.tour',title:'Tour',exhibits:[example.id,'concentric.engine']});assert.deepEqual(route.exhibits,[example.id,'concentric.engine']);
});
test('unknown fields, executable values, reserved IDs, invalid template and states rejected',()=>{
  for(const p of [{...example,script:'alert(1)'},{...example,id:'concentric.tetra'},{...example,template:'concentric.engine'},{...example,templateVersion:2},{...example,initial:{radius:999}},{...example,author:''},{...example,license:'unknown'}])assert.throws(()=>validatePack(registry,p));
  assert.throws(()=>parseData('{"__proto__":{"polluted":true}}'));
  const local=createPackCatalogue(registry);for(let i=0;i<7;i++)local.install({...example,id:'pack.p'+i});assert.throws(()=>local.install({...example,id:'pack.overflow'}));assert.equal(local.registry.list.length,32);
});
test('native contributor example needs no host changes',()=>{
  const extended=createRegistry([...registry.list.map(m=>registry.get(m.id)),counterExample]);const s=createSession(extended);s.mount('example.counter');for(let i=0;i<3;i++)assert.equal(s.dispatch({type:'increment',value:null}).ok,true);assert.equal(s.describe().done,true);assert.equal(s.dispatch({type:'increment',value:null}).ok,false);
  const saved=s.export();s.reset();s.restore(saved);assert.equal(s.describe().done,true);
});
