import test from 'node:test';
import assert from 'node:assert/strict';
import { createService, LIMITS } from '../src/service.js';
function setup({tier = 'basic', type = 'partner', entitlements = [], devices = []} = {}) {
  let now = 1000;
  const service = createService({accounts: [
    {id:'a',type,tier,householdId:'h',partnerId:'p',subscriptionStatus:'active'},
    {id:'b',type:'direct',tier:'basic',householdId:'h',subscriptionStatus:'active'}
  ], devices, entitlements, clock: () => now});
  return {service, principal:{accountId:'a'}, advance: value => {now=value;}};
}
test('five total attempts shared across callers; UTC boundary resets', () => {
  const {service:s,principal:p,advance} = setup();
  for(let i=0;i<5;i++) {
    const r=s.verifyPartner(p,'a');
    assert.equal(r.reason,'partner_status_unknown');
    assert.equal(r.attemptsRemaining,4-i);
    assert.deepEqual(r.missingFields,['partnerEntitlement']);
    assert.match(r.message,/Retry with correct data/);
  }
  assert.equal(s.verifyPartner({...p},'a').reason,'daily_attempt_limit');
  advance(86399999);
  assert.equal(s.verifyPartner(p,'a').reason,'daily_attempt_limit');
  advance(86400000);
  assert.equal(s.verifyPartner(p,'a').attemptsRemaining,4);
});
test('unauthorized requests neither disclose data nor spend another account allowance', () => {
  const {service:s,principal:p}=setup();
  for(let i=0;i<10;i++) assert.deepEqual(s.verifyPartner({accountId:'b'},'a'),{allowed:false,reason:'access_denied'});
  assert.equal(s.verifyPartner(p,'a').attemptsRemaining,4);
  assert.deepEqual(s.verifyPartner(p,'nonexistent'),{allowed:false,reason:'access_denied'});
});
test('missing-field errors do not echo PII or payment values', () => {
  const {service:s,principal:p}=setup({entitlements:[{accountId:'a',partnerId:'p',email:'private@example.invalid',payment:'SECRET'}]});
  const r=s.verifyPartner(p,'a');
  assert.deepEqual(r.missingFields,['status','validUntil']);
  assert.doesNotMatch(JSON.stringify(r),/private|SECRET/);
});
test('partner validity expires exactly at boundary', () => {
  for(const [validUntil,allowed] of [[1000,false],[1001,true]]) {
    const {service:s,principal:p}=setup({entitlements:[{accountId:'a',partnerId:'p',status:'active',validUntil}]});
    assert.equal(s.verifyPartner(p,'a').allowed,allowed);
  }
});
test('completed conversion ignores missing partner evidence and exhausted partner attempts', () => {
  const {service:s,principal:p}=setup();
  for(let i=0;i<5;i++) s.verifyPartner(p,'a');
  s.registerDevice(p,'a','d');
  assert.equal(s.trustedBilling.applyCompletedDirectConversion('a','inactive').allowed,false);
  assert.equal(s.startStream(p,'a','d').allowed,false);
  s.trustedBilling.applyCompletedDirectConversion('a','active');
  assert.equal(s.startStream(p,'a','d').allowed,true);
  assert.equal(s.verifyPartner(p,'a').reason,'partner_verification_not_applicable');
});
for(const [tier,cap] of Object.entries(LIMITS)) test(`${tier}: independent device and stream limits at ${cap}`, () => {
  // Legacy registered devices beyond cap make stream limit independently reachable.
  const devices=Array.from({length:cap+1},(_,i)=>({id:`d${i}`,accountId:'a',householdId:'h'}));
  const {service:s,principal:p}=setup({type:'direct',tier,devices});
  assert.equal(s.registerDevice(p,'a','new').reason,'device_limit');
  assert.equal(s.registerDevice(p,'a','d0').allowed,true);
  for(let i=0;i<cap;i++) assert.equal(s.startStream(p,'a',`d${i}`).allowed,true);
  assert.equal(s.startStream(p,'a',`d${cap}`).reason,'stream_limit');
  assert.match(s.startStream(p,'a',`d${cap}`).message,/Stop playback on one active stream/);
  assert.equal(s.startStream(p,'a','d0').reason,'already_streaming');
  assert.equal(s.stopStream(p,'a','d0').allowed,true);
  assert.equal(s.startStream(p,'a',`d${cap}`).allowed,true);
});
test('new registration boundary and account/household isolation', () => {
  const {service:s,principal:p}=setup({type:'direct',devices:[{id:'other',accountId:'b',householdId:'h'},{id:'away',accountId:'a',householdId:'different'}]});
  assert.equal(s.registerDevice(p,'a','other').reason,'access_denied');
  assert.equal(s.startStream(p,'a','other').reason,'access_denied');
  assert.equal(s.startStream(p,'a','away').reason,'household_mismatch');
  assert.equal(s.registerDevice(p,'a','new').allowed,true);
  assert.equal(s.registerDevice(p,'a','extra').reason,'device_limit');
});

// Regression cases use startStream (the actual entry point), not verifyPartner alone.
function partnerFixture(status, entitlement) {
  return createService({
    accounts:[{id:'a',type:'partner',tier:'basic',householdId:'h',partnerId:'p',
      ...(status === undefined ? {} : {subscriptionStatus:status})}],
    devices:[{id:'tv',accountId:'a',householdId:'h'}],
    entitlements:entitlement ? [{accountId:'a',partnerId:'p',...entitlement}] : [],
    clock:()=>1000
  });
}
for (const status of [undefined,'inactive']) test(`active partner starts streaming with direct status ${status}`, () => {
  const s=partnerFixture(status,{status:'active',validUntil:2000});
  assert.deepEqual(s.startStream({accountId:'a'},'a','tv'),{allowed:true,reason:'stream_started'});
});
test('stream request with missing partner evidence returns actionable validation', () => {
  const s=partnerFixture(undefined);
  assert.deepEqual(s.startStream({accountId:'a'},'a','tv'),{
    allowed:false,reason:'partner_status_unknown',missingFields:['partnerEntitlement'],
    retryable:true,attemptsRemaining:5,
    message:'Missing fields: partnerEntitlement. Retry with correct data through the authorized partner verification flow.'
  });
});
test('inactive partner playback denial must not consume recovery allowance', () => {
  const s=partnerFixture(undefined,{status:'inactive',validUntil:2000});
  assert.deepEqual(s.startStream({accountId:'a'},'a','tv'),{
    allowed:false,reason:'inactive_subscription',attemptsRemaining:5
  });
  assert.equal(s.verifyPartner({accountId:'a'},'a').attemptsRemaining,4);
});
