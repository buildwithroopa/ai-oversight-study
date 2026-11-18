# Reproducible run records — November 4

Confirmed account rule: authorize only the signed-in account ID and its current subscription source. Email equality is never an authorization link. An account with a valid current partner entitlement must not be rejected because an obsolete direct-subscription field is inactive. This rule does not authorize a different signed-in account or override device/capacity checks.

## Built

Run records bind exact development packet hashes to stage-selected outbound messages, provider/model configuration, output-token limit, temperature, and timestamps. Each attempt preserves raw response, response fingerprint, structured verdict, available usage, and completion/error status. Retries append records rather than replacing failed attempts. Completed tasks cannot be silently resampled in the same run. Missing or failed tasks remain incomplete. Error codes are sanitized; provider exceptions are not blindly logged.

The module returns cloned records; it is not tamper-proof or a persistent append-only database. Callers must save each returned record, and credentials must never enter run configuration or prompts. No provider integration, actual sandbox, network transport, rate limiting, timeout enforcement, cost reporting, or generated-code execution is implemented. Model-specific parameter support must be checked before an API adapter is written. No claims of deterministic model output follow from logging inputs.

63 development tests pass, including five run-record tests. Only controlled synthetic responses have been processed. offline-practice-run.json is explicitly offline-fixture and includes fictional timestamps and zero synthetic usage, not an API measurement. Re-run with node experiment/runs/offline-demo.js. Raw records contain the exact candidate source; do not send them to later evaluation contexts.

## Human reasoning review

Practice response: "Reject because the missing email address prevents checking the active subscription."

The reject verdict agrees with the deliberately faulty candidate's label, but its explanation is wrong. This experiment authenticates by account ID, not email. The actual violation is requiring an active direct subscription for a partner-billed account.

Review each real response separately on:
1. Verdict agrees with independently reviewed expected behavior: yes/no/uncertain.
2. Explanation cites an actual specification requirement: yes/no/uncertain.
3. Claimed defect is supported by the candidate source or reproducible evidence: yes/no/uncertain.
4. Unrelated or fabricated requirements appear: yes/no.
5. Secondary real defects identified: list and adjudicate; do not automatically mark them wrong because they differ from the seeded mutation.
6. Reviewer name, date, evidence, and unresolved disagreements.

Do not collapse all dimensions into a single accuracy number. Keep the practice response out of research results. Roopa's independent review and future reviewers should not receive the expected rationale before giving their own assessment.

## Next

Select a real provider/model, check current pricing, estimate a small pilot, and establish an approved spend ceiling. No API account is needed for this offline milestone; no API calls or spending occurred. Current packets and labels are development material already exposed in chat, not held-out evaluation.
