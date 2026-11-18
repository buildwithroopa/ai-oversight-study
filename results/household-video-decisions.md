# Household updates and the next-video boundary

Roopa chose two household changes per 30 days and clarified that subscription expiry should not interrupt the current video. The next-video start is the access-revalidation trigger. These are new declared behaviors, not retroactive corrections to earlier study labels.

## Household policy

Implementation uses a rolling 30-day window per account. The initial household assignment is not a change. Successful verified changes consume one of two allowances; invalid, unauthorized, rejected, and same-household requests consume none. A third change within the window returns household_update_limit, zero updatesRemaining, retryAt based on the oldest counted change, and this generic message:

"Household update limit reached. Two changes are allowed per 30 days. Retry after the limit resets."

No account, partner, device, or household identifier or personal value is included. At exactly 30 days after a change, that change falls outside the window. This uses trusted time; invalid or backward time cannot change the household or allowance.

Updates are available only through trustedHousehold.applyVerifiedHouseholdUpdate in this synthetic harness. Existing devices retain their old household binding; a separately verified device rebind is needed before they gain access in the new household. This avoids silently trusting devices simply because the account changes household. Both adapters enforce ownership but assume external verification already occurred. Real verification, geolocation, authentication, and billing are not implemented.

## Video lifecycle

startStream checks new playback eligibility; an already active video remains idempotent. startNextVideo first ends the previous video and releases its slot, then performs the normal device, household, subscription, expiry, and capacity checks before starting another video. If entitlement is expired at that instant, the next video is denied. It does not consume a verification/recovery attempt.

No background expiry kill was added. An unauthorized next-video request cannot end another account's stream. A blocked next video cannot retain the old slot, and an eligible transition at capacity does not require a new extra slot.

The harness assumes a trusted player reports the boundary honestly. It does not identify real content IDs, enforce media playback, or protect against a malicious client concealing video completion. Replay-safe event IDs and production player integration remain outside scope. An expired current video finishing is permitted behavior; a new video being authorized after expiry is not.

## Verification and experiment integrity

Eight new developer scenarios cover the expiry boundary, repeated transitions at capacity, unauthorized stop attempts, rolling-window boundaries, no-op/failed changes, safe validation, device revalidation, and invalid/backward time. All 109 host development tests pass. No generated code was executed or model/API resources used in this update.

The packet builder now uses version 4 IDs and paths for future generation. Saved earlier packets, labels, expanded-case snapshots, and paid results remain untouched; they do not claim coverage of these new rules. Further research runs must freeze and review a new version rather than overwrite an old evaluation.
