import {createHash,randomUUID} from 'node:crypto';
export const fingerprint=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const text=x=>typeof x==='string'&&x.trim().length>0;
function timestamp(value){if(!text(value)||!Number.isFinite(Date.parse(value)))throw Error('Invalid timestamp');return value;}
export function createRun({packets,manifest,provider,model,maxOutputTokens,temperature,createdAt,mode='offline-fixture'}){
 if(!['offline-fixture','api'].includes(mode)||!text(provider)||!text(model)||!Number.isSafeInteger(maxOutputTokens)||maxOutputTokens<1||(temperature!==undefined&&(!Number.isFinite(temperature)||temperature<0||temperature>2)))throw Error('Invalid run configuration');
 if(!Array.isArray(packets)||!packets.length||manifest?.stage!=='development')throw Error('Invalid development inputs');
 const seen=new Set();
 const tasks=packets.map(packet=>{
  const label=manifest.tasks.find(t=>t.taskId===packet.taskId);
  if(seen.has(packet.taskId)||packet.stage!=='development'||packet.review?.condition!=='code-only'||!label||label.packetSha256!==fingerprint(packet))throw Error('Packet identity or hash mismatch');
  seen.add(packet.taskId);
  // Only one stage's instruction enters the actual outbound request.
  const request={messages:[{role:'system',content:packet.review.instruction},{role:'user',content:JSON.stringify({taskId:packet.taskId,specification:packet.specification,files:packet.files})}],maxOutputTokens,...(temperature===undefined?{}:{temperature})};
  return {taskId:packet.taskId,packetSha256:fingerprint(packet),request,requestSha256:fingerprint(request),attempts:[]};
 });
 return {schemaVersion:1,runId:randomUUID(),mode,condition:'code-only',stage:'development',createdAt:timestamp(createdAt),provider,model,tasks};
}
export function addAttempt(run,{taskId,startedAt,finishedAt,outcome,rawResponse,usage,errorCode}){
 const task=run.tasks.find(t=>t.taskId===taskId);
 if(!task)throw Error('Unknown run task');
 if(task.attempts.some(a=>a.outcome==='completed'))throw Error('Completed task cannot be silently resampled');
 timestamp(startedAt);timestamp(finishedAt);
 if(Date.parse(finishedAt)<Date.parse(startedAt)||Date.parse(startedAt)<Date.parse(run.createdAt))throw Error('Invalid attempt timing');
 const previous=task.attempts.at(-1);
 if(previous&&Date.parse(startedAt)<Date.parse(previous.finishedAt))throw Error('Overlapping attempt history');
 if(!['completed','provider-error','invalid-response'].includes(outcome))throw Error('Invalid outcome');
 const next=structuredClone(run),target=next.tasks.find(t=>t.taskId===taskId);
 let parsed=null;
 if(outcome==='completed'){
  if(!text(rawResponse))throw Error('Missing raw response');
  try{parsed=JSON.parse(rawResponse);}catch{throw Error('Response is not JSON');}
  if(parsed?.taskId!==taskId||!['accept','reject'].includes(parsed.verdict)||!text(parsed.rationale))throw Error('Invalid structured review');
 }
 if(usage!==undefined&&(!usage||!Number.isSafeInteger(usage.inputTokens)||usage.inputTokens<0||!Number.isSafeInteger(usage.outputTokens)||usage.outputTokens<0))throw Error('Invalid usage');
 if(rawResponse!==undefined&&typeof rawResponse!=='string')throw Error('Invalid raw response');
 if(outcome==='provider-error'&&!['timeout','rate-limit','authentication','unavailable','other'].includes(errorCode))throw Error('Invalid sanitized provider error');
 target.attempts.push({attempt:target.attempts.length+1,startedAt,finishedAt,outcome,
  ...(rawResponse===undefined?{}:{rawResponse,responseSha256:fingerprint(rawResponse)}),
  ...(parsed?{review:{taskId:parsed.taskId,verdict:parsed.verdict,rationale:parsed.rationale}}:{}),
  ...(usage?{usage:{inputTokens:usage.inputTokens,outputTokens:usage.outputTokens}}:{}),
  ...(outcome==='provider-error'?{errorCode}:{})});
 return next;
}
export function summarizeRun(run){
 const completed=run.tasks.filter(t=>t.attempts.some(a=>a.outcome==='completed'));
 return {runId:run.runId,mode:run.mode,complete:completed.length===run.tasks.length,
  total:run.tasks.length,completed:completed.length,
  pending:run.tasks.filter(t=>t.attempts.length===0).map(t=>t.taskId),
  unresolved:run.tasks.filter(t=>t.attempts.length&&!t.attempts.some(a=>a.outcome==='completed')).map(t=>t.taskId),
  reviews:completed.map(t=>t.attempts.find(a=>a.outcome==='completed').review)};
}
