# API setup status — November 4, 2026

Update: Roopa supplied a workspace ID; preflight and four paid reviews subsequently completed. See api-pilot/pilot-findings.md for actual usage and outstanding specification adjudication. The earlier setup failures below are retained as history, not current blockers.

Roopa approved a $1 pilot ceiling, reported $5 in organization credits, and saved an API key using the hidden local-entry helper. The key file's existence and owner-only permissions were verified; its value was not displayed or copied into experiment records.

Installed pinned lockfile dependencies: ai 7.0.162 and @ai-sdk/anthropic 4.0.96. Added a single-task API adapter, a persistent conservative spend-reservation ledger with a process lock, output cap, no automatic retries, and two budget tests. No paid generation has been requested.

Two token-count preflight requests returned HTTP 400. The second response explained that the key is not scoped to a workspace and requires the anthropic-workspace-id header. No token counts, verdicts, or billable generation usage were returned. No generation budget reservations were made. The adapter now supports ANTHROPIC_WORKSPACE_ID; the actual ID is pending user input.

Next: supply workspace ID, retry token preflight, reserve worst-case token cost plus margin, then request one review. Check account model availability and actual returned model ID; none has yet been verified for this organization. Do not claim any research result or API spending from setup checks.

The budget excludes taxes and any activity outside this local pilot. Error attempts retain their full reservation. SDK retries are disabled. A task with an existing attempt stops for inspection rather than silently running again.
