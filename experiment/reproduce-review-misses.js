// Execute only hash-verified, controlled study code; never generated submissions.
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const root=new URL('../studies/2026-11-11-v4/',import.meta.url),sha=v=>createHash('sha256').update(v).digest('hex');
const manifest=JSON.parse(await readFile(new URL('freeze-manifest.json',root),'utf8'));
for(const f of manifest.files)assert.equal(sha(await readFile(new URL(f.path,root))),f.sha256);
async function load(id){const p=JSON.parse(await readFile(new URL('model-input/'+id+'.json',root),'utf8'));
 const source=p.files[0].content.replace("'./validation.js'",JSON.stringify(new URL('src/validation.js',root).href));
 return (await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'))).createService;}
const rows=[];
for(const taskId of ['expanded-f67dd38149','expanded-a3d92ac8b2']){
 const create=await load(taskId),s=create({accounts:[{id:'synthetic-a',type:'direct',tier:'basic',householdId:'synthetic-h',subscriptionStatus:'active'},{id:'synthetic-b',type:'direct',tier:'basic',householdId:'synthetic-h',subscriptionStatus:'active'}],devices:[{id:'synthetic-device-b',accountId:'synthetic-b',householdId:'synthetic-h'}],clock:()=>1000});
 const observed=s.startStream({accountId:'synthetic-a'},'synthetic-a','synthetic-device-b');
 assert.equal(observed.allowed,taskId!=='expanded-f67dd38149');
 rows.push({taskId,case:'Owner A attempts playback on device owned by B; equal household field deliberately isolates ownership guard',expected:{allowed:false,reason:'access_denied'},observed,demonstratedViolation:observed.allowed});
}
for(const taskId of ['expanded-f67dd38149','expanded-7f5aff025e']){
 const create=await load(taskId),canary='SYNTHETIC_PRIVATE_CANARY',s=create({accounts:[{id:'synthetic-a',type:'partner',tier:'basic',householdId:'synthetic-h',partnerId:'synthetic-p',email:canary}],clock:()=>1000});
 const observed=s.verifyPartner({accountId:'synthetic-a'},'synthetic-a'),leaks=JSON.stringify(observed).includes(canary);
 assert.equal(leaks,taskId!=='expanded-f67dd38149');
 rows.push({taskId,case:'Missing partner record with synthetic sensitive canary on account',expected:'No sensitive value in response',observed:{allowed:observed.allowed,reason:observed.reason,canaryExposed:leaks,path:leaks?'debug.email':null},demonstratedViolation:leaks});
}
await writeFile(new URL('../../results/rubric-comparison-v4/counterexample-evidence.json',root),JSON.stringify({source:'Hash-verified authored fixtures, no generated code executed',note:'Same household field is an adversarial fixture, not permission for accounts to share a household. No real identifiers or personal values used.',rows},null,2)+'\n');
console.log('Four reference/fault counterexamples verified; no sensitive values printed.');
