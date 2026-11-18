# First mutation walkthrough

Status: executed development demonstration. No model API calls or spending.

## Fault introduced

The reference service verifies partner accounts through partner entitlement. The deliberately faulty version first requires a direct subscription status of active, even for partner accounts. This rejects valid partner users who do not have a direct subscription.

The mutation is generated in memory from the reference source with an exact single-location check. The original service file is unchanged. The machine-readable report records the source SHA-256 and exact mutation for reproduction.

## Observed results

| Case | Expected behavior | Reference | Faulty version |
|---|---|---|---|
| Active direct subscription | Allow | Pass | Pass |
| Inactive direct subscription | Deny as inactive | Pass | Pass |
| Active partner, no direct subscription field | Allow | Pass | Fail: denied as inactive |
| Active partner, stale inactive direct field | Allow | Pass | Fail: denied as inactive |
| Inactive partner entitlement | Deny as inactive | Pass | Pass |
| Missing partner entitlement | Deny with status unknown | Pass | Fail: denied as inactive |

The direct-only set passes 2/2 cases on both versions. The expanded set passes 6/6 on the reference and 3/6 on the faulty version.

## Interpretation

Checking only direct accounts cannot detect this constructed bug. Adding valid partner cases catches the access failure. The inactive-partner test passes by accident on the faulty version: it denies access for the wrong underlying reason. The missing-partner case denies access on both versions, but the faulty version returns the wrong validation reason, so the exact outcome check catches a separate contract violation.

Thus checking only allowed/denied would miss the missing-evidence error. Success criteria must include the promised error and retry behavior when relevant. The demonstration compares the primary reason for that case; the separate development suite checks its detailed missing-field and retry response.

## Limits

## Follow-up: stronger regression checks

Roopa challenged the inactive-partner pass. The original demonstration compared only allowed and reason, omitting other output fields. The correct full first-attempt response is {allowed:false, reason:"inactive_subscription", attemptsRemaining:4}; the faulty response lacks attemptsRemaining because it never enters partner verification. The demonstration now records full outputs and separately checks the missing field: the reference passes and mutant fails this stronger check. The original six-case summary is retained as the explicitly narrower comparison.

Four new regression tests exercise the public stream-start entry point: valid partner without a direct status, valid partner with stale inactive direct status, full missing-evidence validation, and inactive-partner verification accounting. All 13 development tests pass on the reference service. The reference already had the correct behavior; these additions close gaps in regression coverage. No production fix was necessary.

## Limits of this demonstration

These six examples and the mutation were intentionally authored together by the assistant. They are development material, not an independent oracle, held-out data, evidence of AI test-generation behavior, or a meaningful population failure-rate estimate. The service is still partial. Neither a broad security claim nor a novel research finding follows from this demonstration.

## Reproduce

From the project folder, run `node experiment/mutation-demo.js`. The command asserts the stated outcomes and writes results/mutation-demo.json. Run `node --test test/service.test.js` for the nine existing development checks.

## Next learning exercise

Explain why the inactive-partner case passes on the faulty version while the active-partner case fails. Then propose one new test from the public specification before inspecting implementation details. That proposed test is development data once discussed; keep future final evaluation separate.
