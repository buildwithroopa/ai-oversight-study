# Privacy error contract

Roopa's rule: user-visible validation may disclose an error code, the reason, the parameter needing correction, and safe retry instructions. It must not disclose the actual email, account ID, partner ID, payment details, name, or other personal values. Sensitive identifiers are treated as forbidden response data even where their legal classification varies. Authentication and ownership checks precede detailed diagnostics.

Example allowed message: "Missing fields: status, validUntil. Retry with correct data through the authorized partner verification flow." The message must reflect a real failure; do not suggest correcting an email when this service does not use an email parameter. In an email-based form, "Check your email and retry" can identify the field without reproducing its value.

Five new developer tests check full missing-data responses, equivalent behavior when personal values change, malformed provider values, exhausted quota, and generic unauthorized responses. A negative-control test intentionally inserts a synthetic email into a field, a message, and nested data, and requires the privacy checker to fail each time. Field names such as email are allowed; field values are not.

These tests inspect response data only. They do not certify logging, telemetry, headers, network behavior, real PII handling, or production access control. No logging system or real login system exists in this harness. The original model-generated suite, its always-true assertion, and frozen packets are unchanged. Any repaired model-generated suite must be a separate condition. No paid calls were made for this update.
