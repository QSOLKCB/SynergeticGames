import test from 'node:test';
import assert from 'node:assert/strict';
import {canonical,numerator,fromNumerator,xyz,Q_STEPS,FCC_STEPS,lattice,cell,fccQuadray} from '../js/museum/quadray-model.js';
import {registry,foundingRoute,visitSummary} from '../js/museum/catalogue.js';
import {createSession} from '../js/museum/registry.js';
import {GEO} from '../js/world.js';
const key=p=>p.join(','),near=(a,b)=>assert.ok(Math.abs(a-b)<1e-10,a+' != '+b);
const d2=(a,b)=>a.reduce((s,v,i)=>s+(v-b[i])**2,0);
test('integer Quadray quotient, inverse and existing basis agree on 625 tuples and offsets',()=>{
  for(let a=-2;a<=2;a++)for(let b=-2;b<=2;b++)for(let c=-2;c<=2;c++)for(let d=-2;d<=2;d++){
    const q=[a,b,c,d],n=numerator(q);
    assert.deepEqual(fromNumerator(n),canonical(q));
    for(const shift of [-16,-1,0,1,16])assert.deepEqual(numerator(q.map(v=>v+shift)),n);
    xyz(q).forEach((v,i)=>near(v,GEO.quadrayToXYZ(q)[i]));
  }
  assert.deepEqual(fromNumerator([256,0,0]),[128,128,0,0]);
  assert.throws(()=>canonical([-128,128,0,0]));assert.throws(()=>canonical([129,0,0,0]));
  assert.throws(()=>canonical(Array(4)));assert.throws(()=>canonical([1.5,0,0,0]));assert.throws(()=>fromNumerator([1,0,0]));
  assert.throws(()=>fromNumerator([256,256,256]));
});
test('FCC nearest moves and every shell through radius 3 match independent parity enumeration',()=>{
  assert.equal(Q_STEPS.length,12);assert.equal(new Set(Q_STEPS.map(key)).size,12);
  assert.equal(new Set(FCC_STEPS.map(key)).size,12);
  for(const q of Q_STEPS)near(Math.hypot(...xyz(q)),1);
  for(let r=0;r<=3;r++){
    const m=lattice(r),oracle=[];
    for(let x=-r;x<=r;x++)for(let y=-r;y<=r;y++)for(let z=-r;z<=r;z++)if((x+y+z)%2===0&&Math.abs(x)+Math.abs(y)+Math.abs(z)<=2*r)oracle.push([x,y,z]);
    assert.deepEqual(m.points.map(key).sort(),oracle.map(key).sort());
    assert.equal(m.points.length,[1,13,55,147][r]);
    const edges=[];for(let i=0;i<m.points.length;i++)for(let j=i+1;j<m.points.length;j++)if(d2(m.points[i],m.points[j])===2)edges.push(i+','+j);
    assert.deepEqual(m.edges.map(key).sort(),edges.sort());
    m.points.forEach((p,i)=>{assert.equal(m.shells[i],Math.max(...p.map(Math.abs),p.reduce((a,v)=>a+Math.abs(v),0)/2));assert.deepEqual(numerator(fccQuadray(p)),p.map(v=>2*v));});
  }
  assert.throws(()=>lattice(4));
});
test('cells: edge scale, distinct vertices, closed face incidence and independent volume',()=>{
  for(const [name,V,E,F,volume] of [['tetrahedron',4,6,4,1],['octahedron',6,12,8,4],['cuboctahedron',12,24,14,20]]){
    const m=cell(name);assert.equal(new Set(m.vertices.map(key)).size,V);assert.equal(m.edges.length,E);assert.equal(m.faces.length,F);assert.equal(V-E+F,2);
    const incidence=new Map(m.edges.map(e=>[key(e),0]));
    for(const f of m.faces){assert.equal(new Set(f).size,f.length);for(let i=0;i<f.length;i++){const k=key([f[i],f[(i+1)%f.length]].sort((a,b)=>a-b));assert.ok(incidence.has(k));incidence.set(k,incidence.get(k)+1);}}
    assert.ok([...incidence.values()].every(v=>v===2));
    for(const [a,b] of m.edges)near(Math.sqrt(d2(m.vertices[a],m.vertices[b])/2),1);
    const center=[0,1,2].map(i=>m.vertices.reduce((s,p)=>s+p[i],0)/V);
    let sum=0;for(const f of m.faces)for(let i=1;i<f.length-1;i++){
      const points=[center,...[f[0],f[i],f[i+1]].map(j=>m.vertices[j])].map(p=>p.map(x=>x/Math.SQRT2));
      sum+=GEO.euclideanTetraVolume(points);
    }
    near(sum*6*Math.SQRT2,volume);assert.equal(m.tetravolumes,volume);
  }
});
test('workshop state and save isolation, construction, rejected records',()=>{
  const s=createSession(registry),a=(type,value=null)=>s.dispatch({type,value});
  s.mount('concentric.tetra');a('edge','AB');const old=s.export();
  s.mount('geometry.quadray-workshop');const n=numerator(s.snapshot().q);a('offset',1);assert.deepEqual(numerator(s.snapshot().q),n);a('canonical');assert.equal(s.describe().done,true);
  const q=s.export();assert.throws(()=>s.restore({...q,state:{q:[33,0,0,0],view:0}}));assert.deepEqual(s.export(),q);
  s.mount('geometry.ivm-builder');for(let r=1;r<=3;r++)a('radius',r);assert.equal(s.describe().done,true);a('select',146);assert.equal(a('select',147).ok,false);
  const l=s.export();assert.throws(()=>s.restore({...l,state:{...l.state,radius:1}}));assert.deepEqual(s.export(),l);
  s.mount('geometry.cell-foundry');for(const [kind,n] of [['tetrahedron',4],['octahedron',6],['cuboctahedron',12]]){a('kind',kind);for(let i=0;i<n;i++)assert.equal(a('vertex').ok,true);assert.equal(a('vertex').ok,false);}
  assert.equal(s.describe().done,true);a('overlay',true);const saved=s.export();assert.equal(a('vertex').ok,false);s.reset();assert.equal(s.describe().done,false);s.restore(saved);assert.equal(s.describe().done,true);
  assert.throws(()=>s.restore({...saved,state:{...saved.state,counts:[4,6,13]}}));assert.deepEqual(s.export(),saved);
  assert.equal(visitSummary(registry,s,foundingRoute.exhibits).complete,3);s.mount('concentric.tetra');assert.deepEqual(s.export(),old);
});
