// SPDX-License-Identifier: Apache-2.0
import {OBSERVERS,CLUES,observerView,evidenceView,gameTrace,compareSchedules,word,bit} from './epistemic-model.js';
import {fields,integer,action,accept,reject,frame,label} from './measurement-tools.js';
const PAPER='https://arxiv.org/abs/2611.17084v1';
const manifest=(id,title,question,source=PAPER)=>Object.freeze({schema:1,id:'information.'+id,version:1,title,gallery:'Information',kind:'lab',question,source});
const names=(set,n)=>set.map(w=>word(w,n)).join(', ');
const seq=(v,max,len)=>Array.isArray(v)&&v.length<=len&&Array.from(v).every(i=>integer(i,0,max))&&new Set(v).size===v.length;
function cards(canvas,possible,n,title,detail){
  const {c,w,h}=frame(canvas),count=2**n,cols=4;
  label(c,w/2,h*.13,title);
  for(let i=0;i<count;i++){
    const x=w*(.06+(i%cols)*.23),y=h*(.24+Math.floor(i/cols)*.25),ww=w*.19,hh=h*.19,ok=possible.includes(i);
    c.fillStyle=ok?'#245c59':'#203d46';c.fillRect(x,y,ww,hh);c.strokeStyle=ok?'#66d9cd':'#50646a';c.strokeRect(x,y,ww,hh);
    label(c,x+ww/2,y+hh*.45,word(i,n),ok?'#eef1dc':'#a1b6b5');
    label(c,x+ww/2,y+hh*.83,ok?'Possible':'Excluded',ok?'#66d9cd':'#a1b6b5');
  }
  label(c,w/2,h*.91,detail);
}
const oInitial=()=>({truth:2,shared:0,observer:0});
function oValidate(s){
  if(!fields(s,['truth','shared','observer'])||!integer(s.truth,0,3)||!integer(s.shared,0,3)||!integer(s.observer,0,1))throw TypeError('invalid observer state');
  return {...s};
}
function oTransition(s,a){
  if(!fields(a,['type','value']))throw TypeError('invalid observer action');
  if(a.type==='trial'&&integer(a.value,0,3))return accept({...oInitial(),truth:a.value},'New trial. Private observations reset.');
  if(a.type==='observer'&&integer(a.value,0,1))return accept({...s,observer:a.value},'Switched viewpoint; the hidden world did not change.');
  if(a.type==='share'&&a.value===null&&!(s.shared&(1<<s.observer)))return accept({...s,shared:s.shared|(1<<s.observer)},'The active observer disclosed its own truthful bit.');
  if(a.type==='rewind'&&a.value===null)return accept({...s,shared:0},'Rewound both observers to their initial private observations.');
  return reject(s,'Choose an unshared observation or a new viewpoint.');
}
function oDescribe(s){
  const v=observerView(s.truth,s.shared,s.observer);
  return {readout:OBSERVERS[s.observer]+' sees A='+ (v.known[0]??'?')+', B='+(v.known[1]??'?')+'. Possible worlds: '+names(v.possible,2)+' ('+v.possible.length+'). Shared observations: '+((s.shared&1)?'A ':'')+((s.shared&2)?'B':'')+(s.shared===0?'none':'')+'.',
    done:s.shared===3,explanation:'Pip privately observes A; Mica privately observes B. A truthful shared observation removes incompatible worlds from the recipient set. Switching observers never changes their knowledge. This is a local teaching simulation: the visitor can inspect both views and exported records contain the scenario, not a security boundary.',
    actions:[action('View Pip','observer',0,false,s.observer===0),action('View Mica','observer',1,false,s.observer===1),action('Share my observation','share',null,!!(s.shared&(1<<s.observer))),action('Rewind disclosures','rewind'),action('Next trial','trial',(s.truth+1)%4)]};
}
export const observerLab=Object.freeze({manifest:manifest('observer-room','The Observer Room','Pip sees bit A; Mica sees bit B. Switch viewpoints and share observations to discover what each can know.','https://github.com/RyanJBuchanan/RayShare'),initial:oInitial,validate:oValidate,transition:oTransition,describe:oDescribe,draw(canvas,s){const v=observerView(s.truth,s.shared,s.observer);cards(canvas,v.possible,2,OBSERVERS[s.observer]+' — information set',v.possible.length+' compatible worlds');}});
const eInitial=()=>({truth:5,sequence:[]});
function eValidate(s){
  if(!fields(s,['truth','sequence'])||!integer(s.truth,0,7)||!seq(s.sequence,4,5))throw TypeError('invalid evidence state');
  return {truth:s.truth,sequence:[...s.sequence]};
}
function eTransition(s,a){
  if(!fields(a,['type','value']))throw TypeError('invalid evidence action');
  if(a.type==='trial'&&integer(a.value,0,7))return accept({truth:a.value,sequence:[]},'New hidden world; observations reset.');
  if(a.type==='undo'&&a.value===null&&s.sequence.length)return accept({...s,sequence:s.sequence.slice(0,-1)},'Rewound the last disclosure.');
  if(a.type==='reveal'&&integer(a.value,0,4)&&!s.sequence.includes(a.value)){
    const sequence=[...s.sequence,a.value],v=evidenceView(s.truth,sequence),last=v.trace.at(-1);
    return accept({...s,sequence},last.before===last.after?'Truthful but redundant: no worlds eliminated.':'Truthful constraint eliminated '+(last.before-last.after)+' worlds.');
  }
  return reject(s,'Choose an unused clue or rewind.');
}
function eDescribe(s){
  const v=evidenceView(s.truth,s.sequence);
  return {readout:'Possible worlds: '+names(v.possible,3)+' ('+v.possible.length+'). '+(v.trace.length?'History: '+v.trace.map(t=>CLUES[t.id]+'='+t.value+' ('+t.before+'→'+t.after+')').join('; '):'No disclosures yet.'),
    done:v.possible.length===1&&v.trace.some(t=>t.before===t.after),
    explanation:'Each clue is generated from the fixed hidden world. The candidate set is an intersection of constraints, so final knowledge does not depend on the order of the same clues. A truthful duplicate or implied XOR can eliminate zero worlds. Intermediate counts can differ. There are no probabilities or belief-propagation messages in this model.',
    actions:[...CLUES.map((c,i)=>action('Reveal '+c,'reveal',i,s.sequence.includes(i))),action('Undo last reveal','undo',null,s.sequence.length===0),action('Next trial','trial',(s.truth+1)%8)]};
}
export const evidenceLab=Object.freeze({manifest:manifest('evidence-ledger','The Evidence Ledger','Reveal truthful clues about three hidden bits. Find a unique world and discover a redundant clue.'),initial:eInitial,validate:eValidate,transition:eTransition,describe:eDescribe,draw(canvas,s){const v=evidenceView(s.truth,s.sequence);cards(canvas,v.possible,3,'Truthful evidence filters worlds',v.possible.length+' of 8 compatible');}});
const gInitial=()=>({plan:3,order:[],compared:false});
function gValidate(s){
  if(!fields(s,['plan','order','compared'])||!integer(s.plan,0,3)||!seq(s.order,1,2)||typeof s.compared!=='boolean'||(s.compared&&s.order.length!==2))throw TypeError('invalid decision trial');
  return {plan:s.plan,order:[...s.order],compared:s.compared};
}
function gTransition(s,a){
  if(!fields(a,['type','value']))throw TypeError('invalid game action');
  if(a.type==='plan'&&integer(a.value,0,3))return accept({plan:a.value,order:[],compared:false},'New public experiment setup; receiver knowledge resets.');
  if(a.type==='reveal'&&integer(a.value,0,1)&&!s.order.includes(a.value))return accept({...s,order:[...s.order,a.value],compared:false},'Truthful commitment disclosed; the simulated receiver now makes an irreversible stage choice.');
  if(a.type==='rewind'&&a.value===null)return accept({...s,order:[],compared:false},'Trial rewound to before any choice.');
  if(a.type==='compare'&&a.value===null&&s.order.length===2)return accept({...s,compared:true},'Both complete disclosure orders enumerated; random means uniform over the two orders.');
  return reject(s,'Finish the two-stage trial before comparing.');
}
function gDescribe(s){
  const m=gameTrace(s.plan,s.order),cmp=s.compared?compareSchedules(s.plan):null;
  const steps=m.trace.map(t=>'Stage '+(t.stage+1)+': reveal B'+(t.id+1)+'='+t.value+'; worlds '+names(t.possible,2)+'; minima safe '+t.safe+', risky '+t.risky+' → '+t.action+' (payoff '+t.payoff+')').join('. ');
  return {readout:'Sender setup B1,B2='+word(s.plan,2)+'. '+(steps||'Receiver starts with four possible plans.')+'. A payoff '+m.aTotal+'; B score '+m.bTotal+'.'+(cmp?' Best order '+cmp.bestOrder.map(i=>'B'+(i+1)).join(' then ')+': '+cmp.best+' risky choices; uniform-order mean '+cmp.randomNumerator+'/'+cmp.randomDenominator+' = '+(cmp.randomNumerator/2)+'. Orders: '+cmp.cases.map(c=>c.order.map(i=>'B'+(i+1)).join('→')+' gives '+c.bTotal).join('; ')+'.':''),
    done:s.compared,explanation:'Toy game, not a reproduction of the paper’s theorem. Two stages: disclose a distinct truthful plan bit, then A chooses safe (2) or risky (4 if that stage bit is 1, otherwise 0). A maximises the minimum payoff over explicitly compatible plans; ties choose safe. B counts risky choices. A does not infer from the disclosure policy itself. The visitor sees the sender setup, but A uses only disclosed bits. The same final knowledge can yield different irreversible choices; uniform random order is an exact average, not sampled. All agents are fictional.',
    actions:[...Array.from({length:4},(_,i)=>action('Plan '+word(i,2),'plan',i,false,s.plan===i)),action('Disclose B1','reveal',0,s.order.includes(0)),action('Disclose B2','reveal',1,s.order.includes(1)),action('Compare all orders','compare',null,s.order.length!==2),action('Rewind trial','rewind')]};
}
function gDraw(canvas,s){
  const {c,w,h}=frame(canvas),m=gameTrace(s.plan,s.order);
  label(c,w/2,h*.12,'Two-stage disclosure experiment');
  for(let i=0;i<2;i++){
    const x=w*(.27+i*.46),t=m.trace[i];
    c.strokeStyle='#66d9cd';c.strokeRect(x-w*.19,h*.24,w*.38,h*.48);
    label(c,x,h*.34,'Stage '+(i+1));
    label(c,x,h*.46,t?'B'+(t.id+1)+' = '+t.value:'Awaiting clue');
    label(c,x,h*.57,t?'A: '+t.action:'No choice');
    label(c,x,h*.66,t?'A payoff '+t.payoff:'');
  }
  label(c,w/2,h*.88,'A payoff '+m.aTotal+' · B risky choices '+m.bTotal);
}
export const disclosureLab=Object.freeze({manifest:manifest('disclosure-theatre','The Disclosure Theatre','Choose when a simulated sender reveals truthful commitments. Compare the receiver’s maximin choices against uniform disclosure order.'),initial:gInitial,validate:gValidate,transition:gTransition,describe:gDescribe,draw:gDraw});
