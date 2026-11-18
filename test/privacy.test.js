import test from 'node:test';
import assert from 'node:assert/strict';
import {createService} from '../src/service.js';
import {assertNoPersonalValues} from '../checks/privacy.js';
function fixture(tag, entitlementFields={}) {
  const values={accountId:`ACCOUNT_PRIVATE_${tag}`,partnerId:`PARTNER_PRIVATE_${tag}`,
    email:`private-${tag}@example.invalid`,name:`PERSON_PRIVATE_${tag}`,payment:`PAYMENT_PRIVATE_${tag}`};
  const s=createService({accounts:[{id:values.accountId,type:'partner',tier:'basic',householdId:'h',partnerId:values.partnerId,email:values.email,name:values.name}],
    entitlements:[{...values,accountId:values.accountId,partnerId:values.partnerId,...entitlementFields}],clock:()=>1000});
  return {s,values,p:{accountId:values.accountId}};
}
test('authorized missing-data response has actionable field names and no personal values',()=>{
 const {s,values,p}=fixture('ONE');
 const response=s.verifyPartner(p,values.accountId);
 assert.deepEqual(response,{allowed:false,reason:'partner_status_unknown',missingFields:['status','validUntil'],retryable:true,attemptsRemaining:4,
   message:'Missing fields: status, validUntil. Retry with correct data through the authorized partner verification flow.'});
 assertNoPersonalValues(response,Object.values(values));
});
test('changing personal data and identifiers cannot change the same validation outcome',()=>{
 const a=fixture('ALPHA'),b=fixture('BRAVO');
 const one=a.s.verifyPartner(a.p,a.values.accountId),two=b.s.verifyPartner(b.p,b.values.accountId);
 assert.deepEqual(one,two);
 assertNoPersonalValues(one,Object.values(a.values));assertNoPersonalValues(two,Object.values(b.values));
});
test('invalid values and exhausted allowance never echo personal details',()=>{
 const {s,values,p}=fixture('ERROR',{status:'secret-status@example.invalid',validUntil:2000});
 for(let remaining=4;remaining>=0;remaining--){
  const r=s.verifyPartner(p,values.accountId);
  assert.deepEqual(r,{allowed:false,reason:'invalid_partner_data',attemptsRemaining:remaining});
  assertNoPersonalValues(r,[...Object.values(values),'secret-status@example.invalid']);
 }
 const blocked=s.verifyPartner(p,values.accountId);
 assert.deepEqual(blocked,{allowed:false,reason:'daily_attempt_limit',retryable:false,attemptsRemaining:0,retryAt:86400000});
 assertNoPersonalValues(blocked,Object.values(values));
});
test('unauthorized requests do not reveal account existence or validation fields',()=>{
 const {s,values}=fixture('FOREIGN');
 const known=s.verifyPartner({accountId:'ATTACKER_PRIVATE'},values.accountId);
 const unknown=s.verifyPartner({accountId:'ATTACKER_PRIVATE'},'UNKNOWN_PRIVATE');
 assert.deepEqual(known,{allowed:false,reason:'access_denied'});assert.deepEqual(known,unknown);
 assertNoPersonalValues(known,[...Object.values(values),'ATTACKER_PRIVATE','UNKNOWN_PRIVATE']);
});
test('privacy checker actually rejects a leaked value in fields, messages, and nested data',()=>{
 const canary='EMAIL_PRIVATE@example.invalid';
 assert.doesNotThrow(()=>assertNoPersonalValues({reason:'invalid_input',missingFields:['email']},[canary]));
 for(const response of [{email:canary},{message:`Correct email ${canary}`},{error:{debug:[canary]}}])
  assert.throws(()=>assertNoPersonalValues(response,[canary]),assert.AssertionError);
});
