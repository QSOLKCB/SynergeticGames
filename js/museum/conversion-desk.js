// SPDX-License-Identifier: Apache-2.0
import {ExactRational} from '../../vendor/vanillajs/modules/exact-rational/index.js';
import {volumeExchange} from './measurement.js';
import {fields,integer,action,accept,reject,fixed,number,SOURCE_ROOT,frame,label} from './measurement-tools.js';
const DIRECTIONS=['xyz-ivm','ivm-xyz'],PREDICTIONS=['larger','smaller','equal'];
const initial=()=>({quarters:4,direction:'xyz-ivm',prediction:null,measured:false});
function validate(s){
  if(!fields(s,['quarters','direction','prediction','measured'])||!integer(s.quarters,1,48)||!DIRECTIONS.includes(s.direction)||
     !(s.prediction===null||PREDICTIONS.includes(s.prediction))||typeof s.measured!=='boolean'||(s.measured&&s.prediction===null))throw TypeError('invalid conversion state');
  return {...s};
}
export function conversion(quarters,direction){
  if(!integer(quarters,1,48)||!DIRECTIONS.includes(direction))throw RangeError('invalid conversion input');
  const amount=new ExactRational(quarters,4),squared=volumeExchange(100).squaredRatio,forward=direction==='xyz-ivm';
  const ratioSquared=forward?squared:new ExactRational(1).divide(squared);
  return {amount,ratioSquared,resultSquared:amount.multiply(amount).multiply(ratioSquared),
    result:number(amount)*Math.sqrt(number(ratioSquared)),expected:forward?'larger':'smaller'};
}
function transition(s,a){
  if(!fields(a,['type','value']))throw TypeError('invalid conversion action');
  if(a.type==='amount'&&integer(a.value,1,48))return accept({...s,quarters:a.value},'Input volume changed.');
  if(a.type==='direction'&&DIRECTIONS.includes(a.value))return accept({...s,direction:a.value,prediction:null,measured:false},'New input unit: this defines a new specimen. Predict its converted measure.');
  if(a.type==='predict'&&PREDICTIONS.includes(a.value))return accept({...s,prediction:a.value,measured:false},'Prediction recorded.');
  if(a.type==='convert'&&a.value===null&&s.prediction!==null){
    const ok=s.prediction===conversion(s.quarters,s.direction).expected;
    return {state:{...s,measured:true},ok,message:ok?'Correct! The physical volume is unchanged.':'Compare the two measures and try again.'};
  }
  return reject(s,'Choose a valid amount, direction or prediction first.');
}
function describe(s){
  const m=conversion(s.quarters,s.direction),forward=s.direction==='xyz-ivm',from=forward?'XYZ':'IVM',to=forward?'IVM':'XYZ';
  return {readout:'Input: '+m.amount.toString()+' '+from+' units. '+(s.measured?'Converted: '+fixed(m.result)+' '+to+' units. Exact output² = '+m.resultSquared.toString()+'.':'Predict, then convert to '+to+'.'),
    done:s.measured&&s.prediction===m.expected,
    explanation:'With fixed R = 1 u and D = 2 u, the XYZ reference is R³ and the IVM reference is (2√2/3)R³. The same physical volume has √(9/8) times as many IVM units. Reverse conversion uses √(8/9). The squared conversion factor is exactly '+m.ratioSquared.toString()+'. The displayed decimal is rounded.',
    actions:[action('Less volume (−0.25)','amount',Math.max(1,s.quarters-1),s.quarters===1),action('More volume (+0.25)','amount',Math.min(48,s.quarters+1),s.quarters===48),
      action('XYZ to IVM','direction','xyz-ivm',false,forward),action('IVM to XYZ','direction','ivm-xyz',false,!forward),
      ...PREDICTIONS.map(p=>action('Predict '+p,'predict',p,false,s.prediction===p)),action('Convert volume','convert',null,s.prediction===null)]};
}
function draw(canvas,s){
  const {c,w,h}=frame(canvas),m=conversion(s.quarters,s.direction),forward=s.direction==='xyz-ivm';
  // Each conversion compares one physical specimen; a direction change reinterprets the input.
  // Size is proportional to the cube root of the physical volume.
  const physical=number(m.amount)*(forward?1:Math.sqrt(8/9)),edge=Math.cbrt(physical),size=edge*40*Math.min(w/640,h/300);
  const x=w/2-size/2,y=h*.40-size/2;
  c.strokeStyle='#66d9cd';c.lineWidth=2;c.strokeRect(x,y,size,size);
  c.beginPath();c.moveTo(x,y);c.lineTo(x+size*.35,y-size*.35);c.lineTo(x+size*1.35,y-size*.35);c.lineTo(x+size*1.35,y+size*.65);c.lineTo(x+size,y+size);c.moveTo(x+size,y);c.lineTo(x+size*1.35,y-size*.35);c.stroke();
  label(c,w/2,h*.76,'One physical volume');
  label(c,w/2,h*.88,s.measured?m.amount.toString()+' '+(forward?'XYZ':'IVM')+' = '+fixed(m.result)+' '+(forward?'IVM':'XYZ'):'Choose a conversion direction');
}
export const conversionDesk=Object.freeze({manifest:Object.freeze({schema:1,id:'measurement.conversion-desk',version:1,title:'The Conversion Desk',gallery:'Measurement',kind:'lab',question:'Convert the same volume between R-edged cube units and D-edged tetrahedron units. Does its numerical measure grow or shrink?',source:SOURCE_ROOT+'Qvolume.ipynb'}),initial,validate,transition,describe,draw});
