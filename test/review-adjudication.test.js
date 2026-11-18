import {test} from 'node:test';
import assert from 'node:assert/strict';
import {prepareAdjudication,finalizeAdjudication} from '../evaluator/review-adjudication.js';
const review={taskId:'synthetic',implementationJudgment:'violates',evidenceJudgment:'incomplete',nextAction:'reject',violations:[{category:'privacy',requirement:'No personal values',evidence:'Inspect response branch',expected:'No email',actual:'No decisive violation found in this entry.'}],evidenceGaps:[],supportingEvidence:[]};
test('structurally valid rejection remains unverified; contradictory claim flagged',()=>{
 const d=prepareAdjudication(review);assert.equal(d.verifiedAction,null);assert.equal(d.status,'requires-adjudication');assert.deepEqual(d.claims[0].flags,['possible-self-contradiction']);
});
test('unflagged claim is not automatically trusted',()=>{
 const d=prepareAdjudication({...review,violations:[{...review.violations[0],actual:'Response contains a value'}]});assert.equal(d.verifiedAction,null);assert.deepEqual(d.claims[0].flags,[]);
});
test('supported privacy violation rejects even with otherwise adequate evidence',()=>{
 assert.equal(finalizeAdjudication(review,[{index:0,status:'supported',reason:'Synthetic email is returned by the missing-data branch'}],{reviewer:'test reviewer',scopeEvidenceAdequate:true}).verifiedAction,'reject');
});
test('unsupported allegations do not become acceptance without sufficient evidence',()=>{
 const ds=[{index:0,status:'unsupported',reason:'No exposed value in the specified response'}];
 assert.equal(finalizeAdjudication(review,ds,{reviewer:'test reviewer'}).verifiedAction,'request-more-evidence');
 assert.equal(finalizeAdjudication(review,ds,{reviewer:'test reviewer',scopeEvidenceAdequate:true,materialGap:true}).verifiedAction,'request-more-evidence');
 assert.equal(finalizeAdjudication(review,ds,{reviewer:'test reviewer',scopeEvidenceAdequate:true}).verifiedAction,'accept-bounded-task');
 assert.throws(()=>finalizeAdjudication(review,[],{reviewer:'test reviewer'}),/complete/);
});
