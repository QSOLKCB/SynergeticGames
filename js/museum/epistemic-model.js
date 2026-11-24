// SPDX-License-Identifier: Apache-2.0
// Finite, deterministic possible-world model. Truth is fixed per trial.
// A possible-world set is not a probability distribution.
const bounded=(v,min,max)=>Number.isSafeInteger(v)&&v>=min&&v<=max;
export const worlds=n=>{if(!bounded(n,1,3))throw RangeError('1..3 bits');return Array.from({length:2**n},(_,i)=>i);};
export const bit=(w,i)=>(w>>i)&1;
export const word=(w,n)=>Array.from({length:n},(_,i)=>bit(w,i)).join('');
export const OBSERVERS=Object.freeze(['Pip','Mica']);
export function observerView(truth,shared,observer){
  if(!bounded(truth,0,3)||!bounded(shared,0,3)||!bounded(observer,0,1))throw RangeError('invalid observer trial');
  // bit i in shared means that observer i has disclosed its original observation.
  const mask=(1<<observer)|shared,known=Array.from({length:2},(_,i)=>mask&(1<<i)?bit(truth,i):null);
  const possible=worlds(2).filter(w=>(w&mask)===(truth&mask));
  return {known,possible};
}
export const CLUES=Object.freeze(['A','B','A XOR B','A again','C']);
export function clueValue(w,id){
  if(!bounded(w,0,7)||!bounded(id,0,4))throw RangeError('invalid clue');
  return id===0||id===3?bit(w,0):id===1?bit(w,1):id===2?bit(w,0)^bit(w,1):bit(w,2);
}
export function evidenceView(truth,sequence){
  if(!bounded(truth,0,7)||!Array.isArray(sequence)||sequence.length>5||!Array.from(sequence).every(i=>bounded(i,0,4))||new Set(sequence).size!==sequence.length)throw RangeError('invalid evidence trial');
  let possible=worlds(3);const trace=[];
  for(const id of sequence){
    const value=clueValue(truth,id),before=possible.length;
    possible=possible.filter(w=>clueValue(w,id)===value);
    trace.push({id,value,before,after:possible.length});
  }
  return {possible,trace};
}
// Toy extensive decision tree: A moves once per stage; B's binary plan determines
// risky payoff 0 or 4, while safe gives 2. A uses maximin, ties choose safe.
// B discloses one distinct truthful commitment before each A move; goal is risky choices.
// The receiver filters by explicit commitments only, not by inference from the sender policy.
export function decision(possible,stage){
  if(!Array.isArray(possible)||possible.length<1||possible.length>4||!Array.from(possible).every(w=>bounded(w,0,3))||new Set(possible).size!==possible.length||!bounded(stage,0,1))throw RangeError('invalid decision set');
  const safe=2,risky=Math.min(...possible.map(w=>4*bit(w,stage)));
  return {safe,risky,action:risky>safe?'risky':'safe'};
}
export function gameTrace(plan,order){
  if(!bounded(plan,0,3)||!Array.isArray(order)||order.length>2||!Array.from(order).every(i=>bounded(i,0,1))||new Set(order).size!==order.length)throw RangeError('invalid disclosure schedule');
  let possible=worlds(2),aTotal=0,bTotal=0;const trace=[];
  for(const [stage,id] of order.entries()){
    const value=bit(plan,id);possible=possible.filter(w=>bit(w,id)===value);
    const d=decision(possible,stage),payoff=d.action==='safe'?2:4*bit(plan,stage);
    aTotal+=payoff;bTotal+=Number(d.action==='risky');
    trace.push({stage,id,value,possible:[...possible],...d,payoff});
  }
  return {trace,aTotal,bTotal,possible};
}
export function compareSchedules(plan){
  const cases=[[0,1],[1,0]].map(order=>({order,...gameTrace(plan,order)}));
  const best=cases[1].bTotal>cases[0].bTotal?cases[1]:cases[0];
  return {cases,bestOrder:best.order,best:best.bTotal,randomNumerator:cases.reduce((sum,c)=>sum+c.bTotal,0),randomDenominator:2};
}
