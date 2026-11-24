import test from 'node:test';
import assert from 'node:assert/strict';
import {createRegistry,createSession,validateRoute,parseData,ownData} from '../js/museum/registry.js';
import {founding} from '../js/museum/founding.js';
import {createGame,saveRecord} from '../js/game.js';
const registry=createRegistry(founding),act=(session,type,value=null)=>session.dispatch({type,value});
test('catalogue registers all founding exhibits with independent sessions and guarded finale',()=>{
  assert.deepEqual(registry.list.map(m=>m.id),['concentric.tetra','concentric.volume','concentric.ivm','concentric.quadray','concentric.engine']);
  const s=createSession(registry),legacy=saveRecord(createGame()),before=JSON.stringify(legacy);
  s.mount('concentric.tetra');for(const e of ['AB','AC','AD','BC','BD','CD'])assert.equal(act(s,'edge',e).ok,true);
  assert.equal(s.describe().done,true);assert.ok(Object.isFrozen(s.snapshot().lab));
  s.unmount();assert.throws(()=>s.dispatch({type:'edge',value:'AB'}));s.mount('concentric.volume');assert.equal(act(s,'check').ok,false);
  act(s,'add',4);act(s,'check');for(let i=0;i<5;i++)act(s,'add',4);act(s,'check');assert.equal(s.describe().done,true);
  s.mount('concentric.ivm');for(const [a,b] of [[0,3],[1,2],[4,7],[5,6],[8,11],[9,10]]){act(s,'select',a);assert.equal(act(s,'select',b).ok,true);}
  assert.equal(s.describe().done,true);s.mount('concentric.quadray');for(let i=0;i<3;i++)act(s,'subtract');assert.equal(s.describe().done,true);
  s.mount('concentric.tetra');assert.equal(s.describe().done,true);s.reset();assert.equal(s.describe().done,false);
  assert.throws(()=>s.mount('concentric.engine'));assert.equal(s.active,'concentric.tetra');assert.equal(JSON.stringify(legacy),before);
});
test('versioned records restore atomically, own their data and reject wrong fields and references',()=>{
  const s=createSession(registry);s.mount('concentric.tetra');act(s,'edge','AB');const saved=s.export();
  s.mount('concentric.quadray');act(s,'subtract');const before=s.export();
  for(const bad of [{...saved,version:2},{...saved,id:'missing.lab'},{...saved,state:{lab:['AB','AB'],selected:null}},{...saved,state:{lab:['AB'],selected:0}},{...saved,extra:true},{...saved,state:{lab:['AB'],selected:null,extra:true}}]){
    assert.throws(()=>s.restore(bad));assert.deepEqual(s.export(),before);
  }
  s.restore(parseData(JSON.stringify(saved)));saved.state.lab.push('BC');assert.deepEqual(s.snapshot().lab,['AB']);
  assert.throws(()=>parseData('{"__proto__":{}}'));assert.throws(()=>parseData(' '.repeat(65537)));assert.throws(()=>ownData(Array(1)));
  let accessed=false;assert.throws(()=>ownData({get x(){accessed=true;return 1;}}));assert.equal(accessed,false);
  let deep=0;for(let i=0;i<10;i++)deep={nested:deep};assert.throws(()=>ownData(deep));
});
test('route packs are data-only, bounded and refer to reviewed entries; registry rejects duplicates',()=>{
  const route={kind:'museum.route.v1',schema:1,id:'test.route',title:'Test route',exhibits:['concentric.tetra','concentric.engine']};
  const accepted=validateRoute(registry,route);route.exhibits.push('missing.lab');assert.equal(accepted.exhibits.length,2);
  for(const bad of [{...route,exhibits:['concentric.tetra','concentric.tetra']},{...route,exhibits:['../app.js']},{...route,exhibits:['missing.lab']},{...route,schema:2},{...route,script:'evil'}])assert.throws(()=>validateRoute(registry,bad));
  assert.throws(()=>createRegistry([founding[0],founding[0]]));
  assert.throws(()=>createRegistry([{...founding[0],manifest:{...founding[0].manifest,schema:2}}]));
});
test('new reviewed model registers without editing founding models or host',()=>{
  const example={manifest:{schema:1,id:'test.counter',version:1,title:'Counter',gallery:'Test',kind:'lab',question:'Count',source:'local test'},initial:()=>0,validate:n=>{if(!Number.isInteger(n)||n<0||n>2)throw RangeError();return n;},transition:(n,a)=>({state:n+1,ok:true,message:'increment'}),describe:n=>({readout:String(n),actions:[]})};
  const s=createSession(createRegistry([...founding,example]));s.mount('test.counter');act(s,'increment');assert.equal(s.snapshot(),1);act(s,'increment');assert.throws(()=>act(s,'increment'));assert.equal(s.snapshot(),2);
});
