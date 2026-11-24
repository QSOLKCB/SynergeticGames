// SPDX-License-Identifier: Apache-2.0
import {registry} from './catalogue.js';
import {createSession,createRegistry,parseData,validateRoute,LIMITS} from './registry.js';
import {validatePack,packDefinition,TEMPLATE_IDS} from './exhibit-packs.js';
import {verifyResearchEvidence} from './research-evidence.js';
import {applyMuseumIdentity} from './museum-config.js';
const $=id=>document.getElementById(id),message=t=>{$('workshop-status').textContent=t;};
applyMuseumIdentity(document);
let preview=null,activePack=null,stops=[],generation=0;
const option=(label,value)=>{const o=document.createElement('option');o.textContent=label;o.value=value;return o;};
for(const id of TEMPLATE_IDS)$('pack-template').append(option(registry.get(id).manifest.title,id));
for(const m of registry.list)$('route-stop').append(option(m.title,m.id));
function defaultState(){$('pack-initial').value=JSON.stringify(registry.get($('pack-template').value).initial(),null,2);}
function invalidate(){generation++;preview=null;activePack=null;$('preview-actions').replaceChildren();$('preview-readout').textContent='Validate and preview the revised pack.';$('preview-explanation').textContent='';$('preview-canvas').hidden=true;$('pack-download').disabled=true;}
$('pack-template').addEventListener('change',()=>{defaultState();invalidate();});
for(const id of ['pack-id','pack-title','pack-gallery','pack-question','pack-author','pack-license','pack-initial'])$(id).addEventListener('input',invalidate);
function readPack(){return validatePack(registry,{kind:'museum.pack.v1',schema:1,id:$('pack-id').value,title:$('pack-title').value,gallery:$('pack-gallery').value,question:$('pack-question').value,author:$('pack-author').value,license:$('pack-license').value,template:$('pack-template').value,templateVersion:1,initial:parseData($('pack-initial').value)});}
function drawPreview(){
  const v=preview.describe();$('preview-readout').textContent=v.readout;$('preview-explanation').textContent=v.explanation;
  $('preview-actions').replaceChildren();
  const d=packDefinition(registry,activePack);$('preview-canvas').hidden=!d.draw;if(d.draw)d.draw($('preview-canvas'),preview.snapshot());
  for(const a of v.actions){const b=document.createElement('button');b.textContent=a.label;b.disabled=a.disabled;b.addEventListener('click',()=>{const result=preview.dispatch(a.action);message(result.message);drawPreview();});$('preview-actions').append(b);}
}
function previewPack(p){const d=packDefinition(registry,p);preview=createSession(createRegistry([d]));preview.mount(p.id);activePack=p;drawPreview();$('pack-download').disabled=false;message('Pack validated. Preview uses the actual reviewed model.');}
function guarded(fn){try{fn();}catch(e){message('Rejected: '+e.message);}}
$('pack-preview').addEventListener('click',()=>guarded(()=>{invalidate();previewPack(readPack());}));
$('pack-reset').addEventListener('click',()=>guarded(()=>{if(!preview)throw Error('Preview a pack first');preview.reset();drawPreview();}));
function download(value,name){
  const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
}
$('pack-download').addEventListener('click',()=>guarded(()=>{if(!activePack)throw Error('Validate a pack first');download(activePack,'museum-pack.json');message('Pack downloaded. Load it in Museum catalogue.');}));
function renderRoute(){
  $('route-list').replaceChildren();
  stops.forEach((id,i)=>{const li=document.createElement('li');li.append(document.createTextNode(registry.get(id).manifest.title+' '));
    for(const [name,delta] of [['Up',-1],['Down',1],['Remove',0]]){const b=document.createElement('button');b.textContent=name;b.setAttribute('aria-label',name+' '+registry.get(id).manifest.title);b.disabled=delta!==0&&(i+delta<0||i+delta>=stops.length);b.addEventListener('click',()=>{if(delta===0)stops.splice(i,1);else [stops[i],stops[i+delta]]=[stops[i+delta],stops[i]];renderRoute();});li.append(b);} $('route-list').append(li);
  });
}
$('route-add').addEventListener('click',()=>guarded(()=>{const id=$('route-stop').value;if(stops.includes(id))throw Error('Duplicate stop');if(stops.length>=LIMITS.exhibits)throw Error('Route full');stops.push(id);renderRoute();}));
$('route-clear').addEventListener('click',()=>{stops=[];renderRoute();});
$('route-download').addEventListener('click',()=>guarded(()=>{const route=validateRoute(registry,{kind:'museum.route.v1',schema:1,id:$('route-id').value,title:$('route-title').value,exhibits:stops});download(route,'museum-route.json');message('Route validated and downloaded.');}));
$('workshop-load').addEventListener('click',()=>{$('workshop-file').value='';$('workshop-file').click();});
$('workshop-file').addEventListener('change',async()=>{
  const f=$('workshop-file').files[0],ticket=++generation;if(!f)return;
  try{
    if(f.size>LIMITS.bytes)throw Error('64 KiB maximum');
    const r=parseData(await f.text());if(ticket!==generation)return;
    if(r.kind==='museum.pack.v1'){const p=validatePack(registry,r);for(const [key,id] of Object.entries({id:'pack-id',title:'pack-title',gallery:'pack-gallery',question:'pack-question',author:'pack-author',license:'pack-license',template:'pack-template'}))$(id).value=p[key];$('pack-initial').value=JSON.stringify(p.initial,null,2);invalidate();previewPack(p);}
    else if(r.kind==='museum.route.v1'){const route=validateRoute(registry,r);$('route-id').value=route.id;$('route-title').value=route.title;stops=[...route.exhibits];renderRoute();message('Route loaded.');}
    else if(r.kind==='museum.research.evidence.v1'){const v=verifyResearchEvidence(r);$('evidence-inspection').textContent=JSON.stringify(r,null,2);message('Evidence reproduced: '+v.experiment+'; '+v.runs+' run(s).');}
    else throw Error('Unsupported workshop record');
  }catch(e){if(ticket===generation)message('Rejected: '+e.message);}
});
defaultState();renderRoute();
if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
