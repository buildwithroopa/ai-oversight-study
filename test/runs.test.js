import test from 'node:test';
import assert from 'node:assert/strict';
import {buildPackets} from '../experiment/packets/build.js';
import {createRun,addAttempt,summarizeRun} from '../experiment/runs/records.js';
const {packets,manifest}=await buildPackets();
const options={packets,manifest,provider:'synthetic',model:'offline-fixture',maxOutputTokens:1000,temperature:0,createdAt:'2026-11-04T18:00:00Z'};
const run=()=>createRun(options);
const event={taskId:packets[0].taskId,startedAt:'2026-11-04T18:01:00Z',finishedAt:'2026-11-04T18:02:00Z',outcome:'completed',rawResponse:JSON.stringify({taskId:packets[0].taskId,verdict:'accept',rationale:'Synthetic practice response, not model evidence.'}),usage:{inputTokens:0,outputTokens:0}};
test('run stores exact stage-selected requests without evaluator labels',()=>{
 const r=run(); assert.equal(r.mode,'offline-fixture');
 for(const t of r.tasks){assert.doesNotMatch(JSON.stringify(t.request),/acceptable|packetSha256|testGeneration|Synthetic scorer/);assert.equal(t.request.messages.length,2);}
 assert.equal(summarizeRun(r).complete,false);
});
test('changed content and duplicate packets rejected',()=>{
 const bad=structuredClone(packets);bad[0].specification+=' altered';
 assert.throws(()=>createRun({...options,packets:bad}));
 assert.throws(()=>createRun({...options,packets:[packets[0],packets[0]]}));
});
test('completed attempt retains raw response and leaves source record unchanged',()=>{
 const old=run(),next=addAttempt(old,event);
 assert.equal(old.tasks[0].attempts.length,0);
 assert.equal(next.tasks[0].attempts[0].rawResponse,event.rawResponse);
 assert.equal(summarizeRun(next).completed,1);assert.equal(summarizeRun(next).complete,false);
 assert.throws(()=>addAttempt(next,event));
});
test('errors and invalid responses remain unresolved, with retries retained',()=>{
 let r=addAttempt(run(),{...event,outcome:'provider-error',rawResponse:undefined,errorCode:'timeout'});
 assert.equal(summarizeRun(r).unresolved.length,1);assert.equal(summarizeRun(r).reviews.length,0);
 r=addAttempt(r,{...event,startedAt:event.finishedAt,finishedAt:'2026-11-04T18:03:00Z'});
 assert.equal(r.tasks[0].attempts.length,2);assert.equal(summarizeRun(r).completed,1);
});
test('malformed responses, wrong IDs, negative usage, and backward time rejected',()=>{
 for(const extra of [{rawResponse:'not JSON'},{rawResponse:JSON.stringify({taskId:'wrong',verdict:'accept',rationale:'x'})},{usage:{inputTokens:-1,outputTokens:0}},{finishedAt:'2026-11-04T17:00:00Z'}])assert.throws(()=>addAttempt(run(),{...event,...extra}));
});

test('temperature can be omitted for models that reject sampling controls',()=>{
 const r=createRun({...options,temperature:undefined});
 for(const t of r.tasks)assert.equal(Object.hasOwn(t.request,'temperature'),false);
});
