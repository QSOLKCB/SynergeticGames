// SPDX-License-Identifier: Apache-2.0
import {fields,integer,action,accept,reject,fixed,SOURCE_ROOT,frame,label,polygon} from './measurement-tools.js';
const SNAPS=['front-regular','back-regular'],UNITS=['xyz','ivm'],PREDICTIONS=['closed','middle','open'];
const initial=()=>({angle:0,unit:'ivm',prediction:null,measured:false});
const validAngle=a=>integer(a,0,180)||SNAPS.includes(a);
export function angleDegrees(angle){
  if(!validAngle(angle))throw RangeError('invalid book angle');
  if(angle==='front-regular')return Math.acos(1/3)*180/Math.PI;
  if(angle==='back-regular')return Math.acos(-1/3)*180/Math.PI;
  return angle;
}
export function bookGeometry(angle){
  const degrees=angleDegrees(angle),theta=degrees*Math.PI/180;
  // Exact endpoints and midpoint; analytic cosine at the two regular-tetrahedron snaps.
  const cos=angle==='front-regular'?1/3:angle==='back-regular'?-1/3:degrees===90?0:Math.cos(theta);
  const sin=degrees===0||degrees===180?0:degrees===90?1:SNAPS.includes(angle)?Math.sqrt(8/9):Math.sin(theta);
  const root3=Math.sqrt(3);
  return {degrees,hinge:[[-1,0,0],[1,0,0]],front:[0,-root3,0],back:[0,root3,0],page:[0,-root3*cos,root3*sin],sin};
}
export function bookVolumes(angle,unit){
  if(!UNITS.includes(unit))throw TypeError('invalid book unit');
  const g=bookGeometry(angle),xyz=g.sin,ivm=xyz*Math.sqrt(9/8);
  return {each:unit==='xyz'?xyz:ivm,total:2*(unit==='xyz'?xyz:ivm),xyz,ivm};
}
function validate(s){
  if(!fields(s,['angle','unit','prediction','measured'])||!validAngle(s.angle)||!UNITS.includes(s.unit)||
     !(s.prediction===null||PREDICTIONS.includes(s.prediction))||typeof s.measured!=='boolean'||(s.measured&&s.prediction===null))throw TypeError('invalid TetraBook state');
  return {...s};
}
function transition(s,a){
  if(!fields(a,['type','value']))throw TypeError('invalid book action');
  if(a.type==='angle'&&validAngle(a.value))return accept({...s,angle:a.value},'Page moved. Both tetrahedra share the hinge and page.');
  if(a.type==='unit'&&UNITS.includes(a.value))return accept({...s,unit:a.value},'Same geometry, different volume units.');
  if(a.type==='predict'&&PREDICTIONS.includes(a.value))return accept({...s,prediction:a.value,measured:false},'Prediction recorded. Move the page and measure.');
  if(a.type==='measure'&&a.value===null&&s.prediction!==null){
    const ok=s.prediction==='middle'&&s.angle===90;
    return {state:{...s,measured:true},ok,message:ok?'Correct! Both volumes reach their maximum at 90 degrees.':'Explore the sweep and compare volumes; test the vertical page.'};
  }
  return reject(s,'Choose a page position or prediction first.');
}
function describe(s){
  const g=bookGeometry(s.angle),m=bookVolumes(s.angle,s.unit),deg=g.degrees;
  const readout='Page angle: '+deg.toFixed(3)+'° from front cover. D = 2 u, R = 1 u. '+(s.measured?'Each tetrahedron: '+fixed(m.each)+' '+s.unit.toUpperCase()+' units; combined: '+fixed(m.total)+'.':'Predict where the volume peaks, then measure.');
  return {readout,done:s.measured&&s.prediction==='middle'&&s.angle===90,
    explanation:'Each cover and page is an equilateral triangle of edge D = 2. The page tip sweeps a semicircle of radius √3 perpendicular to the hinge. Each tetrahedron has XYZ volume sin θ, and IVM volume S3 sin θ. At 90° each is S3 tetravolumes. At arccos(1/3) or arccos(−1/3), one of the two tetrahedra is regular, and both have unit tetravolume. Endpoints are flat (zero volume).',
    actions:[action('Close to front','angle',0,false,s.angle===0),action('Page − 5°','angle',Math.max(0,Math.ceil(deg)-5),deg===0),action('Page + 5°','angle',Math.min(180,Math.floor(deg)+5),deg===180),
      action('Vertical 90°','angle',90,false,s.angle===90),action('Front regular tetrahedron','angle','front-regular',false,s.angle==='front-regular'),action('Back regular tetrahedron','angle','back-regular',false,s.angle==='back-regular'),action('Close to back','angle',180,false,s.angle===180),
      action('XYZ cubic units','unit','xyz',false,s.unit==='xyz'),action('IVM tetra units','unit','ivm',false,s.unit==='ivm'),
      action('Predict front closed','predict','closed',false,s.prediction==='closed'),action('Predict vertical','predict','middle',false,s.prediction==='middle'),action('Predict back closed','predict','open',false,s.prediction==='open'),action('Measure book','measure',null,s.prediction===null)]};
}
function draw(canvas,s){
  const {c,w,h}=frame(canvas),g=bookGeometry(s.angle),scale=Math.min(w/640,h/300)*54;
  const project=p=>[w*.5+scale*(.78*p[0]+p[1]),h*.53+scale*(.25*p[0]-.25*p[1]-.85*p[2])];
  const hinge=g.hinge.map(project),f=project(g.front),b=project(g.back),p=project(g.page);
  polygon(c,[...hinge,f],'#66d9cd');polygon(c,[...hinge,b],'#b4adff');polygon(c,[...hinge,p],'#f6b754');
  c.strokeStyle='#eef1dc';c.lineWidth=3;c.beginPath();c.moveTo(...hinge[0]);c.lineTo(...hinge[1]);c.stroke();
  label(c,w*.23,h*.88,'Front cover','#66d9cd');label(c,w*.50,h*.88,'Page · '+g.degrees.toFixed(1)+'°','#f6b754');label(c,w*.77,h*.88,'Back cover','#b4adff');
}
export const tetraBookExhibit=Object.freeze({manifest:Object.freeze({schema:1,id:'measurement.tetrabook',version:1,title:'The TetraBook',gallery:'Measurement',kind:'lab',question:'Turn one triangular page between two triangular covers. Where does each enclosed tetrahedron reach its largest volume?',source:SOURCE_ROOT+'TetraBook.ipynb'}),initial,validate,transition,describe,draw});
