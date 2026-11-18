# Privacy test correction validation

Roopa confirmed that each playback start automatically checks access, while only explicit verification/recovery actions consume the daily allowance. No change to that behavior was necessary. The safe clock-retry response is a separately authorized new requirement; it does not retroactively change what the earlier version 2 reviewers were asked to assess.

## Observed comparison

| Service candidate | Original AI-generated suite | Assistant-corrected privacy suite |
|---|---|---|
| Current reference | 12 pass, 0 fail | 12 pass, 0 fail |
| Deliberate email disclosure | 12 pass, 0 fail | 11 pass, 1 fail |

The deliberate candidate adds debugEmail: account.email to missing-partner-data errors. The original suite still passes because its privacy assertion is always true and its fixtures do not meaningfully challenge the personal-value contract. The corrected test provides distinctive synthetic personal values, requires the exact safe response, checks non-disclosure, and verifies its checker rejects deliberately injected values.

The corrected suite fails specifically on the privacy test for the leaking candidate, with an assertion failure rather than an import or harness error. Both suites pass against the reference. This establishes detection of this particular seeded leak by the correction, not comprehensive privacy protection.

## Why the correction was made

Roopa required that error codes, field names, correction steps, and retry instructions remain useful without revealing emails, account IDs, partner IDs, names, or other personal values. An always-true assertion cannot establish that contract. The correction adds meaningful input conditions, an exact response allowlist, and negative controls that prove failures are possible.

Credit: the original suite was model-generated; Roopa supplied the privacy requirement and authorized the correction; the assistant wrote the corrected test and validation tooling. This is a human-directed, AI-assisted correction, not evidence of an unassisted model improvement. The original suite and all prior experiment records remain unchanged.

## Execution and limits

Two separate ephemeral sandboxes ran one candidate each, with original and corrected suites executed in separate Node processes. Both had network egress denied, no secrets, one vCPU, 2 GB RAM, a 60-second lifetime cap, and 15-second command limits. Logs were captured before both sessions were stopped. Input hashes and complete tool-returned logs are preserved beside this report.

The same candidate bytes were used for both suite conditions within each sandbox. No model-generated code ran on the host computer. There were no new model API calls; cumulative estimated API token charges remain $0.291786. Infrastructure usage is separately metered or quota-covered and unverified. These two short sandbox runs remain within the conservative $0.10 infrastructure allowance at the previously inspected rates and configured caps; no dollar ceiling was raised.

Only one seeded leak was assessed. The corrected test does not certify headers, telemetry, logs, network transport, real identity providers, or all possible personal values and encodings. Full-response matching and canary checks should be supplemented by independently reviewed security cases before deployment claims.

## Next milestone

Freeze the clarified specification, expand the correct-control and defect families, and separate implementation-compliance verdicts from test-quality judgments in the next scoring rubric. Independently adjudicate the previous reference rejection before claiming reviewer accuracy. More paid calls need a new bounded call plan within the remaining approved dollar budget.
