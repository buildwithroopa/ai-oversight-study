# Expanded development cases and separate scoring

Prepared November 6, 2026. No model calls, network services, or paid resources used.

## Cases

Twelve source-distinct, opaque-ID packets share the same current version 3 requirements: six labeled compliant controls and six labeled violations. Labels and descriptive names are stored only in evaluator/expanded-development-manifest.json, separately from model-input/expanded-development/ packets.

| Compliant controls | Fault families |
|---|---|
| Current reference | Missing account ownership check |
| Equivalent eligibility switch | Missing household check |
| Equivalent day calculation for validated nonnegative timestamps | Completed conversion does not update account |
| Equivalent stream count using reduction | Sixth verification attempt allowed |
| Equivalent reversed expiry comparison | Access allowed at exact expiry |
| Equivalent conversion object copy | Email exposed in nested error debug data |

These are controlled refactors and mutations of one reference, not twelve independent implementations. Cases are development material and must not be described as held-out after examining them here.

## Behavior verification

Every compliant control passes all 24 contract scenarios. Every faulty candidate fails at least one scenario, with targeted ownership, conversion, retry, expiry, and disclosure evidence. A parse/import failure aborts construction rather than counting as successful defect detection. Source hashes and per-check failure details are in verification.json.

The candidate mutation for privacy adds a nested debug field even when its value is undefined on some fixtures, so exact-response checks catch additional output-shape changes too. The dedicated sensitive-canary scenario separately establishes actual disclosure of a synthetic email; do not attribute every failed contract to a real PII leak.

The labels reflect expected controlled changes plus these assistant-authored checks. They still need independent review. Passing 24 scenarios is not proof of all possible behavior, and the assistant authored both cases and checks.

## Separate review judgments

evaluator/structured-review.js validates the policy-approved response structure: implementation judgment, test-evidence judgment, and next action. Violations require an explicit requirement, evidence, expected result, and actual result. Any recorded privacy/security violation requires reject. Uncertainty requires an evidence gap and request-more-evidence. Acceptance requires supporting evidence and no unresolved material gap.

Five calibration tests cover evidence requests, unjustified rejection, privacy/security rejection, missing evidence, and adequate independent evidence despite a weak individual test. These are synthetic developer fixtures, not new model responses.

Structural validation cannot establish that a cited requirement is applicable or that evidence is truthful. Human adjudication and reproducible behavior remain necessary; fabricated claims can pass a JSON schema. No model has yet been evaluated with this new three-part rubric.

## Reproduce and next step

Run npm test for the host-authored development suite. Run node experiment/verify-expanded.js to rebuild the current expanded development packets and report. This script loads only controlled locally authored source variants; never use its loader for model-generated code.

Before paid evaluation, review the expected outcomes with Roopa, freeze the packet/label hashes, choose a small subset with both correct and faulty cases, and preflight cost. The existing API call plan has reached its thirteen-call bound; a new explicit bounded plan is needed before further generation even if the $1 dollar allowance has room. Earlier packets, binary scoring, model responses, and original/corrected generated suites remain unchanged.
