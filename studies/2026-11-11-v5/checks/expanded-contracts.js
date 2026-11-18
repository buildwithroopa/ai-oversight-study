import assert from 'node:assert/strict';
import {contracts} from './contracts.js';
import {assertNoPersonalValues} from './privacy.js';
export const expandedContracts=[...contracts,
 ['nested response may not disclose personal values',create=>{
  const id='ACCOUNT_PRIVATE_EXPANDED',partnerId='PARTNER_PRIVATE_EXPANDED',email='private-expanded@example.invalid';
  const s=create({accounts:[{id,type:'partner',tier:'basic',householdId:'h',partnerId,email}],clock:()=>1000});
  const r=s.verifyPartner({accountId:id},id);
  assertNoPersonalValues(r,[id,partnerId,email]);
  assert.deepEqual(r,{allowed:false,reason:'partner_status_unknown',missingFields:['partnerEntitlement'],retryable:true,attemptsRemaining:4,
   message:'Missing fields: partnerEntitlement. Retry with correct data through the authorized partner verification flow.'});
 }],
 ['clock retry is safe and allowance unchanged',create=>{
  let now=null;const s=create({accounts:[{id:'a',type:'partner',tier:'basic',householdId:'h',partnerId:'p'}],clock:()=>now});
  assert.deepEqual(s.verifyPartner({accountId:'a'},'a'),{allowed:false,reason:'verification_unavailable',retryable:true,retryAfterSeconds:30,
   message:'Unable to verify access right now. Retry in 30 seconds. Your verification attempt was not consumed.'});
  now=1000;assert.equal(s.verifyPartner({accountId:'a'},'a').attemptsRemaining,4);
 }],
 ['restarts cannot consume explicit verification quota',create=>{
  const s=create({accounts:[{id:'a',type:'partner',tier:'basic',householdId:'h',partnerId:'p'}],devices:[{id:'d',accountId:'a',householdId:'h'}],
   entitlements:[{accountId:'a',partnerId:'p',status:'active',validUntil:2000}],clock:()=>1000});
  for(let i=0;i<20;i++){
   assert.deepEqual(s.startStream({accountId:'a'},'a','d'),{allowed:true,reason:'stream_started'});
   assert.deepEqual(s.stopStream({accountId:'a'},'a','d'),{allowed:true,reason:'stream_stopped'});
  }
  assert.equal(s.verifyPartner({accountId:'a'},'a').attemptsRemaining,4);
 }],
 ['video boundary permits current video but denies the next after expiry',create=>{
  let now=1000;const p={accountId:'a'};
  const s=create({accounts:[{id:'a',type:'partner',tier:'basic',householdId:'h',partnerId:'p'}],devices:[{id:'d',accountId:'a',householdId:'h'}],
   entitlements:[{accountId:'a',partnerId:'p',status:'active',validUntil:2000}],clock:()=>now});
  assert.deepEqual(s.startStream(p,'a','d'),{allowed:true,reason:'stream_started'});
  now=2000;assert.deepEqual(s.startStream(p,'a','d'),{allowed:true,reason:'already_streaming'});
  assert.deepEqual(s.startNextVideo(p,'a','d','event-1'),{allowed:false,reason:'partner_entitlement_expired',attemptsRemaining:5});
 }],
 ['household changes are bounded and require separately verified device rebinding',create=>{
  const p={accountId:'a'};const s=create({accounts:[{id:'a',type:'direct',tier:'basic',householdId:'h',subscriptionStatus:'active'}],
   devices:[{id:'d',accountId:'a',householdId:'h'}],clock:()=>1000});
  assert.deepEqual(s.trustedHousehold.applyVerifiedHouseholdUpdate(p,'a','one'),{allowed:true,reason:'household_updated',updatesRemaining:1});
  assert.equal(s.startStream(p,'a','d').reason,'household_mismatch');
  assert.deepEqual(s.trustedHousehold.applyVerifiedHouseholdUpdate(p,'a','two'),{allowed:true,reason:'household_updated',updatesRemaining:0});
  assert.equal(s.trustedHousehold.applyVerifiedHouseholdUpdate(p,'a','three').reason,'household_update_limit');
  assert.equal(s.trustedHousehold.applyVerifiedHouseholdUpdate(p,'a','two').reason,'household_unchanged');
  assert.equal(s.trustedHousehold.applyVerifiedDeviceRebind(p,'a','d').reason,'device_household_verified');
  assert.equal(s.startStream(p,'a','d').reason,'stream_started');
 }]
 ,['household change preserves current video until trusted boundary',create=>{
  const p={accountId:'a'},s=create({accounts:[{id:'a',type:'direct',tier:'basic',householdId:'h',subscriptionStatus:'active'}],devices:[{id:'d',accountId:'a',householdId:'h'}],clock:()=>1000});
  s.startStream(p,'a','d');s.trustedHousehold.applyVerifiedHouseholdUpdate(p,'a','new');
  assert.deepEqual(s.startStream(p,'a','d'),{allowed:true,reason:'already_streaming'});
  assert.deepEqual(s.startNextVideo(p,'a','d','event'),{allowed:false,reason:'household_mismatch'});
  s.trustedHousehold.applyVerifiedDeviceRebind(p,'a','d');
  assert.deepEqual(s.startNextVideo(p,'a','d','event'),{allowed:false,reason:'household_mismatch'});
  assert.equal(s.startStream(p,'a','d').reason,'stream_started');
 }],
 ['duplicate boundary preserves original result without restarting expired playback',create=>{
  let now=1000;const p={accountId:'a'},s=create({accounts:[{id:'a',type:'partner',tier:'basic',householdId:'h',partnerId:'p'}],devices:[{id:'d',accountId:'a',householdId:'h'}],entitlements:[{accountId:'a',partnerId:'p',status:'active',validUntil:2000}],clock:()=>now});
  s.startStream(p,'a','d');const r=s.startNextVideo(p,'a','d','one');assert.equal(r.reason,'stream_started');r.reason='tampered';now=2000;
  assert.deepEqual(s.startNextVideo(p,'a','d','one'),{allowed:true,reason:'stream_started'});
  assert.equal(s.startNextVideo(p,'a','d','two').reason,'partner_entitlement_expired');
  assert.equal(s.startNextVideo(p,'a','d','one').reason,'stream_started');
  assert.equal(s.startStream(p,'a','d').reason,'partner_entitlement_expired');
 }],
 ['boundary validation and cache authorization cannot end or expose another video',create=>{
  const p={accountId:'a'},s=create({accounts:['a','b'].map(id=>({id,type:'direct',tier:'basic',householdId:'h',subscriptionStatus:'active'})),devices:[{id:'d',accountId:'a',householdId:'h'}],clock:()=>1000});
  s.startStream(p,'a','d');assert.equal(s.startNextVideo(p,'a','d').reason,'invalid_input');
  assert.equal(s.startStream(p,'a','d').reason,'already_streaming');s.startNextVideo(p,'a','d','event');
  assert.deepEqual(s.startNextVideo({accountId:'b'},'a','d','event'),{allowed:false,reason:'access_denied'});
  assert.deepEqual(s.startNextVideo({accountId:'b'},'b','d','event'),{allowed:false,reason:'access_denied'});
 }],
 ['boundary event identity is scoped per device and idle events cannot start playback',create=>{
  const p={accountId:'a'},s=create({accounts:[{id:'a',type:'direct',tier:'basic',householdId:'h',subscriptionStatus:'active'}],devices:['d','e'].map(id=>({id,accountId:'a',householdId:'h'})),clock:()=>1000});
  s.startStream(p,'a','d');assert.equal(s.startNextVideo(p,'a','d','event').reason,'stream_started');
  assert.deepEqual(s.startNextVideo(p,'a','e','event'),{allowed:false,reason:'no_active_video'});
  s.stopStream(p,'a','d');assert.equal(s.startNextVideo(p,'a','d','event').reason,'stream_started');
  assert.deepEqual(s.startNextVideo(p,'a','d','fresh'),{allowed:false,reason:'no_active_video'});
 }]

];
export function evaluateExpanded(create){return expandedContracts.map(([name,check])=>{
 try{check(create);return {name,passes:true};}catch(error){return {name,passes:false,error:error.message};}
});}
