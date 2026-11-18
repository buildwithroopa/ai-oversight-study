import assert from 'node:assert/strict';
const denied=reason=>({allowed:false,reason});
const ok=reason=>({allowed:true,reason});
const principal={accountId:'a'};
function fixture(create, {type='partner',status,entitlement,devices=['d0'],tier='basic'}={}) {
  let now=1000;
  const service=create({accounts:[
    {id:'a',type,tier,householdId:'h',partnerId:'p',...(status===undefined?{}:{subscriptionStatus:status})},
    {id:'b',type:'direct',tier:'basic',householdId:'h',subscriptionStatus:'active'}],
    devices:devices.map(id=>({id,accountId:'a',householdId:'h'})),
    entitlements:entitlement?[{accountId:'a',partnerId:'p',...entitlement}]:[],clock:()=>now});
  return {s:service,p:principal,setTime:t=>{now=t;}};
}
function missing(remaining,fields=['partnerEntitlement']) {
  return {allowed:false,reason:'partner_status_unknown',missingFields:fields,retryable:remaining>0,
    attemptsRemaining:remaining,...(remaining===0?{retryAt:86400000}:{}),
    message:`Missing fields: ${fields.join(', ')}. Retry with correct data through the authorized partner verification flow${remaining===0?' after the daily limit resets':''}.`};
}
export const contracts=[
 ['active partner without direct subscription',create=>{
   const {s,p}=fixture(create,{entitlement:{status:'active',validUntil:2000}});
   assert.deepEqual(s.startStream(p,'a','d0'),ok('stream_started'));
   assert.deepEqual(s.verifyPartner(p,'a'),{...ok('active_partner_subscription'),attemptsRemaining:4});
 }],
 ['stale direct data cannot override active partner',create=>{
   const {s,p}=fixture(create,{status:'inactive',entitlement:{status:'active',validUntil:2000}});
   assert.deepEqual(s.startStream(p,'a','d0'),ok('stream_started'));
 }],
 ['inactive partner playback leaves recovery allowance intact',create=>{
   const {s,p}=fixture(create,{entitlement:{status:'inactive',validUntil:2000}});
   assert.deepEqual(s.startStream(p,'a','d0'),{...denied('inactive_subscription'),attemptsRemaining:5});
   assert.deepEqual(s.verifyPartner(p,'a'),{...denied('inactive_subscription'),attemptsRemaining:4});
 }],
 ['missing partner response complete; denial allocates no stream',create=>{
   const {s,p}=fixture(create);
   assert.deepEqual(s.startStream(p,'a','d0'),missing(5));
   assert.deepEqual(s.startStream(p,'a','d0'),missing(5));
 }],
 ['missing individual fields and no PII echo',create=>{
   const {s,p}=fixture(create,{entitlement:{email:'PRIVATE_EMAIL',payment:'PAYMENT_SECRET'}});
   assert.deepEqual(s.startStream(p,'a','d0'),missing(5,['status','validUntil']));
 }],
 ['five total attempts and exact UTC rollover',create=>{
   const {s,p,setTime}=fixture(create);
   for(let remaining=4;remaining>=0;remaining--) assert.deepEqual(s.verifyPartner({...p},'a'),missing(remaining));
   const blocked={...denied('daily_attempt_limit'),retryable:false,attemptsRemaining:0,retryAt:86400000};
   assert.deepEqual(s.verifyPartner(p,'a'),blocked);
   setTime(86399999);assert.deepEqual(s.verifyPartner(p,'a'),blocked);
   setTime(86400000);assert.deepEqual(s.verifyPartner(p,'a'),missing(4));
 }],
 ['unauthorized and nonexistent accounts have identical safe response and no charge',create=>{
   const {s,p}=fixture(create);
   for(let i=0;i<6;i++) assert.deepEqual(s.verifyPartner({accountId:'b'},'a'),denied('access_denied'));
   assert.deepEqual(s.verifyPartner(p,'absent'),denied('access_denied'));
   assert.deepEqual(s.verifyPartner(null,'a'),denied('access_denied'));
   assert.deepEqual(s.verifyPartner(p,'a'),missing(4));
 }],
 ['partner record must match BOTH account and partner identity',create=>{
   for(const extra of [{accountId:'b',partnerId:'p'},{accountId:'a',partnerId:'wrong'}]) {
     const s=create({accounts:[{id:'a',type:'partner',partnerId:'p',tier:'basic',householdId:'h'}],
       entitlements:[{...extra,status:'active',validUntil:2000}],clock:()=>1000});
     assert.deepEqual(s.verifyPartner(principal,'a'),missing(4));
   }
 }],
 ['expiry before, at, and after boundary',create=>{
   for(const [until,reason,allowed] of [[999,'partner_entitlement_expired',false],[1000,'partner_entitlement_expired',false],[1001,'active_partner_subscription',true]]) {
     const {s,p}=fixture(create,{entitlement:{status:'active',validUntil:until}});
     assert.deepEqual(s.verifyPartner(p,'a'),{allowed,reason,attemptsRemaining:4});
   }
 }],
 ['invalid entitlement cannot authorize',create=>{
   for(const entitlement of [{status:'ACTIVE',validUntil:2000},{status:'active',validUntil:'2000'},{status:'active',validUntil:NaN}]) {
     const {s,p}=fixture(create,{entitlement});
     assert.deepEqual(s.verifyPartner(p,'a'),{...denied('invalid_partner_data'),attemptsRemaining:4});
   }
 }],
 ['failed conversion leaves original eligibility and counters intact',create=>{
   const {s,p}=fixture(create);
   assert.deepEqual(s.trustedBilling.applyCompletedDirectConversion('a','inactive'),denied('invalid_conversion'));
   assert.deepEqual(s.startStream(p,'a','d0'),missing(5));
 }],
 ['completed direct conversion ignores exhausted partner allowance',create=>{
   const {s,p}=fixture(create);
   for(let i=0;i<5;i++)s.verifyPartner(p,'a');
   assert.deepEqual(s.trustedBilling.applyCompletedDirectConversion('a','active'),ok('conversion_completed'));
   assert.deepEqual(s.startStream(p,'a','d0'),ok('stream_started'));
   assert.deepEqual(s.verifyPartner(p,'a'),denied('partner_verification_not_applicable'));
 }],
 ['direct status authoritative regardless of partner evidence',create=>{
   for(const [status,expected] of [['inactive',denied('inactive_subscription')],['active',ok('stream_started')]]) {
     const {s,p}=fixture(create,{type:'direct',status,entitlement:{status:'active',validUntil:2000}});
     assert.deepEqual(s.startStream(p,'a','d0'),expected);
   }
 }],
 ['ownership and household errors do not allocate streams',create=>{
   const s=create({accounts:[{id:'a',type:'direct',subscriptionStatus:'active',tier:'basic',householdId:'h'}],
     devices:[{id:'foreign',accountId:'b',householdId:'h'},{id:'away',accountId:'a',householdId:'x'},
       {id:'good1',accountId:'a',householdId:'h'},{id:'good2',accountId:'a',householdId:'h'}],clock:()=>1000});
   assert.deepEqual(s.startStream(principal,'a','foreign'),denied('access_denied'));
   assert.deepEqual(s.startStream(principal,'a','absent'),denied('access_denied'));
   assert.deepEqual(s.startStream(principal,'a','away'),denied('household_mismatch'));
   for(const id of ['good1','good2'])assert.deepEqual(s.startStream(principal,'a',id),ok('stream_started'));
 }],
 ...[['basic',2],['standard',3],['premium',5]].flatMap(([tier,cap])=>[
   [`${tier} registration boundary, duplicate, invalid input, and foreign ownership`,create=>{
     const {s,p}=fixture(create,{tier,type:'direct',status:'active',devices:[]});
     assert.deepEqual(s.registerDevice(p,'a',''),denied('invalid_input'));
     for(let i=0;i<cap;i++)assert.deepEqual(s.registerDevice(p,'a',`d${i}`),ok('device_registered'));
     assert.deepEqual(s.registerDevice(p,'a','d0'),ok('already_registered'));
     assert.deepEqual(s.registerDevice(p,'a','new'),denied('device_limit'));
     assert.deepEqual(s.registerDevice({accountId:'b'},'b','d0'),denied('access_denied'));
     assert.deepEqual(s.startStream(p,'a','new'),denied('access_denied'));
   }],
   [`${tier} independent stream cap and stop state`,create=>{
     const {s,p}=fixture(create,{tier,type:'direct',status:'active',devices:Array.from({length:cap+1},(_,i)=>`d${i}`)});
     for(let i=0;i<cap;i++)assert.deepEqual(s.startStream(p,'a',`d${i}`),ok('stream_started'));
     assert.deepEqual(s.startStream(p,'a','d0'),ok('already_streaming'));
     const blocked={...denied('stream_limit'),message:'Concurrent stream limit reached. Stop playback on one active stream before starting a new one.'};
     assert.deepEqual(s.startStream(p,'a',`d${cap}`),blocked);
     assert.deepEqual(s.stopStream({accountId:'b'},'a','d0'),denied('access_denied'));
     assert.deepEqual(s.startStream(p,'a',`d${cap}`),blocked);
     assert.deepEqual(s.stopStream(p,'a','d0'),ok('stream_stopped'));
     assert.deepEqual(s.startStream(p,'a',`d${cap}`),ok('stream_started'));
     assert.deepEqual(s.startStream(p,'a','d0'),blocked);
   }]
 ]),
 ['stream counts isolated between accounts',create=>{
   const s=create({accounts:['a','b'].map(id=>({id,type:'direct',subscriptionStatus:'active',tier:'basic',householdId:'h'})),
     devices:['a','b'].flatMap(accountId=>[0,1].map(i=>({id:accountId+i,accountId,householdId:'h'}))),clock:()=>1000});
   for(const accountId of ['a','b']) for(let i=0;i<2;i++)assert.deepEqual(s.startStream({accountId},accountId,accountId+i),ok('stream_started'));
 }]
];
export function runContracts(create) {
  return contracts.map(([name,check])=>{try{check(create);return {name,passes:true};}
    catch(error){return {name,passes:false,error:error.message};}});
}
