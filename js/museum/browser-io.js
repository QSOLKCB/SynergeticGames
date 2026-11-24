// SPDX-License-Identifier: Apache-2.0
// Native user-initiated download; attach anchor and defer revocation for Gecko/WebKit.
export function downloadFile(bytes,name,type='application/json',doc=document){
  const url=URL.createObjectURL(new Blob([bytes],{type})),a=doc.createElement('a');
  try{a.href=url;a.download=name;a.hidden=true;doc.body.append(a);a.click();}
  finally{a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);}
}
