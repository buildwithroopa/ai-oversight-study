import test from 'node:test';
import assert from 'node:assert/strict';
import {createService} from '../src/service.js';
const DAY=86400000,p={accountId:'a'};
function fixture(type='partner'){
 let now=1000;
 const s=createService({accounts:['a','b'].map(id=>({id,type,tier:'basic',householdId:'h',partnerId:'p',subscriptionStatus:'active'})),
  devices:[{id:'d',accountId:'a',householdId:'h'},{id:'e',accountId:'a',householdId:'h'},{id:'f',accountId:'b',householdId:'h'}],
  entitlements:[{accountId:'a',partnerId:'p',status:'active',validUntil:2000}],clock:()=>now});
 return {s,setTime:t=>{now=t;},update:(household)=>s.trustedHousehold.applyVerifiedHouseholdUpdate(p,'a',household)};
}
test('expiry preserves current video but next video is denied and capacity released',()=>{
 const {s,setTime}=fixture();
 assert.equal(s.startStream(p,'a','d').reason,'stream_started');setTime(2000);
 assert.equal(s.startStream(p,'a','d').reason,'already_streaming');
 assert.deepEqual(s.startNextVideo(p,'a','d','event-1'),{allowed:false,reason:'partner_entitlement_expired',attemptsRemaining:5});
 s.trustedBilling.applyCompletedDirectConversion('a','active');
 assert.equal(s.startStream(p,'a','d').reason,'stream_started');
});
test('next-video transition at full capacity rechecks without adding a slot or recovery attempt',()=>{
 const {s}=fixture();s.startStream(p,'a','d');s.startStream(p,'a','e');
 for(let i=0;i<10;i++)assert.deepEqual(s.startNextVideo(p,'a','d',`event-${i}`),{allowed:true,reason:'stream_started'});
 assert.equal(s.verifyPartner(p,'a').attemptsRemaining,4);
});
test('unauthorized next-video request cannot end another account video',()=>{
 const {s}=fixture();s.startStream(p,'a','d');
 assert.deepEqual(s.startNextVideo({accountId:'b'},'a','d','event-1'),{allowed:false,reason:'access_denied'});
 assert.equal(s.startStream(p,'a','d').reason,'already_streaming');
});
test('two changes per rolling 30 days; exact boundary frees first change only',()=>{
 const {s,setTime,update}=fixture('direct');
 assert.deepEqual(update('h1'),{allowed:true,reason:'household_updated',updatesRemaining:1});
 setTime(DAY+1000);assert.deepEqual(update('h2'),{allowed:true,reason:'household_updated',updatesRemaining:0});
 const blocked={allowed:false,reason:'household_update_limit',retryable:false,updatesRemaining:0,retryAt:30*DAY+1000,
  message:'Household update limit reached. Two changes are allowed per 30 days. Retry after the limit resets.'};
 setTime(30*DAY+999);assert.deepEqual(update('h3'),blocked);
 setTime(30*DAY+1000);assert.deepEqual(update('h3'),{allowed:true,reason:'household_updated',updatesRemaining:0});
 assert.equal(update('h4').reason,'household_update_limit');
 // Blocked update did not change the household or devices.
 assert.equal(s.registerDevice(p,'a','new').reason,'device_limit');
 assert.equal(s.startStream(p,'a','d').reason,'household_mismatch');
});
test('initial setup, no-ops, failed requests do not use household change allowance',()=>{
 const {s,update}=fixture('direct');
 assert.deepEqual(update('h'),{allowed:true,reason:'household_unchanged'});
 assert.deepEqual(update(''),{allowed:false,reason:'invalid_input'});
 assert.equal(s.trustedHousehold.applyVerifiedHouseholdUpdate({accountId:'b'},'a','other').reason,'access_denied');
 assert.equal(update('h1').updatesRemaining,1);assert.equal(update('h2').updatesRemaining,0);
 assert.equal(update('h2').reason,'household_unchanged');
 assert.equal(s.trustedHousehold.applyVerifiedHouseholdUpdate({accountId:'b'},'b','own').updatesRemaining,1);
});
test('household errors expose no identifiers or personal values',()=>{
 const {update}=fixture('direct');update('HOUSEHOLD_PRIVATE_ONE');update('HOUSEHOLD_PRIVATE_TWO');
 const r=update('HOUSEHOLD_PRIVATE_THREE');
 assert.equal(r.reason,'household_update_limit');
 for(const v of ['HOUSEHOLD_PRIVATE_ONE','HOUSEHOLD_PRIVATE_TWO','HOUSEHOLD_PRIVATE_THREE'])assert.equal(JSON.stringify(r).includes(v),false);
});
test('household update does not automatically trust existing devices; verified rebind required',()=>{
 const {s,update}=fixture('direct');s.startStream(p,'a','d');update('new');
 assert.equal(s.startNextVideo(p,'a','d','event-1').reason,'household_mismatch');
 assert.equal(s.trustedHousehold.applyVerifiedDeviceRebind({accountId:'b'},'a','d').reason,'access_denied');
 assert.deepEqual(s.trustedHousehold.applyVerifiedDeviceRebind(p,'a','d'),{allowed:true,reason:'device_household_verified'});
 assert.equal(s.startStream(p,'a','d').reason,'stream_started');
 assert.equal(s.startStream(p,'a','e').reason,'household_mismatch');
});
test('invalid or backward trusted time cannot mutate household allowance',()=>{
 const {setTime,update}=fixture('direct');setTime(null);
 assert.equal(update('new').reason,'household_update_unavailable');
 setTime(1000);assert.equal(update('h1').updatesRemaining,1);
 setTime(999);assert.equal(update('h2').reason,'household_update_unavailable');
 setTime(1000);assert.equal(update('h2').updatesRemaining,0);
});
test('household change preserves current video, blocks next and requires rebind',()=>{
 const {s,update}=fixture('direct');s.startStream(p,'a','d');update('new');
 assert.deepEqual(s.startStream(p,'a','d'),{allowed:true,reason:'already_streaming'});
 assert.deepEqual(s.startNextVideo(p,'a','d','transition-1'),{allowed:false,reason:'household_mismatch'});
 s.trustedHousehold.applyVerifiedDeviceRebind(p,'a','d');
 assert.deepEqual(s.startNextVideo(p,'a','d','transition-1'),{allowed:false,reason:'household_mismatch'});
 assert.equal(s.startStream(p,'a','d').reason,'stream_started');
 assert.equal(s.startNextVideo(p,'a','d','transition-2').reason,'stream_started');
});
test('replayed successful transition neither revalidates nor restarts later playback',()=>{
 const {s,setTime}=fixture();s.startStream(p,'a','d');
 const r=s.startNextVideo(p,'a','d','transition-1');assert.equal(r.reason,'stream_started');
 r.reason='tampered';setTime(2000);
 assert.deepEqual(s.startNextVideo(p,'a','d','transition-1'),{allowed:true,reason:'stream_started'});
 assert.equal(s.startStream(p,'a','d').reason,'already_streaming');
 assert.equal(s.startNextVideo(p,'a','d','transition-2').reason,'partner_entitlement_expired');
 assert.equal(s.startNextVideo(p,'a','d','transition-1').reason,'stream_started');
 assert.equal(s.startStream(p,'a','d').reason,'partner_entitlement_expired');
});
test('invalid or unauthorized transition cannot stop playback or read cached results',()=>{
 const {s}=fixture();s.startStream(p,'a','d');
 for(const event of [undefined,null,'',' ']){
  const r=s.startNextVideo(p,'a','d',event);assert.equal(r.reason,'invalid_input');assert.match(r.message,/retry/);
  assert.equal(s.startStream(p,'a','d').reason,'already_streaming');
 }
 s.startNextVideo(p,'a','d','event');
 assert.deepEqual(s.startNextVideo({accountId:'b'},'a','d','event'),{allowed:false,reason:'access_denied'});
 assert.deepEqual(s.startNextVideo({accountId:'b'},'b','d','event'),{allowed:false,reason:'access_denied'});
 s.stopStream(p,'a','d');
 assert.deepEqual(s.startNextVideo(p,'a','d','new-event'),{allowed:false,reason:'no_active_video'});
});
test('event IDs are isolated by device; stale acknowledgments do not revive stopped streams',()=>{
 const {s}=fixture('direct');s.startStream(p,'a','d');s.startStream(p,'a','e');
 assert.equal(s.startNextVideo(p,'a','d','event').reason,'stream_started');
 s.stopStream(p,'a','e');
 assert.equal(s.startNextVideo(p,'a','e','event').reason,'no_active_video');
 s.stopStream(p,'a','d');
 assert.equal(s.startNextVideo(p,'a','d','event').reason,'stream_started');
 assert.equal(s.startNextVideo(p,'a','d','fresh').reason,'no_active_video');
});
test('an idle-event denial stays remembered after playback starts',()=>{
 const {s}=fixture('direct');
 const denied={allowed:false,reason:'no_active_video'};
 assert.deepEqual(s.startNextVideo(p,'a','d','idle-event'),denied);
 s.startStream(p,'a','d');
 assert.deepEqual(s.startNextVideo(p,'a','d','idle-event'),denied);
 assert.equal(s.startStream(p,'a','d').reason,'already_streaming');
 assert.equal(s.startNextVideo(p,'a','d','fresh-event').reason,'stream_started');
});
