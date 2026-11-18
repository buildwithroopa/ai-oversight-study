// Controlled, hash-verified authored candidates only. No generated code execution.
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const base=new URL('../',import.meta.url),root=new URL('studies/2026-11-11-v5/',base);
const read=async p=>JSON.parse(await readFile(new URL(p,root),'utf8'));
const manifest=await read('freeze-manifest.json');
for(const f of manifest.files)assert.equal(createHash('sha256').update(await readFile(new URL(f.path,root))).digest('hex'),f.sha256);
const rows=[];
for(const taskId of ['expanded-929d8c4418','expanded-e0adcf0de4']){
 const p=await read('model-input/'+taskId+'.json');
 const source=p.files[0].content.replace("'./validation.js'",JSON.stringify(new URL('src/validation.js',root).href));
 const create=(await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'))).createService;
 const config={accounts:['a','b'].map(id=>({id,type:'direct',tier:'basic',householdId:'h',subscriptionStatus:'active'})),devices:[{id:'d',accountId:'a',householdId:'h'},{id:'e',accountId:'b',householdId:'h'}],clock:()=>1000};
 const s=create(config),principal={accountId:'a'};
 const initial=s.startNextVideo(principal,'a','d','idle-event');
 assert.deepEqual(initial,{allowed:false,reason:'no_active_video'});
 s.startStream(principal,'a','d');const repeated=s.startNextVideo(principal,'a','d','idle-event');
 assert.deepEqual(repeated,{allowed:true,reason:'stream_started'});
 const owned=create(config),ownership=owned.startStream(principal,'a','e');
 assert.equal(ownership.allowed,taskId==='expanded-e0adcf0de4');
 rows.push({taskId,idleEvent:{initial,repeated,expectedRepeated:initial,confirmedViolation:true},ownership:{expected:{allowed:false,reason:'access_denied'},observed:ownership,confirmedViolation:ownership.allowed}});
}
await writeFile(new URL('results/grounded-v5/reproduced-findings.json',base),JSON.stringify({status:'assistant-reproduced-not-independent',rows},null,2)+'\n');
console.log('Confirmed shared idle-event replay defect and seeded ownership defect on frozen v5 code.');
