// SPDX-License-Identifier: Apache-2.0
// Minimal independent native SDK example; not installed by default.
const valid=n=>Number.isSafeInteger(n)&&n>=0&&n<=6;
export const counterExample=Object.freeze({
  manifest:Object.freeze({schema:1,id:'example.counter',version:1,title:'The Modular Counter',gallery:'Example',kind:'lab',question:'Can you reach 6 using steps of 2?',source:'https://en.wikipedia.org/wiki/Modular_arithmetic'}),
  initial:()=>({n:0}),
  validate(s){if(!s||Object.keys(s).length!==1||!Object.hasOwn(s,'n')||!valid(s.n))throw TypeError('invalid counter state');return {n:s.n};},
  transition(s,a){if(a?.type==='increment'&&a.value===null&&s.n<=4)return {state:{n:s.n+2},ok:true,message:'Added two.'};return {state:s,ok:false,message:'Choose an available step.'};},
  describe(s){return {readout:'Counter: '+s.n,done:s.n===6,explanation:'Three increments of two reach six.',actions:[{label:'Add two',action:{type:'increment',value:null},disabled:s.n>4}]};}
});
