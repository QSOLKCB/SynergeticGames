// SPDX-License-Identifier: Apache-2.0
export const fields=(value,keys)=>value!==null&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length===keys.length&&keys.every(k=>Object.hasOwn(value,k));
export const integer=(v,min,max)=>Number.isSafeInteger(v)&&v>=min&&v<=max;
export const action=(label,type,value=null,disabled=false,pressed=null)=>({label,action:{type,value},disabled,pressed});
export const accept=(state,message)=>({state,ok:true,message});
export const reject=(state,message)=>({state,ok:false,message});
export const fixed=n=>n.toFixed(6);
export const number=q=>Number(q.numerator)/Number(q.denominator);
export const SOURCE_ROOT='https://github.com/4dsolutions/School_of_Tomorrow/blob/8d30d18fa1dde164317f2e21ae7e6c29ab2060df/';
export function frame(canvas){
  const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height;
  c.clearRect(0,0,w,h);c.fillStyle='#102c38';c.fillRect(0,0,w,h);
  return {c,w,h};
}
export function label(c,x,y,text,color='#eef1dc'){
  c.fillStyle=color;c.font='16px sans-serif';c.textAlign='center';c.fillText(text,x,y);
}
export function polygon(c,points,color,fill=false){
  c.beginPath();c.moveTo(...points[0]);for(const p of points.slice(1))c.lineTo(...p);c.closePath();
  if(fill){c.fillStyle=color;c.fill();}else{c.strokeStyle=color;c.lineWidth=2;c.stroke();}
}
