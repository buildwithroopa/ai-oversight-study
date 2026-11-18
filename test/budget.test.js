import test from 'node:test';
import assert from 'node:assert/strict';
import {PILOT,reserve} from '../experiment/runs/budget.js';
const fresh=()=>({model:PILOT.model,calls:[]});
test('reservation covers full output allowance, preserves original ledger',()=>{
 const a=fresh(),b=reserve(a,{taskId:'one',inputTokens:6000});
 assert.equal(a.calls.length,0);assert.equal(b.calls[0].reservedMicroUsd,58257);
});
test('overbudget, malformed token count, repeated task, and total-call limits reject',()=>{
 assert.throws(()=>reserve(fresh(),{taskId:'x',inputTokens:1000000}));
 for(const inputTokens of [-1,NaN,0,1.5])assert.throws(()=>reserve(fresh(),{taskId:'x',inputTokens}));
 let a=fresh();for(let i=0;i<8;i++)a=reserve(a,{taskId:String(i),inputTokens:1000});
 assert.throws(()=>reserve(a,{taskId:'ninth',inputTokens:1000}));
 let b=fresh();for(let i=0;i<2;i++)b=reserve(b,{taskId:'same',inputTokens:1000});
 assert.throws(()=>reserve(b,{taskId:'same',inputTokens:1000}));
});
test('matched phase may reserve thirteen total calls but cannot raise dollar ceiling',()=>{
 let a=fresh();for(let i=0;i<13;i++)a=reserve(a,{taskId:String(i),inputTokens:1000},{maxCalls:13,ceilingMicroUsd:900000});
 assert.throws(()=>reserve(a,{taskId:'fourteenth',inputTokens:1000},{maxCalls:13,ceilingMicroUsd:900000}));
 assert.throws(()=>reserve(fresh(),{taskId:'x',inputTokens:1000},{maxCalls:14}));
 assert.throws(()=>reserve(fresh(),{taskId:'x',inputTokens:1000},{maxCalls:13,ceilingMicroUsd:1000001}));
});
test('lower API ceiling leaves space for separate infrastructure allowance',()=>{
 assert.throws(()=>reserve(fresh(),{taskId:'x',inputTokens:1000},{maxCalls:13,ceilingMicroUsd:1000}));
});
