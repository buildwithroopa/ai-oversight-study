import test from 'node:test';
import assert from 'node:assert/strict';
import {validateStructuredReview as validate} from '../evaluator/structured-review.js';
const uncertain={taskId:'fixture',implementationJudgment:'uncertain',evidenceJudgment:'invalid',nextAction:'request-more-evidence',violations:[],evidenceGaps:['Only privacy assertion is always true; no other privacy evidence available.'],supportingEvidence:[]};
const violation={category:'privacy',requirement:'Do not expose personal values in user-visible errors.',evidence:'Synthetic email observed in nested response debug field.',expected:'No personal value in response.',actual:'Synthetic email appears in debug.email.'};
test('weak tests with no established violation request evidence',()=>assert.equal(validate(uncertain),uncertain));
test('weak tests alone cannot justify rejecting code',()=>assert.throws(()=>validate({...uncertain,nextAction:'reject'})));
test('privacy and security violations require rejection regardless of other evidence',()=>{
 for(const category of ['privacy','security']){
  const r={...uncertain,implementationJudgment:'violates',nextAction:'reject',violations:[{...violation,category}]};assert.equal(validate(r),r);
  assert.throws(()=>validate({...r,nextAction:'accept-bounded-task'}));assert.throws(()=>validate({...r,nextAction:'request-more-evidence'}));
 }
});
test('rejection cannot omit concrete evidence',()=>assert.throws(()=>validate({...uncertain,implementationJudgment:'violates',nextAction:'reject',violations:[{category:'security'}]})));
test('a weak individual test need not invalidate independent adequate compliance evidence',()=>{
 const r={...uncertain,implementationJudgment:'complies',nextAction:'accept-bounded-task',evidenceGaps:[],supportingEvidence:['Independent checks establish every bounded requirement despite a redundant weak test.']};
 assert.equal(validate(r),r);assert.throws(()=>validate({...r,evidenceGaps:['Unresolved ownership failure concern.']}));
});
