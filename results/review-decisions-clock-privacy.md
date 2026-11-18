# Review decisions on clock retries and privacy

## A  Additional clock retry guidance

Roopa chose to add retry fields without exposing personal or internal values. This is a new requirement, not evidence that the version 2 reviewer had cited an existing requirement correctly. The current implementation now returns verification_unavailable, retryable=true, retryAfterSeconds=30, and a generic message explaining that the attempt was not consumed. Thirty seconds is an assistant-selected guidance interval, not a promise of recovery or an enforced throttle. No absolute retry timestamp or remaining daily count is asserted when time is untrustworthy.

A new development check exercises clock failure during playback, verifies the complete safe response, restores the trusted clock, confirms streaming succeeds without a stale reserved slot, and confirms recovery allowance was not consumed. The existing invalid-clock tests were updated to the new response contract. Current development suite: 83 passing tests. The builder now uses version 3 IDs/paths for future packets; saved version 1/2 candidates, labels, prompts, and paid results are untouched.

## B  Corrected privacy suite

Roopa authorized repairing the generated privacy test and recording why. The original OR-true assertion could never reject a leak and therefore did not test the privacy rule. corrected-privacy-suite-v1.txt is an assistant-edited follow-up suite, not a fresh model generation or a replacement of the original evidence.

Only the privacy test was replaced: it supplies distinctive synthetic account, partner, email, and name canaries; requires the complete missing-data response; checks no sensitive value is present; and deliberately injects each canary into nested debug data to verify that the checker fails. Negative controls address the original accidental-pass problem. Other test-quality gaps are not silently repaired.

The corrected suite passes a syntax check only. It has NOT yet been executed in an isolated sandbox or used in a paid review. The original generated suite and its hashes/results remain unchanged. Existing developer privacy tests already exercise analogous leak controls, but are not a substitute for executing this separate corrected suite.

## C  Verification terminology still needs confirmation

Update: Roopa confirmed the intended rule: automatically verify access on every playback start; count only explicit verification/recovery actions toward the five-attempt daily allowance. The implementation already conforms to this distinction. No new verified-session requirement was added. Earlier discussion below is retained as the decision trail.

Every new partner stream already calls playbackPartner and partnerDecision, which assess authenticated account ownership, trusted entitlement status and expiry, and stream limits. This is an automatic access verification. The separate public verifyPartner method is the quota-counted verification/recovery action. The current service does not require a prior explicit verifyPartner invocation when valid trusted entitlement evidence is already present.

There are no real partner API calls: entitlement records are trusted fixture snapshots. Dynamic refresh/revocation and verified-session issuance are not implemented. If Roopa intends a mandatory verified-session step before playback, specify its lifetime, binding, refresh, and failure behavior as a distinct requirement. No change to C has been assumed during this update.

No new model API calls, sandbox executions, or spending occurred for this update.
