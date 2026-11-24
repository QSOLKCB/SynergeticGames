// SPDX-License-Identifier: Apache-2.0
import {graph,exactPosterior,compareInference,validatePriors,MAX_ROUNDS,TOLERANCE,informationUtility} from './inference-model.js';
import {fields,integer,action,accept,reject,frame,label,number} from './measurement-tools.js';
const SOURCE='https://arxiv.org/abs/2209.05464';
const manifest=(id,title,question)=>Object.freeze({schema:1,id:'inference.'+id,version:1,title,gallery:'Inference',kind:'lab',question,source:SOURCE});
const names=['A','B','C','D'],uniform=[2,2,2,2],biased=[3,2,2,2],mixed=[3,1,3,1];
const fmt=x=>x===null?'undefined':x.toFixed(6);
const exactText=m=>m.marginals?m.marginals.map((q,i)=>names[i]+'='+q.toString()).join(', '):'undefined (zero evidence)';
function priorActions(s){return [action('Uniform priors','preset','uniform',false,s.priors.every(v=>v===2)),action('Bias A to 3/4','preset','biased',false,s.priors.every((v,i)=>v===biased[i])),action('Mixed priors','preset','mixed',false,s.priors.every((v,i)=>v===mixed[i])),...names.flatMap((n,i)=>[action(n+' prior − 1/4','prior',2*i,s.priors[i]===1),action(n+' prior + 1/4','prior',2*i+1,s.priors[i]===3)])];}
function changed(s,a){
  if(a.type==='preset'&&['uniform','biased','mixed'].includes(a.value))return [...({uniform,biased,mixed})[a.value]];
  if(a.type==='prior'&&integer(a.value,0,7)){
    const p=[...s.priors],i=Math.floor(a.value/2);p[i]+=a.value%2?1:-1;
    if(integer(p[i],1,3))return p;
  }
  return null;
}
function drawGraph(canvas,kind,exact,bp=null){
  const {c,w,h}=frame(canvas),p=[[w*.19,h*.30],[w*.81,h*.30],[w*.19,h*.68],[w*.81,h*.68]];
  const factors=graph(kind);
  for(const [k,{a,b,parity}] of factors.entries()){
    const x=(p[a][0]+p[b][0])/2+(kind==='tetrahedron'&&a===0&&b===3?-18:kind==='tetrahedron'&&a===1&&b===2?18:0),y=(p[a][1]+p[b][1])/2;
    c.strokeStyle=parity?'#ff8d85':'#628789';c.lineWidth=2;c.beginPath();c.moveTo(...p[a]);c.lineTo(x,y);c.lineTo(...p[b]);c.stroke();
    c.fillStyle=parity?'#83434a':'#245c59';c.fillRect(x-10,y-10,20,20);label(c,x,y+5,String(parity));
    if(bp?.messages[k]){c.fillStyle='#f6b754';c.beginPath();c.arc(x+16,y,3,0,Math.PI*2);c.fill();}
  }
  p.forEach(([x,y],i)=>{
    c.fillStyle='#102c38';c.beginPath();c.arc(x,y,25,0,Math.PI*2);c.fill();c.strokeStyle='#66d9cd';c.stroke();
    label(c,x,y+5,names[i]);
    const v=exact.marginals?number(exact.marginals[i]):null;
    label(c,x,y-33,bp?'BP '+fmt(bp.marginals?.[i]??null):'Exact '+fmt(v),'#f6b754');
  });
  label(c,w/2,h*.94,'Circles: variables · Squares: XOR checks (0 equal, 1 unequal)');
}
const eInitial=()=>({priors:[...biased],evaluated:false});
function eValidate(s){
  if(!fields(s,['priors','evaluated'])||typeof s.evaluated!=='boolean')throw TypeError('invalid exact state');
  return {priors:validatePriors(s.priors),evaluated:s.evaluated};
}
function eTransition(s,a){
  if(!fields(a,['type','value']))throw TypeError('invalid exact action');
  const p=changed(s,a);if(p)return accept({priors:p,evaluated:false},'Prior changed. Recalculate the conditional probabilities.');
  if(a.type==='enumerate'&&a.value===null)return accept({...s,evaluated:true},'All sixteen assignments enumerated with exact rational weights.');
  return reject(s,'Invalid exact action.');
}
function eDescribe(s){
  const m=exactPosterior('tree',s.priors),u=informationUtility();
  return {readout:'Prior P(1): '+s.priors.map(p=>p+'/4').join(', ')+'. '+(s.evaluated?'Evidence Z='+m.evidence.toString()+'; support '+m.support+'/16; posterior P(1): '+exactText(m)+'. P(A=B)='+m.pairEqual[0].toString()+'. Separate uniform-plan disclosure experiment: both first clues give '+u[0].gain.toString()+' bit; mean stage-1 receiver utility B1='+u[0].utility.toString()+', B2='+u[1].utility.toString()+'.':'Enumerate the sixteen assignments.'),
    done:s.evaluated,explanation:'Independent priors multiply. Each equality parity factor has weight 1 if satisfied, else 0. Sum the surviving integer weights, divide by their total for exact rational marginals. Z is the evidence probability before conditioning. Here all four bits agree; singleton marginals do not describe their joint correlation. In a separate uniform-plan Disclosure Theatre benchmark, either first clue halves four equally likely plans (one bit), but the maximin receiver has mean stage-1 utility 3 versus 2. Equal information gain is not equal decision utility.',
    actions:[...priorActions(s),action('Enumerate assignments','enumerate')]};
}
export const exactLab=Object.freeze({manifest:manifest('exact-oracle','The Exact Oracle','Weight sixteen binary assignments, apply three XOR checks and inspect exact posterior fractions.'),initial:eInitial,validate:eValidate,transition:eTransition,describe:eDescribe,draw(canvas,s){const {c,w,h}=frame(canvas),m=exactPosterior('tree',s.priors);label(c,w/2,h*.1,'Sixteen joint assignments');
  for(let i=0;i<16;i++){const x=w*(.06+i%4*.23),y=h*(.16+Math.floor(i/4)*.18),ww=w*.19,hh=h*.15,ok=s.evaluated&&m.weights[i]>0;c.fillStyle=ok?'#245c59':'#203d46';c.fillRect(x,y,ww,hh);label(c,x+ww/2,y+hh*.4,Array.from({length:4},(_,k)=>(i>>k)&1).join(''));label(c,x+ww/2,y+hh*.8,s.evaluated?'Weight '+m.weights[i]:'?');}
  label(c,w/2,h*.94,s.evaluated?'Integer weights / 256 before conditioning':'Predict, then enumerate');}});
