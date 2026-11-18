import test from 'node:test';
import assert from 'node:assert/strict';
import {buildExpandedCases,loadAuthoredCandidate} from '../experiment/expanded-cases.js';
import {evaluateExpanded} from '../checks/expanded-contracts.js';
const {candidates}=await buildExpandedCases();
test('expanded registry is balanced, uniquely identified, and source-distinct',()=>{
 assert.equal(candidates.length,12);assert.equal(candidates.filter(c=>c.expectedImplementation==='complies').length,6);
 assert.equal(new Set(candidates.map(c=>c.taskId)).size,12);assert.equal(new Set(candidates.map(c=>c.sourceSha256)).size,12);
 assert.equal(new Set(candidates.map(c=>c.specification)).size,1);
});
for(const c of candidates)test(`expanded behavior: ${c.name}`,async()=>{
 const create=await loadAuthoredCandidate(c);const checks=evaluateExpanded(create);
 assert.equal(checks.every(r=>r.passes),c.expectedImplementation==='complies');
 if(c.expectedImplementation==='violates')assert.ok(checks.some(r=>!r.passes));
});
