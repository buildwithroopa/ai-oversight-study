import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {reserveGroundedPhase} from '../experiment/runs/grounded-v5-budget.js';
test('four-call plan includes all historical charges and infrastructure without raising ceiling',()=>{
 const b=reserveGroundedPhase(541568,[11000,11500,11000,11500]);assert.ok(b.totalMicroUsd<1000000);
 assert.throws(()=>reserveGroundedPhase(541568,[25000,25000,25000,25000]),/ceiling/);
 assert.throws(()=>reserveGroundedPhase(541568,[1000]),/accounting/);
});
test('v5 intervention changes instructions, not paired data, schema, or action space',()=>{
 const p=JSON.parse(readFileSync(new URL('../results/grounded-v5-plan/requests.json',import.meta.url)));
 assert.equal(p.requests.length,4);assert.equal(p.priorEstimatedApiUsd,0.541568);
 for(const id of new Set(p.requests.map(r=>r.taskId))){
  const pair=p.requests.filter(r=>r.taskId===id);assert.equal(pair.length,2);assert.deepEqual(pair[0].messages,pair[1].messages);assert.notEqual(pair[0].system,pair[1].system);
  const data=JSON.parse(pair[0].messages[0].content);assert.equal(data.expectedImplementation,undefined);assert.match(data.responseSchema.nextAction,/request-more-evidence/);assert.match(data.specification,/eventId/);
 }
});
