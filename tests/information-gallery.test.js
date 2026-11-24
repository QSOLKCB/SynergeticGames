import test from 'node:test';
import assert from 'node:assert/strict';
import {observerView,evidenceView,gameTrace,compareSchedules,decision} from '../js/museum/epistemic-model.js';
import {registry,foundingRoute,visitSummary} from '../js/museum/catalogue.js';
import {createSession} from '../js/museum/registry.js';
const bits=w=>[w%2,Math.floor(w/2)%2,Math.floor(w/4)%2];
const permutations=(items)=>items.length===0?[[]]:items.flatMap((x,i)=>permutations(items.filter((_,j)=>j!==i)).map(t=>[x,...t]));
test('all 32 observer states match independent explicit observation tables',()=>{
  for(let truth=0;truth<4;truth++)for(let shared=0;shared<4;shared++)for(let observer=0;observer<2;observer++){
    const observed=[observer,...(shared%2?[0]:[]),...(shared>=2?[1]:[])];
    const expected=[0,1,2,3].filter(w=>observed.every(i=>bits(w)[i]===bits(truth)[i]));
    const v=observerView(truth,shared,observer);assert.deepEqual(v.possible,expected);assert.ok(v.possible.includes(truth));
    assert.deepEqual(v.known,[0,1].map(i=>observed.includes(i)?bits(truth)[i]:null));
  }
  // No access to the other bit before disclosure.
  assert.deepEqual(observerView(0,0,0),observerView(2,0,0));
  assert.deepEqual(observerView(0,0,1),observerView(1,0,1));
  assert.throws(()=>observerView(4,0,0));assert.throws(()=>observerView(0,4,0));
});
test('all 326 distinct clue prefixes per world agree with independent truth-table oracle',()=>{
  const value=(w,i)=>{const [a,b,c]=bits(w);return [a,b,(a+b)%2,a,c][i];};
  for(let truth=0;truth<8;truth++){
    for(let mask=0;mask<32;mask++)for(const order of permutations([0,1,2,3,4].filter(i=>mask&(1<<i)))){
      const v=evidenceView(truth,order),expected=Array.from({length:8},(_,i)=>i).filter(w=>order.every(i=>value(w,i)===value(truth,i)));
      assert.deepEqual(v.possible,expected);assert.ok(v.possible.includes(truth));
      let prev=8;for(const [i,t] of v.trace.entries()){
        assert.equal(t.before,prev);assert.equal(t.value,value(truth,t.id));assert.equal(t.after,Array.from({length:8},(_,j)=>j).filter(w=>order.slice(0,i+1).every(k=>value(w,k)===value(truth,k))).length);prev=t.after;
      }
    }
    const redundant=evidenceView(truth,[0,3]);assert.equal(redundant.trace[1].before,redundant.trace[1].after);
    assert.equal(evidenceView(truth,[0,1,4]).possible.length,1);
  }
  assert.throws(()=>evidenceView(0,[0,0]));assert.throws(()=>evidenceView(0,[5]));assert.throws(()=>evidenceView(0,Array(1)));
});
test('all 15 nonempty plan sets and both decisions match brute force maximin',()=>{
  for(let mask=1;mask<16;mask++)for(let stage=0;stage<2;stage++){
    const p=[0,1,2,3].filter(i=>mask&(1<<i)),payoffs=[p.map(()=>2),p.map(w=>bits(w)[stage]*4)];
    const minima=payoffs.map(a=>a.reduce((x,y)=>Math.min(x,y),Infinity));
    assert.deepEqual(decision(p,stage),{safe:minima[0],risky:minima[1],action:minima[1]>minima[0]?'risky':'safe'});
  }
  assert.throws(()=>decision([],0));
});
test('all four fixed plans and both full schedules match independent stage oracle; order witness',()=>{
  for(let plan=0;plan<4;plan++){
    const cmp=compareSchedules(plan),scores=[];
    for(const order of [[0,1],[1,0]]){
      const m=gameTrace(plan,order),observed=new Set();let a=0,b=0;
      order.forEach((id,stage)=>{observed.add(id);const risky=observed.has(stage)&&bits(plan)[stage]===1;a+=risky?4:2;b+=Number(risky);
        assert.equal(m.trace[stage].action,risky?'risky':'safe');assert.deepEqual(m.trace[stage].possible,[0,1,2,3].filter(w=>[...observed].every(i=>bits(w)[i]===bits(plan)[i])));});
      assert.equal(m.aTotal,a);assert.equal(m.bTotal,b);scores.push(b);
    }
    assert.equal(cmp.best,Math.max(...scores));assert.equal(cmp.randomNumerator,scores[0]+scores[1]);assert.equal(cmp.randomDenominator,2);
  }
  assert.equal(gameTrace(3,[0,1]).bTotal,2);assert.equal(gameTrace(3,[1,0]).bTotal,1);
  assert.deepEqual(gameTrace(3,[0,1]).possible,gameTrace(3,[1,0]).possible);
  assert.throws(()=>gameTrace(3,[0,0]));
});
test('registered labs, reversible observations, model-derived completion and atomic saves',()=>{
  const s=createSession(registry),a=(type,value=null)=>s.dispatch({type,value});
  s.mount('concentric.tetra');a('edge','AB');const old=s.export();
  s.mount('information.observer-room');a('share');assert.equal(a('share').ok,false);a('observer',1);a('share');assert.equal(s.describe().done,true);
  const o=s.export();assert.throws(()=>s.restore({...o,state:{...o.state,shared:4}}));assert.deepEqual(s.export(),o);a('rewind');assert.equal(s.describe().done,false);s.restore(o);
  s.mount('information.evidence-ledger');for(const id of [0,3,1,4])a('reveal',id);assert.equal(s.describe().done,true);
  const e=s.export();assert.throws(()=>s.restore({...e,state:{truth:5,sequence:[0,0]}}));assert.deepEqual(s.export(),e);a('undo');assert.equal(s.describe().done,false);s.restore(e);
  s.mount('information.disclosure-theatre');assert.equal(a('compare').ok,false);a('reveal',1);a('reveal',0);a('compare');assert.equal(s.describe().done,true);
  const g=s.export();assert.throws(()=>s.restore({...g,state:{plan:3,order:[0],compared:true}}));assert.deepEqual(s.export(),g);
  s.reset();s.restore(g);assert.equal(visitSummary(registry,s,foundingRoute.exhibits).complete,3);
  s.mount('concentric.tetra');assert.deepEqual(s.export(),old);
});
