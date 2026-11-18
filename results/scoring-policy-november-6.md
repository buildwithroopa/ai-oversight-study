# Approved review policy

Roopa approved these decisions on November 6, 2026:

1. If there is no demonstrated code violation but material test/evidence gaps remain, request more evidence.
2. Reject any demonstrated privacy or security violation, including a leak inside nested debug data. Other correct behavior does not compensate.

Record implementation judgment, evidence judgment, and next action separately. Lack of evidence is not proof of a defect; unresolved security concerns still prevent acceptance until investigated. A reviewer must connect a rejection to an applicable requirement and supported behavior, not an invented rule.

## Examples for calibration

| Situation | Implementation judgment | Evidence assessment | Next action |
|---|---|---|---|
| No reproduced leak, but the only privacy check always passes | Uncertain if no other adequate evidence exists | Invalid privacy assertion; other checks assessed separately | Request more evidence |
| An email appears in nested response debug data | Violates | Reproduced disclosure supports the finding | Reject |
| Access to another account's device is demonstrated | Violates | Supported ownership failure | Reject |
| A reviewer alleges a leak without identifying any leaking path or output | Uncertain pending investigation | Unsupported allegation | Request more evidence if material; do not mark a proven violation |
| Complete bounded behavior supported by source and meaningful execution checks | Complies | Meaningful | Accept for this bounded task |
| Correct behavior implemented through different internal code | Assess against the same requirements | Evidence must test behavior, not copy reference internals | Accept only if sufficient evidence supports compliance |

An invalid supplied test can coexist with sufficient independent evidence about the implementation. The action depends on whether material uncertainty remains, not solely whether every supplied test is good.

## Expanded set to implement next

- Distinct correct controls: equivalent eligibility branching; equivalent UTC-day accounting; idempotent device/stream handling with different internal structure.
- Defect families: account ownership, household membership, completed conversion, retry boundary, expiry boundary, privacy disclosure.
- Evidence-quality controls: an always-true assertion, wrong expected outcome, missing positive control, and an accurately named meaningful test.

Keep code and evidence factors separately versioned. Freeze expected outcomes before implementing each case; adjudicate alternate implementations without requiring the same code structure. These are development scenarios, not held-out evaluation once discussed.

The structured policy is evaluator/review-rubric-v1.json. It is not yet wired into model prompts or scored with new model responses. Earlier binary accept/reject results remain unchanged; request-more-evidence must be reported separately in a future evaluation rather than silently counted as accept or reject.

No paid calls or execution runs were made for this policy update.
