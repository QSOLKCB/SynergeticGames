import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,step,labAction,completed,seals,nearestExhibit,switchProbe,facePartner,saveRecord,validateSave,EDGES} from '../js/game.js';
import {MAP,MESHES,DIRECTIONS,GEO,EXHIBITS,meshVolume} from '../js/world.js';
import {castRayFrom,canStand,move,mutualLink,hasLineOfSight} from '../vendor/rayshare/raycast.js';
import {FixedClock} from '../vendor/vanillajs/modules/time/index.js';
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} ≠ ${b}`);
function travel(s,x,y){
  const p=s.probes[s.active];let budget=1000;
  while(Math.hypot(x-p.x,y-p.y)>.07&&budget-->0){p.angle=Math.atan2(y-p.y,x-p.x);step(s,{forward:1});}
  assert.ok(budget>0,`unreachable ${x},${y}`);
}
function solve(s,id){
  if(id==='tetra')for(const e of EDGES)assert.equal(labAction(s,id,'edge',e).ok,true);
  if(id==='volume'){
    assert.equal(labAction(s,id,'check').ok,false);labAction(s,id,'add',4);labAction(s,id,'check');
    for(let i=0;i<5;i++)labAction(s,id,'add',4);labAction(s,id,'check');
  }
  if(id==='ivm')for(let i=0;i<12;i++)if(i<DIRECTIONS[i].opposite)labAction(s,id,'pair',[i,DIRECTIONS[i].opposite]);
  if(id==='quadray')for(let i=0;i<3;i++)labAction(s,id,'subtract');
  assert.equal(completed(s,id),true);
}
test('geometric claims have independent numeric witnesses',()=>{
  for(const [name,v,e,f,volume] of [['tetra',4,6,4,1],['octa',6,12,8,4],['ve',12,24,14,20]]){
    const mesh=MESHES[name];assert.equal(mesh.vertices.length,v);assert.equal(mesh.edges.length,e);assert.equal(mesh.faces.length,f);assert.equal(v-e+f,2);
    for(const [a,b] of mesh.edges)close(GEO.V.distance(mesh.vertices[a],mesh.vertices[b]),1);
    close(meshVolume(mesh),volume);
  }
  close(GEO.euclideanTetraVolume(MESHES.tetra.vertices),Math.sqrt(2)/12);
  for(const q of [[5,3,4,3],[4,2,3,2],[3,1,2,1],[2,0,1,0]]){
    assert.deepEqual(GEO.canonicalQuadray(q),[2,0,1,0]);const p=GEO.quadrayToXYZ(q);p.forEach((v,i)=>close(v,GEO.quadrayToXYZ([2,0,1,0])[i]));
  }
  for(const d of DIRECTIONS){close(GEO.V.length(d.vector),1);assert.equal(DIRECTIONS[d.opposite].opposite,d.index);GEO.V.add(d.vector,DIRECTIONS[d.opposite].vector).forEach(v=>close(v,0));}
});
test('RayShare DDA handles axes, wall starts, distance cap and occluded mutual sight',()=>{
  const m=['11111','10001','10101','10001','11111'].map(r=>[...r].map(Number));
  for(const angle of [0,Math.PI/2,Math.PI,-Math.PI/2])assert.ok(Number.isFinite(castRayFrom(m,1.5,1.5,angle).distance));
  close(castRayFrom(m,1.5,1.5,0).distance,2.5);close(castRayFrom(m,1.5,1.5,Math.PI).distance,.5);
  close(castRayFrom(m,1.5,1.5,0,.25).distance,.25);assert.equal(castRayFrom(m,0,0,0).distance,0);
  assert.equal(hasLineOfSight(m,{x:1.5,y:2.5},{x:3.5,y:2.5}),false);
  assert.equal(mutualLink(m,{x:1.5,y:1.5,angle:0},{x:3.5,y:1.5,angle:Math.PI}),true);
  assert.equal(mutualLink(m,{x:1.5,y:1.5,angle:0},{x:3.5,y:1.5,angle:0}),false);
  assert.throws(()=>castRayFrom(m,NaN,1,0));
});
test('disk collision stops large displacements and keeps all poses inside walls',()=>{
  const p={x:9.5,y:3.5};move(MAP,p,0,-100);assert.ok(p.y>=1.22&&p.y<1.4);assert.equal(canStand(MAP,p.x,p.y),true);
  assert.equal(canStand(MAP,0,0),false);assert.equal(canStand(MAP,-10,3),false);assert.equal(canStand(MAP,Infinity,3),false);
  const s=createGame();for(let i=0;i<15000;i++){step(s,{forward:1,strafe:i%2?1:-1,turn:.5});assert.ok(canStand(MAP,s.probes[0].x,s.probes[0].y));}
});
test('complete expedition via movement, four puzzles and two observer relay',()=>{
  const s=createGame();assert.equal(labAction(s,'tetra','edge','AB').ok,false);
  for(const e of EXHIBITS){travel(s,9.5,9.5);travel(s,e.x,e.y);assert.equal(nearestExhibit(s).id,e.id);solve(s,e.id);assert.deepEqual(validateSave(saveRecord(s)),s);}
  assert.equal(seals(s),4);travel(s,8.5,9.5);facePartner(s);switchProbe(s);facePartner(s);
  for(let i=0;i<119;i++)step(s,{sync:true});assert.equal(s.won,false);step(s,{sync:true});assert.equal(s.won,true);
  switchProbe(s);step(s,{forward:1,turn:1});assert.deepEqual(validateSave(saveRecord(s)),s,'won expedition remains explorable and exportable');
});
test('puzzle mistakes do not award progress; duplicate inputs are bounded',()=>{
  const s=createGame();travel(s,9.5,9.5);travel(s,15.5,9.5);
  assert.equal(labAction(s,'ivm','pair',[0,0]).ok,false);assert.equal(s.labs.ivm.length,0);
  labAction(s,'ivm','pair',[0,DIRECTIONS[0].opposite]);assert.equal(labAction(s,'ivm','pair',[0,DIRECTIONS[0].opposite]).ok,false);
  travel(s,9.5,9.5);travel(s,3.5,9.5);labAction(s,'volume','add',1);assert.equal(labAction(s,'volume','check').ok,false);assert.equal(s.labs.volume.stage,0);
  for(let i=0;i<80;i++)labAction(s,'volume','add',4);assert.equal(s.labs.volume.units,40);
  for(let i=0;i<80;i++)labAction(s,'volume','add',-4);assert.equal(s.labs.volume.units,0);
});
test('malformed restores are rejected, accepted saves own their data',()=>{
  const original=createGame(),record=saveRecord(original),copy=validateSave(record);copy.probes[0].x=7;assert.notEqual(original.probes[0].x,7);
  for(const mutate of [s=>s.tick=-1,s=>s.tick=NaN,s=>s.probes[0].x=0,s=>s.probes[0].angle=Infinity,s=>s.active=2,s=>s.won=true,
    s=>s.labs.tetra=['AB','AB'],s=>s.labs.tetra=['XX'],s=>s.labs.volume.stage=3,s=>s.labs.volume.units=-1,
    s=>s.labs.ivm=[99],s=>s.labs.ivm=[0,0],s=>s.labs.quadray=[2,0,0,0],s=>s.sync=80]){
    const r=saveRecord(original);mutate(r.state);assert.throws(()=>validateSave(r));
  }
});
test('fixed simulation is repeatable, frame partitions preserve ticks, pause has no catch-up',()=>{
  const a=createGame(),b=createGame();for(let i=0;i<5000;i++){const input={forward:i%7?1:0,turn:i%13?0:1,strafe:i%31?0:1};step(a,input);step(b,input);}assert.deepEqual(a,b);
  for(const fps of [30,60,120,144]){const clock=new FixedClock({step:1/60});let count=0;for(let i=0;i<fps*4;i++)clock.advance(1/fps,()=>count++);assert.equal(count,240);clock.setPaused(true);clock.advance(100,()=>count++);assert.equal(count,240);clock.setPaused(false);clock.advance(1/60,()=>count++);assert.equal(count,241);}
});
