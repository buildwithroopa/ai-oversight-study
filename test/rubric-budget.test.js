import {test} from 'node:test';
import assert from 'node:assert/strict';
import {reservePhase} from '../experiment/runs/rubric-budget.js';
test('phase accounts for historical usage, output maximum, margin and infrastructure',()=>{
 const r=reservePhase(291786,Array(8).fill(8000));
 assert.equal(r.totalMicroUsd,893034);
 assert.equal(r.reservations[0].reservedMicroUsd,62656);
});
test('over-budget and incomplete preflights cannot proceed',()=>{
 assert.throws(()=>reservePhase(291786,Array(8).fill(20000)),/ceiling/);
 assert.throws(()=>reservePhase(291786,Array(7).fill(8000)),/accounting/);
 assert.throws(()=>reservePhase(291786,Array(8).fill(NaN)),/accounting/);
});
