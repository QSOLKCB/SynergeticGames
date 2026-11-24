// SPDX-License-Identifier: Apache-2.0
import {CONFIG,HISTORY_LIMIT,validateResearchState,runExperiment} from './research-model.js';
import {researchEvidence} from './research-evidence.js';
import {fields,action,accept,reject,frame,label} from './measurement-tools.js';
const definitions=[
  ['quadrature','quadrature-bench','The Quadrature Bench','Compare midpoint and trapezoid estimates of polynomial integrals against exact fractions.','https://dlmf.nist.gov/3.5'],
  ['oscillator','oscillator-lab','The Oscillator Laboratory','Compare Euler and symplectic Euler against an analytic harmonic oscillator; inspect energy and refinement error.','https://openstax.org/books/university-physics-volume-1/pages/15-1-simple-harmonic-motion'],
  ['inference','inference-sweep','The Inference Sweep','Sweep all 81 prior combinations and distinguish converged messages from accurate marginals and undefined posteriors.','https://arxiv.org/abs/2209.05464']
];
const titles={midpoint:'Midpoint',trapezoid:'Trapezoid',euler:'Explicit Euler',symplectic:'Symplectic Euler',tree:'Parity tree',tetrahedron:'Tetrahedral loop',contradiction:'Contradictory cycle'};
const fmt=n=>n===null?'undefined':n.toExponential(4);
function makeLab(kind,id,title,question,source){
  const c=CONFIG[kind],initial=()=>({selected:{method:c.methods[0],parameter:c.parameters[0]},history:[]});
  const validate=s=>validateResearchState(kind,s);
  function transition(s,a){
    if(!fields(a,['type','value']))throw TypeError('invalid research action');
    if(a.type==='method'&&c.methods.includes(a.value))return accept({...s,selected:{...s.selected,method:a.value}},'Method selected; previous runs retained.');
    if(a.type==='parameter'&&c.parameters.includes(a.value))return accept({...s,selected:{...s.selected,parameter:a.value}},'Parameter selected; previous runs retained.');
    if(a.type==='run'&&a.value===null&&s.history.length<HISTORY_LIMIT){
      const result=runExperiment(kind,s.selected);
      return accept({...s,history:[...s.history,{...s.selected}]},'Run recorded: '+result.status+'. Failed and inconclusive rows are retained.');
    }
    return reject(s,s.history.length===HISTORY_LIMIT?'Log full. Export evidence before resetting.':'Invalid research action.');
  }
  const parameterLabel=n=>kind==='quadrature'?'Integrand x^'+n:kind==='oscillator'?'Final time '+n:'Round budget '+n;
  function describe(s){
    const last=s.history.length?runExperiment(kind,s.history.at(-1)):null;
    let readout='Selected: '+titles[s.selected.method]+'; '+parameterLabel(s.selected.parameter)+'. Runs retained '+s.history.length+'/'+HISTORY_LIMIT+'. ';
    if(last){
      readout+='Last run: '+titles[last.settings.method]+'; '+parameterLabel(last.settings.parameter)+'. Outcome '+last.status+'. ';
      if(kind==='inference'){
        const m=last.rows[0];
        readout+='81 cases; converged '+m.converged+'; accurate '+m.accurate+'; converged but wrong '+m.convergedWrong+'; undefined exact posterior '+m.undefinedPosterior+'; undefined BP '+m.undefinedBP+'; max marginal error '+fmt(m.maximumError)+'.';
      }else readout+=last.rows.map(r=>'n='+r.n+' error '+fmt(r.error)+' '+r.status+(kind==='quadrature'?' (estimate '+r.estimate+')':' (energy drift '+fmt(r.energyError)+')')).join('; ')+'.';
    }else readout+='Run the bounded experiment. Accuracy failures are observations, not visitor failures.';
    return {readout,done:s.history.length>0,
      explanation:'All results are recomputed deterministically from recorded settings. Tolerance '+c.tolerance+'; '+c.units+'. '+(kind==='quadrature'?'Integrate x² or x⁴ from 0 to 1; exact reference 1/(power+1). Each resolution is evaluated independently.':kind==='oscillator'?'Initial x=1, v=0; x″=−x. Compare against cos(t), −sin(t); ideal energy 1/2. Explicit Euler advances both from old values; symplectic Euler advances v first.':'Reuse the bounded classical inference model. All 81 priors are enumerated; accuracy and convergence are different. No exact posterior means inconclusive accuracy, not a valid result.')+' The final row determines refinement outcome. Export evidence includes all rows of all retained runs; no silent eviction. Explicit reset clears the log.',
      actions:[...c.methods.map(m=>action(titles[m],'method',m,false,s.selected.method===m)),...c.parameters.map(n=>action(parameterLabel(n),'parameter',n,false,s.selected.parameter===n)),action('Run experiment','run',null,s.history.length===HISTORY_LIMIT)]};
  }
  function draw(canvas,s){
    const {c:ctx,w,h}=frame(canvas);label(ctx,w/2,h*.12,title);
    if(!s.history.length){label(ctx,w/2,h*.48,'Ready to run');return;}
    const m=runExperiment(kind,s.history.at(-1)),rows=m.rows;
    const bars=kind==='inference'?[{name:'Converged',v:rows[0].converged/81},{name:'Accurate',v:rows[0].accurate/81},{name:'Undefined exact',v:rows[0].undefinedPosterior/81}]:rows.map(r=>({name:'n='+r.n,v:r.error/Math.max(...rows.map(x=>x.error),1e-15),status:r.status}));
    bars.forEach((b,i)=>{const y=h*(.22+i*.125);label(ctx,w*.13,y+12,b.name);ctx.fillStyle='#203d46';ctx.fillRect(w*.25,y,w*.62,20);ctx.fillStyle=b.status==='FAIL'?'#f6b754':'#66d9cd';ctx.fillRect(w*.25,y,w*.62*b.v,20);});
    label(ctx,w/2,h*.94,kind==='inference'?'Fraction of 81 cases':'Relative error magnitude · '+m.status);
  }
  return Object.freeze({manifest:Object.freeze({schema:1,id:'research.'+id,version:1,title,gallery:'Research annex',kind:'lab',question,source}),initial,validate,transition,describe,draw,evidence:s=>researchEvidence(kind,s)});
}
export const researchLabs=Object.freeze(definitions.map(args=>makeLab(...args)));
