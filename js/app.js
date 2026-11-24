// SPDX-License-Identifier: Apache-2.0
import {FixedClock} from '../vendor/vanillajs/modules/time/index.js';
import {createDisplayController} from '../vendor/vanillajs/api/display/index.js';
import {angleDifference} from '../vendor/rayshare/raycast.js';
import {createGame,step,seals,completed,nearestExhibit,linkStatus,labAction,switchProbe,facePartner,saveRecord,validateSave,EDGES,MAX_TICK} from './game.js';
import {EXHIBITS,DIRECTIONS,GEO,SOURCE,CORE} from './world.js';
import {createRenderer,drawLab} from './render.js';
import {audioSystem,soundtrack} from './music.js';
import {connectMuseum} from './museum/catalogue.js';
import {applyMuseumIdentity} from './museum/museum-config.js';
import {downloadFile as download} from './museum/browser-io.js';
applyMuseumIdentity(document);
const $=id=>document.getElementById(id),STORAGE='concentric.expedition.v1';
let state=createGame(),started=false,paused=false,labId=null,pair=null,victoryShown=false,importGeneration=0;
const keyboard=new Set(),touches=new Map();let drag=null;
const clock=new FixedClock({step:1/60,maxFrame:.1,maxSteps:6});
const renderer=createRenderer($('world'),$('map'));
const status=message=>{$('status').textContent=message;};
const audio=audioSystem(status);
const reducedQuery=matchMedia('(prefers-reduced-motion: reduce)');$('motion').checked=reducedQuery.matches;
let lastRender=0,lastHUD='',lastTime=performance.now();
function blocked(){return !started||paused||$('lab').open||$('notebook').open||$('museum').open||!$('victory').hidden;}
function clearInput(){keyboard.clear();touches.clear();drag=null;state.sync=state.won?120:0;}
function stopTime(){clearInput();clock.setPaused(true);audio.stop();}
const display=createDisplayController({root:document.documentElement,initial:'page',onTransition:stopTime,onChange(view){
  document.body.dataset.view=view.mode;
  $('view-mode').textContent=view.windowed==='fit'?'Page view':'Fit window';
  $('view-mode').setAttribute('aria-pressed',String(view.windowed==='fit'));
  $('fullscreen').textContent=view.fullscreen?'Exit fullscreen':'Fullscreen ⛶';
  $('view-mode').disabled=view.pending;$('fullscreen').disabled=view.pending;
  if(view.message)status(view.message);
}});
$('view-mode').addEventListener('click',async()=>{await display.setMode(display.snapshot().windowed==='fit'?'page':'fit');if(started)focusWorld();});
$('fullscreen').addEventListener('click',async()=>{const view=display.snapshot();await display.setMode(view.fullscreen?view.windowed:'fullscreen');if(started)focusWorld();});
function saveLocal(){try{localStorage.setItem(STORAGE,JSON.stringify(saveRecord(state)));return true;}catch{status('Local saving is unavailable. Use Save to download your expedition.');return false;}}
function focusWorld(){$('world').focus({preventScroll:true});}
function updateTools(){for(const id of ['pause','switch','face'])$(id).disabled=!started;}
function begin(){started=true;paused=false;$('intro').hidden=true;$('paused').hidden=true;updateTools();focusWorld();}
function setPause(value){if(!started)return;paused=value;$('paused').hidden=!value;$('pause').textContent=value?'Resume':'Pause P';stopTime();if(value){if(!$('museum').open)$('resume').focus();}else focusWorld();}
function newExpedition(){
  importGeneration++;stopTime();state=createGame();victoryShown=false;lastHUD='';$('victory').hidden=true;$('confirm-restart').hidden=true;
  $('notebook').close();begin();saveLocal();status('New expedition. The Department has misplaced everything again.');
}
function openNotes(){stopTime();$('confirm-restart').hidden=true;$('notebook').showModal();}
function openLab(){
  if(blocked())return;const exhibit=nearestExhibit(state);if(!exhibit)return;
  labId=exhibit.id;pair=null;stopTime();$('lab-title').textContent=exhibit.name;$('lab-brief').textContent=exhibit.brief;
  $('lab-source').href=SOURCE+'#/article/'+exhibit.article;
  $('lab-feedback').textContent=completed(state,labId)?exhibit.fact:'Try a connection. You can experiment without losing progress.';
  $('lab-feedback').dataset.tone='neutral';buildLab();$('lab').showModal();audio.cue('inspect');updateHUD(true);
}
function closeLab(){$('lab').close();labId=null;pair=null;clearInput();saveLocal();focusWorld();}
function labButton(text,action,value,disabled=false,key=text){
  const b=document.createElement('button');b.textContent=text;b.disabled=disabled;b.dataset.key=key;
  b.addEventListener('click',()=>performLab(action,value,key));return b;
}
function performLab(action,value,key){
  let result;
  if(labId==='ivm'&&action==='select'){
    if(pair===null){pair=value;$('lab-feedback').textContent=`Direction ${value+1} selected. Now choose its opposite.`;$('lab-feedback').dataset.tone='neutral';audio.cue('select');buildLab(key);return;}
    if(pair===value){pair=null;buildLab(key);return;}
    result=labAction(state,labId,'pair',[pair,value]);pair=null;
  }else result=labAction(state,labId,action,value);
  const restored=completed(state,labId);
  $('lab-feedback').textContent=result.message;$('lab-feedback').dataset.tone=result.ok?(restored?'complete':'neutral'):'retry';
  audio.cue(result.ok?(restored?'complete':'connect'):'retry');if(result.ok)saveLocal();
  buildLab(key);updateHUD(true);
}
function buildLab(focusKey){
  const controls=$('lab-controls');controls.replaceChildren();
  if(labId==='tetra'){
    $('lab-readout').textContent=`${state.labs.tetra.length} / 6 struts · 4 vertices · close every triangular face`;
    for(const edge of EDGES)controls.append(labButton('Join '+edge,'edge',edge,state.labs.tetra.includes(edge)));
  }else if(labId==='volume'){
    const {stage,units}=state.labs.volume;
    $('lab-readout').textContent=stage===2?'Calibrated: tetrahedron 1 · octahedron 4 · vector equilibrium 20':
      `${stage===0?'Octahedron: 4':'Vector equilibrium: 20'} tetravolumes · your counter: ${units} · equal edge lengths`;
    for(const [label,value] of [['+1 tetrahedron',1],['+4 octahedron',4],['−1 unit',-1],['−4 units',-4]])controls.append(labButton(label,'add',value,stage===2));
    const check=labButton('Compare volumes','check',null,stage===2);check.className='primary';controls.append(check);
  }else if(labId==='ivm'){
    $('lab-readout').textContent=`${state.labs.ivm.length} / 6 opposite pairs · 12 directions · their vector sum is zero`;
    DIRECTIONS.forEach((direction,i)=>{
      const done=state.labs.ivm.includes(Math.min(i,direction.opposite));
      const b=labButton(`Point ${i+1}`,'select',i,done);b.setAttribute('aria-pressed',String(pair===i));
      const v=direction.vector.map(n=>Math.round(n*Math.SQRT2));b.title=`Direction (${v.join(', ')}) / √2`;controls.append(b);
    });
  }else if(labId==='quadray'){
    const q=state.labs.quadray,xyz=GEO.quadrayToXYZ(q);
    $('lab-readout').textContent=`[${q.join(', ')}] → XYZ [${xyz.map(n=>n.toFixed(3)).join(', ')}]`;
    controls.append(labButton('Subtract 1 from all four','subtract',null,completed(state,labId)));
  }
  if(completed(state,labId)){
    const done=document.createElement('button');done.textContent='Exhibit restored — back to station';done.className='primary';done.addEventListener('click',closeLab);controls.append(done);
    if(focusKey)done.focus();
  }else if(focusKey){
    const match=[...controls.children].find(b=>b.dataset.key===focusKey&&!b.disabled);
    (match||controls.querySelector('button:not(:disabled)'))?.focus();
  }
}
function updateHUD(force=false){
  const nearest=nearestExhibit(state),link=linkStatus(state),count=seals(state);
  const goal=EXHIBITS.find(e=>!completed(state,e.id))||{...CORE,name:'Concentric Engine'},p=state.probes[state.active];
  const bearing=angleDifference(Math.atan2(goal.y-p.y,goal.x-p.x),p.angle);
  const arrow=['↑','↗','→','↘','↓','↙','←','↖'][(Math.round(bearing/(Math.PI/4))+8)%8];
  $('wayfinder').hidden=blocked()||!!nearest||state.won;
  $('wayfinder-arrow').textContent=arrow;$('wayfinder-target').textContent=goal.name;
  $('world').dataset.position=JSON.stringify(state.probes[state.active]);$('world').dataset.tick=String(state.tick);$('world').dataset.seals=String(count);
  const key=JSON.stringify([nearest?.id,count,state.active,link,state.sync,state.won,blocked()]);if(key===lastHUD&&!force)return;lastHUD=key;
  $('seal-count').textContent=`0${count} / 04`;$('probe-label').textContent=state.active===0?'PIP · 01':'MICA · 02';
  $('objective').textContent=state.won?'The whole is back.':count===4?'Two views. One connection.':'Restore the connections.';
  $('objective-detail').textContent=state.won?'All exhibits restored. Wander, revisit the experiments, or save your expedition.':count===4?
    'Park both probes near the engine. Q switches, F faces the partner. Face each other, then hold Space to link.':'Visit the four coloured exhibits. Each one is a small experiment you can solve by doing.';
  $('checklist').replaceChildren(...EXHIBITS.map((e,i)=>{const li=document.createElement('li');const n=document.createElement('span');n.className='number';n.textContent=String(i+1).padStart(2,'0');
    const label=document.createElement('span');label.className='check-label';label.textContent=e.short+' · '+['Tetrahedron','Tetravolume','12 neighbours','Quadray'][i];
    const done=document.createElement('span');done.className='done';done.textContent=completed(state,e.id)?'✓':'○';done.setAttribute('aria-label',completed(state,e.id)?'restored':'not restored');li.append(n,label,done);return li;}));
  const ready=!!nearest&&!blocked();
  $('inspect').disabled=!ready;$('interaction').dataset.ready=String(ready);$('inspect-hint').hidden=!ready;
  $('inspect').querySelector('small').textContent=ready?'Open experiment ↗':'Move closer';
  $('interaction-kicker').textContent=ready?(completed(state,nearest.id)?'EXHIBIT RESTORED · REVISIT':'EXPERIMENT IN REACH'):count===4?'THE FINAL CONNECTION':'EXPLORE THE STATION';
  $('prompt').textContent=nearest?nearest.name:count===4&&!state.won?'Both probes near the core':'Follow a coloured floor trail.';
  $('interaction-help').textContent=ready?'Press E or tap the gold button to inspect.':count===4&&!state.won?'Q switches · F faces your partner · hold Space to link.':'Inspect lights up when you reach an exhibit.';
  $('link-label').textContent=link.linked?(link.near?'Facing · near core':'Facing · return to core'):'Face your partner';
  $('sync-progress').value=state.sync;
  $('world').dataset.position=JSON.stringify(state.probes[state.active]);$('world').dataset.tick=String(state.tick);$('world').dataset.seals=String(count);
}
const museum=connectMuseum({dialog:$('museum'),stop:stopTime,returnToStation:()=>{if(!started)begin();else if(paused)$('resume').focus();else if(!$('victory').hidden)$('continue').focus();else focusWorld();updateHUD(true);},download});
$('museum-open').addEventListener('click',()=>{importGeneration++;museum.open($('museum-open'));});
$('start').addEventListener('click',()=>{begin();updateHUD(true);});
$('pause').addEventListener('click',()=>setPause(!paused));$('resume').addEventListener('click',()=>setPause(false));
$('switch').addEventListener('click',()=>{if(!blocked()){clearInput();switchProbe(state);audio.cue('switch');updateHUD(true);saveLocal();}focusWorld();});
$('face').addEventListener('click',()=>{if(!blocked()){facePartner(state);updateHUD(true);}focusWorld();});
$('inspect').addEventListener('click',openLab);$('close-lab').addEventListener('click',closeLab);
$('lab').addEventListener('cancel',e=>{e.preventDefault();closeLab();});
$('notes').addEventListener('click',openNotes);$('close-notes').addEventListener('click',()=>{$('notebook').close();clearInput();if(started)focusWorld();});
$('notebook').addEventListener('close',clearInput);
$('sound').addEventListener('click',async()=>{const enabled=await audio.toggle();$('sound').textContent=enabled?'Sound on':'Sound off';$('sound').setAttribute('aria-pressed',String(enabled));if(started)focusWorld();});
$('save').addEventListener('click',()=>{try{download(JSON.stringify(saveRecord(state),null,2),'concentric-expedition.json','application/json');status('Expedition downloaded. Load it here to continue.');}catch{status('Could not export this expedition.');}if(started)focusWorld();});
$('load').addEventListener('click',()=>{stopTime();if(started)setPause(true);$('file').value='';$('file').click();});
$('file').addEventListener('change',async()=>{
  const file=$('file').files[0],generation=++importGeneration;if(!file)return;
  try{
    if(file.size>65536)throw new Error('Expedition files must be at most 64 KiB.');
    const candidate=validateSave(JSON.parse(await file.text()));if(generation!==importGeneration)return;
    stopTime();state=candidate;victoryShown=state.won;$('victory').hidden=true;lastHUD='';begin();saveLocal();updateHUD(true);status('Expedition restored. Same geometry, fresh eyes.');
  }catch(error){if(generation===importGeneration)status(`File rejected: ${error.message} Your expedition is unchanged.`);}
});
$('wav').addEventListener('click',()=>{try{download(soundtrack.wav(),'concentric-small-department.wav','audio/wav');status('Original soundtrack downloaded: 48 kHz mono PCM.');}catch{status('Soundtrack export failed; your expedition is safe.');}});
$('restart').addEventListener('click',()=>{$('confirm-restart').hidden=false;$('confirm-restart').focus();});$('confirm-restart').addEventListener('click',newExpedition);
$('continue').addEventListener('click',()=>{$('victory').hidden=true;focusWorld();});
const movement=new Set(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space']);
window.addEventListener('keydown',event=>{
  if(event.target.closest?.('input,textarea,select')||event.target.isContentEditable||$('lab').open||$('notebook').open||$('museum').open)return;
  // Pausing focuses Resume; the same shortcuts must work from that button.
  if(event.code==='KeyP'||event.code==='Escape'){if(!event.repeat&&started){event.preventDefault();setPause(!paused);}return;}
  if(event.target.closest?.('button,a,summary'))return;
  if(blocked())return;
  if(movement.has(event.code)){event.preventDefault();keyboard.add(event.code);}
  if(event.repeat)return;
  if(event.code==='KeyE'){event.preventDefault();openLab();}
  if(event.code==='KeyQ'){event.preventDefault();clearInput();switchProbe(state);audio.cue('switch');updateHUD(true);}
  if(event.code==='KeyF'){event.preventDefault();facePartner(state);}
});
window.addEventListener('keyup',e=>keyboard.delete(e.code));
window.addEventListener('blur',()=>{stopTime();if(started&&!$('lab').open&&!$('notebook').open&&!$('museum').open)setPause(true);});
document.addEventListener('visibilitychange',()=>{if(document.hidden){stopTime();if(started)setPause(true);saveLocal();}});
window.addEventListener('pagehide',()=>{stopTime();saveLocal();});
for(const b of document.querySelectorAll('[data-hold]')){
  b.addEventListener('pointerdown',e=>{e.preventDefault();if(blocked()||e.button>0)return;touches.set(e.pointerId,b.dataset.hold);b.setPointerCapture(e.pointerId);});
  for(const name of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(name,e=>touches.delete(e.pointerId));
}
$('world').addEventListener('pointerdown',e=>{focusWorld();if(blocked()||e.button!==0)return;drag={id:e.pointerId,x:e.clientX};$('world').setPointerCapture(e.pointerId);});
$('world').addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId||blocked())return;const dx=e.clientX-drag.x;drag.x=e.clientX;state.probes[state.active].angle=angleDifference(state.probes[state.active].angle+dx*.006,0);});
for(const name of ['pointerup','pointercancel','lostpointercapture'])$('world').addEventListener(name,e=>{if(drag?.id===e.pointerId)drag=null;});
// Clear held movement when tabbing to a native control; Tab remains accessible.
$('world').addEventListener('blur',clearInput);
try{
  const raw=localStorage.getItem(STORAGE);
  if(raw&&raw.length<=65536){state=validateSave(JSON.parse(raw));$('start').textContent='Continue expedition ↗';status('A saved expedition is ready. Choose Continue expedition.');}
}catch{status('No usable local save. A fresh expedition is ready.');}
function frame(now){
  const elapsed=Math.max(0,(now-lastTime)/1000);lastTime=now;
  const running=!blocked();if(clock.paused===running)clock.setPaused(!running);
  if(running){
    const held=code=>keyboard.has(code)||[...touches.values()].includes(code);
    clock.advance(elapsed,()=>step(state,{forward:Number(held('KeyW')||held('ArrowUp'))-Number(held('KeyS')||held('ArrowDown')),strafe:Number(held('KeyD'))-Number(held('KeyA')),turn:Number(held('ArrowRight'))-Number(held('ArrowLeft')),sync:held('Space')}));
    if(state.won&&!victoryShown){victoryShown=true;stopTime();$('victory').hidden=false;$('continue').focus();saveLocal();audio.cue('victory');}
    if(state.tick===MAX_TICK){setPause(true);status('This expedition reached its 10-hour simulation limit. Save it or start a new one.');}
  }
  audio.sync(state.tick,running&&!state.won);
  if(document.hidden||$('museum').open||$('notebook').open){lastRender=0;}
  else if(now-lastRender>=($('economy').checked?66:33)||lastRender===0){renderer.draw(state,{reduced:$('motion').checked||$('economy').checked,activeExhibit:blocked()?null:nearestExhibit(state)?.id});if(labId&&$('lab').open)drawLab($('lab-canvas'),labId,state,$('motion').checked?.65:now/2200);updateHUD();lastRender=now;}
  requestAnimationFrame(frame);
}
updateHUD(true);requestAnimationFrame(frame);
function resizeWorld(){const canvas=$('world'),rect=canvas.getBoundingClientRect(),width=Math.min($('economy').checked?640:960,Math.round(rect.width));if(width<=0||rect.height<=0)return;const height=Math.max(1,Math.round(width*rect.height/rect.width));if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;lastRender=0;}}
if(typeof ResizeObserver==='function')new ResizeObserver(resizeWorld).observe($('world'));
window.addEventListener('resize',resizeWorld);$('economy').addEventListener('change',resizeWorld);resizeWorld();
if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>status('Offline caching is unavailable. The expedition still runs online.'));
