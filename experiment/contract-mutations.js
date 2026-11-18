import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {runContracts} from '../checks/contracts.js';
import {createService} from '../src/service.js';
const source=await readFile(new URL('../src/service.js',import.meta.url),'utf8').then(text => text.replace("'./validation.js'", JSON.stringify(new URL('../src/validation.js', import.meta.url).href)));
const mutations=[
 ['playback-consumes-recovery-quota','return partnerDecision(accountId, now, Math.max(0, 5 - used));','return verifyPartner({accountId}, accountId);'],
 ['direct-required-for-partner',"if (a.type === 'partner') return playbackPartner(accountId);","if (a.type === 'partner') return a.subscriptionStatus === 'active' ? playbackPartner(accountId) : deny('inactive_subscription');"],
 ['six-attempts','if (used >= 5)','if (used >= 6)'],
 ['attempt-not-consumed','used: used + 1','used: used'],
 ['expiry-inclusive','if (now >= record.validUntil)','if (now > record.validUntil)'],
 ['wrong-partner-match','e.accountId === accountId && e.partnerId === account.partnerId','e.accountId === accountId'],
 ['wrong-account-match','e.accountId === accountId && e.partnerId === account.partnerId','e.partnerId === account.partnerId'],
 ['no-household-check',"if (d.householdId !== a.householdId) return deny('household_mismatch');",''],
 ['extra-device','if (count >= LIMITS[a.tier]) return deny(\'device_limit\');','if (count > LIMITS[a.tier]) return deny(\'device_limit\');'],
 ['extra-stream',"if (count >= LIMITS[a.tier]) return { ...deny('stream_limit'),","if (count > LIMITS[a.tier]) return { ...deny('stream_limit'),"],
 ['stop-does-not-release','sessions.delete(deviceId);','// intentionally do not delete session'],
 ['global-stream-count','[...sessions.values()].filter(id => id === accountId).length','sessions.size'],
 ['conversion-noop',"users.set(accountId, { ...a, type: 'direct', subscriptionStatus: 'active' });",'// intentionally leave original account unchanged'],
 ['wrong-missing-message','Retry with correct data through the authorized partner verification flow','Please wait'],
 ['wrong-attempt-count','const remaining = 4 - used;','const remaining = 5 - used;']
];
const reference=runContracts(createService);
assert.ok(reference.every(r=>r.passes),'Reference must pass all contracts before mutation scoring');
const results=[];
for(const [name,from,to] of mutations){
  assert.equal(source.split(from).length-1,1,`${name}: exact mutation anchor required`);
  const mutated=source.replace(from,to);
  let factory;
  try{factory=(await import(`data:text/javascript;base64,${Buffer.from(mutated).toString('base64')}`)).createService;}
  catch(error){throw Error(`${name}: invalid mutation, not a detected behavioral defect: ${error.message}`);}
  const rows=runContracts(factory);
  results.push({name,detected:rows.some(r=>!r.passes),failedChecks:rows.filter(r=>!r.passes).map(r=>r.name)});
}
const report={kind:'constructed-development-contract-mutation-audit',sourceSha256:createHash('sha256').update(source).digest('hex'),
 referenceChecks:reference.length,mutations:results.length,detected:results.filter(r=>r.detected).length,
 warning:'Hand-selected assistant-authored mutations and checks; not exhaustive correctness, independent evaluation, or empirical model evidence.',results};
await writeFile(new URL('../results/contract-mutations-v2.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.table(results.map(r=>({mutation:r.name,detected:r.detected,failedChecks:r.failedChecks.length})));
console.log(`${reference.length} reference checks passed; ${report.detected}/${results.length} selected mutations detected.`);
assert.ok(results.every(r=>r.detected),'Undetected mutations require review');
