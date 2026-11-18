import test from 'node:test';
import assert from 'node:assert/strict';
import {createService} from '../src/service.js';
import {ConfigurationError} from '../src/validation.js';
const account={id:'a',type:'partner',partnerId:'p',householdId:'h',tier:'basic'};
const p={accountId:'a'};
function config(extra={}) {return {accounts:[{...account}],clock:()=>1000,...extra};}
for(const [name,patch,field] of [
 ['missing accounts',{accounts:undefined},'accounts'],
 ['non-array devices',{devices:{}},'devices'],
 ['invalid clock',{clock:1000},'clock'],
 ['null account',{accounts:[null]},'accounts'],
 ['blank identity',{accounts:[{...account,id:' '}]},'accounts.identity'],
 ['invalid tier',{accounts:[{...account,tier:'unlimited'}]},'accounts.tier'],
 ['unknown billing type',{accounts:[{...account,type:'unknown'}]},'accounts.type'],
 ['missing direct status',{accounts:[{...account,type:'direct'}]},'accounts.subscriptionStatus'],
 ['missing partner identity',{accounts:[{...account,partnerId:null}]},'accounts.partnerId'],
 ['duplicate account',{accounts:[account,account]},'accounts.duplicate'],
 ['duplicate device',{devices:[{id:'d',accountId:'a',householdId:'h'},{id:'d',accountId:'b',householdId:'x'}]},'devices.duplicate'],
 ['duplicate partner record',{entitlements:[{accountId:'a',partnerId:'p'},{accountId:'a',partnerId:'p'}]},'entitlements.duplicate'],
 ['unidentifiable provider record',{entitlements:[{accountId:'a'}]},'entitlements.identity']
]) test(`configuration rejects ${name} safely`,()=>{
 assert.throws(()=>createService(config(patch)),e=>e instanceof ConfigurationError && e.message===`Invalid service configuration: ${field}`);
});
test('configuration errors do not echo sensitive identifiers',()=>{
 assert.throws(()=>createService(config({accounts:[{...account,id:'SECRET',tier:'PRIVATE_VALUE'}]})),
 e=>e.message==='Invalid service configuration: accounts.tier');
});
test('caller mutations of fixture records cannot change entitlement',()=>{
 const entitlements=[{accountId:'a',partnerId:'p',status:'inactive',validUntil:2000}];
 const s=createService(config({entitlements}));
 entitlements[0].status='active';entitlements.length=0;
 assert.deepEqual(s.verifyPartner(p,'a'),{allowed:false,reason:'inactive_subscription',attemptsRemaining:4});
});
test('bad clock neither leaks exceptions nor consumes allowance',()=>{
 for(const bad of [NaN,-1,1.5,Number.MAX_SAFE_INTEGER,'1000',()=>{throw Error('PRIVATE');}]){
  let now=bad;
  const s=createService(config({clock:()=>typeof now==='function'?now():now}));
  assert.deepEqual(s.verifyPartner(p,'a'),{allowed:false,reason:'verification_unavailable',retryable:true,retryAfterSeconds:30,
    message:'Unable to verify access right now. Retry in 30 seconds. Your verification attempt was not consumed.'});
  now=1000;
  assert.equal(s.verifyPartner(p,'a').attemptsRemaining,4);
 }
});
test('invalid device inputs do not register, start, or stop anything',()=>{
 const s=createService(config({accounts:[{...account,type:'direct',subscriptionStatus:'active'}]}));
 for(const id of [null,{},12,'',' d ']) for(const action of ['registerDevice','startStream','stopStream'])
  assert.deepEqual(s[action](p,'a',id),{allowed:false,reason:'invalid_input'});
 assert.deepEqual(s.registerDevice(p,'a','d1'),{allowed:true,reason:'device_registered'});
 assert.deepEqual(s.registerDevice(p,'a','d2'),{allowed:true,reason:'device_registered'});
 assert.deepEqual(s.registerDevice(p,'a','d3'),{allowed:false,reason:'device_limit'});
});
test('malformed provider payload still counts and never grants access',()=>{
 const s=createService(config({entitlements:[{accountId:'a',partnerId:'p',status:'active',validUntil:-1}]}));
 assert.deepEqual(s.verifyPartner(p,'a'),{allowed:false,reason:'invalid_partner_data',attemptsRemaining:4});
});
