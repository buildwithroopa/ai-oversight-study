import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createService } from '../src/service.js';

// Controlled, authored mutation. No downloaded or model-generated code is executed.
const source = await readFile(new URL('../src/service.js', import.meta.url), 'utf8').then(text => text.replace("'./validation.js'", JSON.stringify(new URL('../src/validation.js', import.meta.url).href)));
const original = "    if (a.type === 'partner') return playbackPartner(accountId);";
assert.equal(source.split(original).length - 1, 1, 'Mutation must match exactly one location');
const replacement = `    if (a.type === 'partner') {
      // DELIBERATE BUG: partner users are incorrectly required to pay directly.
      if (a.subscriptionStatus !== 'active') return deny('inactive_subscription');
      return playbackPartner(accountId);
    }`;
const mutant = source.replace(original, replacement);
const { createService: faultyService } = await import(`data:text/javascript;base64,${Buffer.from(mutant).toString('base64')}`);

// Expected outcomes declared explicitly from public development requirements.
// These are not independent, held-out, or AI-generated tests.
const cases = [
  { id:'direct-active', type:'direct', status:'active', expected:{allowed:true,reason:'stream_started'} },
  { id:'direct-inactive', type:'direct', status:'inactive', expected:{allowed:false,reason:'inactive_subscription'} },
  { id:'partner-active-no-direct-field', type:'partner', entitlement:{status:'active',validUntil:2000}, expected:{allowed:true,reason:'stream_started'} },
  { id:'partner-active-stale-inactive-direct-field', type:'partner', status:'inactive', entitlement:{status:'active',validUntil:2000}, expected:{allowed:true,reason:'stream_started'} },
  { id:'partner-inactive', type:'partner', entitlement:{status:'inactive',validUntil:2000}, expected:{allowed:false,reason:'inactive_subscription'} },
  { id:'partner-missing-evidence', type:'partner', expected:{allowed:false,reason:'partner_status_unknown'} },
];
function evaluate(factory, c) {
  const account={id:'a',type:c.type,tier:'basic',householdId:'h',partnerId:'p',
    ...(c.status === undefined ? {} : {subscriptionStatus:c.status})};
  const service=factory({accounts:[account],devices:[{id:'tv',accountId:'a',householdId:'h'}],
    entitlements:c.entitlement ? [{accountId:'a',partnerId:'p',...c.entitlement}] : [], clock:()=>1000});
  const r=service.startStream({accountId:'a'},'a','tv');
  const actual={allowed:r.allowed,reason:r.reason};
  return {case:c.id,expected:c.expected,actual,fullOutput:r,passes:actual.allowed === c.expected.allowed && actual.reason === c.expected.reason};
}
const rows=cases.map(c=>({case:c.id,reference:evaluate(createService,c),faulty:evaluate(faultyService,c)}));
assert.ok(rows.every(r=>r.reference.passes),'Reference must pass every declared development case');
const narrow=rows.filter(r=>r.case.startsWith('direct-'));
assert.ok(narrow.every(r=>r.faulty.passes),'Direct-only set must miss the seeded bug');
assert.equal(rows.filter(r=>!r.faulty.passes).length,3);
// Inactive partner denial matches by accident: positive and negative controls matter.
assert.ok(rows.find(r=>r.case==='partner-inactive').faulty.passes);
const inactive = rows.find(r=>r.case==='partner-inactive');
assert.equal(inactive.reference.fullOutput.attemptsRemaining,5);
assert.equal(inactive.faulty.fullOutput.attemptsRemaining,undefined);
const report={kind:'constructed-development-mutation-demonstration',
  warning:'Not a model experiment, independent oracle, or estimate of real-world failure rates.',
  sourceSha256:createHash('sha256').update(source).digest('hex'),
  mutation:{original,replacement},
  inactivePartnerStrongerCheck:{expectedAttemptsRemaining:5,
    referencePasses:inactive.reference.fullOutput.attemptsRemaining===5,
    faultyPasses:inactive.faulty.fullOutput.attemptsRemaining===5},
  summary:{directOnly:{cases:narrow.length,referencePasses:2,faultyPasses:2},
    expanded:{cases:rows.length,referencePasses:6,faultyPasses:3}},rows};
await mkdir(new URL('../results/',import.meta.url),{recursive:true});
await writeFile(new URL('../results/mutation-demo-v2.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.table(rows.map(r=>({case:r.case,reference:r.reference.passes?'PASS':'FAIL',faulty:r.faulty.passes?'PASS':'FAIL',faultyDecision:r.faulty.actual.reason})));
console.log('Direct-only: both versions pass 2/2. Expanded: reference passes 6/6; faulty version passes 3/6.');
console.log('Constructed development demonstration only; no empirical model claim.');
