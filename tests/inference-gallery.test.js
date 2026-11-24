import test from 'node:test';
import assert from 'node:assert/strict';
import {exactPosterior,beliefPropagation,compareInference,graph,MAX_ROUNDS,TOLERANCE,informationUtility} from '../js/museum/inference-model.js';
import {registry,foundingRoute,visitSummary} from '../js/museum/catalogue.js';
import {createSession} from '../js/museum/registry.js';
const num=q=>Number(q.numerator)/Number(q.denominator);
const close=(a,b,t=1e-10)=>assert.ok(Math.abs(a-b)<=t,a+' != '+b);
const priors=[];for(let a=1;a<=3;a++)for(let b=1;b<=3;b++)for(let c=1;c<=3;c++)for(let d=1;d<=3;d++)priors.push([a,b,c,d]);
test('all 243 exact cases match independent closed-form all-equal/contradictory oracle',()=>{
  for(const p of priors)for(const kind of ['tree','tetrahedron','contradiction']){
    const m=exactPosterior(kind,p),one=p.reduce((a,b)=>a*b,1),zero=p.reduce((a,b)=>a*(4-b),1);
    if(kind==='contradiction'){assert.equal(m.total,0);assert.equal(m.support,0);assert.equal(m.marginals,null);assert.equal(m.evidence.toString(),'0');continue;}
    assert.equal(m.total,one+zero);assert.equal(m.support,2);assert.equal(m.weights[0],zero);assert.equal(m.weights[15],one);
    assert.ok(m.weights.slice(1,15).every(x=>x===0));close(num(m.evidence),(one+zero)/256);
    m.marginals.forEach(q=>{assert.equal(q.numerator*BigInt(one+zero),q.denominator*BigInt(one));});
    assert.ok(m.pairEqual.every(q=>q.toString()==='1'));
  }
  for(const p of [[0,2,2,2],[4,2,2,2],[1,2,3],Array(4)])assert.throws(()=>exactPosterior('tree',p));
  assert.throws(()=>exactPosterior('unknown',[2,2,2,2]));
});
test('tree BP matches exact for all 81 priors after finite propagation; normalized messages at every round',()=>{
  for(const p of priors){
    const exact=exactPosterior('tree',p);
    const m=compareInference('tree',p,4);assert.equal(m.bp.converged,true);assert.ok(m.error<=TOLERANCE);
    m.bp.marginals.forEach((v,i)=>close(v,num(exact.marginals[i])));
    for(let r=0;r<=4;r++){const b=beliefPropagation('tree',p,r);assert.equal(b.rounds,r);for(const f of b.messages)for(const v of f){close(v[0]+v[1],1);assert.ok(v.every(x=>x>=0&&x<=1));}}
  }
});
test('independent cavity-product oracle matches each directed message at each round',()=>{
  for(const kind of ['tree','tetrahedron','contradiction']){
    const p=[3,1,2,3],f=graph(kind);let old=new Map();
    for(let k=0;k<f.length;k++)for(const i of [f[k].a,f[k].b])old.set(k+':'+i,[.5,.5]);
    for(let r=1;r<=8;r++){
      const next=new Map();
      f.forEach(({a,b,parity},k)=>{for(const [src,dst] of [[a,b],[b,a]]){
        const raw=[0,0];for(let y=0;y<2;y++)for(let x=0;x<2;x++)if((x+y)%2===parity){
          let v=x?p[src]/4:1-p[src]/4;
          f.forEach((h,j)=>{if(j!==k&&(h.a===src||h.b===src))v*=old.get(j+':'+src)[x];});raw[y]+=v;
        }const z=raw[0]+raw[1];next.set(k+':'+dst,raw.map(v=>v/z));
      }});
      const b=beliefPropagation(kind,p,r);
      f.forEach(({a,b:dst},k)=>{for(const [j,i] of [a,dst].entries())b.messages[k][j].forEach((v,x)=>close(v,next.get(k+':'+i)[x]));});
      old=next;
    }
  }
});
test('loopy witness: convergence is not accuracy, uniform contradiction is invisible to local residual',()=>{
  const p=[3,2,2,2],m=compareInference('tetrahedron',p,MAX_ROUNDS);
  assert.equal(m.bp.converged,true);assert.ok(m.error>0.24);m.exact.marginals.forEach(q=>assert.equal(q.toString(),'3/4'));
  const u=compareInference('tetrahedron',[2,2,2,2],MAX_ROUNDS);assert.equal(u.error,0);assert.equal(u.exact.pairEqual[0].toString(),'1');
  const c=compareInference('contradiction',[2,2,2,2],MAX_ROUNDS);
  assert.equal(c.status,'contradiction');assert.equal(c.error,null);assert.equal(c.bp.converged,true);assert.deepEqual(c.bp.marginals,[.5,.5,.5,.5]);
  assert.equal(beliefPropagation('tree',p,0).converged,false);assert.throws(()=>beliefPropagation('tree',p,33));
});
test('registered labs preserve state, atomic invalid restores and prior resets',()=>{
  const s=createSession(registry),a=(type,value=null)=>s.dispatch({type,value});
  s.mount('information.observer-room');a('share');const old=s.export();
  s.mount('inference.exact-oracle');a('enumerate');assert.equal(s.describe().done,true);
  const e=s.export();assert.throws(()=>s.restore({...e,state:{priors:[0,2,2,2],evaluated:true}}));assert.deepEqual(s.export(),e);
  s.mount('inference.message-tree');assert.equal(a('compare').ok,false);for(let i=0;i<4;i++)a('step');a('compare');assert.equal(s.describe().done,true);
  const t=s.export();a('preset','mixed');assert.equal(s.snapshot().rounds,0);assert.equal(s.describe().done,false);s.restore(t);
  s.mount('inference.hidden-tetrahedron');a('run');a('compare');assert.equal(s.describe().done,true);
  const l=s.export();assert.throws(()=>s.restore({...l,state:{...l.state,rounds:33}}));assert.deepEqual(s.export(),l);
  assert.throws(()=>s.restore({...l,state:{...l.state,rounds:0}}));assert.deepEqual(s.export(),l);
  s.mount('inference.contradiction-room');a('kind','contradiction');a('check');assert.equal(s.describe().done,true);
  const c=s.export();s.reset();assert.equal(s.describe().done,false);s.restore(c);
  assert.equal(visitSummary(registry,s,foundingRoute.exhibits).complete,4);s.mount('information.observer-room');assert.deepEqual(s.export(),old);
});

test('equal information gain does not imply equal expected decision utility',()=>{
  const m=informationUtility();
  assert.deepEqual(m.map(x=>x.gain.toString()),['1','1']);
  assert.deepEqual(m.map(x=>x.utility.toString()),['3','2']);
});
