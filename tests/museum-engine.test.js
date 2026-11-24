import test from 'node:test';
import assert from 'node:assert/strict';
import {volumeExchange} from '../js/museum/measurement.js';
import {tetrahedralGraph} from '../js/museum/topology.js';
import {MESHES,GEO} from '../js/world.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<=1e-10*Math.max(1,Math.abs(b)),`${a} != ${b}`);
const numeric=q=>Number(q.numerator)/Number(q.denominator);
test('exact S3 ratio and independent determinant/mesh volumes for every supported radius',()=>{
  for(let n=1;n<=200;n++){
    const r=n/100,model=volumeExchange(n);
    assert.equal(model.squaredRatio.toString(),'9/8');
    near(numeric(model.cube),r**3);
    const scaled=MESHES.tetra.vertices.map(v=>v.map(x=>x*2*r));
    near(numeric(model.tetCoefficient)*Math.sqrt(2),GEO.euclideanTetraVolume(scaled));
    near(numeric(model.cube)/(numeric(model.tetCoefficient)*Math.sqrt(2)),Math.sqrt(9/8));
  }
  assert.equal(volumeExchange(100).cube.toString(),'1');
  assert.equal(volumeExchange(50).tetCoefficient.toString(),'1/12');
  for(const n of [0,201,1.5,NaN,Infinity,'100',null])assert.throws(()=>volumeExchange(n));
});
test('all tetrahedral strut subsets agree with independent enumeration',()=>{
  const edges=['AB','AC','AD','BC','BD','CD'],triangles=['ABC','ABD','ACD','BCD'];
  for(let mask=0;mask<64;mask++){
    const chosen=edges.filter((_,i)=>mask&(1<<i)),g=tetrahedralGraph(chosen);
    assert.equal(g.vertices,4);assert.equal(g.edges,chosen.length);
    assert.equal(g.triangles,BigInt(triangles.filter(t=>[t[0]+t[1],t[0]+t[2],t[1]+t[2]].every(e=>chosen.includes(e))).length));
    assert.deepEqual(g.degreeSequence,[...'ABCD'].map(v=>chosen.filter(e=>e.includes(v)).length).sort((a,b)=>a-b));
  }
  assert.equal(tetrahedralGraph(edges).components,1);
  assert.equal(tetrahedralGraph([]).components,4);
  for(const invalid of [['AB','AB'],['BA'],['AA'],['XX'],Array(1),null])assert.throws(()=>tetrahedralGraph(invalid));
});
