import test from 'node:test';
import assert from 'node:assert/strict';
import {createService} from '../src/service.js';
const p={accountId:'a'};
function fixture(tier='premium'){
 let now=1000;
 const s=createService({accounts:[{id:'a',type:'partner',partnerId:'p',tier,householdId:'h'}],
  devices:Array.from({length:6},(_,i)=>({id:`d${i}`,accountId:'a',householdId:'h'})),
  entitlements:[{accountId:'a',partnerId:'p',status:'active',validUntil:2000}],clock:()=>now});
 return {s,setTime:t=>{now=t;}};
}
test('twenty stop/restarts after successful verification leave allowance unchanged',()=>{
 const {s}=fixture();
 assert.deepEqual(s.verifyPartner(p,'a'),{allowed:true,reason:'active_partner_subscription',attemptsRemaining:4});
 for(let i=0;i<20;i++){
  assert.deepEqual(s.startStream(p,'a','d0'),{allowed:true,reason:'stream_started'});
  assert.deepEqual(s.stopStream(p,'a','d0'),{allowed:true,reason:'stream_stopped'});
 }
 assert.deepEqual(s.verifyPartner(p,'a'),{allowed:true,reason:'active_partner_subscription',attemptsRemaining:3});
});
test('exhausted recovery quota does not deny currently valid playback',()=>{
 const {s}=fixture();
 for(let i=0;i<5;i++)assert.equal(s.verifyPartner(p,'a').allowed,true);
 assert.equal(s.verifyPartner(p,'a').reason,'daily_attempt_limit');
 assert.deepEqual(s.startStream(p,'a','d0'),{allowed:true,reason:'stream_started'});
 assert.equal(s.verifyPartner(p,'a').reason,'daily_attempt_limit');
});
test('past successful verification does not authorize expired entitlement on restart',()=>{
 const {s,setTime}=fixture();s.verifyPartner(p,'a');
 s.startStream(p,'a','d0');s.stopStream(p,'a','d0');setTime(2000);
 assert.deepEqual(s.startStream(p,'a','d0'),{allowed:false,reason:'partner_entitlement_expired',attemptsRemaining:4});
});
for(const [tier,cap] of [['basic',2],['standard',3],['premium',5]])test(`${tier} concurrent limit remains enforced for partner playback`,()=>{
 const {s}=fixture(tier);
 for(let i=0;i<cap;i++)assert.deepEqual(s.startStream(p,'a',`d${i}`),{allowed:true,reason:'stream_started'});
 assert.deepEqual(s.startStream(p,'a',`d${cap}`),{allowed:false,reason:'stream_limit',message:'Concurrent stream limit reached. Stop playback on one active stream before starting a new one.'});
 s.stopStream(p,'a','d0');
 assert.deepEqual(s.startStream(p,'a',`d${cap}`),{allowed:true,reason:'stream_started'});
 assert.deepEqual(s.verifyPartner(p,'a'),{allowed:true,reason:'active_partner_subscription',attemptsRemaining:4});
});
