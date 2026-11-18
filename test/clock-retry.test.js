import test from 'node:test';
import assert from 'node:assert/strict';
import {createService} from '../src/service.js';
test('clock outage gives safe playback retry guidance and reserves no stream or attempt',()=>{
 let now=null;
 const id='ACCOUNT_PRIVATE_CLOCK',partner='PARTNER_PRIVATE_CLOCK',device='DEVICE_PRIVATE_CLOCK';
 const s=createService({accounts:[{id,type:'partner',partnerId:partner,householdId:'h',tier:'basic'}],
  devices:[{id:device,accountId:id,householdId:'h'}],entitlements:[{accountId:id,partnerId:partner,status:'active',validUntil:2000}],
  clock:()=>{if(now===null)throw Error('PRIVATE_INTERNAL_FAILURE');return now;}});
 const response=s.startStream({accountId:id},id,device);
 assert.deepEqual(response,{allowed:false,reason:'verification_unavailable',retryable:true,retryAfterSeconds:30,
  message:'Unable to verify access right now. Retry in 30 seconds. Your verification attempt was not consumed.'});
 for(const secret of [id,partner,device,'PRIVATE_INTERNAL_FAILURE'])assert.equal(JSON.stringify(response).includes(secret),false);
 now=1000;
 assert.deepEqual(s.startStream({accountId:id},id,device),{allowed:true,reason:'stream_started'});
 assert.equal(s.verifyPartner({accountId:id},id).attemptsRemaining,4);
});
