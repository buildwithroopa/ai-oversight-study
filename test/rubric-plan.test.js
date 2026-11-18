import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const plan=JSON.parse(await readFile(new URL('results/rubric-comparison-plan/requests.json',root),'utf8'));
test('rubric plan holds task data and response schema fixed across both conditions',()=>{
 assert.equal(plan.requests.length,8);assert.equal(plan.status,'prepared-not-run');
 const ids=new Set(plan.requests.map(r=>r.taskId));assert.equal(ids.size,4);
 for(const id of ids){
  const pair=plan.requests.filter(r=>r.taskId===id);assert.equal(pair.length,2);
  assert.equal(pair[0].messages[0].content,pair[1].messages[0].content);
  assert.equal(pair[0].candidateSha256,pair[1].candidateSha256);
  assert.notEqual(pair[0].system,pair[1].system);
 }
});
test('both arms permit evidence requests and exclude evaluator labels and stale execution results',()=>{
 for(const request of plan.requests){
  assert.match(request.system,/uncertain/);
  const data=JSON.parse(request.messages[0].content);
  assert.match(data.responseSchema.nextAction,/request-more-evidence/);
  assert.deepEqual(Object.keys(data).sort(),['taskId','specification','files','suppliedTests','responseSchema'].sort());
  assert.match(data.suppliedTests.status,/No execution outcome/);
  assert.equal(data.expectedImplementation,undefined);assert.equal(data.testResults,undefined);
 }
});
