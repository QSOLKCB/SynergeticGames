// SPDX-License-Identifier: Apache-2.0
import {rotate,seededRandom} from '../vendor/vanillajs/modules/math/index.js';
import {castRayFrom} from '../vendor/rayshare/raycast.js';
import {MAP,EXHIBITS,CORE,MESHES,DIRECTIONS,GEO} from './world.js';
import {completed,EDGES,seals} from './game.js';
const TAU=Math.PI*2;
function polygon(ctx,points,fill,stroke){
  ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();
  if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.stroke();}
}
export function meshDrawing(ctx,mesh,cx,cy,size,angle,color,options={}){
  const q=[0,Math.sin(angle/2),0,Math.cos(angle/2)],tilt=[Math.sin(.23),0,0,Math.cos(.23)];
  const vertices=mesh.vertices.map(v=>rotate(tilt,rotate(q,v)));
  const projected=vertices.map(v=>[cx+v[0]*size,cy-v[1]*size]);
  const faces=mesh.faces.map(f=>({f,z:f.reduce((a,i)=>a+vertices[i][2],0)/f.length})).sort((a,b)=>a.z-b.z);
  ctx.save();ctx.lineWidth=1.5;
  for(const {f} of faces)polygon(ctx,f.map(i=>projected[i]),color+'0c',null);
  mesh.edges.forEach(([a,b],i)=>{
    const built=!options.edges||options.edges.includes(EDGES[i]);
    ctx.globalAlpha=built?1:.2;ctx.strokeStyle=color;ctx.lineWidth=built?2:1;
    ctx.setLineDash(built?[]:[4,5]);ctx.beginPath();ctx.moveTo(...projected[a]);ctx.lineTo(...projected[b]);ctx.stroke();
  });
  ctx.setLineDash([]);ctx.globalAlpha=1;
  projected.forEach((p,i)=>{
    const done=options.pairs?.some(a=>i===a||DIRECTIONS[a].opposite===i);
    ctx.fillStyle=done?'#f6b754':color;ctx.beginPath();ctx.arc(...p,options.labels?5:3,0,TAU);ctx.fill();
    if(options.labels){ctx.font='bold 12px monospace';ctx.fillText(options.labels[i],p[0]+8,p[1]-7);}
  });ctx.restore();return projected;
}
export function createRenderer(canvas,mapCanvas){
  const ctx=canvas.getContext('2d',{alpha:false}),mapctx=mapCanvas.getContext('2d');
  const sprite=document.createElement('canvas');sprite.width=320;sprite.height=400;const sc=sprite.getContext('2d');
  const random=seededRandom(1983),stars=Array.from({length:95},()=>[random(),random(),random()]);
  function draw(s,{reduced=false}={}){
    const w=canvas.width,h=canvas.height,horizon=h*.48,p=s.probes[s.active],focal=w/(2*Math.tan(Math.PI*70/360));
    const sky=ctx.createLinearGradient(0,0,0,horizon);sky.addColorStop(0,'#091d29');sky.addColorStop(1,'#22555b');ctx.fillStyle=sky;ctx.fillRect(0,0,w,horizon);
    stars.forEach(([x,y,r])=>{ctx.fillStyle=r>.6?'#bce9d6':'#64858a';const px=((x*w-p.angle*w/TAU)%w+w)%w;ctx.fillRect(px,y*horizon,1+r*1.5,1+r*1.5);});
    const floor=ctx.createLinearGradient(0,horizon,0,h);floor.addColorStop(0,'#173c43');floor.addColorStop(1,'#0b202b');ctx.fillStyle=floor;ctx.fillRect(0,horizon,w,h);
    // Floor tiles in world coordinates: translation and strafing are visible.
    const project=(x,y,z=0)=>{const dx=x-p.x,dy=y-p.y,d=dx*Math.cos(p.angle)+dy*Math.sin(p.angle);return d>.1?[w/2+(-dx*Math.sin(p.angle)+dy*Math.cos(p.angle))*focal/d,horizon+(.62-z)*focal/d]:null;};
    ctx.lineWidth=1;ctx.strokeStyle='#42646b55';
    for(let i=0;i<19;i++)for(let j=0;j<18;j++)for(const axis of [0,1]){
      const a=project(axis?i:j,axis?j:i),b=project(axis?i:j+1,axis?j+1:i);
      if(a&&b&&Math.abs(a[0])<w*5&&Math.abs(b[0])<w*5){ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke();}
    }
    const depth=new Float32Array(w);
    for(let x=0;x<w;x+=2){
      const rayAngle=p.angle+Math.atan((x+.5-w/2)/focal),hit=castRayFrom(MAP,p.x,p.y,rayAngle),d=Math.max(.05,hit.distance*Math.cos(rayAngle-p.angle));
      const top=horizon-1.38*focal/d,bottom=horizon+.62*focal/d;
      const shade=Math.max(14,58-d*2.1)-(hit.side?7:0),accent=(hit.mapX+hit.mapY)%4===0;
      ctx.fillStyle=`hsl(${accent?178:192} 24% ${shade}%)`;ctx.fillRect(x,top,2,bottom-top);
      const frac=(hit.side?hit.hitX:hit.hitY)%1;
      if(frac<.025||frac>.975){ctx.fillStyle='#081e3090';ctx.fillRect(x,top,2,bottom-top);}
      ctx.fillStyle='#83d5c3';ctx.globalAlpha=Math.max(.15,1-d/20);ctx.fillRect(x,top+3*focal/d/100,2,Math.max(1,.018*focal/d));
      ctx.fillStyle='#7aa6a1';ctx.fillRect(x,bottom-.11*focal/d,2,Math.max(1,.025*focal/d));ctx.globalAlpha=1;
      depth[x]=d;if(x+1<w)depth[x+1]=d;
    }
    const objects=[...EXHIBITS.map(e=>({...e,done:completed(s,e.id)})),{...CORE,id:'core',name:'CONCENTRIC ENGINE',short:'Relay',mesh:'ve',color:'#f6b754',done:s.won},
      {...s.probes[1-s.active],id:'probe',name:s.active===0?'MICA · PROBE 02':'PIP · PROBE 01',color:s.active===0?'#66d9cd':'#f6b754'}]
      .map(o=>({...o,d:(o.x-p.x)*Math.cos(p.angle)+(o.y-p.y)*Math.sin(p.angle),side:-(o.x-p.x)*Math.sin(p.angle)+(o.y-p.y)*Math.cos(p.angle)})).filter(o=>o.d>.25).sort((a,b)=>b.d-a.d);
    for(const o of objects){
      sc.clearRect(0,0,320,400);sc.textAlign='center';
      const bob=reduced?0:Math.sin(s.tick/45+o.x)*5;
      const glow=sc.createRadialGradient(160,190,5,160,190,140);glow.addColorStop(0,o.color+'30');glow.addColorStop(1,o.color+'00');sc.fillStyle=glow;sc.fillRect(0,30,320,320);
      sc.strokeStyle=o.color+'70';sc.lineWidth=2;sc.beginPath();sc.ellipse(160,329,100,18,0,0,TAU);sc.stroke();
      polygon(sc,[[80,315],[160,292],[240,315],[160,346]],'#214450',o.color+'90');
      polygon(sc,[[80,315],[160,346],[160,369],[80,338]],'#17313c','#426367');
      polygon(sc,[[240,315],[160,346],[160,369],[240,338]],'#0c2732','#426367');
      if(o.id==='probe'){
        polygon(sc,[[117,172+bob],[160,150+bob],[203,172+bob],[203,226+bob],[160,249+bob],[117,226+bob]],o.color,'#e9eee1');
        sc.fillStyle='#102c39';sc.fillRect(128,184+bob,64,24);sc.fillStyle='#f8f0d6';sc.fillRect(139,190+bob,10,10);sc.fillRect(172,190+bob,10,10);
        sc.strokeStyle=o.color;sc.beginPath();sc.moveTo(160,150+bob);sc.lineTo(160,125+bob);sc.stroke();sc.beginPath();sc.arc(160,120+bob,5,0,TAU);sc.stroke();
      }else{
        meshDrawing(sc,MESHES[o.mesh],160,202+bob,o.mesh==='tetra'?145:115,reduced?.6:s.tick/180+o.x,o.color);
        if(o.done){sc.fillStyle='#e9f6d9';sc.font='bold 13px monospace';sc.fillText('RESTORED',160,105);}
      }
      sc.fillStyle='#081d2be8';sc.fillRect(12,36,296,36);sc.strokeStyle=o.color+'88';sc.strokeRect(12,36,296,36);
      sc.fillStyle=o.color;sc.font='bold 13px monospace';sc.fillText(o.name.toUpperCase(),160,59);
      const size=Math.min(h*3,focal*(o.id==='core'?1.55:1.5)/o.d),left=w/2+o.side*focal/o.d-size/2,top=horizon+.62*focal/o.d-size*370/320;
      for(let x=Math.max(0,Math.floor(left));x<Math.min(w,left+size);x+=2){
        if(o.d>depth[x]+.02)continue;
        const sx=(x-left)*320/size,sw=Math.min(320-sx,2*320/size);
        if(sx>=0&&sw>0)ctx.drawImage(sprite,sx,0,sw,400,x,top,2,size*400/320);
      }
    }
    // Restrained viewfinder; no flashing or camera shake.
    ctx.strokeStyle='#e4eee38a';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(w/2-7,horizon);ctx.lineTo(w/2+7,horizon);ctx.moveTo(w/2,horizon-7);ctx.lineTo(w/2,horizon+7);ctx.stroke();
    ctx.fillStyle='#061b2888';ctx.fillRect(18,h-91,226,29);ctx.fillStyle='#c2d9d5';ctx.font='11px monospace';ctx.fillText(`${s.active===0?'PIP 01':'MICA 02'}   ${p.x.toFixed(1)} / ${p.y.toFixed(1)}   ${seals(s)}/4`,30,h-72);
    drawMap(s);
  }
  function drawMap(s){
    const c=mapctx,w=mapCanvas.width,n=w/19;c.fillStyle='#102d38';c.fillRect(0,0,w,w);
    MAP.forEach((row,y)=>row.forEach((wall,x)=>{c.fillStyle=wall?'#25434b':'#102d38';c.fillRect(x*n,y*n,n-.6,n-.6);}));
    EXHIBITS.forEach(e=>{c.fillStyle=completed(s,e.id)?'#e7efd9':e.color;c.beginPath();c.arc(e.x*n,e.y*n,n*.4,0,TAU);c.fill();});
    c.strokeStyle='#d7b879';c.strokeRect((CORE.x-1)*n,(CORE.y-1)*n,2*n,2*n);
    s.probes.forEach((p,i)=>{const x=p.x*n,y=p.y*n;c.fillStyle=i===0?'#f6b754':'#66d9cd';c.beginPath();c.arc(x,y,i===s.active?4:3,0,TAU);c.fill();c.strokeStyle=c.fillStyle;c.beginPath();c.moveTo(x,y);c.lineTo(x+Math.cos(p.angle)*12,y+Math.sin(p.angle)*12);c.stroke();});
  }
  return {draw};
}
export function drawLab(canvas,id,s,angle){
  const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height;c.clearRect(0,0,w,h);c.fillStyle='#102c38';c.fillRect(0,0,w,h);
  c.strokeStyle='#d5e6df12';for(let i=0;i<w;i+=24){c.beginPath();c.moveTo(i,0);c.lineTo(i,h);c.stroke();}for(let i=0;i<h;i+=24){c.beginPath();c.moveTo(0,i);c.lineTo(w,i);c.stroke();}
  const e=EXHIBITS.find(e=>e.id===id);
  if(id==='volume'){
    const target=s.labs.volume.stage===0?MESHES.octa:MESHES.ve;
    meshDrawing(c,target,w*.65,h*.5,h*.45,angle,e.color);
    meshDrawing(c,MESHES.tetra,w*.2,h*.5,h*.45,angle,'#f6b754');
    c.font='13px monospace';c.fillStyle='#f0ead7';c.textAlign='center';c.fillText('1 unit',w*.2,h*.86);c.fillText(s.labs.volume.stage===0?'OCTAHEDRON':'VECTOR EQUILIBRIUM',w*.65,h*.86);
  }else if(id==='quadray'){
    const point=GEO.quadrayToXYZ(s.labs.quadray),q=[0,Math.sin(angle/2),0,Math.cos(angle/2)];
    meshDrawing(c,MESHES.tetra,w/2,h*.55,h*.65,angle,e.color,{labels:['A','B','C','D']});
    const p=rotate(q,point);c.fillStyle='#f6b754';c.beginPath();c.arc(w/2+p[0]*h*.2,h*.55-p[1]*h*.2,7,0,TAU);c.fill();
    c.font='12px monospace';c.fillText('same point',w/2+p[0]*h*.2+12,h*.55-p[1]*h*.2);
  }else meshDrawing(c,MESHES[e.mesh],w/2,h/2,h*(id==='tetra'?.75:.48),angle,e.color,id==='tetra'?{edges:s.labs.tetra,labels:['A','B','C','D']}:{pairs:s.labs.ivm,labels:DIRECTIONS.map((_,i)=>String(i+1))});
}
