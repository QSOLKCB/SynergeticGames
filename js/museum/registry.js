// SPDX-License-Identifier: Apache-2.0
// Registry is reviewed source. Imported records are bounded data, never code.
export const LIMITS=Object.freeze({exhibits:32,bytes:65536,depth:8,nodes:1024,array:64,string:512});
const ID=/^[a-z][a-z0-9-]{0,31}\.[a-z][a-z0-9-]{0,31}$/;
const forbidden=new Set(['__proto__','constructor','prototype']);
export function ownData(value){
  let nodes=0;
  function copy(v,depth){
    if(++nodes>LIMITS.nodes||depth>LIMITS.depth)throw new RangeError('record too complex');
    if(v===null||typeof v==='boolean')return v;
    if(typeof v==='number'&&Number.isFinite(v))return v;
    if(typeof v==='string'&&v.length<=LIMITS.string)return v;
    if(!v||typeof v!=='object')throw new TypeError('plain JSON data required');
    const desc=Object.getOwnPropertyDescriptors(v);
    if(Array.isArray(v)){
      if(Object.getPrototypeOf(v)!==Array.prototype||v.length>LIMITS.array||Reflect.ownKeys(desc).length!==v.length+1)throw new TypeError('bounded dense array required');
      return Array.from({length:v.length},(_,i)=>{const d=desc[i];if(!d||!Object.hasOwn(d,'value'))throw new TypeError('array data required');return copy(d.value,depth+1);});
    }
    if(![Object.prototype,null].includes(Object.getPrototypeOf(v)))throw new TypeError('plain record required');
    const out={};
    for(const k of Reflect.ownKeys(desc)){
      const d=desc[k];if(typeof k!=='string'||k.length>64||forbidden.has(k)||!Object.hasOwn(d,'value')||!d.enumerable)throw new TypeError('invalid data field');
      out[k]=copy(d.value,depth+1);
    }
    return out;
  }
  return copy(value,0);
}
function fields(v,keys){
  if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).length!==keys.length||keys.some(k=>!Object.hasOwn(v,k)))throw new TypeError('unexpected record fields');
}
const text=(v,max)=>typeof v==='string'&&v.length>0&&v.length<=max;
const validId=v=>typeof v==='string'&&ID.test(v);
const freezeData=v=>{if(v&&typeof v==='object'){for(const x of Object.values(v))freezeData(x);Object.freeze(v);}return v;};
export function parseData(raw){
  if(typeof raw!=='string'||raw.length>LIMITS.bytes||new TextEncoder().encode(raw).length>LIMITS.bytes)throw new RangeError('64 KiB maximum');
  return ownData(JSON.parse(raw));
}
export function createRegistry(definitions){
  if(!Array.isArray(definitions)||definitions.length<1||definitions.length>LIMITS.exhibits)throw new RangeError('registry size');
  const entries=new Map();
  for(const definition of definitions){
    const m=ownData(definition.manifest);
    fields(m,['schema','id','version','title','gallery','kind','question','source']);
    if(m.schema!==1||m.version!==1||!validId(m.id)||!text(m.title,100)||!text(m.gallery,64)||!text(m.question,512)||!text(m.source,512)||!['lab','expedition'].includes(m.kind)||entries.has(m.id))throw new TypeError('invalid or duplicate exhibit');
    if(m.kind==='lab'&&['initial','validate','transition','describe'].some(k=>typeof definition[k]!=='function'))throw new TypeError('missing reviewed model');
    entries.set(m.id,Object.freeze({...definition,manifest:freezeData(m)}));
  }
  return Object.freeze({list:Object.freeze([...entries.values()].map(d=>d.manifest)),get(id){if(!entries.has(id))throw new RangeError('unknown exhibit');return entries.get(id);}});
}
export function validateRoute(registry,input){
  const r=ownData(input);fields(r,['kind','schema','id','title','exhibits']);
  if(r.kind!=='museum.route.v1'||r.schema!==1||!validId(r.id)||!text(r.title,100)||!Array.isArray(r.exhibits)||!r.exhibits.length||r.exhibits.length>LIMITS.exhibits||new Set(r.exhibits).size!==r.exhibits.length)throw new TypeError('invalid route');
  for(const id of r.exhibits){if(!validId(id))throw new TypeError('invalid exhibit reference');registry.get(id);}
  return freezeData(r);
}
export function createSession(registry){
  const states=new Map(),statuses=new Map();let active=null;
  // Cache only the completion bit for immutable state, not mutable readouts/actions.
  const described=(id,d)=>{const state=states.get(id),view=d.describe(state);statuses.set(id,{state,done:view.done===true});return view;};
  const model=id=>{const d=registry.get(id);if(d.manifest.kind!=='lab')throw new TypeError('expedition is not a standalone lab');return d;};
  const checked=(d,s)=>freezeData(ownData(d.validate(ownData(s))));
  const current=()=>{if(active===null)throw new Error('no mounted exhibit');return model(active);};
  return Object.freeze({
    get active(){return active;},
    status(id){const d=registry.get(id);if(d.manifest.kind==='expedition')return 'expedition';
      if(!states.has(id))return 'unvisited';const cached=statuses.get(id),state=states.get(id);const done=cached&&cached.state===state?cached.done:described(id,d).done===true;return done?'complete':'visited';},
    mount(id){const d=model(id);if(!states.has(id))states.set(id,checked(d,d.initial()));active=id;return states.get(id);},
    unmount(){active=null;},
    snapshot(){current();return states.get(active);},
    describe(){return described(active,current());},
    reset(){const d=current(),next=checked(d,d.initial());states.set(active,next);statuses.delete(active);return next;},
    dispatch(action){const d=current(),result=d.transition(states.get(active),ownData(action));
      const next=checked(d,result.state);states.set(active,next);statuses.delete(active);return {ok:result.ok,message:result.message};},
    export(){const d=current();return ownData({kind:'museum.exhibit.v1',schema:1,id:active,version:d.manifest.version,state:states.get(active)});},
    restore(input){
      const r=ownData(input);fields(r,['kind','schema','id','version','state']);
      if(r.kind!=='museum.exhibit.v1'||r.schema!==1||!validId(r.id))throw new TypeError('unsupported exhibit record');
      const d=model(r.id);if(r.version!==d.manifest.version)throw new TypeError('unsupported exhibit version');
      const next=checked(d,r.state); // No mutation before validation completes.
      states.set(r.id,next);statuses.delete(r.id);active=r.id;return next;
    }
  });
}
