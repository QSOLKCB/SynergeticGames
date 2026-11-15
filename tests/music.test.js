import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {soundtrack,phrase,audioSystem,soundCues} from '../js/music.js';
test('original score is bounded, nonoverlapping, deterministic PCM with a valid WAV',()=>{
  const a=soundtrack.renderRange(0,48000),b=soundtrack.renderRange(0,48000);
  assert.deepEqual(a,b);assert.ok(a.some(n=>n!==0));assert.ok(a.every(n=>Math.abs(n)<32767));
  for(let i=0;i<4;i++){const score=phrase(i);assert.ok(score.events.length<=128);const ends=[0,0,0,0];for(const e of score.events){assert.ok(e.sample>=ends[e.channel]);ends[e.channel]=e.sample+e.duration;}}
  const wav=soundtrack.wav(),view=new DataView(wav.buffer);assert.equal(new TextDecoder().decode(wav.slice(0,4)),'RIFF');assert.equal(view.getUint32(24,true),48000);assert.equal(view.getUint32(40,true),soundtrack.frames*2);
  assert.deepEqual(soundtrack.position(0),soundtrack.position(soundtrack.loopTicks));
  console.log('soundtrack WAV SHA-256',createHash('sha256').update(wav).digest('hex'));
});
test('interaction cues are distinct deterministic unclipped PCM scores',()=>{
  const hashes=new Set();
  for(const cue of Object.values(soundCues)){
    const a=cue.renderAll(),b=cue.renderAll();assert.deepEqual(a,b);
    assert.ok(a.length>0&&a.length<=96000);assert.ok(a.some(n=>n!==0));assert.ok(a.every(n=>Math.abs(n)<32767));
    hashes.add(createHash('sha256').update(new Uint8Array(a.buffer)).digest('hex'));
  }
  assert.equal(hashes.size,Object.keys(soundCues).length);
});
test('sound can retry after a partially constructed audio device fails',async t=>{
  const previous=Object.getOwnPropertyDescriptor(globalThis,'AudioContext');
  let attempts=0,closed=0,started=0;const messages=[];
  t.mock.method(console,'warn',()=>{});
  class Device {
    constructor(){this.destination={};this.state='running';this.currentTime=0;if(++attempts>1)this.createGain=()=>({gain:{value:1},connect(){},disconnect(){}});}
    createBuffer(_channels,frames){return {getChannelData:()=>new Float32Array(frames)};}
    createBufferSource(){return {connect(){},disconnect(){},start(){started++;},stop(){}};}
    async resume(){}
    async close(){closed++;}
  }
  Object.defineProperty(globalThis,'AudioContext',{configurable:true,value:Device});
  try{
    const audio=audioSystem(message=>messages.push(message));
    await audio.toggle();assert.equal(messages.length,1);
    await audio.toggle();await audio.toggle();audio.sync(0,true);
    assert.equal(attempts,2);assert.equal(closed,1);assert.ok(started>0);audio.stop();
  }finally{if(previous)Object.defineProperty(globalThis,'AudioContext',previous);else delete globalThis.AudioContext;}
});
