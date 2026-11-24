import test from 'node:test';
import assert from 'node:assert/strict';
import {FULL,PRESETS,vertices,boundary,validateComplex,closure,toggleSimplex,basis,boundaryMatrix,homology,rank,doubleBoundary,classifyChain,mod} from '../js/museum/simplex-model.js';
import {registry,foundingRoute,visitSummary} from '../js/museum/catalogue.js';
import {createSession} from '../js/museum/registry.js';
const ids=Array.from({length:15},(_,i)=>i+1);
const pop=n=>n.toString(2).replaceAll('0','').length;
const has=(m,id)=>Math.floor(m/2**(id-1))%2===1;
const closed=m=>ids.every(i=>!has(m,i)||ids.every(j=>(j&i)!==j||has(m,j)));
const kernelDimension=(rows,width,p)=>{
  let count=0;
  for(let n=0;n<p**width;n++){
    const v=Array.from({length:width},(_,i)=>Math.floor(n/p**i)%p);
    if(rows.every(row=>row.reduce((s,c,i)=>s+c*v[i],0)%p===0))count++;
  }
  let dim=0;while(count>1){assert.equal(count%p,0);count/=p;dim++;}return dim;
};
test('all 32768 masks: closure validation, and both fields for every closed complex',()=>{
  let valid=0;
  for(let m=0;m<=FULL;m++){
    if(!closed(m)){assert.throws(()=>validateComplex(m));continue;}
    valid++;assert.equal(validateComplex(m),m);
    for(const p of [2,3]){
      const h=homology(m,p),b=[0,1,2,3].map(k=>ids.filter(i=>has(m,i)&&pop(i)===k+1));
      // Independent incidence by sorted vertex deletion, not production boundary matrices.
      const matrices=[1,2,3].map(k=>b[k-1].map(row=>b[k].map(col=>{
        const vs=[0,1,2,3].filter(i=>col&(1<<i));
        const j=vs.findIndex(i=>col-2**i===row);return j<0?0:j%2?p-1:1;
      })));
      const counts=b.map(x=>x.length),r=[0,...matrices.map((a,i)=>counts[i+1]-kernelDimension(a,counts[i+1],p)),0];
      assert.deepEqual(h.counts,counts);assert.deepEqual(h.ranks,r);
      assert.deepEqual(h.betti,counts.map((n,k)=>n-r[k]-r[k+1]));
      assert.ok(h.betti.every(n=>n>=0));assert.equal(h.chain,true);
      assert.equal(h.euler,h.betti.reduce((s,n,i)=>s+(i%2?-n:n),0));
      assert.deepEqual(h.matrices.map(x=>x.values),matrices);
    }
  }
  assert.equal(valid,167);
});
test('oriented boundary signs and cancellation in both fields, every simplex',()=>{
  assert.deepEqual(boundary(7),[{id:6,coefficient:1},{id:5,coefficient:-1},{id:3,coefficient:1}]);
  for(const id of ids)for(const sign of [1,-1])for(const p of [2,3]){
    assert.deepEqual(doubleBoundary(id,sign,p),[]);
    assert.deepEqual(boundary(id,sign).map(t=>t.coefficient),boundary(id).map(t=>sign*t.coefficient));
  }
  assert.throws(()=>boundary(0));assert.throws(()=>boundary(3,0));assert.throws(()=>homology(FULL,5));
  assert.equal(rank([[2,1],[1,2]],3),1);assert.equal(rank([[0,1],[1,0]],2),2);
});
test('standard spaces, graph versus complex, cycle witnesses',()=>{
  const expected={empty:[0,0,0,0],points:[4,0,0,0],tree:[1,0,0,0],loop:[1,1,0,0],disk:[1,0,0,0],surface:[1,0,1,0],filled:[1,0,0,0],disjoint:[2,0,0,0],wireframe:[1,3,0,0]};
  for(const p of [2,3]){
    for(const [key,b] of Object.entries(expected))assert.deepEqual(homology(PRESETS[key],p).betti,b);
    for(const [key,k,id,filled] of [['loop',1,7,false],['disk',1,7,true],['surface',2,15,false],['filled',2,15,true]]){
      const mask=PRESETS[key],v=basis(mask,k).map(x=>mod(boundary(id).find(t=>t.id===x)?.coefficient??0,p));
      assert.deepEqual(classifyChain(mask,k,p,v),{cycle:true,boundary:filled,nontrivial:!filled});
    }
    assert.deepEqual(classifyChain(PRESETS.loop,1,p,[1,0,0]),{cycle:false,boundary:false,nontrivial:false});
  }
});
test('closure-safe construction and removal, invalid states rejected atomically',()=>{
  assert.throws(()=>toggleSimplex(0,3));assert.throws(()=>toggleSimplex(PRESETS.filled,1));
  let m=0;for(const id of ids.slice().sort((a,b)=>pop(a)-pop(b)||a-b))m=toggleSimplex(m,id);
  assert.equal(m,FULL);assert.equal(toggleSimplex(m,15),PRESETS.surface);
  for(const v of [-1,FULL+1,1.5,NaN,'3'])assert.throws(()=>validateComplex(v));
  const s=createSession(registry),a=(type,value=null)=>s.dispatch({type,value});
  s.mount('inference.exact-oracle');a('enumerate');const old=s.export();
  s.mount('topology.simplex-builder');assert.equal(a('toggle',3).ok,false);
  for(const id of ids.slice().sort((a,b)=>pop(a)-pop(b)||a-b))assert.equal(a('toggle',id).ok,true);
  assert.equal(s.describe().done,true);assert.equal(a('toggle',1).ok,false);
  const save=s.export();assert.throws(()=>s.restore({...save,state:{mask:4,field:2}}));assert.deepEqual(s.export(),save);
  s.mount('topology.boundary-studio');for(const id of [3,7,15]){a('id',id);a('flip');a('check');}
  assert.equal(s.describe().done,true);const oriented=s.export();assert.throws(()=>s.restore({...oriented,state:{...oriented.state,sign:0}}));assert.deepEqual(s.export(),oriented);
  s.mount('topology.homology-lab');for(const p of ['loop','disk','surface','filled']){a('preset',p);a('check');}
  assert.equal(s.describe().done,true);const h=s.export();assert.throws(()=>s.restore({...h,state:{...h.state,field:4}}));assert.deepEqual(s.export(),h);
  s.reset();s.restore(h);assert.equal(visitSummary(registry,s,foundingRoute.exhibits).complete,4);
  s.mount('inference.exact-oracle');assert.deepEqual(s.export(),old);
});
