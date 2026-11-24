// SPDX-License-Identifier: Apache-2.0
// At most four labelled vertices. Nonempty simplices have IDs 1..15 (vertex bit sets).
// Complex mask uses bit (id-1). Empty complex is allowed; ordinary, unreduced homology.
export const FULL=32767;
const integer=(v,min,max)=>Number.isSafeInteger(v)&&v>=min&&v<=max;
export function vertices(id){
  if(!integer(id,1,15))throw RangeError('simplex id must be 1..15');
  return [0,1,2,3].filter(i=>id&(1<<i));
}
export const dimension=id=>vertices(id).length-1;
export const simplexName=id=>vertices(id).map(i=>'ABCD'[i]).join('');
export const contains=(mask,id)=>!!(mask&(1<<(id-1)));
export function boundary(id,sign=1){
  if(sign!==1&&sign!==-1)throw RangeError('orientation must be ±1');
  const v=vertices(id);
  return v.length===1?[]:v.map((i,j)=>({id:id^(1<<i),coefficient:sign*(j%2?-1:1)}));
}
export function validateComplex(mask){
  if(!integer(mask,0,FULL))throw RangeError('invalid complex mask');
  for(let id=1;id<=15;id++)if(contains(mask,id))for(const f of boundary(id))if(!contains(mask,f.id))throw TypeError('missing face '+simplexName(f.id));
  return mask;
}
export function toggleSimplex(mask,id){
  validateComplex(mask);vertices(id);
  const next=mask^(1<<(id-1));return validateComplex(next);
}
export function closure(ids){
  if(!Array.isArray(ids)||ids.length>15)throw RangeError('bounded generators required');
  let mask=0;
  for(const id of ids){vertices(id);for(let sub=id;sub;sub=(sub-1)&id)mask|=1<<(sub-1);}
  return validateComplex(mask);
}
export const PRESETS=Object.freeze({
  empty:0,points:closure([1,2,4,8]),tree:closure([3,6,12]),loop:closure([3,5,6]),
  disk:closure([7]),surface:closure([7,11,13,14]),filled:closure([15]),disjoint:closure([3,12]),wireframe:closure([3,5,6,9,10,12])
});
export const field=p=>{if(p!==2&&p!==3)throw RangeError('coefficient field must be GF(2) or GF(3)');return p;};
export const mod=(v,p)=>((v%p)+p)%p;
export function basis(mask,k){
  validateComplex(mask);
  if(!integer(k,0,3))throw RangeError('dimension 0..3');
  return Array.from({length:15},(_,i)=>i+1).filter(id=>contains(mask,id)&&dimension(id)===k);
}
export function boundaryMatrix(mask,k,p){
  field(p);if(!integer(k,1,3))throw RangeError('boundary dimension 1..3');
  const rows=basis(mask,k-1),cols=basis(mask,k);
  const terms=cols.map(id=>boundary(id));
  return {rows,cols,values:rows.map(id=>terms.map(t=>mod(t.find(f=>f.id===id)?.coefficient??0,p)))};
}
// Small dense Gaussian elimination in the declared prime field; rectangular/empty matrices supported.
export function rank(matrix,p){
  field(p);
  if(!Array.isArray(matrix)||matrix.length>6)throw RangeError('bounded matrix');
  const width=matrix.length?matrix[0].length:0;
  if(!integer(width,0,6)||!Array.from(matrix).every(row=>Array.isArray(row)&&row.length===width&&Array.from(row).every(v=>integer(v,0,p-1))))throw TypeError('invalid matrix');
  const a=matrix.map(row=>[...row]);let r=0;
  for(let j=0;j<width&&r<a.length;j++){
    const pivot=a.findIndex((row,i)=>i>=r&&row[j]!==0);if(pivot<0)continue;
    [a[pivot],a[r]]=[a[r],a[pivot]];
    const inv=a[r][j]===1?1:2;
    a[r]=a[r].map(v=>mod(v*inv,p));
    for(let i=r+1;i<a.length;i++){const q=a[i][j];a[i]=a[i].map((v,k)=>mod(v-q*a[r][k],p));}
    r++;
  }
  return r;
}
export function composeZero(left,right,p){
  field(p);
  if(left.cols.length!==right.rows.length||left.cols.some((id,i)=>id!==right.rows[i]))throw TypeError('incompatible boundaries');
  return left.rows.every((_,i)=>right.cols.every((_,j)=>mod(left.cols.reduce((s,__,k)=>s+left.values[i][k]*right.values[k][j],0),p)===0));
}
export function homology(mask,p){
  validateComplex(mask);field(p);
  const counts=[0,1,2,3].map(k=>basis(mask,k).length);
  const matrices=[1,2,3].map(k=>boundaryMatrix(mask,k,p));
  const ranks=[0,...matrices.map(m=>rank(m.values,p)),0];
  const betti=counts.map((n,k)=>n-ranks[k]-ranks[k+1]);
  const euler=counts.reduce((s,n,k)=>s+(k%2?-n:n),0);
  return {counts,ranks,betti,euler,matrices,chain:composeZero(matrices[0],matrices[1],p)&&composeZero(matrices[1],matrices[2],p)};
}
export function doubleBoundary(id,sign,p){
  field(p);const coefficients=new Map();
  for(const f of boundary(id,sign))for(const g of boundary(f.id,f.coefficient))coefficients.set(g.id,mod((coefficients.get(g.id)??0)+g.coefficient,p));
  return [...coefficients].filter(([,v])=>v!==0).map(([id,coefficient])=>({id,coefficient}));
}
// Test a chain in the selected complex. Determine if it is a cycle and if it is a boundary.
export function classifyChain(mask,k,p,coefficients){
  validateComplex(mask);field(p);
  const ids=basis(mask,k);
  if(!Array.isArray(coefficients)||coefficients.length!==ids.length||!Array.from(coefficients).every(v=>integer(v,0,p-1)))throw TypeError('invalid chain');
  const lower=k===0?null:boundaryMatrix(mask,k,p);
  const cycle=!lower||lower.values.every(row=>mod(row.reduce((s,v,i)=>s+v*coefficients[i],0),p)===0);
  const upper=k===3?ids.map(()=>[]):boundaryMatrix(mask,k+1,p).values;
  // Exhaustively enumerate the image of the next boundary (at most 3^6 coefficients).
  const width=k===3?0:basis(mask,k+1).length;
  let isBoundary=false;
  for(let code=0;code<p**width&&!isBoundary;code++){
    let n=code;const vector=Array.from({length:width},()=>{const v=n%p;n=Math.floor(n/p);return v;});
    isBoundary=ids.every((_,i)=>mod(upper[i].reduce((s,v,j)=>s+v*vector[j],0),p)===coefficients[i]);
  }
  return {cycle,boundary:isBoundary,nontrivial:cycle&&!isBoundary};
}
