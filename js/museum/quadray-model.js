// SPDX-License-Identifier: Apache-2.0
// Exact integer coordinates, D=1. XYZ = numerator * sqrt(2)/4.
// All arithmetic below is bounded safe-integer arithmetic.
export const Q_LIMIT=128;
const dense=(a,n,limit)=>Array.isArray(a)&&a.length===n&&Array.from(a).every(v=>Number.isSafeInteger(v)&&Math.abs(v)<=limit);
export function canonical(q){
  if(!dense(q,4,Q_LIMIT))throw new RangeError('bounded integer Quadray required');
  const m=Math.min(...q),out=q.map(v=>v-m);
  if(Math.max(...out)>Q_LIMIT)throw new RangeError('Quadray span exceeds bound');
  return out;
}
export function numerator(q){
  const [a,b,c,d]=canonical(q);
  return [a+b-c-d,a-b+c-d,a-b-c+d];
}
export function fromNumerator(n){
  if(!dense(n,3,2*Q_LIMIT)||n.some(v=>(v-n[0])%2!==0))throw new RangeError('not an integer Quadray numerator');
  const [x,y,z]=n;
  // Fix d=0, then normalize; intermediate representatives can exceed the input bound.
  const raw=[(x+y)/2,(x-z)/2,(y-z)/2,0],m=Math.min(...raw),out=raw.map(v=>v-m);
  if(Math.max(...out)>Q_LIMIT)throw new RangeError('Quadray span exceeds bound');
  return out;
}
export const xyz=q=>numerator(q).map(v=>v*Math.SQRT2/4);
export const add=(a,b)=>canonical(canonical(a).map((v,i)=>v+canonical(b)[i]));
export const key=p=>p.join(',');
export const sub=(a,b)=>a.map((v,i)=>v-b[i]);
export const norm2=a=>a.reduce((s,v)=>s+v*v,0);
export const det=(a,b,c)=>a[0]*(b[1]*c[2]-b[2]*c[1])-a[1]*(b[0]*c[2]-b[2]*c[0])+a[2]*(b[0]*c[1]-b[1]*c[0]);
export const Q_STEPS=Object.freeze(Array.from({length:4},(_,i)=>Array.from({length:4},(_,j)=>i===j?null:Object.freeze(Array.from({length:4},(_,k)=>k===i?2:k===j?0:1)))).flat().filter(Boolean));
export const FCC_STEPS=Object.freeze(Q_STEPS.map(q=>Object.freeze(numerator(q).map(v=>v/2))));
export const fccQuadray=p=>fromNumerator(p.map(v=>2*v));
export function lattice(radius){
  if(!Number.isInteger(radius)||radius<0||radius>3)throw new RangeError('shell radius 0..3');
  const points=[[0,0,0]],shells=[0],seen=new Map([['0,0,0',0]]);
  for(let i=0;i<points.length;i++){
    if(shells[i]===radius)continue;
    for(const step of FCC_STEPS){
      const p=points[i].map((v,j)=>v+step[j]),k=key(p);
      if(!seen.has(k)){seen.set(k,points.length);points.push(p);shells.push(shells[i]+1);}
    }
  }
  const edges=[];
  for(let i=0;i<points.length;i++)for(const step of FCC_STEPS){
    const j=seen.get(key(points[i].map((v,k)=>v+step[k])));if(j!==undefined&&i<j)edges.push([i,j]);
  }
  return {points,shells,edges};
}
export const CELL_NAMES=Object.freeze(['tetrahedron','octahedron','cuboctahedron']);
export function cell(name){
  if(!CELL_NAMES.includes(name))throw new RangeError('unknown cell');
  const vertices=name==='tetrahedron'?[[0,0,0],[1,1,0],[1,0,1],[0,1,1]]:
    name==='octahedron'?[[0,0,0],[2,0,0],[1,1,0],[1,-1,0],[1,0,1],[1,0,-1]]:FCC_STEPS.map(p=>[...p]);
  const edges=[],faces=[],n=vertices.length;
  for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)if(norm2(sub(vertices[i],vertices[j]))===2)edges.push([i,j]);
  const joined=(a,b)=>norm2(sub(vertices[a],vertices[b]))===2;
  for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)for(let k=j+1;k<n;k++)if(joined(i,j)&&joined(j,k)&&joined(k,i))faces.push([i,j,k]);
  if(name==='cuboctahedron')for(let axis=0;axis<3;axis++)for(const sign of [-1,1]){
    const ids=vertices.map((v,i)=>v[axis]===sign?i:-1).filter(i=>i>=0);
    const ordered=[ids[0]];
    while(ordered.length<4)ordered.push(ids.find(i=>!ordered.includes(i)&&joined(ordered.at(-1),i)));
    faces.push(ordered);
  }
  // Fan triangles on convex boundary; reference vertex lies on boundary. D=1 tetra volume corresponds to determinant magnitude 2.
  let doubled=0;for(const f of faces)for(let i=1;i<f.length-1;i++)doubled+=Math.abs(det(...[f[0],f[i],f[i+1]].map(j=>sub(vertices[j],vertices[0]))));
  if(doubled%2!==0)throw Error('nonintegral reference volume');
  return {vertices,edges,faces,tetravolumes:doubled/2};
}
