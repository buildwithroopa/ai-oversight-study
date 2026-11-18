# First real API pilot — November 4, 2026

Four fresh code-only reviews completed on claude-sonnet-5-5 with medium effort, adaptive thinking, max output 4096 tokens, no tools, and SDK retries disabled. Each task was sent exactly once. No generated tests were executed. Workspace-specific preflight succeeded.

Provider-reported usage: 16,906 input tokens and 2,848 output tokens. Estimated standard token charges: $0.062292 before taxes, using the inspected $2/$10 per million input/output pricing. This is calculated usage cost, not a verified Console debit. Conservative budget reservations total $0.217420 against the approved $1 ceiling. No additional calls are needed to interpret this pilot.

## Observations

| Candidate | Review | Primary finding |
|---|---|---|
| Reference | Reject | New partner stream starts consume the five-attempt allowance, potentially blocking ordinary playback |
| Direct status wrongly required for partner | Reject | Correctly identified partner entitlement being overridden by direct status |
| Sixth attempt allowed | Reject | Correctly identified off-by-one limit |
| Inclusive expiry | Reject | Correctly identified exact-boundary error |

All four responses cited extra concerns, some unsupported by the public requirements or explicitly described by the model as ambiguous/acceptable. A correct seeded-bug citation does not validate the rest of a rationale. The absence of tests is not a defect in a code-only review task; the packet's general wording about writing tests should be removed from the review-stage specification in a separately versioned future packet.

## Adjudication needed

The original development labels produce three correct rejections and one reference rejection (3/4 verdict agreement, provisional false rejection 1/1). These are not validated performance claims. An always-reject baseline obtains the same verdict agreement on this unbalanced set. The model did identify the three particular seeded bugs, which is a more specific observation than verdict agreement alone.

The reference candidate follows the currently documented implementation choice that every new partner stream calls verification. However, the compact model-facing specification does not clearly state this coupling. It may be undesirable product behavior: repeated start/stop actions can exhaust access even when partner entitlement remains active. Resolve intended policy with Roopa before declaring this a model false positive or relabeling the reference. Preserve the original packets, raw responses, hashes, and labels; future clarification requires new versions and separate runs.

Other rationale claims need individual review rather than automatic acceptance: error precedence for full-capacity inactive accounts is not established in the packet; inactive conversion is outside the currently completed-active-conversion contract; registering an existing device with conflicting household metadata is another policy question; returning success for an already-stopped stream may be an idempotency choice.

## Next decision

Should the five-total-attempt cap apply only to an explicit verification/recovery flow, while already verified ordinary playback is governed by current entitlement and stream limits? If yes, define cached verification validity, refresh, expiry/revocation, and unavailable-partner behavior before changing the implementation. Do not silently remove counting or allow permanent stale access.

This remains a tiny constructed development pilot, not independent held-out research evidence. Related-work review, independent oracle/label review, and test-assisted comparison are still outstanding.
