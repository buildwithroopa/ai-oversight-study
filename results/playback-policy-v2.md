# Playback policy clarification — version 2

Roopa confirmed ordinary partner playback may stop and restart more than five times daily provided the concurrent-stream limit is respected. Earlier approved tier limits remain 2/3/5; five is the maximum tier, not a replacement for lower-tier limits. Each account belongs to one household; counting is per account in this bounded model, not across independently billed accounts sharing a household identifier.

## Implementation

Only explicit verifyPartner calls consume the five-total-attempt daily allowance. Stream starts separately evaluate trusted partner entitlement, identity, status, expiry, device ownership, and capacity without consuming this allowance. Exhausting recovery attempts cannot block otherwise valid playback. Missing evidence still denies access and reports the actual remaining recovery allowance; repeated playback cannot replenish or consume it.

No permanent verification cache was introduced. Every new stream checks entitlement at the trusted clock time. Currently entitlements are immutable fixture snapshots: dynamic revocation/refresh ingestion is not implemented, and existing active streams are not terminated on expiry. Do not describe this as a production revocation solution.

## Verification

72 development tests pass. Six new scenarios cover 20 restarts, exhausted recovery allowance with valid playback, expiry on restart, and tier-specific partner stream limits. The new suite detects reintroducing playback/quota coupling as a deliberate mutation alongside the earlier mutation set. See contract-mutations-v2.json for exact outcomes.

## Experiment integrity

Original model-input/development packets, evaluator/development-manifest.json, original mutation outputs, and results/api-pilot records are retained. New packets use task-v2 identifiers, model-input/development-v2/, and evaluator/development-v2-manifest.json. No paid calls occurred during this revision. Original estimated pilot cost remains $0.062292; its labels and results must not be silently rewritten to fit the new rules.

The original reference rejection led us to clarify a real product-policy ambiguity. It cannot simply be counted as an established model error. Changes to task wording and implementation are development iteration, not held-out generalization evidence.
