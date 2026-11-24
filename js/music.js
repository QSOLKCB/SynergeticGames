// SPDX-License-Identifier: Apache-2.0
// Original score: "A Small Department on a Very Large Planet".
// Four integer PCM lanes. No third-party melodies, recordings or samples.
import {createSoundtrack} from '../vendor/vanillajs/modules/soundtrack/index.js';
import {createSound2D} from '../vendor/vanillajs/modules/audio2d/index.js';
import {createSoundtrackPlayer,createEffectPlayer} from '../vendor/vanillajs/api/audio/index.js';
const melody=[0,2,4,7,4,2,9,7,5,4,2,0,2,5,4,7];
const pitches=[262,294,330,349,392,440,494,524,588,660];
export function phrase(index){
  const step=12000,events=[],roots=[131,110,87,98],root=roots[index];
  const add=(sample,duration,channel,frequency,gain,wave,seed=0)=>events.push({id:events.length+1,sample,duration,channel,frequency,gain,wave,seed});
  for(let i=0;i<16;i++){
    const at=i*step;
    add(at,step-600,0,i%4===3?Math.floor(root*3/2):root,2400,'triangle');
    if(i!==7&&i!==15)add(at,9000,1,pitches[melody[(i+index*3)%16]],1400,'triangle');
    if(i%4===0)add(at,step*3,2,root*3,700,'saw');
    add(at,i%4===0?5500:1800,3,i%4===0?65:2400,i%4===0?2600:480,i%4===0?'triangle':'noise',0xc0ffee+index*16+i);
  }
  return {frames:step*16,events};
}
export const soundtrack=createSoundtrack({phrases:Array.from({length:4},(_,i)=>phrase(i))});
function cueScore(notes,{gap=3600,duration=6500,gain=1800}={}){
  return createSound2D({frames:gap*(notes.length-1)+duration,events:notes.map((frequency,i)=>({
    id:i+1,sample:i*gap,duration,channel:i%4,frequency,gain,wave:'triangle'}))});
}
// Each cue is an original bounded PCM score; no randomness or device clock in the notes.
export const soundCues=Object.freeze({
  select:cueScore([660],{duration:2200,gain:1100}),
  connect:cueScore([524,784],{gap:1800,duration:4300,gain:1500}),
  inspect:cueScore([392,524,660],{gap:2400,gain:1400}),
  retry:cueScore([294,262],{gap:4200,duration:5000,gain:1200}),
  switch:cueScore([440,588],{gap:2600,duration:4000,gain:1300}),
  complete:cueScore([524,660,784,1048],{gap:4800,duration:12000,gain:2100}),
  victory:cueScore([392,524,660,784,1048,1318],{gap:7200,duration:18000,gain:2100})
});
export function audioSystem(report){
  let context=null,player=null,effects=null,enabled=false,failed=false,attempt=0;
  function fail(error){
    failed=true;attempt++;
    try{player?.dispose();}catch{}
    try{effects?.dispose();}catch{}
    try{context?.close()?.catch(()=>{});}catch{}
    context=null;player=null;effects=null;
    report('Audio unavailable in this session. You can retry Sound.');console.warn('Concentric audio:',error);
  }
  return {
    async toggle(){
      const current=++attempt;enabled=!enabled;failed=false;
      if(!enabled){this.stop();return false;}
      try{
        if(!context){context=new (globalThis.AudioContext||globalThis.webkitAudioContext)();player=createSoundtrackPlayer(context,soundtrack);effects=createEffectPlayer(context);}
        context.resume().catch(error=>{if(current===attempt)fail(error);});
      }catch(error){fail(error);}
      return enabled;
    },
    sync(tick,running){if(enabled&&!failed)try{player?.sync(tick,running);}catch(error){fail(error);}},
    cue(kind){if(enabled&&!failed&&soundCues[kind])try{effects?.play(soundCues[kind]);}catch(error){fail(error);}},
    reward(){this.cue('complete');},
    stop(){try{player?.stop();effects?.stopAll();}catch(error){fail(error);}},
    get enabled(){return enabled;}
  };
}
