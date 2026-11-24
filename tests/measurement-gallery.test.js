import test from 'node:test';
import assert from 'node:assert/strict';
import {registry,foundingRoute,visitSummary} from '../js/museum/catalogue.js';
import {createSession} from '../js/museum/registry.js';
import {conversion} from '../js/museum/conversion-desk.js';
import {areaModel,similarPolygon} from '../js/museum/pythagoras.js';
import {bookGeometry,bookVolumes,angleDegrees} from '../js/museum/tetrabook.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-10*Math.max(1,Math.abs(b)),a+' != '+b);
const num=q=>Number(q.numerator)/Number(q.denominator);
const sub=(a,b)=>a.map((v,i)=>v-b[i]),dist=(a,b)=>Math.hypot(...sub(a,b));
const determinant=(a,b,c)=>a[0]*(b[1]*c[2]-b[2]*c[1])-a[1]*(b[0]*c[2]-b[2]*c[0])+a[2]*(b[0]*c[1]-b[1]*c[0]);
test('conversion desk: every bounded amount, both directions and exact squared results',()=>{
  for(let n=1;n<=48;n++){
    const f=conversion(n,'xyz-ivm'),b=conversion(n,'ivm-xyz');
    assert.equal(f.ratioSquared.toString(),'9/8');assert.equal(b.ratioSquared.toString(),'8/9');
    near(f.result,(n/4)/(2*Math.SQRT2/3));near(b.result,(n/4)*(2*Math.SQRT2/3));
    near(num(f.resultSquared),f.result**2);near(num(b.resultSquared),b.result**2);
    near(f.result*Math.sqrt(num(b.ratioSquared)),n/4);
  }
  for(const bad of [0,49,1.5,NaN,'4'])assert.throws(()=>conversion(bad,'xyz-ivm'));
  assert.throws(()=>conversion(4,'other'));
});
test('area transfer: all 192 triangles/shape pairs, independent shoelace area and exact sum',()=>{
  const area=p=>Math.abs(p.reduce((sum,v,i)=>{const w=p[(i+1)%p.length];return sum+v[0]*w[1]-v[1]*w[0];},0))/2;
  for(let a=1;a<=8;a++)for(let b=1;b<=8;b++)for(const shape of ['square','triangle','rectangle']){
    const m=areaModel(a,b,shape);
    for(let i=0;i<3;i++)near(num(m.areas[i]),area(similarPolygon(m.sides[i],shape)));
    assert.equal(m.areas[0].add(m.areas[1]).compare(m.areas[2]),0);
    near(m.sides[2],Math.hypot(a,b));
  }
  assert.throws(()=>areaModel(0,4,'square'));assert.throws(()=>areaModel(3,4,'circle'));
});
test('TetraBook: actual hinge coordinates, 181 integer angles and both analytic regular snaps',()=>{
  for(const angle of [...Array.from({length:181},(_,i)=>i),'front-regular','back-regular']){
    const g=bookGeometry(angle),[a,b]=g.hinge;
    near(dist(a,b),2);
    for(const p of [g.front,g.back,g.page]){near(dist(a,p),2);near(dist(b,p),2);}
    for(const cover of [g.front,g.back]){
      const v=Math.abs(determinant(sub(b,a),sub(cover,a),sub(g.page,a)))/6;
      near(v,bookVolumes(angle,'xyz').each);near(v*Math.sqrt(9/8),bookVolumes(angle,'ivm').each);
    }
    near(bookVolumes(angle,'xyz').total,2*bookVolumes(angle,'xyz').each);
    assert.ok(bookVolumes(angle,'ivm').each<=Math.sqrt(9/8)+1e-12);
  }
  assert.equal(bookVolumes(0,'xyz').each,0);assert.equal(bookVolumes(180,'xyz').each,0);
  assert.equal(bookVolumes(90,'xyz').each,1);near(bookVolumes(90,'ivm').each,Math.sqrt(9/8));
  for(const [angle,cover] of [['front-regular','front'],['back-regular','back']]){
    const g=bookGeometry(angle);near(dist(g.page,g[cover]),2);near(bookVolumes(angle,'ivm').each,1);
  }
  near(angleDegrees('front-regular')+angleDegrees('back-regular'),180);
  for(const bad of [-1,181,NaN,90.5,'90','other'])assert.throws(()=>bookGeometry(bad));
});
test('new exhibits register and own state; correct/retry, bounds, reset and import rejection',()=>{
  const s=createSession(registry),a=(type,value=null)=>s.dispatch({type,value});
  s.mount('concentric.tetra');a('edge','AB');const legacy=s.export();
  s.mount('measurement.conversion-desk');a('predict','equal');assert.equal(a('convert').ok,false);a('predict','larger');assert.equal(a('convert').ok,true);
  a('direction','ivm-xyz');assert.equal(s.describe().done,false);a('predict','smaller');assert.equal(a('convert').ok,true);
  const converted=s.export();assert.throws(()=>s.restore({...converted,state:{...converted.state,quarters:49}}));assert.deepEqual(s.export(),converted);
  s.mount('measurement.area-transfer');a('shape','triangle');a('transfer',1);assert.equal(a('transfer',1).ok,false);a('transfer',2);assert.equal(s.describe().done,true);
  a('shape','rectangle');assert.equal(s.describe().done,false);a('transfer',2);a('transfer',1);assert.equal(s.describe().done,true);
  const areas=s.export();assert.throws(()=>s.restore({...areas,state:{...areas.state,transferred:4}}));assert.deepEqual(s.export(),areas);
  s.mount('measurement.tetrabook');a('predict','closed');a('measure');assert.equal(s.describe().done,false);a('predict','middle');a('angle',90);a('measure');assert.equal(s.describe().done,true);
  const book=s.export();a('angle','front-regular');assert.equal(s.describe().done,false);a('unit','xyz');assert.throws(()=>s.restore({...book,state:{...book.state,angle:181}}));
  s.reset();assert.equal(s.snapshot().angle,0);s.restore(book);assert.equal(s.describe().done,true);
  assert.equal(visitSummary(registry,s,foundingRoute.exhibits).complete,3);
  s.mount('concentric.tetra');assert.deepEqual(s.export(),legacy);
});
