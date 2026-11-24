// SPDX-License-Identifier: Apache-2.0
import {volumeExchange} from './measurement.js';

const SOURCE='https://github.com/4dsolutions/School_of_Tomorrow/blob/8d30d18fa1dde164317f2e21ae7e6c29ab2060df/Qvolume.ipynb';
const UNITS=Object.freeze(['fixed','xyz','ivm']);
const PREDICTIONS=Object.freeze(['cube','tetra','equal']);
const bounded=n=>Number.isSafeInteger(n)&&n>=1&&n<=200;
const fields=(s,keys)=>s!==null&&typeof s==='object'&&!Array.isArray(s)&&Object.keys(s).length===keys.length&&keys.every(k=>Object.hasOwn(s,k));
const numeric=q=>Number(q.numerator)/Number(q.denominator);
const fixed=n=>n.toFixed(6);
const radiusLabel=n=>(n/100).toFixed(2);
const initial=()=>({radius:100,unit:'xyz',prediction:null,measured:false});
function validate(s){
  if(!fields(s,['radius','unit','prediction','measured'])||!bounded(s.radius)||!UNITS.includes(s.unit)||
     !(s.prediction===null||PREDICTIONS.includes(s.prediction))||typeof s.measured!=='boolean'||(s.measured&&s.prediction===null))
    throw new TypeError('invalid Volume Exchange state');
  return {radius:s.radius,unit:s.unit,prediction:s.prediction,measured:s.measured};
}
function transition(s,a){
  if(!fields(a,['type','value']))throw new TypeError('invalid Volume Exchange action');
  const reject=message=>({state:s,ok:false,message}),accept=(state,message)=>({state,ok:true,message});
  if(a.type==='radius'&&bounded(a.value))return accept({...s,radius:a.value},'Both solids rescaled together. The ratio is invariant.');
  if(a.type==='unit'&&UNITS.includes(a.value))return accept({...s,unit:a.value},'Only the unit of measurement changed. The solids did not move.');
  if(a.type==='predict'&&PREDICTIONS.includes(a.value))return accept({...s,prediction:a.value,measured:false},'Prediction recorded. Measure to test it.');
  if(a.type==='measure'&&a.value===null){
    if(s.prediction===null)return reject('Make a prediction first.');
    const ok=s.prediction==='cube';
    return {state:{...s,measured:true},ok,message:ok?'Correct! The cube holds slightly more. Try another radius or unit.':'Compare the measured volumes. You can revise your prediction and measure again.'};
  }
  return reject('Unsupported Volume Exchange action.');
}
// Fixed cubic length units: exact cube and exact coefficient of sqrt(2) for the tetrahedron.
// Radius-based XYZ and IVM use the current reference solids, so their displayed values are scale-independent.
export function volumeReadings(radius,unit){
  if(!UNITS.includes(unit))throw new TypeError('unknown volume unit');
  const m=volumeExchange(radius);
  const s3=Math.sqrt(numeric(m.squaredRatio));
  const xyzTet=numeric(m.tetCoefficient.divide(m.cube))*Math.SQRT2;
  if(unit==='fixed')return Object.freeze({cube:numeric(m.cube),tetra:numeric(m.tetCoefficient)*Math.SQRT2,label:'fixed u³',s3});
  if(unit==='xyz')return Object.freeze({cube:1,tetra:xyzTet,label:'XYZ (R³)',s3});
  return Object.freeze({cube:s3,tetra:1,label:'IVM (D-edged tetrahedron)',s3});
}
// Explicit coordinates, with a shared fixed physical length scale.
// The tetrahedron is a parity subset of cube corners of side sqrt(2)*R.
export function exchangeGeometry(radius){
  if(!bounded(radius))throw new RangeError('radius must be 1..200 hundredths');
  const r=radius/100,a=r/2,b=r/Math.SQRT2;
  const cube=Array.from({length:8},(_,i)=>[(i&4)?a:-a,(i&2)?a:-a,(i&1)?a:-a]);
  const tetra=[[b,b,b],[b,-b,-b],[-b,b,-b],[-b,-b,b]];
  const cubeEdges=[];for(let i=0;i<8;i++)for(const bit of [1,2,4])if((i&bit)===0)cubeEdges.push([i,i|bit]);
  return {cube,tetra,cubeEdges,tetraEdges:[[0,1],[0,2],[0,3],[1,2],[1,3],[2,3]]};
}
const action=(label,type,value,disabled=false,pressed=null)=>({label,action:{type,value},disabled,pressed});
function describe(s){
  const r=radiusLabel(s.radius),d=radiusLabel(2*s.radius),v=volumeReadings(s.radius,s.unit);
  const m=volumeExchange(s.radius);
  const geometry='R = '+r+' u; D = '+d+' u. Common physical scale. ';
  const readout=geometry+(s.measured
    ?'Cube: '+fixed(v.cube)+'; tetrahedron: '+fixed(v.tetra)+' '+v.label+'. Ratio ≈ '+fixed(v.s3)+'. Exact ratio² = '+m.squaredRatio.toString()+'.'
    :'Predict which solid holds more, then measure. Selected unit: '+v.label+'.');
  return {readout,done:s.measured&&s.prediction==='cube',
    explanation:'With D = 2R, Vcube = R³ and Vtet = (2√2/3)R³. The same physical volume has S3 = √(9/8) times as many D-edged tetravolumes as R-edged cube volumes; divide by S3 to go back. In fixed cubic units the exact cube volume is '+m.cube.toString()+' u³ and the tetrahedron volume is ('+m.tetCoefficient.toString()+')√2 u³. If both reference edges were 1 u instead, the conversion would be 6√2, not S3. These are unit conversions, not tiling claims.',
    actions:[
      action('Smaller R (−0.25 u)','radius',Math.max(1,s.radius-25),s.radius===1),
      action('Larger R (+0.25 u)','radius',Math.min(200,s.radius+25),s.radius===200),
      action('R = 1 u','radius',100,s.radius===100),
      action('Fixed cubic units','unit','fixed',false,s.unit==='fixed'),
      action('XYZ: R³ units','unit','xyz',false,s.unit==='xyz'),
      action('IVM: tetra units','unit','ivm',false,s.unit==='ivm'),
      action('Predict cube','predict','cube',false,s.prediction==='cube'),
      action('Predict tetrahedron','predict','tetra',false,s.prediction==='tetra'),
      action('Predict equal','predict','equal',false,s.prediction==='equal'),
      action('Measure volumes','measure',null,s.prediction===null)
    ]};
}
// Orthographic isometric projection with one scale for both solids, not independent auto-fit.
// No unit/prediction/measurement state enters the drawing.
export function drawExchange(canvas,s){
  const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height;
  const g=exchangeGeometry(s.radius),scale=Math.min(w/640,h/300)*48;
  c.clearRect(0,0,w,h);c.fillStyle='#102c38';c.fillRect(0,0,w,h);
  const project=(v,cx)=>[cx+scale*(v[0]-v[2])/Math.SQRT2,h*.45+scale*(v[0]+v[2]-2*v[1])/Math.sqrt(6)];
  function solid(vertices,edges,centre,color){
    const p=vertices.map(v=>project(v,centre));c.strokeStyle=color;c.lineWidth=2;
    for(const [a,b] of edges){c.beginPath();c.moveTo(...p[a]);c.lineTo(...p[b]);c.stroke();}
    c.fillStyle=color;for(const [x,y] of p){c.beginPath();c.arc(x,y,2.5,0,Math.PI*2);c.fill();}
  }
  solid(g.cube,g.cubeEdges,w*.25,'#66d9cd');solid(g.tetra,g.tetraEdges,w*.75,'#f6b754');
  c.fillStyle='#eef1dc';c.font='16px sans-serif';c.textAlign='center';
  c.fillText('R-edged cube',w*.25,h*.86);c.fillText('D-edged tetrahedron',w*.75,h*.86);
  c.font='13px monospace';c.fillText('R = '+radiusLabel(s.radius)+' u',w*.25,h*.93);
  c.fillText('D = '+radiusLabel(s.radius*2)+' u',w*.75,h*.93);
}
export const volumeExchangeExhibit=Object.freeze({
  manifest:Object.freeze({schema:1,id:'measurement.volume-exchange',version:1,title:'The Volume Exchange',gallery:'Measurement',kind:'lab',
    question:'A cube has edges R and a regular tetrahedron has edges D = 2R. Which holds more? Predict, measure, then change the scale and the units without changing the relationship.',source:SOURCE}),
  initial,validate,transition,describe,draw:drawExchange
});