const bInitial=()=>({priors:[...biased],rounds:0,compared:false});
function bValidate(s){
  if(!fields(s,['priors','rounds','compared'])||!integer(s.rounds,0,MAX_ROUNDS)||typeof s.compared!=='boolean'||(s.compared&&s.rounds===0))throw TypeError('invalid message state');
  return {priors:validatePriors(s.priors),rounds:s.rounds,compared:s.compared};
}
function bTransition(s,a){
  if(!fields(a,['type','value']))throw TypeError('invalid message action');
  const p=changed(s,a);if(p)return accept({priors:p,rounds:0,compared:false},'Prior changed; messages reset to uniform.');
  if(a.type==='step'&&a.value===null&&s.rounds<MAX_ROUNDS)return accept({...s,rounds:s.rounds+1,compared:false},'One synchronous round applied.');
  if(a.type==='run'&&a.value===null)return accept({...s,rounds:MAX_ROUNDS,compared:false},'Ran the fixed bounded round budget.');
  if(a.type==='compare'&&a.value===null&&s.rounds>0)return accept({...s,compared:true},'Compared with independent exact enumeration.');
  if(a.type==='rewind'&&a.value===null)return accept({...s,rounds:0,compared:false},'Messages reset; priors unchanged.');
  return reject(s,'Invalid message action.');
}
function bpDescription(s,kind){
  const m=compareInference(kind,s.priors,s.rounds),b=m.bp;
  const messages=graph(kind).map(({a,b:dst},k)=>names[a]+'←'+names[dst]+' '+fmt(b.messages[k][0][1])+'; '+names[dst]+'←'+names[a]+' '+fmt(b.messages[k][1][1])).join(' | ');
  return {readout:'Prior P(1): '+s.priors.map(p=>p+'/4').join(', ')+'. Round '+b.rounds+'/'+MAX_ROUNDS+'; residual '+(b.residual===null?'not measured':b.residual.toExponential(3))+'; '+(b.converged?'message convergence':'messages not converged')+'. BP P(1): '+(b.marginals?b.marginals.map((v,i)=>names[i]+'='+fmt(v)).join(', '):'undefined')+'. '+(s.compared?'Exact P(1): '+exactText(m.exact)+'; max marginal error '+fmt(m.error)+'; evidence Z='+m.exact.evidence.toString()+'. '+m.status+'.':'Compare with exact enumeration after a round.')+' Factor messages P(1), recipient←other: '+messages+'.',
    done:s.compared&&(kind==='tree'?m.error!==null&&m.error<=TOLERANCE&&b.converged:s.rounds===MAX_ROUNDS),
    explanation:'Every round computes all variable-to-factor messages from previous factor-to-variable messages, then all factor-to-variable messages from those new variable messages. Normalize each pair; equality passes the other incoming message, inequality swaps it. Uniform initialization, no damping, maximum 32 rounds, residual tolerance 1e-9. '+(kind==='tree'?'On this tree the final marginals agree with exact enumeration.':'On the tetrahedral loop, a small residual need not imply correct marginals. Cycles can repeatedly count correlated information. Compare the exact oracle; convergence is not a certificate of accuracy.'),
    actions:[...priorActions(s),action('Step one round','step',null,s.rounds===MAX_ROUNDS),action('Run 32 rounds','run',null,s.rounds===MAX_ROUNDS),action('Compare exact posterior','compare',null,s.rounds===0),action('Reset messages','rewind')]};
}
function messageLab(kind,id,title,question){return Object.freeze({manifest:manifest(id,title,question),initial:bInitial,validate:bValidate,transition:bTransition,describe:s=>bpDescription(s,kind),draw(canvas,s){const m=compareInference(kind,s.priors,s.rounds);drawGraph(canvas,kind,m.exact,m.bp);}});}
export const treeLab=messageLab('tree','message-tree','The Message Tree','Step normalized sum-product messages along a parity tree, then compare with exact marginals.');
export const loopLab=messageLab('tetrahedron','hidden-tetrahedron','The Hidden Tetrahedron','Run belief propagation around the six edges of a tetrahedron. Does convergence imply correctness?');
const cInitial=()=>({kind:'tree',checked:false});
function cValidate(s){if(!fields(s,['kind','checked'])||!['tree','contradiction'].includes(s.kind)||typeof s.checked!=='boolean')throw TypeError('invalid contradiction state');return {...s};}
function cTransition(s,a){
  if(!fields(a,['type','value']))throw TypeError('invalid contradiction action');
  if(a.type==='kind'&&['tree','contradiction'].includes(a.value))return accept({kind:a.value,checked:false},'Graph changed. Check evidence and messages.');
  if(a.type==='check'&&a.value===null)return accept({...s,checked:true},'Checked exact evidence and bounded BP independently.');
  return reject(s,'Invalid contradiction action.');
}
function cDescribe(s){
  const m=compareInference(s.kind,uniform,MAX_ROUNDS);
  return {readout:s.checked?'Evidence Z='+m.exact.evidence.toString()+'; '+m.exact.support+' compatible assignments; exact posterior '+(m.exact.marginals?'defined':'undefined')+'; BP '+(m.bp.converged?'converged':'not converged')+'; BP P(1) '+(m.bp.marginals?m.bp.marginals.map(fmt).join(', '):'undefined')+'. '+(m.exact.total===0?'Global contradiction: local messages are not a consistency certificate.':'Consistent graph.'):'Check a consistent tree or inconsistent parity cycle.',
    done:s.checked&&s.kind==='contradiction',explanation:'A=B, B=C, A≠C cannot hold simultaneously. Exact evidence is zero; no normalized posterior exists. Uniform BP messages can nevertheless remain fixed on the frustrated cycle. The oracle, not the residual, establishes global inconsistency. These are classical XOR constraints, not a validated quantum decoder.',
    actions:[action('Consistent tree','kind','tree',false,s.kind==='tree'),action('Contradictory cycle','kind','contradiction',false,s.kind==='contradiction'),action('Check consistency','check')]};
}
export const contradictionLab=Object.freeze({manifest:manifest('contradiction-room','The Contradiction Room','Compare zero evidence with local message convergence on an impossible XOR cycle.'),initial:cInitial,validate:cValidate,transition:cTransition,describe:cDescribe,draw(canvas,s){const m=compareInference(s.kind,uniform,s.checked?MAX_ROUNDS:0);drawGraph(canvas,s.kind,m.exact,s.checked?m.bp:null);}});
