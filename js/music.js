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
const chime=createSound2D({frames:24000,events:[
  {id:1,sample:0,duration:16000,channel:0,frequency:524,gain:3000,wave:'triangle'},
  {id:2,sample:6000,duration:16000,channel:1,frequency:660,gain:2400,wave:'triangle'},
  {id:3,sample:12000,duration:12000,channel:2,frequency:784,gain:2200,wave:'triangle'}]});
export function audioSystem(report){
  let context=null,player=null,effects=null,enabled=false,failed=false;
  function fail(error){try{player?.stop();effects?.stopAll();}catch{}failed=true;report('Audio unavailable in this session. You can retry Sound.');console.warn('Concentric audio:',error);}
  return {
    async toggle(){
      enabled=!enabled;failed=false;
      if(!enabled){this.stop();return false;}
      try{
        if(!context){context=new (globalThis.AudioContext||globalThis.webkitAudioContext)();player=createSoundtrackPlayer(context,soundtrack);effects=createEffectPlayer(context);}
        await context.resume();
      }catch(error){fail(error);}
      return enabled;
    },
    sync(tick,running){if(enabled&&!failed)try{player?.sync(tick,running);}catch(error){fail(error);}},
    reward(){if(enabled&&!failed)try{effects?.play(chime);}catch(error){fail(error);}},
    stop(){try{player?.stop();effects?.stopAll();}catch(error){fail(error);}},
    get enabled(){return enabled;}
  };
}
