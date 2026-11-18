import {writeFile} from 'node:fs/promises';
import {buildPackets} from '../packets/build.js';
import {createRun,addAttempt,summarizeRun} from './records.js';
const {packets,manifest}=await buildPackets();
let run=createRun({packets,manifest,provider:'synthetic',model:'offline-fixture',maxOutputTokens:1000,temperature:0,createdAt:'2026-11-04T18:00:00Z'});
// Intentionally wrong reasoning with the correct verdict, for human-review practice.
const review={taskId:'task-v4-b904',verdict:'reject',rationale:'SYNTHETIC PRACTICE: Reject because the missing email address prevents checking the active subscription.'};
run=addAttempt(run,{taskId:review.taskId,startedAt:'2026-11-04T18:01:00Z',finishedAt:'2026-11-04T18:02:00Z',outcome:'completed',rawResponse:JSON.stringify(review),usage:{inputTokens:0,outputTokens:0}});
await writeFile(new URL('../../results/offline-practice-run-v4.json',import.meta.url),JSON.stringify(run,null,2)+'\n');
console.log(JSON.stringify(summarizeRun(run),null,2));
