// SPDX-License-Identifier: Apache-2.0
import {ExactGraph,graphInvariants} from '../../vendor/vanillajs/modules/exact-graph/index.js';
// Reviewed static topology: these are graph triangles, not a general face-complex oracle.
export function tetrahedralGraph(struts){
  if(!Array.isArray(struts)||struts.length>6)throw new TypeError('bounded strut array required');
  const edges=Array.from(struts,edge=>{
    if(typeof edge!=='string'||!['AB','AC','AD','BC','BD','CD'].includes(edge))throw new TypeError('invalid strut');
    return [edge.charCodeAt(0)-65,edge.charCodeAt(1)-65];
  });
  return graphInvariants(new ExactGraph(4,edges));
}
