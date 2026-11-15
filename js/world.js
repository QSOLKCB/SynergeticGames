// SPDX-License-Identifier: Apache-2.0
import '../vendor/synergetics95/js/math.js';
export const GEO=globalThis.SynergeticsMath;
export const MAP=Object.freeze([
  '1111111111111111111',
  '1111110000000111111',
  '1111110000000111111',
  '1111110000000111111',
  '1111110000000111111',
  '1111111100011111111',
  '1000000000000000001',
  '1000000000000000001',
  '1000000000000000001',
  '1000000000000000001',
  '1000000000000000001',
  '1000000000000000001',
  '1000000000000000001',
  '1111111100011111111',
  '1111110000000111111',
  '1111110000000111111',
  '1111110000000111111',
  '1111110000000111111',
  '1111111111111111111'
].map(row=>Object.freeze([...row].map(Number))));
export const EXHIBITS=Object.freeze([
 {id:'tetra',name:'The Minimum Department',short:'Build',x:9.5,y:3.5,color:'#f6b754',mesh:'tetra',
  brief:'Build a tetrahedron from four vertices and six struts. The department tried three points. It was a flat-out failure.',
  fact:'A regular tetrahedron has 4 vertices, 6 edges and 4 triangular faces. A tetrahedron has the fewest faces of any closed polyhedron.',article:'minimum-system'},
 {id:'volume',name:'The Volume Bureau',short:'Measure',x:3.5,y:9.5,color:'#66d9cd',mesh:'octa',
  brief:'Calibrate the octahedron, then the vector equilibrium. Your unit is one regular tetrahedron, with the same edge length as each target.',
  fact:'At equal edge length: tetrahedron = 1, octahedron = 4, cuboctahedron (vector equilibrium) = 20 tetravolumes.',article:'tetrahedral-accounting'},
 {id:'ivm',name:'Neighbourhood Watch',short:'Connect',x:15.5,y:9.5,color:'#b4adff',mesh:'ve',
  brief:'Pair each of the twelve nearest-neighbour directions with its opposite. Even geometry needs someone who sees the other side.',
  fact:'The FCC / isotropic vector matrix has 12 nearest-neighbour directions. They form 6 opposite pairs and the vertices of a cuboctahedron.',article:'ivm'},
 {id:'quadray',name:'The Coordinate Office',short:'Locate',x:9.5,y:16.5,color:'#ff8d85',mesh:'tetra',
  brief:'The address contains unnecessary paperwork. Subtract the same amount from all four Quadrays until one reaches zero. Watch the point stay put.',
  fact:'These four tetrahedral basis vectors sum to zero. Adding or subtracting a common offset leaves the Cartesian position unchanged.',article:'quadray-coordinates'}
]);
export const MESHES=Object.freeze({tetra:GEO.regularTetrahedron(),octa:GEO.regularOctahedron(),ve:GEO.cuboctahedron()});
export const DIRECTIONS=GEO.ivmDirections();
export const CORE={x:9.5,y:9.5};
export const SOURCE='https://qsolkcb.github.io/synergetics2/';
export function meshVolume(mesh){
  let total=0;
  for(const face of mesh.faces)for(let i=1;i<face.length-1;i++)
    total+=GEO.euclideanTetraVolume([[0,0,0],mesh.vertices[face[0]],mesh.vertices[face[i]],mesh.vertices[face[i+1]]]);
  return total*6*Math.sqrt(2);
}
