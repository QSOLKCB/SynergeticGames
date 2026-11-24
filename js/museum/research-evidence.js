// SPDX-License-Identifier: Apache-2.0
import {ownData} from './registry.js';
import {validateResearchState,runExperiment} from './research-model.js';
export const MODEL_BLOB='0cbdb7253be816775de96cefa72006865ecbccbc';
export const BASELINE='056c7d451017b370f75a9d2e189bc2fa3cd7846d';
export const ALGORITHM='research-001.v1';
const KIND='museum.research.evidence.v1';
export function researchEvidence(kind,state){
  const s=validateResearchState(kind,state);
  if(!s.history.length)throw RangeError('run an experiment before exporting evidence');
  return ownData({kind:KIND,schema:1,experiment:kind,algorithm:ALGORITHM,modelBlob:MODEL_BLOB,baselineCommit:BASELINE,
    precision:'Exact integer/rational quadrature; binary64 oscillator and inference; no random seed',
    limitations:'Bounded numerical teaching experiments; no private research, physical validation or independent certification.',
    runs:s.history.map(input=>runExperiment(kind,input))});
}
// Order-independent comparison of plain data after bounded copying. No tolerance is used
// to accept modified receipts: this is reproducibility verification for this algorithm version.
function same(a,b){
  if(a===b)return true;
  if(a===null||b===null||typeof a!=='object'||typeof b!=='object'||Array.isArray(a)!==Array.isArray(b))return false;
  const ka=Object.keys(a),kb=Object.keys(b);
  return ka.length===kb.length&&ka.every(k=>Object.hasOwn(b,k)&&same(a[k],b[k]));
}
export function verifyResearchEvidence(input){
  const r=ownData(input);
  if(!r||r.kind!==KIND||r.schema!==1||r.algorithm!==ALGORITHM||r.modelBlob!==MODEL_BLOB||r.baselineCommit!==BASELINE||!Array.isArray(r.runs)||r.runs.length<1||r.runs.length>4)throw TypeError('unsupported evidence record');
  const history=r.runs.map(x=>x?.settings);
  const expected=researchEvidence(r.experiment,{selected:history[0],history});
  if(!same(r,expected))throw TypeError('evidence differs from recomputation');
  return {experiment:r.experiment,runs:r.runs.length};
}
