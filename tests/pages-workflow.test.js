import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const workflow=readFileSync(new URL('../.github/workflows/ci.yml',import.meta.url),'utf8');
const gate="github.ref == 'refs/heads/main' && github.event_name != 'pull_request'";
// This is a deliberately narrow structural check of our checked-in workflow,
// not a general YAML parser and not a simulation of GitHub artifact visibility.
function contract(source){
  const lines=source.replace(/\r\n/g,'\n').split('\n');
  const jobs=lines.indexOf('jobs:');assert.ok(jobs>=0,'jobs missing');
  const headings=lines.map((line,i)=>/^  [a-z][\w-]*:$/.test(line)&&i>jobs?i:-1).filter(i=>i>=0);
  const get=name=>{
    const start=lines.indexOf('  '+name+':',jobs+1);assert.ok(headings.includes(start),name+' missing');
    return lines.slice(start+1,headings.find(i=>i>start)??lines.length);
  };
  const validate=get('validate'),deploy=get('deploy'),compatibility=get('compatibility');
  assert.ok(validate.includes('    needs: compatibility'),'Pages validation must depend on compatibility jobs');
  assert.ok(compatibility.includes('        engine: [firefox, webkit]'));
  assert.ok(compatibility.some(line=>line.includes('python tests/browser.py')));
  const steps=job=>{
    const start=job.indexOf('    steps:');assert.ok(start>=0);
    const body=job.slice(start+1),indices=body.map((s,i)=>/^      - /.test(s)?i:-1).filter(i=>i>=0);
    return indices.map((i,n)=>body.slice(i,indices[n+1]??body.length).join('\n'));
  };
  const v=steps(validate),d=steps(deploy),upload=s=>s.includes('uses: actions/upload-pages-artifact@'),stage=s=>s.includes('name: Stage only distributable files'),publish=s=>s.includes('uses: actions/deploy-pages@');
  const u=v.findIndex(upload),s=v.findIndex(stage),browser=v.findIndex(x=>x.includes('python tests/browser.py'));
  assert.ok(browser>=0&&s>browser&&u>s,'validation must finish before staging and uploading');
  assert.equal(v.filter(upload).length,1);assert.equal(v.filter(stage).length,1);
  assert.ok(v[s].split('\n').includes('        if: '+gate));assert.ok(v[u].split('\n').includes('        if: '+gate));
  assert.ok(v[u].split('\n').includes('          path: _site'));
  assert.ok(deploy.includes('    if: '+gate));assert.ok(deploy.includes('    needs: validate'));
  assert.equal(d.filter(upload).length,0,'never upload Pages artifact inside deploy');
  assert.equal(d.filter(stage).length,0);assert.equal(d.filter(publish).length,1);
  assert.equal(v.filter(publish).length,0);
}
test('Pages artifact is uploaded by validation before the main-only dependent deployment (PR #4)',()=>contract(workflow));
test('Pages workflow guard rejects the pre-PR #4 ordering and lost main/dependency gates',()=>{
  const first=workflow.indexOf('      - name: Stage only distributable files');
  const end=workflow.indexOf('  deploy:',first);
  const moved=workflow.slice(first,end);
  const old=workflow.slice(0,first)+workflow.slice(end);
  const position=old.indexOf('      - uses: actions/deploy-pages@');
  assert.throws(()=>contract(old.slice(0,position)+moved+old.slice(position)));
  assert.throws(()=>contract(workflow.replace('    needs: validate','    needs: other')));
  assert.throws(()=>contract(workflow.replace('    needs: compatibility','    needs: other')));
  assert.throws(()=>contract(workflow.replace('    if: '+gate+'\n    needs:', '    if: always()\n    needs:')));
  assert.throws(()=>contract(workflow.replace('        if: '+gate,'        if: always()')));
});
