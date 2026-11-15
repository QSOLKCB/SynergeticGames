/* SPDX-License-Identifier: MIT
 * Adapted from Ryan Jamie / RyanJBuchanan RayShare app.js,
 * commit e0f7fe59331b5a09ac1e20164a12280202ab44d0.
 * Copyright (c) 2026 Ryan Jamie. See LICENSE beside this file.
 * Changes by QSOL-IMC: pure map argument, bounded DDA, explicit miss,
 * exact grid traversal for sight, disk collision, independent observer cones.
 */
export const angleDifference = (a,b) => Math.atan2(Math.sin(a-b),Math.cos(a-b));
export function cell(map,x,y) { return map[Math.floor(y)]?.[Math.floor(x)] ?? 1; }
export function castRayFrom(map,startX,startY,angle,maxDepth=64) {
  if (![startX,startY,angle,maxDepth].every(Number.isFinite) || maxDepth<=0) throw new TypeError('finite ray required');
  const dx=Math.cos(angle),dy=Math.sin(angle);
  let mapX=Math.floor(startX),mapY=Math.floor(startY);
  if(cell(map,startX,startY))return {distance:0,side:0,mapX,mapY,hit:true,hitX:startX,hitY:startY};
  const deltaX=Math.abs(dx)<1e-14?Infinity:Math.abs(1/dx),deltaY=Math.abs(dy)<1e-14?Infinity:Math.abs(1/dy);
  const stepX=dx<0?-1:1,stepY=dy<0?-1:1;
  let sideX=(dx<0?startX-mapX:mapX+1-startX)*deltaX;
  let sideY=(dy<0?startY-mapY:mapY+1-startY)*deltaY;
  let distance=0,side=0,hit=false;
  for(let step=0;step<4096;step++) {
    if(sideX<sideY){distance=sideX;sideX+=deltaX;mapX+=stepX;side=0;}
    else{distance=sideY;sideY+=deltaY;mapY+=stepY;side=1;}
    if(distance>maxDepth){distance=maxDepth;break;}
    if(cell(map,mapX,mapY)){hit=true;break;}
  }
  return {distance,side,mapX,mapY,hit,hitX:startX+dx*distance,hitY:startY+dy*distance};
}
export function hasLineOfSight(map,a,b) {
  const distance=Math.hypot(b.x-a.x,b.y-a.y);
  if(cell(map,a.x,a.y)||cell(map,b.x,b.y))return false;
  if(distance<1e-10)return true;
  return castRayFrom(map,a.x,a.y,Math.atan2(b.y-a.y,b.x-a.x),distance).distance>=distance-1e-9;
}
export function mutualLink(map,a,b,cone=Math.PI/7) {
  const bearing=Math.atan2(b.y-a.y,b.x-a.x);
  return Math.hypot(b.x-a.x,b.y-a.y)>.35 && hasLineOfSight(map,a,b) &&
    Math.abs(angleDifference(bearing,a.angle))<=cone &&
    Math.abs(angleDifference(bearing+Math.PI,b.angle))<=cone;
}
export function canStand(map,x,y,radius=.22) {
  if(!Number.isFinite(x)||!Number.isFinite(y))return false;
  for(let cy=Math.floor(y-radius);cy<=Math.floor(y+radius);cy++)for(let cx=Math.floor(x-radius);cx<=Math.floor(x+radius);cx++){
    if(!cell(map,cx,cy))continue;
    const nearX=Math.max(cx,Math.min(x,cx+1)),nearY=Math.max(cy,Math.min(y,cy+1));
    if((nearX-x)**2+(nearY-y)**2<radius*radius)return false;
  }
  return true;
}
export function move(map,actor,dx,dy) {
  // Substeps retain collision safety for callers with large displacements.
  const steps=Math.ceil(Math.max(Math.abs(dx),Math.abs(dy))/.1)||1;
  if(steps>1000||![dx,dy].every(Number.isFinite))throw new RangeError('movement budget');
  for(let i=0;i<steps;i++){
    if(canStand(map,actor.x+dx/steps,actor.y))actor.x+=dx/steps;
    if(canStand(map,actor.x,actor.y+dy/steps))actor.y+=dy/steps;
  }
}
