// SPDX-License-Identifier: Apache-2.0
import {ownData,createRegistry,LIMITS} from './registry.js';
export const PACK_KIND='museum.pack.v1';
// These shipped models are reviewed data-template providers. No executable input.
export const TEMPLATE_IDS=Object.freeze(['measurement.volume-exchange','geometry.quadray-workshop','information.observer-room','inference.exact-oracle','topology.homology-lab']);
const text=(v,n)=>typeof v==='string'&&v.trim().length>0&&v.length<=n;
const keys=(v,k)=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===k.length&&k.every(x=>Object.hasOwn(v,x));
const clone=v=>ownData(v);
export function validatePack(base,input){
  const p=clone(input);
  if(!keys(p,['kind','schema','id','title','gallery','question','author','license','template','templateVersion','initial'])||
    p.kind!==PACK_KIND||p.schema!==1||typeof p.id!=='string'||!/^pack\.[a-z][a-z0-9-]{0,31}$/.test(p.id)||
    !text(p.title,100)||!text(p.gallery,64)||!text(p.question,512)||!text(p.author,100)||
    !['CC0-1.0','CC-BY-4.0','Apache-2.0','MIT'].includes(p.license)||!TEMPLATE_IDS.includes(p.template)||p.templateVersion!==1)throw TypeError('invalid pack fields');
  const model=base.get(p.template);if(model.manifest.version!==p.templateVersion||model.manifest.kind!=='lab')throw TypeError('template version unavailable');
  if(base.list.some(m=>m.id===p.id))throw TypeError('pack conflicts with reviewed exhibit');
  const initial=clone(model.validate(clone(p.initial)));
  return clone({...p,initial});
}
function equal(a,b){
  if(a===b)return true;
  if(!a||!b||typeof a!=='object'||typeof b!=='object'||Array.isArray(a)!==Array.isArray(b))return false;
  const k=Object.keys(a);return k.length===Object.keys(b).length&&k.every(x=>Object.hasOwn(b,x)&&equal(a[x],b[x]));
}
export function packDefinition(base,input){
  const p=validatePack(base,input),model=base.get(p.template);
  // Embedded pack identity prevents a same-ID, different-pack save from being accepted.
  const wrap=state=>({pack:clone(p),modelState:clone(state)});
  const def={manifest:{schema:1,id:p.id,version:1,title:p.title,gallery:p.gallery,kind:'lab',question:p.question,source:model.manifest.source},
    initial:()=>wrap(p.initial),
    validate(s){if(!keys(s,['pack','modelState'])||!equal(validatePack(base,s.pack),p))throw TypeError('save requires the identical installed pack');return wrap(model.validate(clone(s.modelState)));},
    transition(s,a){const r=model.transition(s.modelState,a);return {...r,state:wrap(r.state)};},
    describe(s){const v=model.describe(s.modelState);return {...v,explanation:'Pack author: '+p.author+' · '+p.license+'. Template: '+p.template+' v'+p.templateVersion+'. '+v.explanation};}
  };
  if(model.draw)def.draw=(canvas,s)=>model.draw(canvas,s.modelState);
  return createRegistry([def]).get(p.id);
}
// Local overlay retains the original registry and all mounted session state.
export function createPackCatalogue(base){
  const packs=new Map();
  const registry=Object.freeze({get list(){return Object.freeze([...base.list.filter(m=>m.kind!=='expedition'),...[...packs.values()].map(d=>d.manifest),...base.list.filter(m=>m.kind==='expedition')]);},
    get(id){return packs.has(id)?packs.get(id):base.get(id);}});
  return Object.freeze({registry,install(input){
    const d=packDefinition(base,input),id=d.manifest.id;
    if(packs.has(id))throw TypeError('pack ID already installed; reload to replace');
    if(registry.list.length>=LIMITS.exhibits)throw RangeError('catalogue capacity reached');
    packs.set(id,d);return id;
  }});
}
