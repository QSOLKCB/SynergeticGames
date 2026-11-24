// SPDX-License-Identifier: Apache-2.0
import {ExactRational} from '../../vendor/vanillajs/modules/exact-rational/index.js';
import {compareInference} from './inference-model.js';
export const HISTORY_LIMIT=4;
export const LEVELS=Object.freeze([8,16,32,64,128]);
const num=q=>Number(q.numerator)/Number(q.denominator);
const integer=(v,min,max)=>Number.isSafeInteger(v)&&v>=min&&v<=max;
export const CONFIG=Object.freeze({
  quadrature:Object.freeze({methods:Object.freeze(['midpoint','trapezoid']),parameters:Object.freeze([2,4]),tolerance:1e-4,units:'dimensionless integral on [0,1]'}),
  oscillator:Object.freeze({methods:Object.freeze(['euler','symplectic']),parameters:Object.freeze([1,2]),tolerance:0.01,units:'dimensionless x,v,t; m=k=1'}),
  inference:Object.freeze({methods:Object.freeze(['tree','tetrahedron','contradiction']),parameters:Object.freeze([1,4,8,32]),tolerance:1e-6,units:'absolute marginal probability'})
});
export function settings(kind,input){
  const c=Object.hasOwn(CONFIG,kind)?CONFIG[kind]:null;
  if(!c||!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).length!==2||!Object.hasOwn(input,'method')||!Object.hasOwn(input,'parameter')||!c.methods.includes(input.method)||!c.parameters.includes(input.parameter))throw TypeError('invalid research settings');
  return {method:input.method,parameter:input.parameter};
}
export function quadrature(method,power,n){
  settings('quadrature',{method,parameter:power});if(!LEVELS.includes(n))throw RangeError('unsupported resolution');
  let numerator=0n,denominator;
  if(method==='midpoint'){
    for(let i=0;i<n;i++)numerator+=BigInt(2*i+1)**BigInt(power);
    denominator=BigInt(n)*BigInt(2*n)**BigInt(power);
  }else{
    numerator=BigInt(n)**BigInt(power);
    for(let i=1;i<n;i++)numerator+=2n*BigInt(i)**BigInt(power);
    denominator=2n*BigInt(n)**BigInt(power+1);
  }
  const estimate=new ExactRational(numerator,denominator),reference=new ExactRational(1,power+1),error=estimate.subtract(reference).abs();
  return {n,estimate:estimate.toString(),reference:reference.toString(),exactError:error.toString(),error:num(error),status:error.compare(new ExactRational(1,10000))<=0?'PASS':'FAIL'};
}
// Analytic reference at t=1 or 2; fixed nearest binary64 constants rather than a runtime libm dependency.
const REFERENCE=Object.freeze({1:Object.freeze([0.5403023058681398,-0.8414709848078965]),2:Object.freeze([-0.4161468365471424,-0.9092974268256817])});
export function oscillator(method,time,n){
  settings('oscillator',{method,parameter:time});if(!LEVELS.includes(n))throw RangeError('unsupported resolution');
  let x=1,v=0;const h=time/n;
  for(let i=0;i<n;i++){
    if(method==='euler'){const nx=x+h*v;v-=h*x;x=nx;}
    else{v-=h*x;x+=h*v;}
  }
  const [rx,rv]=REFERENCE[time],error=Math.max(Math.abs(x-rx),Math.abs(v-rv)),energy=(x*x+v*v)/2;
  return {n,x,v,referenceX:rx,referenceV:rv,energy,energyError:Math.abs(energy-.5),error,status:error<=CONFIG.oscillator.tolerance?'PASS':'FAIL'};
}
export function inferenceSweep(kind,rounds){
  settings('inference',{method:kind,parameter:rounds});
  let converged=0,undefinedPosterior=0,undefinedBP=0,accurate=0,convergedWrong=0,maximumError=null,worst=null;
  for(let a=1;a<=3;a++)for(let b=1;b<=3;b++)for(let c=1;c<=3;c++)for(let d=1;d<=3;d++){
    const p=[a,b,c,d],m=compareInference(kind,p,rounds);
    if(m.bp.converged)converged++;
    if(m.exact.marginals===null)undefinedPosterior++;
    if(m.bp.marginals===null)undefinedBP++;
    if(m.error!==null){
      if(m.error<=CONFIG.inference.tolerance)accurate++;
      else if(m.bp.converged)convergedWrong++;
      if(maximumError===null||m.error>maximumError){maximumError=m.error;worst=p;}
    }
  }
  return {rounds,cases:81,converged,notConverged:81-converged,undefinedPosterior,undefinedBP,accurate,convergedWrong,maximumError,worst,
    status:undefinedPosterior===81?'INCONCLUSIVE':accurate===81?'PASS':'FAIL'};
}
export function runExperiment(kind,input){
  const s=settings(kind,input),c=CONFIG[kind];
  const rows=kind==='inference'?[inferenceSweep(s.method,s.parameter)]:LEVELS.map(n=>kind==='quadrature'?quadrature(s.method,s.parameter,n):oscillator(s.method,s.parameter,n));
  // Finest-resolution outcome for refinement experiments; earlier failed rows are retained.
  return {settings:s,units:c.units,tolerance:c.tolerance,rows,status:rows.at(-1).status};
}
export function validateResearchState(kind,s){
  if(!s||typeof s!=='object'||Array.isArray(s)||Object.keys(s).length!==2||!Object.hasOwn(s,'selected')||!Object.hasOwn(s,'history')||!Array.isArray(s.history)||s.history.length>HISTORY_LIMIT)throw TypeError('invalid research state');
  return {selected:settings(kind,s.selected),history:Array.from(s.history,r=>settings(kind,r))};
}
