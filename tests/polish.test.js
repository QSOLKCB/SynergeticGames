import test from 'node:test';
import assert from 'node:assert/strict';
import {createRegistry,createSession} from '../js/museum/registry.js';
test('completion cache is per immutable state and refreshes after reset, dispatch and restore',()=>{
  let calls=0;
  const d={manifest:{schema:1,id:'test.cache',version:1,title:'Cache',gallery:'Test',kind:'lab',question:'Count?',source:'https://example.invalid'},initial:()=>({n:0}),validate:s=>({n:s.n}),transition:s=>({state:{n:s.n+1},ok:true,message:'ok'}),describe:s=>{calls++;return {done:s.n>0};}};
  const s=createSession(createRegistry([d]));s.mount('test.cache');
  assert.equal(s.status('test.cache'),'visited');assert.equal(s.status('test.cache'),'visited');assert.equal(calls,1);
  s.dispatch({});assert.equal(s.status('test.cache'),'complete');assert.equal(calls,2);const saved=s.export();
  s.reset();assert.equal(s.status('test.cache'),'visited');assert.equal(calls,3);
  s.restore(saved);assert.equal(s.status('test.cache'),'complete');assert.equal(calls,4);
  s.describe().done=false;assert.equal(s.status('test.cache'),'complete');assert.equal(calls,5);
});
