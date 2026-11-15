import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {soundtrack,phrase} from '../js/music.js';
test('original score is bounded, nonoverlapping, deterministic PCM with a valid WAV',()=>{
  const a=soundtrack.renderRange(0,48000),b=soundtrack.renderRange(0,48000);
  assert.deepEqual(a,b);assert.ok(a.some(n=>n!==0));assert.ok(a.every(n=>Math.abs(n)<32767));
  for(let i=0;i<4;i++){const score=phrase(i);assert.ok(score.events.length<=128);const ends=[0,0,0,0];for(const e of score.events){assert.ok(e.sample>=ends[e.channel]);ends[e.channel]=e.sample+e.duration;}}
  const wav=soundtrack.wav(),view=new DataView(wav.buffer);assert.equal(new TextDecoder().decode(wav.slice(0,4)),'RIFF');assert.equal(view.getUint32(24,true),48000);assert.equal(view.getUint32(40,true),soundtrack.frames*2);
  assert.deepEqual(soundtrack.position(0),soundtrack.position(soundtrack.loopTicks));
  console.log('soundtrack WAV SHA-256',createHash('sha256').update(wav).digest('hex'));
});
