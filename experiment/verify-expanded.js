import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {buildExpandedCases,loadAuthoredCandidate} from './expanded-cases.js';
import {evaluateExpanded} from '../checks/expanded-contracts.js';
const {sourceSha256,candidates}=await buildExpandedCases();
const results=[];
for(const c of candidates){
 const create=await loadAuthoredCandidate(c); // A parse/import error aborts, never counts as detection.
 const checks=evaluateExpanded(create),passes=checks.every(x=>x.passes);
 assert.equal(passes,c.expectedImplementation==='complies',`Unexpected case result: ${c.name}`);
 results.push({taskId:c.taskId,name:c.name,family:c.family,expectedImplementation:c.expectedImplementation,
  sourceSha256:c.sourceSha256,totalChecks:checks.length,passed:checks.filter(x=>x.passes).length,
  failures:checks.filter(x=>!x.passes)});
}
const out=new URL('../results/expanded-development/',import.meta.url);await mkdir(out,{recursive:true});
const modelOut=new URL('../model-input/expanded-development/',import.meta.url);await mkdir(modelOut,{recursive:true});
for(const c of candidates)await writeFile(new URL(`${c.taskId}.json`,modelOut),JSON.stringify({stage:'development',taskId:c.taskId,specification:c.specification,files:c.files},null,2)+'\n');
const manifest={stage:'development',sourceSha256,warning:'Balanced controlled refactors/mutations, not independent implementations or held-out data.',
 tasks:results.map(({taskId,name,family,expectedImplementation,sourceSha256})=>({taskId,name,family,expectedImplementation,sourceSha256}))};
await writeFile(new URL('../evaluator/expanded-development-manifest.json',import.meta.url),JSON.stringify(manifest,null,2)+'\n');
await writeFile(new URL('verification.json',out),JSON.stringify({stage:'development',results},null,2)+'\n');
console.table(results.map(r=>({candidate:r.name,label:r.expectedImplementation,passed:r.passed,total:r.totalChecks})));
