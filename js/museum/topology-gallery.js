// SPDX-License-Identifier: Apache-2.0
import {FULL,PRESETS,closure,vertices,dimension,simplexName,contains,boundary,validateComplex,toggleSimplex,homology,doubleBoundary,basis,mod,classifyChain} from './simplex-model.js';
import {fields,integer,action,accept,reject,frame,label,polygon} from './measurement-tools.js';
const SOURCE='https://www.math.ucdavis.edu/~lstarkston/math180/simplicialhomology';
const manifest=(id,title,question)=>Object.freeze({schema:1,id:'topology.'+id,version:1,title,gallery:'Topology',kind:'lab',question,source:SOURCE});
const fieldOK=p=>p===2||p===3;
const fieldActions=s=>[action('GF(2)','field',2,false,s.field===2),action('GF(3)','field',3,false,s.field===3)];
const points=[[320,42],[155,210],[485,210],[320,157]];
const fieldText=p=>'GF('+p+')';
const stats=m=>'Counts ('+m.counts.join(', ')+'); ranks ∂1,∂2,∂3 = ('+m.ranks.slice(1,4).join(', ')+'); Betti ('+m.betti.join(', ')+'); χ='+m.euler+'; ∂²='+ (m.chain?'0':'nonzero')+'.';
function drawComplex(canvas,mask,highlight=0,sign=1){
  const {c,w,h}=frame(canvas),p=points.map(([x,y])=>[x*w/640,y*h/300]);
  for(const id of basis(mask,2)){
    c.globalAlpha=id===highlight?.55:.16;polygon(c,vertices(id).map(i=>p[i]),'#66d9cd',true);c.globalAlpha=1;
  }
  for(const id of basis(mask,1)){
    const [a,b]=vertices(id);c.strokeStyle=id===highlight?'#f6b754':'#66d9cd';c.lineWidth=id===highlight?3:2;c.beginPath();c.moveTo(...p[a]);c.lineTo(...p[b]);c.stroke();
  }
  for(const id of basis(mask,0)){
    const i=vertices(id)[0],[x,y]=p[i];c.fillStyle='#eef1dc';c.beginPath();c.arc(x,y,5,0,2*Math.PI);c.fill();label(c,x+(i===1?-15:14),y-10,'ABCD'[i]);
  }
  label(c,w/2,h*.94,contains(mask,15)?'3-simplex present (interior filled)':highlight?'Oriented ['+simplexName(highlight)+'] · sign '+(sign===1?'+':'−'):'Abstract complex · schematic projection');
}
const bInitial=()=>({mask:0,field:2});
function bValidate(s){if(!fields(s,['mask','field'])||!fieldOK(s.field))throw TypeError('invalid complex state');return {mask:validateComplex(s.mask),field:s.field};}
function bTransition(s,a){
  if(!fields(a,['type','value']))throw TypeError('invalid complex action');
  if(a.type==='field'&&fieldOK(a.value))return accept({...s,field:a.value},'Coefficient field changed; complex unchanged.');
  if(a.type==='toggle'&&integer(a.value,1,15)){
    try{return accept({...s,mask:toggleSimplex(s.mask,a.value)},contains(s.mask,a.value)?'Removed maximal simplex.':'Added simplex with all faces present.');}
    catch{return reject(s,'Face closure required: install all faces first, or remove cofaces first.');}
  }
  return reject(s,'Invalid construction action.');
}
const allIds=Array.from({length:15},(_,i)=>i+1).sort((a,b)=>dimension(a)-dimension(b)||a-b);
function bDescribe(s){
  const m=homology(s.mask,s.field);
  return {readout:fieldText(s.field)+'. '+stats(m)+' Add vertices before edges, edges before faces, faces before the 3-simplex.',
    done:s.mask===FULL,explanation:'A simplicial complex is closed under taking nonempty faces. Adding a simplex requires every proper face; removing one requires all containing cofaces to be absent. Counts, ranks and Betti numbers are derived from the current complex, not from artwork. Ordinary unreduced homology is used.',
    actions:[...fieldActions(s),...allIds.map(id=>action((contains(s.mask,id)?'Remove ':'Add ')+simplexName(id),'toggle',id,false,contains(s.mask,id)))]};
}
export const simplexLab=Object.freeze({manifest:manifest('simplex-builder','The Simplex Builder','Construct vertices, edges, triangular faces and a tetrahedron. Can you preserve face closure?'),initial:bInitial,validate:bValidate,transition:bTransition,describe:bDescribe,draw(canvas,s){drawComplex(canvas,s.mask);}});
const oInitial=()=>({id:3,sign:1,field:3,checked:0});
function oValidate(s){
  if(!fields(s,['id','sign','field','checked'])||![3,7,15].includes(s.id)||![-1,1].includes(s.sign)||!fieldOK(s.field)||!integer(s.checked,0,7))throw TypeError('invalid orientation state');
  return {...s};
}
function oTransition(s,a){
  if(!fields(a,['type','value']))throw TypeError('invalid boundary action');
  if(a.type==='id'&&[3,7,15].includes(a.value))return accept({...s,id:a.value},'Selected oriented simplex.');
  if(a.type==='flip'&&a.value===null)return accept({...s,sign:-s.sign},'Reversed orientation.');
  if(a.type==='field'&&fieldOK(a.value))return accept({...s,field:a.value},'Coefficient field changed.');
  if(a.type==='check'&&a.value===null&&doubleBoundary(s.id,s.sign,s.field).length===0)return accept({...s,checked:s.checked|(1<<(dimension(s.id)-1))},'Boundary of boundary is zero.');
  return reject(s,'Invalid boundary action.');
}
function oDescribe(s){
  const terms=boundary(s.id,s.sign),twice=doubleBoundary(s.id,s.sign,s.field);
  return {readout:'Oriented '+(s.sign===1?'+':'−')+'['+simplexName(s.id)+']. Signed boundary: '+terms.map(t=>(t.coefficient===1?'+':'−')+'['+simplexName(t.id)+']').join(' ')+'. '+fieldText(s.field)+' coefficients: '+terms.map(t=>mod(t.coefficient,s.field)).join(', ')+'. ∂² = '+(twice.length?'nonzero':'0')+'. Checked '+[1,2,4].filter(v=>s.checked&v).length+'/3 dimensions.',
    done:s.checked===7,explanation:'Use the increasing vertex order as basis orientation. Delete vertex i with sign (−1)^i; reversing the input orientation negates every coefficient. Modulo 2 the signs agree; modulo 3, −1 is 2. Every codimension-two face occurs twice with opposite signs, so ∂ applied twice is zero. Ordinary ∂0 is zero.',
    actions:[action('Edge AB','id',3,false,s.id===3),action('Triangle ABC','id',7,false,s.id===7),action('Tetrahedron ABCD','id',15,false,s.id===15),action('Reverse orientation','flip'),...fieldActions(s),action('Check boundary twice','check')]};
}
export const boundaryLab=Object.freeze({manifest:manifest('boundary-studio','The Boundary Studio','Reverse simplex orientations, compare GF(2) and GF(3), and check that the boundary of a boundary vanishes.'),initial:oInitial,validate:oValidate,transition:oTransition,describe:oDescribe,draw(canvas,s){drawComplex(canvas,closure([s.id]),s.id,s.sign);}});
const presetNames=['empty','points','tree','loop','disk','surface','filled','disjoint','wireframe'];
const titles=['Empty complex','Four points','Tree','Triangle loop','Filled triangle','Tetrahedral surface','Filled tetrahedron','Two disjoint edges','Tetrahedral wireframe'];
const hInitial=()=>({preset:'loop',field:2,checked:0});
function hValidate(s){if(!fields(s,['preset','field','checked'])||!presetNames.includes(s.preset)||!fieldOK(s.field)||!integer(s.checked,0,15))throw TypeError('invalid homology state');return {...s};}
function witness(s){
  const mask=PRESETS[s.preset],p=s.field;
  if(['loop','disk'].includes(s.preset)){
    const vector=basis(mask,1).map(id=>mod(boundary(7).find(t=>t.id===id)?.coefficient??0,p));
    return {name:'Triangle rim',...classifyChain(mask,1,p,vector)};
  }
  if(['surface','filled'].includes(s.preset)){
    const vector=basis(mask,2).map(id=>mod(boundary(15).find(t=>t.id===id)?.coefficient??0,p));
    return {name:'Tetrahedral surface chain',...classifyChain(mask,2,p,vector)};
  }
  return null;
}
function hTransition(s,a){
  if(!fields(a,['type','value']))throw TypeError('invalid homology action');
  if(a.type==='preset'&&presetNames.includes(a.value))return accept({...s,preset:a.value},'Complex selected; compare its homology.');
  if(a.type==='field'&&fieldOK(a.value))return accept({...s,field:a.value},'Coefficient field changed.');
  if(a.type==='check'&&a.value===null){
    const i=['loop','disk','surface','filled'].indexOf(s.preset),m=homology(PRESETS[s.preset],s.field);
    if(!m.chain)return reject(s,'Chain identity failed.');
    return accept({...s,checked:i<0?s.checked:s.checked|(1<<i)},'Computed ranks and Betti numbers; cycle witness checked where available.');
  }
  return reject(s,'Invalid homology action.');
}
function hDescribe(s){
  const m=homology(PRESETS[s.preset],s.field),w=witness(s);
  return {readout:titles[presetNames.indexOf(s.preset)]+' over '+fieldText(s.field)+'. '+stats(m)+(w?w.name+': cycle '+(w.cycle?'yes':'no')+'; boundary '+(w.boundary?'yes':'no')+'; nontrivial homology class '+(w.nontrivial?'yes':'no')+'. ':'')+'Compared '+[1,2,4,8].filter(v=>s.checked&v).length+'/4 rim/fill cases.',
    done:s.checked===15,explanation:'βk = dim Ck − rank ∂k − rank ∂(k+1). A cycle is in the kernel of the boundary map; a boundary lies in the image of the next map. The triangle rim becomes a boundary when the face is filled. The tetrahedral surface has β2=1 until the 3-simplex is added. A wireframe and a surface with the same vertices and edges need not have the same homology. This is finite-field simplicial homology, not a physical or quantum code claim.',
    actions:[...presetNames.map((p,i)=>action(titles[i],'preset',p,false,s.preset===p)),...fieldActions(s),action('Analyse homology','check')]};
}
export const homologyLab=Object.freeze({manifest:manifest('homology-lab','The Homology Laboratory','Compare cycles, boundaries and Betti numbers as a triangle or tetrahedral surface is filled.'),initial:hInitial,validate:hValidate,transition:hTransition,describe:hDescribe,draw(canvas,s){drawComplex(canvas,PRESETS[s.preset]);}});
