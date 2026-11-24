import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {quadrature,oscillator,inferenceSweep,LEVELS,runExperiment} from '../js/museum/research-model.js';
import {researchEvidence,verifyResearchEvidence,MODEL_BLOB} from '../js/museum/research-evidence.js';
import {registry,foundingRoute,visitSummary} from '../js/museum/catalogue.js';
import {createSession} from '../js/museum/registry.js';
const near=(a,b,t=1e-12)=>assert.ok(Math.abs(a-b)<=t,a+' != '+b);
test('model identity binds evidence to actual source bytes',()=>{
  const bytes=readFileSync(new URL('../js/museum/research-model.js',import.meta.url));
  assert.equal(createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex'),MODEL_BLOB);
});
test('quadrature: all 20 cases agree with independent polynomial closed forms',()=>{
  for(const n of LEVELS)for(const p of [2,4])for(const method of ['midpoint','trapezoid']){
    const r=quadrature(method,p,n);
    // Exact errors from polynomial power sums.
    const h=1/n,err=p===2?(method==='midpoint'?h*h/12:h*h/6):
      method==='midpoint'?h*h/6-7*h**4/240:h*h/3-h**4/30;
    near(r.error,err);assert.equal(r.status,err<=1e-4?'PASS':'FAIL');
  }
  assert.throws(()=>quadrature('midpoint',2,0));assert.throws(()=>quadrature('midpoint',3,8));
});
test('oscillator: independent analytic Euler solution and matrix-power symplectic oracle',()=>{
  for(const n of LEVELS)for(const time of [1,2])for(const method of ['euler','symplectic']){
    const r=oscillator(method,time,n),h=time/n;
    if(method==='euler'){const amp=(1+h*h)**(n/2),theta=n*Math.atan(h);near(r.x,amp*Math.cos(theta));near(r.v,-amp*Math.sin(theta));}
    else{
      const m=[[1-h*h,h],[-h,1]],mul=(a,b)=>a.map(row=>[0,1].map(j=>row[0]*b[0][j]+row[1]*b[1][j]));
      let a=[[1,0],[0,1]],b=m,k=n;while(k){if(k%2)a=mul(a,b);b=mul(b,b);k=Math.floor(k/2);}
      near(r.x,a[0][0]);near(r.v,a[1][0]);
    }
    near(r.referenceX,Math.cos(time));near(r.referenceV,-Math.sin(time));
    near(r.error,Math.max(Math.abs(r.x-Math.cos(time)),Math.abs(r.v+Math.sin(time))));
    near(r.energyError,Math.abs((r.x*r.x+r.v*r.v)/2-.5));
  }
  assert.ok(oscillator('euler',1,128).error<oscillator('euler',1,8).error);
  assert.throws(()=>oscillator('euler',3,8));
});
test('sweep: exact tree, loopy witness, and global inconsistency retained',()=>{
  const t=inferenceSweep('tree',4);assert.equal(t.cases,81);assert.equal(t.accurate,81);assert.equal(t.converged,81);assert.equal(t.status,'PASS');
  const l=inferenceSweep('tetrahedron',32);assert.ok(l.convergedWrong>0);assert.ok(l.maximumError>.24);assert.equal(l.status,'FAIL');
  for(const rounds of [1,4,8,32]){const c=inferenceSweep('contradiction',rounds);assert.equal(c.undefinedPosterior,81);assert.equal(c.maximumError,null);assert.equal(c.status,'INCONCLUSIVE');}
  assert.throws(()=>inferenceSweep('tree',33));
});
test('evidence recomputes every run, rejects tampering, permits key order changes',()=>{
  const state={selected:{method:'midpoint',parameter:2},history:[{method:'midpoint',parameter:2},{method:'trapezoid',parameter:4}]};
  const e=researchEvidence('quadrature',state);assert.equal(e.runs[0].rows[0].status,'FAIL');assert.equal(e.runs[0].rows.at(-1).status,'PASS');
  assert.deepEqual(verifyResearchEvidence(JSON.parse(JSON.stringify(e))),{experiment:'quadrature',runs:2});
  assert.deepEqual(verifyResearchEvidence(Object.fromEntries(Object.entries(e).reverse())),{experiment:'quadrature',runs:2});
  for(const mutate of [r=>r.runs[0].rows[0].error=0,r=>r.runs[0].rows.pop(),r=>r.modelBlob='0'.repeat(40),r=>r.runs[0].status='FAIL',r=>r.extra=true]){
    const bad=structuredClone(e);mutate(bad);assert.throws(()=>verifyResearchEvidence(bad));
  }
  for(const [kind,method,parameter] of [['oscillator','euler',1],['inference','contradiction',4]]){
    const input={method,parameter};const r=researchEvidence(kind,{selected:input,history:[input]});assert.equal(verifyResearchEvidence(r).runs,1);
  }
});
test('registered labs retain failed rows, cap history, isolate state and restore atomically',()=>{
  const s=createSession(registry),a=(type,value=null)=>s.dispatch({type,value});
  s.mount('topology.homology-lab');const old=s.export();
  s.mount('research.quadrature-bench');for(let i=0;i<4;i++)assert.equal(a('run').ok,true);
  const q=s.export();assert.equal(a('run').ok,false);assert.deepEqual(s.export(),q);
  assert.throws(()=>s.restore({...q,state:{...q.state,history:Array(5).fill(q.state.selected)}}));assert.deepEqual(s.export(),q);
  s.mount('research.oscillator-lab');a('run');assert.equal(s.describe().done,true);
  s.mount('research.inference-sweep');a('method','contradiction');a('run');assert.equal(s.describe().done,true);
  assert.match(s.describe().readout,/INCONCLUSIVE/);const saved=s.export();
  const receipt=registry.get(s.active).evidence(s.snapshot());verifyResearchEvidence(receipt);assert.deepEqual(s.export(),saved);
  s.reset();assert.equal(s.describe().done,false);s.restore(saved);
  assert.equal(visitSummary(registry,s,foundingRoute.exhibits).complete,3);
  s.mount('topology.homology-lab');assert.deepEqual(s.export(),old);
});
