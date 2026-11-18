import {readFile,writeFile} from 'node:fs/promises';
import {scoreReviews} from '../../evaluator/score.js';
const root=new URL('../../',import.meta.url);
const read=async p=>JSON.parse(await readFile(new URL(p,root),'utf8'));
const manifest=await read('evaluator/development-v2-manifest.json');
const plan=await read('results/matched-v2/plan.json');
const records=await Promise.all(plan.requests.map(r=>read(`results/matched-v2/${r.id}.json`)));
const conditions={};
for(const condition of ['code-only','test-assisted']){
 const rows=records.filter(r=>r.condition===condition);
 conditions[condition]={scoreAgainstDevelopmentLabels:scoreReviews(manifest,rows.filter(r=>r.status==='completed').map(r=>r.review)),
   inputTokens:rows.reduce((n,r)=>n+(r.usage?.inputTokens||0),0),outputTokens:rows.reduce((n,r)=>n+(r.usage?.outputTokens||0),0),
   estimatedCostUsd:rows.reduce((n,r)=>n+(r.estimatedCostUsd||0),0)};
}
const ledger=await read('results/api-pilot/ledger.json');
const report={stage:'development',warning:'One sample per condition/candidate, constructed labels, no independent adjudication. Agreement is not established correctness.',
 pairedVerdicts:manifest.tasks.map(t=>({taskId:t.taskId,expected:t.acceptable?'accept':'reject',
   codeOnly:records.find(r=>r.taskId===t.taskId&&r.condition==='code-only')?.review?.verdict||'missing',
   testAssisted:records.find(r=>r.taskId===t.taskId&&r.condition==='test-assisted')?.review?.verdict||'missing'})),conditions,
 estimatedMatchedApiUsd:records.reduce((n,r)=>n+(r.estimatedCostUsd||0),0),
 estimatedCumulativeApiUsd:ledger.calls.reduce((n,c)=>n+(c.estimatedActualMicroUsd||0),0)/1e6,
 cumulativeApiReservedUsd:ledger.calls.reduce((n,c)=>n+c.reservedMicroUsd,0)/1e6,
 infrastructureAllowanceUsd:0.1,totalApiCalls:ledger.calls.length,
 interpretation:'Both reject all three faults. Reference accepted code-only, rejected test-assisted. Selected evidence changes one verdict but no reliable treatment effect can be inferred.'};
await writeFile(new URL('results/matched-v2/summary.json',root),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
