// SPDX-License-Identifier: Apache-2.0
import {createRegistry,createSession,parseData,validateRoute,LIMITS} from './registry.js';
import {founding} from './founding.js';
import {volumeExchangeExhibit} from './volume-exchange.js';
import {conversionDesk} from './conversion-desk.js';
import {pythagorasExhibit} from './pythagoras.js';
import {tetraBookExhibit} from './tetrabook.js';
import {quadrayWorkshop,latticeWorkshop,cellWorkshop} from './geometry-workshop.js';
// New reviewed exhibits enter through this list, not through the host's view code.
export const registry=createRegistry([...founding.slice(0,-1),volumeExchangeExhibit,conversionDesk,pythagorasExhibit,tetraBookExhibit,quadrayWorkshop,latticeWorkshop,cellWorkshop,founding.at(-1)]);
export const foundingRoute=validateRoute(registry,{kind:'museum.route.v1',schema:1,id:'concentric.route',title:'Founding collection, Measurement Gallery and Geometry Workshop',exhibits:registry.list.map(m=>m.id)});
// Pure catalogue metadata; route order is never sorted or modified.
export function visitSummary(registry,session,ids){
  let total=0,complete=0;
  const entries=ids.map(id=>{
    const manifest=registry.get(id).manifest,status=session.status(id);
    if(status!=='expedition'){total++;if(status==='complete')complete++;}
    return Object.freeze({manifest,status});
  });
  return Object.freeze({total,complete,entries:Object.freeze(entries)});
}
export function connectMuseum({dialog,stop,returnToStation,download}){
  const $=id=>dialog.querySelector('#'+id),session=createSession(registry);
  let route=foundingRoute,mode='free',generation=0,opener=null;
  const message=s=>{$('museum-feedback').textContent=s;};
  const focusTitle=()=>$('museum-heading').focus();
  const statuses={unvisited:'Not yet visited',visited:'Ready to revisit',complete:'Experiment completed',expedition:'Expedition challenge'};
  const visibleIds=()=>mode==='guided'?route.exhibits:registry.list.map(m=>m.id);
  function updateProgress(){const summary=visitSummary(registry,session,visibleIds());$('museum-progress').textContent=summary.complete+' / '+summary.total+' standalone experiments completed';return summary;}
  function catalogue(){
    session.unmount();$('museum-list').hidden=false;$('museum-lab').hidden=true;
    $('museum-heading').textContent='The Living Museum';$('museum-route').textContent=mode==='guided'?'Guided route: '+route.title:'Free exploration';
    $('museum-list').replaceChildren();$('museum-route-tools').hidden=mode!=='guided';
    const summary=updateProgress();
    for(const [i,{manifest:m,status}] of summary.entries.entries()){
      const card=document.createElement('article'),heading=document.createElement('h3'),brief=document.createElement('p'),meta=document.createElement('p'),state=document.createElement('p'),button=document.createElement('button');
      card.dataset.gallery=m.gallery;card.dataset.status=status;
      meta.className='museum-card-meta';meta.textContent=(mode==='guided'?'STOP '+String(i+1).padStart(2,'0')+' / ':'')+m.gallery.toUpperCase();
      heading.textContent=m.title;brief.textContent=m.question;
      state.className='museum-card-state';state.textContent=statuses[status];
      button.textContent=m.kind==='lab'?'Explore '+m.title:'Return to Concentric finale';button.dataset.exhibit=m.id;
      button.addEventListener('click',()=>enter(m.id));card.append(meta,heading,brief,state,button);$('museum-list').append(card);
    }
  }
  function paint(focusIndex=null){
    const id=session.active,d=registry.get(id),v=session.describe(),m=d.manifest;
    $('museum-heading').textContent=m.title;$('museum-question').textContent=m.question;$('museum-readout').textContent=v.readout;
    $('museum-source').href=m.source;$('museum-explanation').textContent=v.explanation;
    $('museum-explanation').hidden=!$('museum-reveal').checked;
    updateProgress();$('museum-lab-status').textContent=v.done?'Experiment completed':'Explore and test your ideas';
    $('museum-canvas').hidden=typeof d.draw!=='function';if(d.draw)d.draw($('museum-canvas'),session.snapshot());
    $('museum-actions').replaceChildren();
    for(const [index,a] of v.actions.entries()){
      const b=document.createElement('button');b.textContent=a.label;b.disabled=a.disabled;
      if(a.pressed!==null&&a.pressed!==undefined)b.setAttribute('aria-pressed',String(a.pressed));
      b.addEventListener('click',()=>{if(session.active!==id)return;generation++;const wasDone=session.describe().done;const r=session.dispatch(a.action);if(!wasDone&&session.describe().done)$('museum-reveal').checked=true;message(r.message);paint(index);});
      $('museum-actions').append(b);
    }
    const position=route.exhibits.indexOf(id);
    $('museum-stop').textContent=mode==='guided'&&position>=0?'Stop '+(position+1)+' of '+route.exhibits.length:m.gallery;
    $('museum-previous').hidden=mode!=='guided'||position<=0;
    $('museum-next').hidden=mode!=='guided'||position<0||position+1>=route.exhibits.length;
    if(focusIndex!==null){const controls=$('museum-actions').children;(controls[focusIndex]&&!controls[focusIndex].disabled?controls[focusIndex]:[...controls].find(b=>!b.disabled)||$('museum-reset')).focus();}
  }
  function enter(id){
    generation++;
    const d=registry.get(id);if(d.manifest.kind==='expedition'){close(true);return;}
    session.mount(id);$('museum-list').hidden=true;$('museum-lab').hidden=false;$('museum-route-tools').hidden=true;
    $('museum-reveal').checked=session.describe().done===true;message('Independent experiment. Expedition progress is unchanged.');paint();focusTitle();
  }
  function close(toStation=false){
    generation++;session.unmount();dialog.close();stop();
    if(toStation)returnToStation();else opener?.focus();
  }
  function open(source){
    if(dialog.open)return;opener=source;stop();catalogue();message('Choose an exhibit. All experiments can be revisited.');dialog.showModal();focusTitle();
  }
  $('museum-close').addEventListener('click',()=>close());
  dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
  $('museum-back').addEventListener('click',()=>{generation++;catalogue();message('Returned to catalogue.');focusTitle();});
  $('museum-mode').addEventListener('change',e=>{generation++;mode=e.target.value==='guided'?'guided':'free';catalogue();message('Visitor route changed.');});
  $('museum-reset').addEventListener('click',()=>{generation++;session.reset();$('museum-reveal').checked=false;message('Experiment reset.');paint();});
  $('museum-reveal').addEventListener('change',()=>paint());
  $('museum-previous').addEventListener('click',()=>{const n=route.exhibits.indexOf(session.active);if(mode==='guided'&&n>0)enter(route.exhibits[n-1]);});
  $('museum-next').addEventListener('click',()=>{const n=route.exhibits.indexOf(session.active);if(mode==='guided'&&n>=0&&n+1<route.exhibits.length)enter(route.exhibits[n+1]);});
  $('museum-route-export').addEventListener('click',()=>{download(JSON.stringify(route,null,2),'museum-route.json','application/json');message('Route downloaded.');});
  $('museum-route-default').addEventListener('click',()=>{generation++;route=foundingRoute;catalogue();message('Founding route restored. Lab progress is unchanged.');focusTitle();});
  $('museum-export').addEventListener('click',()=>{download(JSON.stringify(session.export(),null,2),'museum-exhibit.json','application/json');message('Exhibit downloaded.');});
  $('museum-load').addEventListener('click',()=>{$('museum-file').value='';$('museum-file').click();});
  $('museum-file').addEventListener('change',async()=>{
    const f=$('museum-file').files[0],ticket=++generation;if(!f)return;
    try{
      if(f.size>LIMITS.bytes)throw new RangeError('64 KiB maximum');
      const record=parseData(await f.text());if(ticket!==generation||!dialog.open)return;
      if(record.kind==='museum.route.v1'){route=validateRoute(registry,record);mode='guided';$('museum-mode').value=mode;catalogue();message('Route loaded.');focusTitle();}
      else{session.restore(record);$('museum-list').hidden=true;$('museum-lab').hidden=false;$('museum-route-tools').hidden=true;$('museum-reveal').checked=session.describe().done===true;paint();message('Exhibit restored.');focusTitle();}
    }catch(error){if(ticket===generation&&dialog.open)message('Record rejected: '+error.message+'. Existing progress is unchanged.');}
  });
  return Object.freeze({open});
}
