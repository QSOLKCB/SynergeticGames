// SPDX-License-Identifier: Apache-2.0
import {createGame,applyLabAction,completed,validateSave,EDGES} from '../game.js';
import {EXHIBITS,DIRECTIONS,GEO,SOURCE} from '../world.js';
import {drawLab} from '../render.js';
import {tetrahedralGraph} from './topology.js';
const btn=(label,type,value=null,disabled=false,pressed=null)=>({label,action:{type,value},disabled,pressed});
const dataKeys=(s,keys)=>s&&typeof s==='object'&&!Array.isArray(s)&&Object.keys(s).length===keys.length&&keys.every(k=>Object.hasOwn(s,k));
function gameFor(id,lab){const s=createGame();s.labs[id]=structuredClone(lab);return s;}
function makeLab(e,gallery,describe){
  const id=e.id,initial=()=>({lab:createGame().labs[id],selected:null});
  function validate(s){
    if(!dataKeys(s,['lab','selected'])||(id==='volume'&&!dataKeys(s.lab,['stage','units'])))throw new TypeError('invalid lab fields');
    const g=validateSave({kind:'concentric.save.v1',state:gameFor(id,s.lab)});
    if(s.selected!==null&&(id!=='ivm'||!Number.isInteger(s.selected)||s.selected<0||s.selected>=12||g.labs.ivm.includes(Math.min(s.selected,DIRECTIONS[s.selected].opposite))))throw new TypeError('invalid selected direction');
    return {lab:g.labs[id],selected:s.selected};
  }
  return {
    manifest:{schema:1,id:'concentric.'+id,version:1,title:e.name,gallery,kind:'lab',question:e.brief,source:SOURCE+'#/article/'+e.article},
    initial,validate,
    transition(s,a){
      if(!dataKeys(a,['type','value']))throw new TypeError('invalid action');
      const g=gameFor(id,s.lab);let selected=s.selected,result;
      if(id==='ivm'&&a.type==='select'){
        const v=a.value;
        if(!Number.isInteger(v)||v<0||v>=12||completed(g,id)||g.labs.ivm.includes(Math.min(v,DIRECTIONS[v].opposite)))return {state:s,ok:false,message:'Choose an unused direction.'};
        if(selected===null)return {state:{lab:s.lab,selected:v},ok:true,message:'Now choose its opposite.'};
        if(selected===v)return {state:{lab:s.lab,selected:null},ok:true,message:'Selection cleared.'};
        result=applyLabAction(g,id,'pair',[selected,v]);selected=null;
      }else{
        if(!['edge','add','check','subtract'].includes(a.type))return {state:s,ok:false,message:'Unsupported action.'};
        result=applyLabAction(g,id,a.type,a.value);
      }
      return {state:{lab:g.labs[id],selected},...result};
    },
    describe(s){const done=completed(gameFor(id,s.lab),id);return {...describe(s,done),done,explanation:e.fact};},
    draw(canvas,s){drawLab(canvas,id,gameFor(id,s.lab),.65);}
  };
}
const descriptions={
  tetra:(s,done)=>{const g=tetrahedralGraph(s.lab);return {readout:g.edges+' / 6 struts · '+g.components+' connected component(s) · '+String(g.triangles)+' graph triangles',actions:EDGES.map(e=>btn('Join '+e,'edge',e,s.lab.includes(e)))};},
  volume:(s,done)=>({readout:done?'Calibrated: 1 : 4 : 20 tetravolumes':(s.lab.stage===0?'Octahedron':'Vector equilibrium')+' · your counter: '+s.lab.units+' · equal edge lengths',actions:[btn('+1 tetrahedron','add',1,done),btn('+4 octahedron','add',4,done),btn('−1 unit','add',-1,done),btn('−4 units','add',-4,done),btn('Compare volumes','check',null,done)]}),
  ivm:(s,done)=>({readout:s.lab.length+' / 6 opposite pairs · '+(s.selected===null?'choose a direction':'selected '+(s.selected+1)),actions:DIRECTIONS.map((d,i)=>btn('Point '+(i+1)+' ('+d.vector.map(x=>Math.round(x*Math.SQRT2)).join(', ')+')','select',i,s.lab.includes(Math.min(i,d.opposite)),s.selected===i))}),
  quadray:(s,done)=>({readout:'['+s.lab.join(', ')+'] → XYZ ['+GEO.quadrayToXYZ(s.lab).map(v=>v.toFixed(3)).join(', ')+']',actions:[btn('Subtract 1 from all four','subtract',null,done)]})
};
export const founding=Object.freeze([
  ...EXHIBITS.map(e=>makeLab(e,e.id==='volume'?'Measurement':'Geometry',descriptions[e.id])),
  {manifest:{schema:1,id:'concentric.engine',version:1,title:'The Concentric Engine',gallery:'Shared perspectives',kind:'expedition',question:'Restore all four experiments and bring Pip and Mica into mutual visibility and alignment. The relay is a fictional mechanic.',source:'https://github.com/RyanJBuchanan/RayShare'}}
]);
