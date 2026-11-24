// SPDX-License-Identifier: Apache-2.0
// Binary parity factors; four variables, integer prior weights over 4.
// Exact enumeration and approximate synchronous sum-product are independent paths.
import {ExactRational} from '../../vendor/vanillajs/modules/exact-rational/index.js';
export const MAX_ROUNDS=32, TOLERANCE=1e-9;
export const GRAPH_NAMES=Object.freeze(['tree','tetrahedron','contradiction']);
const bounded=(v,min,max)=>Number.isSafeInteger(v)&&v>=min&&v<=max;
const EDGES=Object.freeze({
  tree:Object.freeze([[0,1],[1,2],[2,3]].map(Object.freeze)),
  tetrahedron:Object.freeze([[0,1],[0,2],[0,3],[1,2],[1,3],[2,3]].map(Object.freeze)),
  contradiction:Object.freeze([[0,1],[1,2],[0,2],[2,3]].map(Object.freeze))
});
export function graph(kind){
  if(!GRAPH_NAMES.includes(kind))throw RangeError('unknown graph');
  return EDGES[kind].map(([a,b],i)=>({a,b,parity:kind==='contradiction'&&i===2?1:0}));
}
export function validatePriors(priors){
  if(!Array.isArray(priors)||priors.length!==4||!Array.from(priors).every(p=>bounded(p,1,3)))throw RangeError('four prior numerators in 1..3 required');
  return [...priors];
}
export const bit=(w,i)=>(w>>i)&1;
export function exactPosterior(kind,priors){
  const p=validatePriors(priors),factors=graph(kind),weights=[],sums=[0,0,0,0],pairs=[];
  let total=0;
  for(let w=0;w<16;w++){
    const allowed=factors.every(f=>(bit(w,f.a)^bit(w,f.b))===f.parity);
    const weight=allowed?p.reduce((v,k,i)=>v*(bit(w,i)?k:4-k),1):0;
    weights.push(weight);total+=weight;
    for(let i=0;i<4;i++)if(bit(w,i))sums[i]+=weight;
  }
  for(const {a,b} of factors)pairs.push(total?new ExactRational(weights.reduce((s,v,w)=>s+v*Number(bit(w,a)===bit(w,b)),0),total):null);
  return {weights,total,evidence:new ExactRational(total,256),marginals:total?sums.map(s=>new ExactRational(s,total)):null,
    pairEqual:total?pairs:null,support:weights.filter(w=>w!==0).length};
}
const norm=v=>{const z=v[0]+v[1];return z>0&&Number.isFinite(z)?v.map(x=>x/z):null;};
const prior=(p,i)=>[(4-p[i])/4,p[i]/4];
const incident=(f,i)=>f.a===i||f.b===i;
const endpoint=(f,i)=>f.a===i?0:1;
const product=(p,i,factors,messages,omit=-1)=>{
  const v=prior(p,i);
  factors.forEach((f,k)=>{if(k!==omit&&incident(f,i)){const m=messages[k][endpoint(f,i)];v[0]*=m[0];v[1]*=m[1];}});
  return norm(v);
};
// One round: all variable->factor messages from the previous factor messages,
// then all factor->variable messages from those variable messages. No damping.
// Pair factors implement XOR by swapping the incoming pair when parity=1.
export function beliefPropagation(kind,priors,rounds){
  const p=validatePriors(priors),factors=graph(kind);
  if(!bounded(rounds,0,MAX_ROUNDS))throw RangeError('invalid round count');
  let messages=factors.map(()=>[[.5,.5],[.5,.5]]),residual=null,iteration=0,localZero=false;
  for(let t=0;t<rounds;t++){
    const incoming=factors.map((f,k)=>[product(p,f.a,factors,messages,k),product(p,f.b,factors,messages,k)]);
    if(incoming.some(m=>m.some(x=>x===null))){localZero=true;break;}
    const next=incoming.map(([a,b],k)=>factors[k].parity?[[b[1],b[0]],[a[1],a[0]]]:[[...b],[...a]]);
    residual=Math.max(...next.flatMap((m,k)=>m.flatMap((v,j)=>v.map((x,b)=>Math.abs(x-messages[k][j][b])))));
    messages=next;iteration++;
  }
  const beliefs=p.map((_,i)=>product(p,i,factors,messages));
  localZero||=beliefs.some(b=>b===null);
  return {rounds:iteration,residual,converged:!localZero&&residual!==null&&residual<=TOLERANCE,
    localZero,marginals:localZero?null:beliefs.map(b=>b[1]),messages};
}
export function compareInference(kind,priors,rounds){
  const exact=exactPosterior(kind,priors),bp=beliefPropagation(kind,priors,rounds);
  const error=exact.marginals&&bp.marginals?Math.max(...exact.marginals.map((q,i)=>Math.abs(Number(q.numerator)/Number(q.denominator)-bp.marginals[i]))):null;
  return {exact,bp,error,status:exact.total===0?'contradiction':bp.localZero?'local zero':bp.converged?'converged':rounds===MAX_ROUNDS?'iteration limit':'not converged'};
}
