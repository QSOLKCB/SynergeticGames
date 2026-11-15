// SPDX-License-Identifier: Apache-2.0
import {rotate,seededRandom,normalize,cross,subtract,dot,clamp} from '../vendor/vanillajs/modules/math/index.js';
import {castRayFrom} from '../vendor/rayshare/raycast.js';
import {MAP,EXHIBITS,CORE,MESHES,DIRECTIONS,GEO} from './world.js';
import {completed,EDGES,seals} from './game.js';
const TAU=Math.PI*2;
const LIGHT=normalize([-.35,.65,1]);
const TILT=[Math.sin(.23),0,0,Math.cos(.23)];
const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
const tint=(hex,shade=1,alpha=1)=>`rgba(${rgb(hex).map(n=>Math.round(n*shade)).join(',')},${alpha})`;
function polygon(ctx,points,fill,stroke){
  ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();
  if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.stroke();}
}
export function meshDrawing(ctx,mesh,cx,cy,size,angle,color,options={}){
  const q=[0,Math.sin(angle/2),0,Math.cos(angle/2)];
  const vertices=mesh.vertices.map(v=>rotate(TILT,rotate(q,v)));
  const projected=vertices.map(v=>[cx+v[0]*size,cy-v[1]*size]);
  const faces=mesh.faces.map(f=>({f,z:f.reduce((a,i)=>a+vertices[i][2],0)/f.length,
    light:clamp(dot(normalize(cross(subtract(vertices[f[1]],vertices[f[0]]),subtract(vertices[f[2]],vertices[f[0]]))),LIGHT),0,1)})).sort((a,b)=>a.z-b.z);
  ctx.save();ctx.lineWidth=1.5;
  for(const {f,light,z} of faces)polygon(ctx,f.map(i=>projected[i]),tint(color,.6+light*.4,(z>0?.09:.035)+light*.12),null);
  mesh.edges.forEach(([a,b],i)=>{
    const built=!options.edges||options.edges.includes(EDGES[i]);
    const front=(vertices[a][2]+vertices[b][2])>=0;
    ctx.globalAlpha=built?(front?1:.38):.16;ctx.strokeStyle=color;ctx.lineWidth=built?(front?2.2:1.4):1;
    ctx.shadowColor=color;ctx.shadowBlur=built&&front?5:0;
    ctx.setLineDash(built?[]:[4,5]);ctx.beginPath();ctx.moveTo(...projected[a]);ctx.lineTo(...projected[b]);ctx.stroke();
  });
  ctx.setLineDash([]);ctx.globalAlpha=1;ctx.shadowBlur=0;
  projected.forEach((p,i)=>{
    const done=options.pairs?.some(a=>i===a||DIRECTIONS[a].opposite===i);
    ctx.fillStyle=done?'#f6b754':color;ctx.beginPath();ctx.arc(...p,options.labels?5:3,0,TAU);ctx.fill();
    if(options.labels){ctx.font='bold 12px monospace';ctx.lineWidth=4;ctx.strokeStyle='#102c38';ctx.strokeText(options.labels[i],p[0]+8,p[1]-7);ctx.fillStyle='#ecf1de';ctx.fillText(options.labels[i],p[0]+8,p[1]-7);}
  });ctx.restore();return projected;
}
export function createRenderer(canvas,mapCanvas){
  const ctx=canvas.getContext('2d',{alpha:false}),mapctx=mapCanvas.getContext('2d');
  const sprite=document.createElement('canvas');sprite.width=320;sprite.height=400;const sc=sprite.getContext('2d');
  const random=seededRandom(1983),stars=Array.from({length:95},()=>[random(),random(),random()]);
  const motes=Array.from({length:18},()=>[random(),random(),random()]);
  function draw(s,{reduced=false,activeExhibit=null}={}){
    const w=canvas.width,h=canvas.height,horizon=h*.48,p=s.probes[s.active],focal=w/(2*Math.tan(Math.PI*70/360));
    const sky=ctx.createLinearGradient(0,0,0,horizon);sky.addColorStop(0,'#091d29');sky.addColorStop(1,'#22555b');ctx.fillStyle=sky;ctx.fillRect(0,0,w,horizon);
    stars.forEach(([x,y,r])=>{ctx.fillStyle=r>.6?'#bce9d6':'#64858a';const px=((x*w-p.angle*w/TAU)%w+w)%w;ctx.fillRect(px,y*horizon,1+r*1.5,1+r*1.5);});
    ctx.save();ctx.strokeStyle='#9dc0a51a';ctx.lineWidth=1;
    const orbit=w*.65+Math.sin(p.angle)*w*.2;
    for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse(orbit,horizon*.1,w*(.15+i*.045),horizon*(.11+i*.04),-.32,0,TAU);ctx.stroke();}ctx.restore();
    const floor=ctx.createLinearGradient(0,horizon,0,h);floor.addColorStop(0,'#173c43');floor.addColorStop(1,'#0b202b');ctx.fillStyle=floor;ctx.fillRect(0,horizon,w,h);
    // Floor tiles in world coordinates: translation and strafing are visible.
    const project=(x,y,z=0)=>{const dx=x-p.x,dy=y-p.y,d=dx*Math.cos(p.angle)+dy*Math.sin(p.angle);return d>.1?[w/2+(-dx*Math.sin(p.angle)+dy*Math.cos(p.angle))*focal/d,horizon+(.62-z)*focal/d]:null;};
    ctx.lineWidth=1;ctx.strokeStyle='#42646b55';
    for(let i=0;i<19;i++)for(let j=0;j<18;j++)for(const axis of [0,1]){
      const a=project(axis?i:j,axis?j:i),b=project(axis?i:j+1,axis?j+1:i);
      if(a&&b&&Math.abs(a[0])<w*5&&Math.abs(b[0])<w*5){ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke();}
    }
    // Coloured trails are navigation aids, painted on the floor before occluding walls.
    for(const exhibit of EXHIBITS){
      const dx=exhibit.x-CORE.x,dy=exhibit.y-CORE.y,length=Math.hypot(dx,dy),ux=dx/length,uy=dy/length;
      for(let distance=1.6;distance<length-.55;distance+=.85){
        const x=CORE.x+ux*distance,y=CORE.y+uy*distance;
        const points=[project(x+ux*.18,y+uy*.18),project(x-ux*.14-uy*.13,y-uy*.14+ux*.13),project(x-ux*.14+uy*.13,y-uy*.14-ux*.13)];
        if(points.every(Boolean))polygon(ctx,points,tint(exhibit.color,1,completed(s,exhibit.id)?.22:.5),null);
      }
    }
    const depth=new Float32Array(w);
    for(let x=0;x<w;x+=2){
      const rayAngle=p.angle+Math.atan((x+.5-w/2)/focal),hit=castRayFrom(MAP,p.x,p.y,rayAngle),d=Math.max(.05,hit.distance*Math.cos(rayAngle-p.angle));
      const top=horizon-1.38*focal/d,bottom=horizon+.62*focal/d;
      const shade=Math.max(14,49-d*1.9)-(hit.side?6:0),accent=(hit.mapX+hit.mapY)%4===0;
      const zone=hit.mapY<6?EXHIBITS[0]:hit.mapY>12?EXHIBITS[3]:hit.mapX<6?EXHIBITS[1]:hit.mapX>12?EXHIBITS[2]:null;
      ctx.fillStyle=`hsl(${accent?180:197} 25% ${shade}%)`;ctx.fillRect(x,top,2,bottom-top);
      const frac=(hit.side?hit.hitX:hit.hitY)%1;
      if(frac<.035||frac>.965){ctx.fillStyle='#081e3090';ctx.fillRect(x,top,2,bottom-top);}
      if(frac>.09&&frac<.91){
        ctx.fillStyle='#08233035';ctx.fillRect(x,top+.18*focal/d,2,1.45*focal/d);
        ctx.fillStyle='#c5e2c822';ctx.fillRect(x,top+.18*focal/d,2,Math.max(1,.008*focal/d));
        if(zone&&(hit.mapX+hit.mapY)%3===0){ctx.fillStyle=tint(zone.color,.9,.32);ctx.fillRect(x,top+.82*focal/d,2,.1*focal/d);}
      }
      ctx.fillStyle=zone?.color||'#83d5c3';ctx.globalAlpha=Math.max(.18,1-d/20);ctx.fillRect(x,top+.055*focal/d,2,Math.max(1,.018*focal/d));
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
      for(let ring=0;ring<3;ring++){
        sc.strokeStyle=tint(o.color,1,.12+ring*.06);sc.beginPath();sc.ellipse(160,329-ring*8,105+ring*7,19+ring*2,0,0,TAU);sc.stroke();
      }
      if(o.id!=='probe')for(const [mx,my,speed] of motes){
        const rise=reduced?my:(my+s.tick*(.0006+speed*.0004))%1;
        sc.fillStyle=tint(o.color,1,.12+Math.sin(rise*Math.PI)*.35);sc.fillRect(75+mx*170,310-rise*190,1+speed,1+speed);
      }
      polygon(sc,[[80,315],[160,292],[240,315],[160,346]],'#214450',o.color+'90');
      polygon(sc,[[80,315],[160,346],[160,369],[80,338]],'#17313c','#426367');
      polygon(sc,[[240,315],[160,346],[160,369],[240,338]],'#0c2732','#426367');
      if(o.id==='probe'){
        polygon(sc,[[117,172+bob],[160,150+bob],[203,172+bob],[203,226+bob],[160,249+bob],[117,226+bob]],o.color,'#e9eee1');
        polygon(sc,[[117,172+bob],[160,196+bob],[160,249+bob],[117,226+bob]],'#123e4955',null);
        polygon(sc,[[117,172+bob],[160,150+bob],[203,172+bob],[160,196+bob]],'#e9f4cf44',null);
        sc.fillStyle='#102c39';sc.fillRect(128,184+bob,64,24);sc.fillStyle='#f8f0d6';sc.fillRect(139,190+bob,10,10);sc.fillRect(172,190+bob,10,10);
        sc.fillStyle='#e5f4d090';sc.fillRect(147,226+bob,26,3);
        sc.strokeStyle=o.color;sc.beginPath();sc.moveTo(160,150+bob);sc.lineTo(160,125+bob);sc.stroke();sc.beginPath();sc.arc(160,120+bob,5,0,TAU);sc.stroke();
        const heading=o.angle-p.angle;
        sc.strokeStyle='#e9f4cf';sc.lineWidth=2;sc.beginPath();sc.moveTo(160,319);sc.lineTo(160+Math.sin(heading)*45,319-Math.cos(heading)*12);sc.stroke();
      }else{
        meshDrawing(sc,MESHES[o.mesh],160,202+bob,o.mesh==='tetra'?145:115,reduced?.6:s.tick/180+o.x,o.color);
        if(o.done){sc.fillStyle='#e9f6d9';sc.font='bold 13px monospace';sc.fillText('RESTORED',160,105);}
        if(o.id===activeExhibit){
          sc.strokeStyle='#ffcf7d';sc.lineWidth=3;
          for(const [x,y,dx,dy] of [[50,100,1,1],[270,100,-1,1],[50,287,1,-1],[270,287,-1,-1]]){sc.beginPath();sc.moveTo(x+20*dx,y);sc.lineTo(x,y);sc.lineTo(x,y+20*dy);sc.stroke();}
        }
        if(o.id==='core'){
          for(let i=0;i<4;i++){sc.fillStyle=i<seals(s)?EXHIBITS[i].color:'#45616b';sc.fillRect(112+i*26,287,18,5);}
          if(s.sync>0){sc.strokeStyle='#fff0ba';sc.lineWidth=3;sc.beginPath();sc.ellipse(160,202,110,85,0,-Math.PI/2,-Math.PI/2+TAU*s.sync/120);sc.stroke();}
        }
      }
      sc.fillStyle='#081d2be8';sc.fillRect(12,36,296,36);sc.strokeStyle=o.color+'88';sc.strokeRect(12,36,296,36);
      sc.fillStyle=o.id===activeExhibit?'#ffcf7d':o.color;sc.font='bold 13px monospace';sc.fillText(o.name.toUpperCase(),160,59);
      const size=Math.min(h*3,focal*(o.id==='core'?1.55:1.5)/o.d),left=w/2+o.side*focal/o.d-size/2,top=horizon+.62*focal/o.d-size*370/320;
      for(let x=Math.max(0,Math.floor(left));x<Math.min(w,left+size);x+=2){
        if(o.d>depth[x]+.02)continue;
        const sx=(x-left)*320/size,sw=Math.min(320-sx,2*320/size);
        if(sx>=0&&sw>0)ctx.drawImage(sprite,sx,0,sw,400,x,top,2,size*400/320);
      }
    }
    // Restrained viewfinder; no flashing or camera shake.
    ctx.strokeStyle='#e4eee38a';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(w/2-7,horizon);ctx.lineTo(w/2+7,horizon);ctx.moveTo(w/2,horizon-7);ctx.lineTo(w/2,horizon+7);ctx.stroke();
    // Leave room for the centred Inspect hint on narrow views.
    const plaqueTop=h-(activeExhibit&&w<650?204:144);
    ctx.fillStyle='#061b2888';ctx.fillRect(18,plaqueTop,190,26);ctx.fillStyle='#c2d9d5';ctx.font='10px monospace';ctx.fillText(`${s.active===0?'PIP 01':'MICA 02'}  ·  ${seals(s)} / 4 CONNECTIONS`,29,plaqueTop+17);
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
    const size=h*.45,cx=w/2,cy=h*.65;
    meshDrawing(c,MESHES.tetra,cx,cy,size,angle,e.color,{labels:['A','B','C','D']});
    const p=rotate(TILT,rotate(q,point)),px=cx+p[0]*size,py=cy-p[1]*size;
    c.strokeStyle='#f6b75470';c.setLineDash([3,4]);c.beginPath();c.moveTo(cx,cy);c.lineTo(px,py);c.stroke();c.setLineDash([]);
    c.fillStyle='#f6b754';c.beginPath();c.arc(px,py,7,0,TAU);c.fill();
    c.font='12px monospace';c.fillText('same point',px+12,py);
  }else meshDrawing(c,MESHES[e.mesh],w/2,h/2,h*(id==='tetra'?.75:.48),angle,e.color,id==='tetra'?{edges:s.labs.tetra,labels:['A','B','C','D']}:{pairs:s.labs.ivm,labels:DIRECTIONS.map((_,i)=>String(i+1))});
}
