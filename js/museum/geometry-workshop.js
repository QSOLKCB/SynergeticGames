// SPDX-License-Identifier: Apache-2.0
import {canonical,numerator,fromNumerator,xyz,Q_STEPS,lattice,cell,CELL_NAMES,fccQuadray} from './quadray-model.js';
import {fields,integer,action,accept,reject,SOURCE_ROOT,frame,label} from './measurement-tools.js';
const manifest=(id,title,question,source)=>Object.freeze({schema:1,id:'geometry.'+id,version:1,title,gallery:'Geometry',kind:'lab',question,source:SOURCE_ROOT+source});
const fmt=q=>'['+q.join(', ')+']';
function project(p,w,h,scale,view=0){
  const t=view*Math.PI/6,x=p[0]*Math.cos(t)-p[1]*Math.sin(t),y=p[0]*Math.sin(t)+p[1]*Math.cos(t);
  return [w/2+scale*(x-y)*Math.SQRT1_2,h*.44+scale*((x+y)/Math.sqrt(6)-p[2]*Math.sqrt(2/3))];
}
function line(c,a,b,color){c.strokeStyle=color;c.lineWidth=1.5;c.beginPath();c.moveTo(...a);c.lineTo(...b);c.stroke();}
function dot(c,p,color,r=4){c.fillStyle=color;c.beginPath();c.arc(...p,r,0,2*Math.PI);c.fill();}
const viewAction=s=>action('Rotate view','view',(s.view+1)%12);
const validView=s=>integer(s.view,0,11);
const qInitial=()=>({q:[3,2,2,1],view:0});
function qValidate(s){
  if(!fields(s,['q','view'])||!validView(s)||!Array.isArray(s.q)||s.q.length!==4||!Array.from(s.q).every(v=>integer(v,-16,32)))throw TypeError('invalid coordinate state');
  if(Math.max(...canonical(s.q))>32)throw RangeError('coordinate span exceeds 32');
  return {q:[...s.q],view:s.view};
}
function qTransition(s,a){
  if(!fields(a,['type','value']))throw TypeError('invalid coordinate action');
  if(a.type==='view'&&integer(a.value,0,11))return accept({...s,view:a.value},'View changed; coordinate unchanged.');
  let q;
  if(a.type==='step'&&integer(a.value,0,7)){q=[...s.q];q[Math.floor(a.value/2)]+=a.value%2?1:-1;}
  else if(a.type==='offset'&&[-1,1].includes(a.value))q=s.q.map(v=>v+a.value);
  else if(a.type==='canonical'&&a.value===null)q=canonical(s.q);
  else if(a.type==='inverse'&&a.value===null)q=fromNumerator(numerator(s.q));
  else return reject(s,'Invalid coordinate action.');
  try{return accept(qValidate({...s,q}),a.type==='offset'?'Common offset changed; same point.':'Coordinate updated.');}catch{return reject(s,'Coordinate bound reached.');}
}
function qDescribe(s){
  const n=numerator(s.q),q=canonical(s.q),p=xyz(s.q);
  return {readout:'Quadray: '+fmt(s.q)+'; canonical: '+fmt(q)+'; exact XYZ numerator: '+fmt(n)+' × √2/4. XYZ ≈ '+fmt(p.map(v=>v.toFixed(4)))+' (D=1).',
    done:Math.min(...s.q)===0,explanation:'Four tetrahedral basis rays sum to zero. Adding the same integer to every component leaves all three Cartesian numerators unchanged. The unique nonnegative representative has minimum zero. The integer inverse exists precisely when the numerator components have matching parity, within the declared bound.',
    actions:[...['A','B','C','D'].flatMap((k,i)=>[action(k+' − 1','step',2*i),action(k+' + 1','step',2*i+1)]),action('Add common offset','offset',1),action('Subtract common offset','offset',-1),action('Canonicalise','canonical'),action('Round-trip XYZ numerator','inverse'),viewAction(s)]};
}
function qDraw(canvas,s){
  const {c,w,h}=frame(canvas),p=xyz(s.q),basis=Array.from({length:4},(_,i)=>xyz(Array.from({length:4},(_,j)=>Number(i===j))));
  const scale=Math.min(w/640,h/300)*Math.min(95,105/Math.max(1,Math.hypot(...p))),o=project([0,0,0],w,h,scale,s.view),colors=['#f6b754','#66d9cd','#b4adff','#ff8d85'];
  basis.forEach((v,i)=>{const end=project(v,w,h,scale,s.view);line(c,o,end,colors[i]);dot(c,end,colors[i]);label(c,end[0]+10,end[1]-10,'ABCD'[i],colors[i]);});
  const end=project(p,w,h,scale,s.view);line(c,o,end,'#eef1dc');dot(c,end,'#eef1dc',6);dot(c,o,'#90aaa8',3);
  label(c,w/2,h*.92,'Same numerator = same point');
}
export const quadrayWorkshop=Object.freeze({manifest:manifest('quadray-workshop','The Quadray Workshop','Construct a point with four integer rays, change the common offset, then recover the canonical coordinates.','Mapping_Quadrays.ipynb'),initial:qInitial,validate:qValidate,transition:qTransition,describe:qDescribe,draw:qDraw});
const lInitial=()=>({radius:0,view:0,selected:0});
function lValidate(s){
  if(!fields(s,['radius','view','selected'])||!integer(s.radius,0,3)||!validView(s)||!integer(s.selected,0,lattice(s.radius).points.length-1))throw TypeError('invalid lattice state');
  return {...s};
}
function lTransition(s,a){
  if(!fields(a,['type','value']))throw TypeError('invalid lattice action');
  if(a.type==='radius'&&integer(a.value,0,3))return accept({...s,radius:a.value,selected:0},'Shell regenerated from the twelve exact neighbour steps.');
  if(a.type==='view'&&integer(a.value,0,11))return accept({...s,view:a.value},'View changed.');
  if(a.type==='select'&&integer(a.value,0,lattice(s.radius).points.length-1))return accept({...s,selected:a.value},'Inspect the selected lattice point.');
  return reject(s,'Invalid lattice action.');
}
function lDescribe(s){
  const m=lattice(s.radius),p=m.points[s.selected],counts=Array.from({length:s.radius+1},(_,i)=>m.shells.filter(k=>k===i).length);
  const degree=m.edges.filter(e=>e.includes(s.selected)).length;
  return {readout:'Shell '+s.radius+': '+counts.join(' + ')+' = '+m.points.length+' points; '+m.edges.length+' nearest-neighbour bonds. Selected '+fmt(fccQuadray(p))+'; lattice index '+fmt(p)+'; '+degree+' neighbours in this finite patch.',
    done:s.radius===3,explanation:'FCC points are integer triples with even coordinate sum, scaled by 1/√2 for D=1. The twelve nearest moves are permutations of (±1,±1,0), equivalent to the twelve Quadray permutations of (2,1,1,0). Breadth-first graph shells contain 1, 12, 42, 92 points. Finite boundary points can have fewer than twelve neighbours.',
    actions:[action('Grow shell','radius',Math.min(3,s.radius+1),s.radius===3),action('Shrink shell','radius',Math.max(0,s.radius-1),s.radius===0),action('Previous point','select',Math.max(0,s.selected-1),s.selected===0),action('Next point','select',Math.min(m.points.length-1,s.selected+1),s.selected===m.points.length-1),action('Inspect origin','select',0,s.selected===0),viewAction(s)]};
}
function lDraw(canvas,s){
  const {c,w,h}=frame(canvas),m=lattice(s.radius),scale=Math.min(w/640,h/300)*31,pts=m.points.map(p=>project(p,w,h,scale,s.view));
  for(const [i,j] of m.edges)line(c,pts[i],pts[j],i===s.selected||j===s.selected?'#f6b754':'#466b72');
  pts.forEach((p,i)=>dot(c,p,['#eef1dc','#66d9cd','#b4adff','#ff8d85'][m.shells[i]],i===s.selected?6:2.8));
  dot(c,pts[s.selected],'#f6b754',5);label(c,w/2,h*.94,'Shell '+s.radius+' · '+m.points.length+' sites · '+m.edges.length+' bonds');
}
export const latticeWorkshop=Object.freeze({manifest:manifest('ivm-builder','The IVM Builder','Grow three FCC neighbour shells and inspect their Quadray addresses and nearest-neighbour bonds.','Rendering_IVM.ipynb'),initial:lInitial,validate:lValidate,transition:lTransition,describe:lDescribe,draw:lDraw});
const cInitial=()=>({kind:'tetrahedron',counts:[0,0,0],view:0,overlay:false});
function cValidate(s){
  if(!fields(s,['kind','counts','view','overlay'])||!CELL_NAMES.includes(s.kind)||!validView(s)||typeof s.overlay!=='boolean'||!Array.isArray(s.counts)||s.counts.length!==3||!Array.from(s.counts).every((v,i)=>integer(v,0,cell(CELL_NAMES[i]).vertices.length)))throw TypeError('invalid cell state');
  return {...s,counts:[...s.counts]};
}
function cTransition(s,a){
  if(!fields(a,['type','value']))throw TypeError('invalid cell action');
  if(a.type==='kind'&&CELL_NAMES.includes(a.value))return accept({...s,kind:a.value,overlay:false},'Cell selected.');
  if(a.type==='view'&&integer(a.value,0,11))return accept({...s,view:a.value},'View changed.');
  if(a.type==='overlay'&&typeof a.value==='boolean')return accept({...s,overlay:a.value},'Concentric comparison changed; construction progress unchanged.');
  if(a.type==='vertex'&&a.value===null&&!s.overlay){
    const i=CELL_NAMES.indexOf(s.kind),counts=[...s.counts];
    if(counts[i]<cell(s.kind).vertices.length){counts[i]++;return accept({...s,counts},'Vertex installed; bonds and faces follow exact incidence.');}
  }
  return reject(s,'Choose a cell with an unbuilt vertex.');
}
function cDescribe(s){
  const m=cell(s.kind),n=s.counts[CELL_NAMES.indexOf(s.kind)],e=m.edges.filter(f=>f.every(i=>i<n)).length,f=m.faces.filter(f=>f.every(i=>i<n)).length;
  return {readout:s.overlay?'Concentric comparison (equal edges D=1): tetrahedron 1, octahedron 4, cuboctahedron 20 tetravolumes. Separate solids with aligned centroids, not a tiling.':
    s.kind+': '+n+' / '+m.vertices.length+' vertices; '+e+' / '+m.edges.length+' edges; '+f+' / '+m.faces.length+' faces. '+(n===m.vertices.length?'Volume: '+m.tetravolumes+' tetravolumes.':'Install the remaining vertices.'),
    done:s.counts.every((v,i)=>v===cell(CELL_NAMES[i]).vertices.length),
    explanation:'Every cell vertex is on the FCC lattice. Edges join points at squared lattice distance 2 (D=1 after scaling). Face incidence is calculated from the boundary; determinants give equal-edge tetravolumes 1, 4 and 20. The concentric view translates centroids only and preserves edge scale. This is not a hinged Jitterbug or a tetrahedral tiling claim.',
    actions:[...CELL_NAMES.map(k=>action(k[0].toUpperCase()+k.slice(1),'kind',k,false,s.kind===k&&!s.overlay)),action('Add next vertex','vertex',null,s.overlay||n===m.vertices.length),action('Concentric comparison','overlay',!s.overlay,false,s.overlay),viewAction(s)]};
}
function cDraw(canvas,s){
  const {c,w,h}=frame(canvas),scale=Math.min(w/640,h/300)*75;
  const draw=(kind,n,color)=>{
    const m=cell(kind),center=[0,1,2].map(k=>m.vertices.reduce((a,v)=>a+v[k],0)/m.vertices.length);
    const p=m.vertices.map(v=>project(v.map((x,i)=>x-center[i]),w,h,scale,s.view));
    for(const [i,j] of m.edges)if(i<n&&j<n)line(c,p[i],p[j],color);
    p.forEach((v,i)=>{if(i<n)dot(c,v,color,4);});
  };
  if(s.overlay)CELL_NAMES.slice().reverse().forEach(k=>draw(k,cell(k).vertices.length,{'tetrahedron':'#f6b754','octahedron':'#66d9cd','cuboctahedron':'#b4adff'}[k]));
  else draw(s.kind,s.counts[CELL_NAMES.indexOf(s.kind)],'#66d9cd');
  label(c,w/2,h*.94,s.overlay?'Equal-edge solids · aligned centroids':s.kind+' · build the FCC vertices');
}
export const cellWorkshop=Object.freeze({manifest:manifest('cell-foundry','The Cell Foundry','Build tetrahedral, octahedral and cuboctahedral cells; compare equal-edge volumes with aligned centroids.','Qvolume.ipynb'),initial:cInitial,validate:cValidate,transition:cTransition,describe:cDescribe,draw:cDraw});
