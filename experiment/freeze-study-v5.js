import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {buildExpandedCases,loadAuthoredCandidate} from './expanded-cases.js';
import {evaluateExpanded} from '../checks/expanded-contracts.js';
const root=new URL('../',import.meta.url),out=new URL('studies/2026-11-11-v5/',root);
const sha=data=>createHash('sha256').update(data).digest('hex');
const {candidates}=await buildExpandedCases();
const reports=[];
for(const c of candidates){const rows=evaluateExpanded(await loadAuthoredCandidate(c));
 if(rows.every(r=>r.passes)!==(c.expectedImplementation==='complies'))throw Error('Case failed pre-freeze review');
 reports.push({taskId:c.taskId,expectedImplementation:c.expectedImplementation,checks:rows});}
// A new version is required on rerun; this script must never overwrite a prior freeze.
await mkdir(new URL('studies/',root),{recursive:true});await mkdir(out);
const entries=[];
async function put(path,data){const url=new URL(path,out);await mkdir(new URL('.',url),{recursive:true});
 const bytes=typeof data==='string'?data:JSON.stringify(data,null,2)+'\n';
 await writeFile(url,bytes,{flag:'wx'});entries.push({path,sha256:sha(bytes)});}
for(const c of candidates)await put(`model-input/${c.taskId}.json`,{taskId:c.taskId,stage:'development',specification:c.specification,files:c.files});
await put('evaluator/labels.json',{stage:'development',tasks:candidates.map(({taskId,name,family,expectedImplementation,sourceSha256})=>({taskId,name,family,expectedImplementation,sourceSha256}))});
await put('evaluator/pre-freeze-verification.json',reports);
for(const path of ['src/validation.js','checks/contracts.js','checks/privacy.js','checks/expanded-contracts.js','evaluator/structured-review.js','evaluator/review-rubric-v1.json','evaluator/review-adjudication.js','evaluator/grounded-review-protocol-v2.md'])await put(path,await readFile(new URL(path,root),'utf8'));
await put('evidence/original-generated-suite.txt',await readFile(new URL('results/test-generation/generated-test-source.txt',root),'utf8'));
await put('evidence/corrected-privacy-suite.txt',await readFile(new URL('results/test-generation/corrected-privacy-suite-v1.txt',root),'utf8'));
const verifier=`import {readFile} from 'node:fs/promises';
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
`;
await put('verify-frozen.mjs',verifier);
await put('README.md',`# Frozen development study\n\nNovember 11 version 5. Six compliant controls and six faulty candidates, 30 contract scenarios each. This is development material, not independent or held-out evidence.\n\nRun node verify-frozen.mjs to check file hashes and rerun controlled authored candidate checks without API calls or project dependencies. Generated suites in evidence/ are stored as text and are NOT executed. No API keys, provider configuration, workspace IDs, or private employer data are included.\n\nOnly a selected model-input file may be sent to a reviewer; never send this directory wholesale, labels, checks, prior chat, or the evidence files except as a declared evidence condition. No current-version execution logs for those evidence suites are supplied. Older version 2 logs must not be attached to these version 5 candidates.\n\nThis is versioned and tamper-evident under its manifest, not write-protected or authenticated storage. Checksums detect accidental changes; they do not prevent someone replacing both data and manifest.\n`);
await writeFile(new URL('freeze-manifest.json',out),JSON.stringify({studyId:'2026-11-11-v5',createdAt:new Date().toISOString(),files:entries},null,2)+'\n',{flag:'wx'});
console.log('Frozen 12 development cases with 30 checks each; prior study files were not overwritten.');
