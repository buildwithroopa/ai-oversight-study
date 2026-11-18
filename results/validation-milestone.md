# Input validation milestone

52 development tests pass, including 18 new validation tests. All 14 earlier selected behavioral mutations remain detected by the 21 contract scenarios. No model experiments, API calls, or spending occurred.

## Implemented

- Reject malformed setup collections, invalid identities, unsupported account types/tiers, invalid direct subscription states, and duplicate account/device/partner-entitlement keys. Setup errors identify only the field category; they never include the supplied sensitive value.
- Preserve the difference between bad service setup and missing partner evidence. Incomplete identifiable partner records enter normal verification and return missing-field instructions while consuming an attempt. Invalid identifiable partner payloads return invalid_partner_data.
- Reject invalid device identifiers before registration or stream changes. Unauthenticated/unauthorized callers still receive only access_denied.
- Snapshot entitlement fields so caller mutation of fixture objects cannot silently change subscription eligibility. This in-memory adapter does not yet support live entitlement updates.
- Invalid or throwing trusted clocks return verification_unavailable without exposing exceptions or consuming an attempt. Invalid timestamps include negatives, fractions, strings, and unsupported large values.

## Design choice to review

Trusted configuration failure throws a sanitized ConfigurationError before creating a service. Client mistakes return structured denial objects. This supersedes the initial blanket suggestion that every schema failure return invalid_input. There is no HTTP API yet; a future adapter must prevent configuration exceptions from becoming public debug responses.

## Scope limits

Inputs are plain trusted JavaScript fixtures, not arbitrary executable objects, getters, proxies, or untrusted serialized files. Complete relational consistency, persistent/distributed state, real authentication, audit logs, temporary grants, transport failures, country policy, session lifetime, and downgrade rules are not implemented. Existing tests deliberately permit legacy devices above a cap and ownership mismatch fixtures to test runtime checks.

The 14 mutation challenges target earlier behavior; they do not independently audit every new validator. Test counts describe developer checks, not independent research samples or evidence of frontier-model safety.

## Next milestone

Review the rules and expected cases without consulting implementation, then build model-visible development task packets and a separate scoring boundary. Freeze the small experiment scope before adding country/offer features. Related-work review and independent checks remain necessary before claiming research results.
