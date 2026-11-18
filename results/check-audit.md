# Development check audit

Executed November 3, 2026. 34 tests pass: the existing 13 development tests and 21 new contract scenarios. Several scenarios contain multiple cases and assertions; these totals are test-runner counts, not independent research samples.

## What changed

Added a reusable contract suite that compares complete expected response objects, including validation messages, missing-field names, remaining attempts, reset times, and absence of unexpected fields. Follow-up actions verify state effects rather than accepting success messages as proof.

Examples:
- An inactive partner denial must consume exactly one verification attempt.
- A failed stream request cannot reserve a stream slot.
- A duplicate device registration cannot allocate another slot.
- A stop request must actually release capacity, and an unauthorized stop cannot release it.
- Failed conversion cannot change eligibility; completed conversion must do so.
- Partner identity AND account identity must match the entitlement.
- Active direct eligibility and partner eligibility are tested separately.
- Boundary checks distinguish immediately before expiry, exact expiry, and immediately after expiry.
- Separate accounts must not share stream counts.
- Fake sensitive fields must not appear as extra response fields.

## Deliberate bug challenges

The same 21 scenarios were run on 14 individually changed implementations. All 14 were detected: partner access wrongly requires direct payment; six attempts permitted; allowance never consumed; expiry inclusive; partner identity ignored; account identity ignored; household check removed; one extra device; one extra stream; stop does not release; counts shared across accounts; conversion does nothing; missing-data instructions wrong; remaining-attempt count wrong.

Each mutation must match exactly one source location and import successfully. Invalid mutation code aborts the audit and is not counted as successful bug detection. Machine-readable results list the checks that caught each mutation in contract-mutations.json.

## Interpretation and remaining limits

This strengthens development confidence and addresses known accidental agreement. It cannot guarantee that all checks reject every wrong implementation. Checks and mutations were authored by the same assistant; mutation selection is deliberate, not representative or independent. Passing the original suite and killing these mutations does not establish model-test quality or production safety.

Exact messages are checked where their wording is currently part of the development contract. A deliberate copy change will require updating that contract. Research scoring should later distinguish functional errors from purely stylistic wording changes.

The service still lacks complete fixture/input schema validation, temporary grants, transport errors, country policy, persistent/distributed concurrency, session expiry, and downgrade behavior. Those are unimplemented scope, not properties certified by these checks. Synthetic authorization assumes a trusted principal; real authentication is not implemented. No logging system exists, so response non-disclosure checks are not log-security verification.

Reproduce: `node --test test/*.test.js`, then `node experiment/contract-mutations.js` from the project folder. No API calls or paid resources are used.
