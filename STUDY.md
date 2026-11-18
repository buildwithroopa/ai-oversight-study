# Study notes

## Question

When a model writes tests for a small access-control service, do those tests catch selected failures? And when a reviewer sees those tests and their results, does that evidence help the reviewer make a sound judgment?

## Why this example

The fictional service models the kinds of cases that made password sharing difficult to verify in my engineering work: partner-backed accounts, direct subscription conversion, multiple device types, household ownership, retry limits, and privacy-safe errors. My contribution at work was in identifying an overlooked partner-user population, finding the Android TV configuration needed to reproduce it, setting up mocked data and internal tooling, tracing the code and experience gaps with product, UX, and backend partners, and writing the technical approach. The launch had no customer-support escalations during the 35-day observation period. This research prototype uses newly written synthetic code and data; it does not include work code or customer information.

## Approach

1. I set behavior requirements for a fictional subscription and playback service, including ownership, conversion, limits, retries, privacy, and expiry.
2. AI generated much of the prototype implementation and an initial test suite from those requirements.
3. I inspected the tests and checked whether they failed on deliberately faulty variants, including one that exposed a synthetic email.
4. The original privacy assertion included `|| true`, so it always passed. I kept the original artifact as evidence, wrote a separate corrected privacy check, and tested each suite against the reference and the seeded disclosure variant.
5. I ran a small code-only versus test-assisted review comparison on four frozen candidates. Inputs were paired and kept unchanged within each comparison.
6. I added human-reviewed behavior decisions to later development checks, including household-update windows and the next-video expiry boundary. Those later decisions were not retroactively added to earlier model-study labels.

## Findings

### Generated-test pilot

The original generated suite passed the reference and the three selected faulty candidates in their respective seeded properties. It did not catch the synthetic email disclosure because its privacy assertion was always true. The corrected suite passed the reference and failed the seeded disclosure variant. The evidence supports only this narrow statement: the corrected check detects this particular injected disclosure under the tested harness.

The suite also had incomplete coverage and a misleading playback test title. A passing suite therefore did not establish that the required behavior was correct.

### Matched review pilot

Four version 2 candidates were reviewed once in each condition. Code-only review accepted the reference and rejected all three seeded defects (4/4 agreement with development labels). Test-assisted review rejected the reference as well as the three defects (3/4 agreement). Some assisted explanations noticed the vacuous privacy assertion, but one also treated a behavior that was not required as a violation.

This is not evidence that tests make model review worse. The sample is tiny, labels have not been independently adjudicated, and each condition received one stochastic response per case. Test-assisted prompts were also longer; equal output caps did not make the conditions equal in cost or information.

### Later frozen development set

Version 6 contains six controlled compliant variants and six controlled faulty variants, each checked against 31 authored scenarios. The checks are useful for reproducibility and regression work, but the variants are derived from one reference implementation. They are not twelve independent systems, not held-out examples, and not a model evaluation. The set needs independent review before it can support stronger claims.

## What changed during the work

- I clarified whether partner verification failures should deny access, what retry details could be shown without exposing personal information, and how a direct subscription should be treated after partner conversion.
- I tightened a weak privacy assertion after checking whether it could actually fail on a deliberately leaking candidate.
- I traced three review failures with a person: an ownership check that did not bind the active account to the requested resource, a privacy assertion that was always true, and a replayed event that was not matched to the action it requested. The resulting checks use explicit ownership, meaningful non-disclosure assertions, and request-specific event handling.
- I clarified playback expiry: the current video may finish; the next-video transition checks access again. This is a declared behavior in the prototype and does not imply production media enforcement.
- I kept each study version and its labels/results distinct instead of rewriting old observations to match later requirements.

## Contribution and AI assistance

I supplied the motivating problem, policy requirements, privacy constraints, edge cases, and review decisions. I directed the project and examined the observed failures and limitations. AI generated much of the prototype code, test code, and some study analysis; I also used AI assistance to revise the checks after inspecting their behavior. The study should be described as human-directed and AI-assisted. It should not be presented as code or research completed independently by me, and its labels and evaluator checks need independent review.

## Limitations and next steps

- Small, hand-constructed candidate sets; they do not represent the range of model outputs or production systems.
- The same assistant contributed to implementation, tests, and analysis. This creates correlated errors and limits the independence of the checks.
- Development labels have not received independent adjudication.
- Four paired model-review cases, one response per condition, do not support general performance estimates or causal claims.
- The corrected privacy check covers one seeded email leak. It does not establish complete privacy or security.
- The application prototype assumes trusted inputs in places and omits real identity, billing, partner integrations, persistence, geography, and media enforcement.
- Frozen hashes detect accidental changes only; they do not provide authenticated or write-protected storage.

Useful next steps are independent review of the requirements and labels, more source-distinct compliant controls and defect families, a preregistered comparison with enough repeated samples to characterize variability, and a separate audit of whether the tests themselves cover each policy requirement.

## Ethical and data boundary

All accounts, identifiers, and disclosures in this repository are synthetic. It contains no real customer data, employer source code, provider credentials, or raw model/API logs. The project is not suitable for production use or real access decisions.
