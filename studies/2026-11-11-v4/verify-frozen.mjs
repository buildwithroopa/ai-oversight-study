import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {evaluateExpanded} from './checks/expanded-contracts.js';
const root=new URL('./',import.meta.url);
const manifest=JSON.parse(await readFile(new URL('freeze-manifest.json',root),'utf8'));
for(const e of manifest.files){const bytes=await readFile(new URL(e.path,root));if(createHash('sha256').update(bytes).digest('hex')!==e.sha256)throw Error('Frozen content changed: '+e.path);}
const labels=JSON.parse(await readFile(new URL('evaluator/labels.json',root),'utf8'));
for(const label of labels.tasks){const packet=JSON.parse(await readFile(new URL('model-input/'+label.taskId+'.json',root),'utf8'));
 let source=packet.files[0].content.replace("'./validation.js'",JSON.stringify(new URL('src/validation.js',root).href));
 // Controlled authored code only; never use this loader for generated/untrusted submissions.
 const factory=(await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'))).createService;
 const rows=evaluateExpanded(factory);if(rows.every(r=>r.passes)!==(label.expectedImplementation==='complies'))throw Error('Behavior changed: '+label.taskId);
 console.log(JSON.stringify({taskId:label.taskId,label:label.expectedImplementation,passed:rows.filter(r=>r.passes).length,total:rows.length}));}
console.log('Frozen hashes and all constructed candidate expectations verified.');
