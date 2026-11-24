// SPDX-License-Identifier: Apache-2.0
import {openSync,readSync,closeSync} from 'node:fs';
import {registry} from '../js/museum/catalogue.js';
import {parseData,validateRoute,LIMITS} from '../js/museum/registry.js';
import {validatePack} from '../js/museum/exhibit-packs.js';
import {verifyResearchEvidence} from '../js/museum/research-evidence.js';
try{
  if(process.argv.length!==3)throw Error('Usage: node scripts/validate-museum.mjs RECORD.json');
  const fd=openSync(process.argv[2],'r'),buffer=Buffer.alloc(LIMITS.bytes+1);let n=0;
  try{while(n<buffer.length){const count=readSync(fd,buffer,n,buffer.length-n,null);if(!count)break;n+=count;}}finally{closeSync(fd);}
  if(n>LIMITS.bytes)throw Error('64 KiB maximum');
  const value=parseData(new TextDecoder('utf-8',{fatal:true}).decode(buffer.subarray(0,n)));
  const result=value.kind==='museum.pack.v1'?validatePack(registry,value):value.kind==='museum.route.v1'?validateRoute(registry,value):value.kind==='museum.research.evidence.v1'?verifyResearchEvidence(value):null;
  if(!result)throw Error('Unsupported record kind');
  console.log('PASS',value.kind,result.id??result.experiment);
}catch(e){console.error('FAIL:',e.message);process.exitCode=1;}
