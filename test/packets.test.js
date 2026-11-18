import test from 'node:test';
import assert from 'node:assert/strict';
import {buildPackets} from '../experiment/packets/build.js';
import {scoreReviews} from '../evaluator/score.js';
import {createHash} from 'node:crypto';
const {packets,manifest}=await buildPackets();
test('packet top-level allowlist excludes evaluator labels and explanations',()=>{
 for(const p of packets){
  assert.deepEqual(Object.keys(p).sort(),['schemaVersion','stage','taskId','specification','files','testGeneration','review'].sort());
  assert.deepEqual(p.files.map(f=>f.path),['src/service.js','src/validation.js']);
  assert.equal(p.stage,'development');
  assert.equal(p.review.condition,'code-only');
  assert.doesNotMatch(JSON.stringify(p),/acceptable|sourceSha256|packetSha256|DELIBERATE BUG|evaluator\/development-manifest/);
 }
});
test('all packets have same requirements; manifest binds exact packet contents',()=>{
 assert.equal(new Set(packets.map(p=>p.specification)).size,1);
 for(const p of packets){
  const t=manifest.tasks.find(t=>t.taskId===p.taskId);
  assert.equal(t.packetSha256,createHash('sha256').update(JSON.stringify(p)).digest('hex'));
 }
});
const reviews=manifest.tasks.map(t=>({taskId:t.taskId,verdict:t.acceptable?'accept':'reject',rationale:'Synthetic scorer fixture, not a model response.'}));
test('perfect synthetic verdicts score correctly; this is not model evidence',()=>{
 const r=scoreReviews(manifest,reviews);
 assert.equal(r.complete,true);assert.equal(r.falseAcceptances,0);assert.equal(r.falseRejections,0);
 assert.ok(r.rows.every(x=>x.correct));
});
test('inverted synthetic verdicts count both types of mistake',()=>{
 const r=scoreReviews(manifest,reviews.map(x=>({...x,verdict:x.verdict==='accept'?'reject':'accept'})));
 assert.equal(r.falseAcceptances,3);assert.equal(r.falseRejections,1);
 assert.equal(r.falseAcceptanceRate,1);assert.equal(r.falseRejectionRate,1);
});
test('missing tasks remain incomplete; empty denominator produces null',()=>{
 const r=scoreReviews(manifest,[]);
 assert.equal(r.complete,false);assert.equal(r.missing.length,4);
 assert.equal(r.falseAcceptanceRate,null);assert.equal(r.falseRejectionRate,null);
});
test('duplicate, unknown, malformed, or unsupported verdicts are rejected',()=>{
 for(const rows of [[reviews[0],reviews[0]],[{...reviews[0],taskId:'unknown'}],[{...reviews[0],verdict:'maybe'}],[{...reviews[0],rationale:''}], [null]])
  assert.throws(()=>scoreReviews(manifest,rows));
});
