# Specification-only generated-test pilot

One fresh Claude Sonnet 5.5 call received version 2 public requirements and fixture/API schema only. No candidate implementation, seeded-bug explanation, prior chat, human tests, or evaluator labels were supplied. Model settings, exact request, original response, token use, and test-source hash are in generation.json. The unchanged suite is stored as generated-test-source.txt to prevent automatic local test discovery. It is named tests/generated.test.js only inside a sandbox.

## Observed results

| Candidate | Pass | Fail | Interpretation |
|---|---:|---:|---|
| Reference | 12 | 0 | No generated-test failure observed |
| Direct status required for partner | 10 | 2 | Positive partner playback assertions failed |
| Sixth attempt allowed | 10 | 2 | Sixth-attempt boundary assertions failed |
| Inclusive expiry | 11 | 1 | Exact-expiry denial assertion failed |

The logged executions showed assertion failures, not import/dependency errors. The suite therefore distinguished these selected seeded faults from the current reference. One suite and three constructed defects do not estimate general model-test quality or coverage. Repeated executions of identical files are not independent research samples.

## Quality defects found in the generated suite

The purported privacy assertion ends in `|| true`, making it always pass. It checks an arbitrary fixture identifier rather than a meaningful sensitive-data contract. It is NOT evidence of PII protection. A test titled "sixth verification blocked with retryAt; playback still allowed" never starts playback; another test covers that behavior. Several assertions compare only allowed/reason, not the full error contract. Standard/premium registration bounds, exact missing-field sets, UTC rollover, and other negative cases are incompletely covered.

These findings justify adversarially testing the generated tests themselves. Preserve this original suite; put any corrected suite in a separately versioned condition, with its correction cost and assistance documented.

## Isolation and execution record

Candidates ran separately in ephemeral Vercel sandboxes: one vCPU, 2 GB RAM, denied network egress, no mounted credentials, no injected secrets, and a 15-second command timeout. Only service source, validation source, package type metadata, and generated test source were uploaded. The returned image digest and sandbox configuration are captured in logged-execution.json. No generated code executed on the host; host syntax checking used Node's parser only.

Setup first encountered connector network-policy shape and extraction-directory errors. The first sandbox expired before execution. Four subsequent runs returned exit codes, but logs were requested after shutdown and unavailable. We corrected log capture and repeated all four with the SAME suite and candidate bytes; logged runs confirmed the same exit outcomes. Original records and errors remain preserved; these were harness fixes, not model resampling. All sessions were stopped or expired. Log inspection must occur before shutdown in future runs.

## Cost

Generation: 1,489 input and 4,011 output tokens, estimated $0.043088. Earlier four reviews: estimated $0.062292. Combined estimated API token charges: $0.105380 before taxes, not a verified account debit. API reservations remain $0.265752. Nine short-lived sandbox creations (including failed setup and repeated capture) are separately metered/covered by account quotas. At published iad1 CPU/memory rates and configured maximum lifetimes, the compute upper estimate is below $0.08 before tax and small transfer charges; actual infrastructure debit is unverified. A conservative $0.10 infrastructure allowance plus API reservations remains below the $1 ceiling. No automatic API retries or extra model resampling occurred.

## Next experiment

Compare code-only and test-assisted review on the SAME frozen candidates and requirements. The earlier code-only pilot was version 1; do not compare it directly to version 2 as a causal effect. Add independent reference/label review and stronger correct controls before a final evaluation. Investigate whether reviewers detect or over-trust the always-true privacy assertion.
