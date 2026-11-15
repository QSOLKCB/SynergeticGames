import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=new URL('../',import.meta.url),read=p=>readFileSync(new URL(p,root),'utf8');
test('every pinned vendor file retains its recorded identity and license',()=>{
  const manifest=JSON.parse(read('vendor/PROVENANCE.json'));
  for(const file of manifest.files){assert.match(file.commit,/^[0-9a-f]{40}$/);assert.equal(createHash('sha256').update(readFileSync(new URL(file.path,root))).digest('hex'),file.sha256,file.path);}
  for(const path of ['vendor/rayshare/LICENSE','vendor/vanillajs/LICENSE','vendor/synergetics95/LICENSE'])assert.ok(read(path).length>1000);
});
test('offline shell contains the transitive runtime imports and no remote runtime assets',()=>{
  const html=read('index.html'),sw=read('sw.js');
  const assetSection=sw.split('const ASSETS=')[1].split('];')[0];
  const cached=[...assetSection.matchAll(/'([^']+)'/g)].map(m=>m[1].replace(/^\.\//,''));
  for(const path of cached.filter(Boolean))assert.ok(existsSync(new URL(path,root)),path);
  const visited=new Set();function visit(path){if(visited.has(path))return;visited.add(path);assert.ok(cached.includes(path),`not cached: ${path}`);
    for(const m of read(path).matchAll(/(?:from\s+|import\s*)['"]([^'"]+)['"]/g)){
      assert.ok(m[1].startsWith('.'),`external module: ${m[1]}`);const child=new URL(m[1],new URL(path,root));visit(fileURLToPath(child).slice(fileURLToPath(root).length));
    }
  }visit('js/app.js');
  assert.equal(/<(?:script|link)[^>]+(?:src|href)=["']https?:/.test(html),false);
  assert.ok(html.includes('We are not members of the School of Tomorrow'));
});
