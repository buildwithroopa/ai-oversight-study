# First API pilot proposal — November 4, 2026

Status: proposed; no account creation, paid calls, or spend approval yet.

## Model and purpose

Recommend Claude Sonnet 5.5, API ID claude-sonnet-5-5, for four code-only reviews in separate fresh contexts, one per existing development packet. This tests transport, structured responses, logging, scoring, and human rationale assessment. It is not the main generated-test experiment and cannot establish statistical performance from four constructed tasks.

Official model documentation inspected today lists Sonnet input $2/million tokens and output $10/million; Haiku 5.5 (prompts below 100K tokens) $0.10/$0.50; Opus 5.5 $4/$20. Sonnet is proposed as the middle-cost coding reviewer. This choice is engineering judgment, not a measured superiority claim. Account access and the returned model ID must be checked before the paid run.

Sources:
- https://platform.claude.com/docs/en/models/sonnet-5-5/overview
- https://platform.claude.com/docs/en/about-claude/pricing
- https://support.claude.com/en/articles/8114531-i-created-a-claude-console-organization-how-do-i-start-using-the-claude-api

## Estimate

Measured outbound instruction plus serialized user-content size: 11,029, 11,097, 11,029, and 11,028 ASCII characters. These are NOT token counts. For planning use 3,000–6,000 input tokens per call, pending exact counting with the selected model. Allow at most 4,096 total billed output tokens per call, including model thinking within the configured output allowance, subject to confirming provider API semantics in the adapter. Use no tools, caching, batching, or search.

Four calls at those assumptions:
- Sonnet: input $0.024–$0.048 plus up to $0.16384 output = about $0.19–$0.22 before taxes.
- Haiku at short-prompt rate: about $0.0094–$0.0106.
- Opus: about $0.38–$0.43.

These are estimates, not measured usage or guaranteed ceilings. Propose $1 maximum approved experimental spend for this code-only pilot, enforced by preflight reservations and a bounded call count in the future adapter. Allow at most one retry per task for transport/invalid response issues, retain every attempt, and never resample a valid verdict to improve results. At the same assumed token sizes, eight Sonnet attempts cost about $0.38–$0.43. Stop if preflight token counts or provider settings invalidate the assumptions. No auto-reload or automatic continuation is needed.

Console minimum funding or prepaid credit purchase may exceed pilot consumption; check the actual checkout rather than equating a $1 experiment budget with a $1 account deposit. Check eligible existing-plan credits before buying any. The earlier blanket assumption that chat plans never supply API credits is outdated: current support documentation describes credits for eligible Max, Ultra, and Team plans, requiring linking/claiming.

## Settings and setup

Sonnet 5.5 rejects temperature/top_p/top_k. Adaptive thinking is the default; exact effort and thinking configuration must be selected and recorded after inspecting API parameter docs. Offline run records now support omitting temperature, verified in a new test; no API adapter exists yet. 64 development tests pass.

Roopa's next step: sign into the Claude Console and inspect whether an organization and any credits already exist. Do not paste API keys in chat. Account creation, payment, and API-key storage will be separate explicit steps once the spending proposal is accepted. Use a local secret setup that never logs the key or commits it.

The task packets remain development data. Keep evaluator labels, prior chat, mutation explanations, and generated tests out of code-only reviewer contexts. Independently review reference labels and score explanations before treating any results as research evidence.
