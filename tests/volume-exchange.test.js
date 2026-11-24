import test from 'node:test';
import assert from 'node:assert/strict';
import {registry,foundingRoute} from '../js/museum/catalogue.js';
import {createSession} from '../js/museum/registry.js';
import {exchangeGeometry,volumeReadings,drawExchange} from '../js/museum/volume-exchange.js';
const ID='measurement.volume-exchange';
const close=(a,b)=>assert.ok(Math.abs(a-b)<=1e-11*Math.max(Math.abs(b),1e-12),a+' != '+b);
const sub=(a,b)=>a.map((v,i)=>v-b[i]);
const dist=(a,b)=>Math.hypot(...sub(a,b));
const determinant=(a,b,c)=>a[0]*(b[1]*c[2]-b[2]*c[1])-a[1]*(b[0]*c[2]-b[2]*c[0])+a[2]*(b[0]*c[1]-b[1]*c[0]);
test('actual registered exhibit is new and precedes the legacy finale in guided route',()=>{
  assert.equal(registry.list.length,12);assert.equal(registry.get(ID).manifest.kind,'lab');
  assert.deepEqual(foundingRoute.exhibits.slice(-8),[ID,'measurement.conversion-desk','measurement.area-transfer','measurement.tetrabook','geometry.quadray-workshop','geometry.ivm-builder','geometry.cell-foundry','concentric.engine']);
});
test('every radius: common-scale mesh edges, independent determinants, fixed and reference-unit conversions',()=>{
  for(let n=1;n<=200;n++){
    const r=n/100,g=exchangeGeometry(n);
    assert.equal(g.cubeEdges.length,12);assert.equal(g.tetraEdges.length,6);
    for(const [a,b] of g.cubeEdges)close(dist(g.cube[a],g.cube[b]),r);
    for(const [a,b] of g.tetraEdges)close(dist(g.tetra[a],g.tetra[b]),2*r);
    const cube=Math.abs(determinant(...[1,2,4].map(i=>sub(g.cube[i],g.cube[0]))));
    const tet=Math.abs(determinant(...[1,2,3].map(i=>sub(g.tetra[i],g.tetra[0]))))/6;
    const f=volumeReadings(n,'fixed'),x=volumeReadings(n,'xyz'),t=volumeReadings(n,'ivm');
    close(f.cube,cube);close(f.tetra,tet);close(x.cube,1);close(x.tetra,tet/cube);
    close(t.cube,cube/tet);close(t.tetra,1);
    close(x.cube*t.s3,t.cube);close(x.tetra*t.s3,t.tetra);close(t.s3**2,9/8);
    assert.ok(cube>tet);
  }
  for(const bad of [0,201,NaN,1.5,'100',null])assert.throws(()=>exchangeGeometry(bad));
  assert.throws(()=>volumeReadings(100,'unknown'));
});
test('prediction, retry, scale and unit transitions, reset and atomic record restore',()=>{
  const s=createSession(registry),act=(type,value=null)=>s.dispatch({type,value});
  s.mount('concentric.tetra');act('edge','AB');const legacy=s.export();
  s.mount(ID);assert.equal(s.describe().done,false);assert.equal(act('measure').ok,false);
  act('predict','tetra');assert.equal(act('measure').ok,false);assert.match(s.describe().readout,/Ratio ≈ 1\.060660/);
  assert.equal(s.describe().done,false);act('predict','cube');assert.equal(act('measure').ok,true);assert.equal(s.describe().done,true);
  act('radius',200);act('unit','fixed');assert.match(s.describe().readout,/Cube: 8\.000000; tetrahedron: 7\.542472/);
  act('unit','ivm');assert.match(s.describe().readout,/Cube: 1\.060660; tetrahedron: 1\.000000/);
  const saved=s.export();assert.equal(saved.state.radius,200);
  for(const [type,value] of [['radius',201],['unit','other'],['predict','other'],['measure',true],['unknown',null]]){
    assert.equal(act(type,value).ok,false);assert.deepEqual(s.export(),saved);
  }
  for(const state of [{...saved.state,radius:0},{...saved.state,unit:'other'},{...saved.state,prediction:null},{...saved.state,measured:1},{...saved.state,extra:true}]){
    assert.throws(()=>s.restore({...saved,state}));assert.deepEqual(s.export(),saved);
  }
  s.reset();assert.deepEqual(s.snapshot(),{radius:100,unit:'xyz',prediction:null,measured:false});
  s.restore(JSON.parse(JSON.stringify(saved)));assert.deepEqual(s.export(),saved);
  s.mount('concentric.tetra');assert.deepEqual(s.export(),legacy);
});
test('unit toggles and predictions cannot change projected geometry',()=>{
  const commands=s=>{const log=[],ctx=new Proxy({},{
    get(_t,k){return (...args)=>log.push([k,...args]);},
    set(_t,k,v){log.push([k,v]);return true;}
  });drawExchange({width:640,height:300,getContext:()=>ctx},s);return log;};
  const initial={radius:100,unit:'xyz',prediction:null,measured:false},a=commands(initial);
  assert.deepEqual(a,commands({...initial,unit:'ivm',prediction:'cube',measured:true}));
  assert.deepEqual(a,commands({...initial,unit:'fixed'}));
  assert.notDeepEqual(a,commands({...initial,radius:200}));
  // Canvas coordinate span doubles at the same viewport size.
  const edgeLength=log=>{const i=log.findIndex(x=>x[0]==='moveTo');return Math.hypot(log[i][1]-log[i+1][1],log[i][2]-log[i+1][2]);};
  close(edgeLength(commands({...initial,radius:200})),2*edgeLength(a));
});
