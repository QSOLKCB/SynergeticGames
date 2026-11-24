import test from 'node:test';
import assert from 'node:assert/strict';
import {registry,foundingRoute,visitSummary} from '../js/museum/catalogue.js';
import {createSession,validateRoute} from '../js/museum/registry.js';
test('progress derives from model state and excludes the expedition; inspection cannot mount labs',()=>{
  const s=createSession(registry),ids=foundingRoute.exhibits,summary=()=>visitSummary(registry,s,ids);
  assert.equal(summary().total,18);assert.equal(summary().complete,0);assert.equal(s.active,null);
  assert.deepEqual(summary().entries.map(e=>e.status),[...Array(18).fill('unvisited'),'expedition']);
  s.mount('concentric.tetra');assert.equal(s.status('concentric.tetra'),'visited');
  for(const edge of ['AB','AC','AD','BC','BD','CD'])s.dispatch({type:'edge',value:edge});
  assert.equal(summary().complete,1);assert.equal(s.active,'concentric.tetra');
  const saved=s.export();s.reset();assert.equal(summary().complete,0);s.unmount();
  s.restore(saved);assert.equal(summary().complete,1);s.unmount();assert.equal(s.active,null);
  const selected=visitSummary(registry,s,['concentric.engine','concentric.tetra']);
  assert.equal(selected.total,1);assert.equal(selected.complete,1);
  assert.deepEqual(selected.entries.map(e=>e.manifest.id),['concentric.engine','concentric.tetra']);
  assert.throws(()=>s.status('missing.lab'));
});
test('route round-trip preserves explicit order and does not touch lab state',()=>{
  const s=createSession(registry);s.mount('concentric.quadray');s.dispatch({type:'subtract',value:null});const before=s.export();
  const route=validateRoute(registry,{kind:'museum.route.v1',schema:1,id:'school.tour',title:'A short tour',exhibits:['measurement.volume-exchange','concentric.quadray']});
  const restored=validateRoute(registry,JSON.parse(JSON.stringify(route)));
  assert.deepEqual(restored,route);assert.deepEqual(s.export(),before);
  assert.deepEqual(visitSummary(registry,s,restored.exhibits).entries.map(e=>e.status),['unvisited','visited']);
  for(let i=0;i<100;i++){s.unmount();s.mount('measurement.volume-exchange');s.reset();s.unmount();s.mount('concentric.quadray');assert.deepEqual(s.export(),before);}
});
