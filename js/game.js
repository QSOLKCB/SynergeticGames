// SPDX-License-Identifier: Apache-2.0
import {clamp} from '../vendor/vanillajs/modules/math/index.js';
import {angleDifference,move,canStand,mutualLink,hasLineOfSight} from '../vendor/rayshare/raycast.js';
import {MAP,EXHIBITS,CORE,DIRECTIONS,MESHES,meshVolume,GEO} from './world.js';
export const VERSION=1,TICK_RATE=60,MAX_TICK=2160000;
const EDGES=['AB','AC','AD','BC','BD','CD'];
export {EDGES};
export function createGame(){return {version:VERSION,tick:0,active:0,probes:[
  {x:9.5,y:12,angle:-Math.PI/2},{x:10.7,y:9.5,angle:Math.PI}],
  labs:{tetra:[],volume:{stage:0,units:0},ivm:[],quadray:[5,3,4,3]},sync:0,won:false};}
export function completed(s,id){
  if(id==='tetra')return s.labs.tetra.length===6;
  if(id==='volume')return s.labs.volume.stage===2;
  if(id==='ivm')return s.labs.ivm.length===6;
  if(id==='quadray')return Math.min(...s.labs.quadray)===0;
  return false;
}
export const seals=s=>EXHIBITS.filter(e=>completed(s,e.id)).length;
export function nearestExhibit(s){
  const p=s.probes[s.active];
  return EXHIBITS.find(e=>Math.hypot(e.x-p.x,e.y-p.y)<2&&hasLineOfSight(MAP,p,e))??null;
}
export function linkStatus(s){
  const near=s.probes.every(p=>Math.hypot(p.x-CORE.x,p.y-CORE.y)<3);
  return {near,linked:mutualLink(MAP,...s.probes),ready:seals(s)===4};
}
export function step(s,input={}){
  if(s.tick>=MAX_TICK)return;
  const p=s.probes[s.active];
  const forward=clamp(Number(input.forward)||0,-1,1),strafe=clamp(Number(input.strafe)||0,-1,1),turn=clamp(Number(input.turn)||0,-1,1);
  p.angle=angleDifference(p.angle+turn*.038,0);
  const n=Math.max(1,Math.hypot(forward,strafe)),speed=.052;
  move(MAP,p,(Math.cos(p.angle)*forward-Math.sin(p.angle)*strafe)*speed/n,
    (Math.sin(p.angle)*forward+Math.cos(p.angle)*strafe)*speed/n);
  const link=linkStatus(s);
  if(!s.won){
    if(input.sync===true&&link.ready&&link.near&&link.linked)s.sync=Math.min(120,s.sync+1);
    else s.sync=0;
  }
  s.tick++;
  if(s.sync===120)s.won=true;
}
export function switchProbe(s){s.active=1-s.active;if(!s.won)s.sync=0;}
export function facePartner(s){const p=s.probes[s.active],b=s.probes[1-s.active];p.angle=Math.atan2(b.y-p.y,b.x-p.x);}
export function labAction(s,id,action,value){
  if(s.won||nearestExhibit(s)?.id!==id)return {ok:false,message:'Walk closer to the exhibit first.'};
  return applyLabAction(s,id,action,value);
}
// Shared puzzle transitions; callers own access policy and isolated state.
export function applyLabAction(s,id,action,value){
  if(completed(s,id))return {ok:false,message:'Exhibit restored. The paperwork is finally finished.'};
  if(id==='tetra'&&action==='edge'&&EDGES.includes(value)){
    if(s.labs.tetra.includes(value))return {ok:false,message:'That strut is already installed.'};
    s.labs.tetra.push(value);s.labs.tetra.sort();
  }else if(id==='volume'&&action==='add'&&[1,4,-1,-4].includes(value)){
    s.labs.volume.units=clamp(s.labs.volume.units+value,0,40);
  }else if(id==='volume'&&action==='check'){
    const lab=s.labs.volume,target=Math.round(meshVolume(lab.stage===0?MESHES.octa:MESHES.ve));
    if(lab.units!==target)return {ok:false,message:`You have ${lab.units} units. Compare the target with the reference tetrahedron; adjust and try again.`};
    lab.stage++;lab.units=0;
  }else if(id==='ivm'&&action==='pair'&&Array.isArray(value)&&value.length===2&&value.every(n=>Number.isInteger(n)&&n>=0&&n<12)){
    const [a,b]=value,canonical=Math.min(a,b);
    if(DIRECTIONS[a].opposite!==b)return {ok:false,message:'Those directions do not cancel. Find the point across the centre.'};
    if(s.labs.ivm.includes(canonical))return {ok:false,message:'That pair is already connected.'};
    s.labs.ivm.push(canonical);s.labs.ivm.sort((a,b)=>a-b);
  }else if(id==='quadray'&&action==='subtract'){
    s.labs.quadray=s.labs.quadray.map(n=>n-1);
  }else return {ok:false,message:'Unsupported lab action.'};
  return {ok:true,message:completed(s,id)?EXHIBITS.find(e=>e.id===id).fact:'A little less paperwork. A little more geometry.'};
}
function integer(n,min,max){return Number.isSafeInteger(n)&&n>=min&&n<=max;}
export function validateSave(record){
  if(!record||record.kind!=='concentric.save.v1'||!record.state||record.state.version!==VERSION)throw new TypeError('Unsupported expedition file');
  const s=record.state, labs=s.labs;
  if(!integer(s.tick,0,MAX_TICK)||!integer(s.active,0,1)||!integer(s.sync,0,120)||typeof s.won!=='boolean')throw new TypeError('Invalid expedition state');
  if(!Array.isArray(s.probes)||s.probes.length!==2||s.probes.some(p=>!p||!Number.isFinite(p.angle)||Math.abs(p.angle)>Math.PI+1e-8||!canStand(MAP,p.x,p.y)))throw new TypeError('Invalid probe position');
  if(!labs||!Array.isArray(labs.tetra)||labs.tetra.length>6||new Set(labs.tetra).size!==labs.tetra.length||labs.tetra.some(e=>!EDGES.includes(e)))throw new TypeError('Invalid struts');
  if(!labs.volume||!integer(labs.volume.stage,0,2)||!integer(labs.volume.units,0,40)||(labs.volume.stage===2&&labs.volume.units!==0))throw new TypeError('Invalid volume');
  if(!Array.isArray(labs.ivm)||labs.ivm.length>6||new Set(labs.ivm).size!==labs.ivm.length||labs.ivm.some(n=>!integer(n,0,11)||n>DIRECTIONS[n].opposite))throw new TypeError('Invalid neighbour pairs');
  if(!Array.isArray(labs.quadray)||labs.quadray.length!==4||labs.quadray.some(n=>!integer(n,0,5)))throw new TypeError('Invalid Quadray');
  if(JSON.stringify(GEO.canonicalQuadray(labs.quadray))!=='[2,0,1,0]'||Math.min(...labs.quadray)>3)throw new TypeError('Changed Quadray point');
  const link=linkStatus(s);
  if(s.won!==(s.sync===120)||(s.sync>0&&!link.ready)||(!s.won&&s.sync>0&&(!link.near||!link.linked)))throw new TypeError('Invalid relay state');
  // Copy only known fields. No imported prototypes, UI flags or arbitrary properties.
  return {version:VERSION,tick:s.tick,active:s.active,probes:s.probes.map(p=>({x:p.x,y:p.y,angle:p.angle})),
    labs:{tetra:[...labs.tetra],volume:{stage:labs.volume.stage,units:labs.volume.units},ivm:[...labs.ivm],quadray:[...labs.quadray]},sync:s.sync,won:s.won};
}
export const saveRecord=s=>({kind:'concentric.save.v1',state:validateSave({kind:'concentric.save.v1',state:s})});
