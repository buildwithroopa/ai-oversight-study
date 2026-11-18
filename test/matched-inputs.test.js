import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildMatchedInputs} from '../experiment/runs/matched-inputs.js';
const root=new URL('../',import.meta.url);
const manifest=JSON.parse(await readFile(new URL('evaluator/development-v2-manifest.json',root),'utf8'));
const packets=await Promise.all(manifest.tasks.map(async t=>JSON.parse(await readFile(new URL(`model-input/development-v2/${t.taskId}.json`,root),'utf8'))));
const logs=JSON.parse(await readFile(new URL('results/test-generation/logged-execution.json',root),'utf8'));
const code=await readFile(new URL('results/test-generation/generated-test-source.txt',root),'utf8');
test('paired conditions share identical candidate and requirements',()=>{
 const inputs=buildMatchedInputs(packets,logs,code);assert.equal(inputs.length,8);
 for(const p of packets){const pair=inputs.filter(r=>r.taskId===p.taskId);assert.equal(pair.length,2);assert.equal(pair[0].candidateSha256,pair[1].candidateSha256);assert.equal(pair[0].requirementsSha256,pair[1].requirementsSha256);assert.equal(pair[0].system,pair[1].system);}
});
test('code-only receives no test evidence; assisted receives unchanged code and raw execution',()=>{
 for(const r of buildMatchedInputs(packets,logs,code)){
  const data=JSON.parse(r.messages[0].content);
  assert.deepEqual(Object.keys(data).sort(),(r.condition==='code-only'?['taskId','specification','files']:['taskId','specification','files','testEvidence']).sort());
  if(r.condition==='code-only')assert.equal(data.testEvidence,undefined);
  else{assert.equal(data.testEvidence.testCode,code);assert.match(data.testEvidence.stdout,/# tests 12\b/);}
 }
});
test('missing evidence fails closed',()=>{
 assert.throws(()=>buildMatchedInputs(packets,logs.slice(1),code));
});
