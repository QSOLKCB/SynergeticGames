// SPDX-License-Identifier: Apache-2.0
import {ExactRational} from '../../vendor/vanillajs/modules/exact-rational/index.js';
import {fields,integer,action,accept,reject,number,frame,label,polygon} from './measurement-tools.js';
const SHAPES=['square','triangle','rectangle'];
const initial=()=>({a:3,b:4,shape:'square',transferred:0});
function validate(s){
  if(!fields(s,['a','b','shape','transferred'])||!integer(s.a,1,8)||!integer(s.b,1,8)||!SHAPES.includes(s.shape)||!integer(s.transferred,0,3))throw TypeError('invalid area transfer state');
  return {...s};
}
// Similar figures on all three sides. k = 1, 1/2 or 2; c² is exact even when c is irrational.
export function areaModel(a,b,shape){
  if(!integer(a,1,8)||!integer(b,1,8)||!SHAPES.includes(shape))throw RangeError('invalid right triangle');
  const k=shape==='triangle'?new ExactRational(1,2):new ExactRational(shape==='rectangle'?2:1);
  const squares=[a*a,b*b,a*a+b*b],areas=squares.map(v=>k.multiply(new ExactRational(v)));
  return {sides:[a,b,Math.sqrt(squares[2])],squares,areas};
}
export function similarPolygon(side,shape){
  if(!Number.isFinite(side)||side<=0||side>12||!SHAPES.includes(shape))throw RangeError('invalid similar figure');
  if(shape==='triangle')return [[0,0],[side,0],[0,side]];
  const height=shape==='rectangle'?2*side:side;
  return [[0,0],[side,0],[side,height],[0,height]];
}
function transition(s,a){
  if(!fields(a,['type','value']))throw TypeError('invalid area action');
  if(['a','b'].includes(a.type)&&integer(a.value,1,8))return accept({...s,[a.type]:a.value,transferred:0},'New right triangle. Transfer both leg areas again.');
  if(a.type==='shape'&&SHAPES.includes(a.value))return accept({...s,shape:a.value,transferred:0},'All three figures now use the same shape and scale rule.');
  if(a.type==='transfer'&&[1,2].includes(a.value)&&!(s.transferred&a.value)){
    const next={...s,transferred:s.transferred|a.value};return accept(next,next.transferred===3?'Both leg areas exactly fill the target area.':'One leg transferred. Add the other.');
  }
  return reject(s,'Select an untransferred leg or a valid dimension.');
}
function describe(s){
  const m=areaModel(s.a,s.b,s.shape),zero=new ExactRational(0);
  const transferred=(s.transferred&1?m.areas[0]:zero).add(s.transferred&2?m.areas[1]:zero);
  return {readout:'Right triangle: a = '+s.a+', b = '+s.b+', c = √'+m.squares[2]+'. Areas: '+m.areas[0].toString()+' + '+m.areas[1].toString()+' = '+m.areas[2].toString()+' square units. Transferred: '+transferred.toString()+' / '+m.areas[2].toString()+'.',
    done:s.transferred===3,explanation:'Euclid VI.31 generalises the familiar squares: similar figures on all three sides have areas k·a², k·b² and k·c² with the same k. Since the triangle is right-angled, a²+b²=c². This is area accounting, not a claim that the small figures physically tile the larger one.',
    actions:[action('a − 1','a',Math.max(1,s.a-1),s.a===1),action('a + 1','a',Math.min(8,s.a+1),s.a===8),action('b − 1','b',Math.max(1,s.b-1),s.b===1),action('b + 1','b',Math.min(8,s.b+1),s.b===8),
      ...SHAPES.map(p=>action(p==='square'?'Squares':p==='triangle'?'Similar triangles':'Similar rectangles','shape',p,false,s.shape===p)),action('Transfer leg a','transfer',1,!!(s.transferred&1)),action('Transfer leg b','transfer',2,!!(s.transferred&2))]};
}
function draw(canvas,s){
  const {c,w,h}=frame(canvas),m=areaModel(s.a,s.b,s.shape),scale=Math.min(w/640,h/300)*6.5;
  const colors=['#66d9cd','#f6b754','#b4adff'];
  // Separate, equally scaled shapes. Area transfer is a ledger bar, not a geometric dissection.
  for(let i=0;i<3;i++){
    const x=w*(i+1)/4,y=h*.40;
    const pts=similarPolygon(m.sides[i],s.shape),maxX=Math.max(...pts.map(p=>p[0])),maxY=Math.max(...pts.map(p=>p[1]));
    const points=pts.map(p=>[x+(p[0]-maxX/2)*scale,y+(p[1]-maxY/2)*scale]);
    if(i<2&&!(s.transferred&(1<<i)))polygon(c,points,colors[i],true);
    polygon(c,points,colors[i]);label(c,x,h*.79,['leg a','leg b','hypotenuse'][i]);label(c,x,h*.86,m.areas[i].toString()+' u²',colors[i]);
  }
  const x=w*.15,y=h*.93,width=w*.70,height=9;
  let offset=0;for(let i=0;i<2;i++)if(s.transferred&(1<<i)){const part=width*number(m.areas[i])/number(m.areas[2]);c.fillStyle=colors[i];c.fillRect(x+offset,y,part,height);offset+=part;}
  c.strokeStyle='#eef1dc';c.strokeRect(x,y,width,height);
}
export const pythagorasExhibit=Object.freeze({manifest:Object.freeze({schema:1,id:'measurement.area-transfer',version:1,title:'The Pythagorean Transfer',gallery:'Measurement',kind:'lab',question:'Transfer the areas of similar figures on the two legs of a right triangle to the hypotenuse ledger. Does it still work when the figures are not squares?',source:'https://www.claymath.org/euclid_index/similar-figures-and-proportions/?chapter=31'}),initial,validate,transition,describe,draw});
