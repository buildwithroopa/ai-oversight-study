import {readFile,writeFile} from 'node:fs/promises';
import {prepareAdjudication} from '../evaluator/review-adjudication.js';
const root=new URL('../',import.meta.url),dir='results/rubric-comparison-v4/';
const plan=JSON.parse(await readFile(new URL('results/rubric-comparison-plan/requests.json',root),'utf8'));
const reviews=[];
for(const r of plan.requests){
 const record=JSON.parse(await readFile(new URL(dir+r.id+'.json',root),'utf8'));
 if(record.status!=='completed')throw Error('Incomplete run');
 reviews.push({id:r.id,condition:r.condition,...prepareAdjudication(record.review)});
}
await writeFile(new URL(dir+'adjudication-queue.json',root),JSON.stringify({status:'requires-human-review',reviews},null,2)+'\n');
console.log(JSON.stringify({reviews:reviews.length,claims:reviews.reduce((n,r)=>n+r.claims.length,0),flaggedClaims:reviews.reduce((n,r)=>n+r.claims.filter(c=>c.flags.length).length,0),verifiedVerdicts:0}));
