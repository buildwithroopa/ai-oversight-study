# AI Oversight Study

**Can model generated tests give reliable evidence that an access-control implementation follows its requirements?**

This project is a small, human-directed study of that question. The test domain is a fictional subscription service with partner verification, household ownership, privacy-sensitive errors, device and stream limits, and playback expiry. The code and accounts are synthetic; no employer systems or customer data are involved.

## What I did

I brought the problem from my experience testing ambiguous, cross-device subscription flows: passing tests can miss the very edge cases that matter. I set the policy requirements and privacy constraints, reviewed the scenarios, and decided which failures mattered. AI generated much of the JavaScript implementation and an initial test suite. I then examined the suite against deliberately faulty versions of the service. That review found an always-true privacy assertion (`|| true`) that could never fail. I wrote a corrected privacy check and compared its behavior against a seeded email-disclosure defect.

The work is exploratory. AI assistance was substantial, and the study checks and labels also need independent review. This is evidence about a few deliberately constructed examples, not a claim that AI tests or reviewers are generally reliable.

## Main observation

The initial generated suite passed both the reference implementation and three selected faulty implementations in different properties; it missed an injected email disclosure because its privacy assertion was always true. The corrected privacy suite passed the reference and failed the seeded disclosure case. That demonstrates that the correction catches this specific defect. It does not establish broad privacy coverage.

A separate small comparison used four frozen candidates, each reviewed once with code only and once with code plus test evidence. Both conditions rejected the three seeded faults. Code-only accepted the reference; test-assisted review rejected it, partly for a requirement that was not actually specified. Four constructed cases and one response per condition are too few to estimate general performance or claim that test evidence causes worse judgments.

## How to reproduce the offline checks

Requires Node.js 20 or newer. From the project root, run:

```sh
npm test
```

The offline checks are development checks written with AI assistance. They are not an independent security oracle. Review the limitations in [`STUDY.md`](STUDY.md) before interpreting the results.

## Study documents

- [`STUDY.md`](STUDY.md): design, observations, limits, and contribution details.
- [`results/`](results/): selected written findings from the development phases.
- [`studies/2026-11-11-v6/`](studies/2026-11-11-v6/): frozen, hashed development cases and verification code. Labels are kept separate from model-input packets. This is not a held-out benchmark.

## Scope and safety

This is an offline research prototype, not production access-control software. It does not implement real authentication, billing, partner APIs, geographic policy, media enforcement, or persistent storage. Do not deploy it or use it to make decisions about real accounts. The frozen study contains synthetic cases. Generated test code is stored as text and must not be executed on the host; the reproduction commands run the authored development tests only.

No API keys, provider credentials, raw provider request/response logs, workspace identifiers, or private employer data are part of this repository.

## License

MIT. See [`LICENSE`](LICENSE).
