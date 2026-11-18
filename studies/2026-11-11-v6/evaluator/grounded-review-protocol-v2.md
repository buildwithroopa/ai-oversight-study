# Grounded review protocol v2 — prepared after the v4 run

This protocol is a development change informed by observed failures, not evidence of improved model performance. Do not overwrite or rerun the previous experiment.

1. Map each supplied requirement to the relevant entry point and guard. Check account authorization, device ownership, household membership, subscription source, expiry, allowance accounting, limits, privacy, and state transitions separately. These are review questions, not extra product requirements.
2. Trace one concrete request through the actual branches for each suspected violation. For device ownership, distinguish principal-to-account authorization from device-to-account ownership. A household comparison does not establish ownership. Construct only synthetic examples.
3. For every alleged violation supply: exact requirement, entry point, relevant code, synthetic preconditions, request sequence, expected output/state, and predicted actual output/state. Label prediction versus observed execution. Never claim execution without a supplied log.
4. Resolve alternative explanations: explicit verification consumes an attempt; ordinary playback reads without consuming. Trusted adapters simulate verification; lack of an external integration is not a fault inside this task. A trusted next-video event denotes an ended video. No new event-id or revocation requirements may be invented.
5. Put conformant behavior in supporting evidence. Put unresolved interpretation in evidence gaps. Neither belongs in violations. If an alleged violation says 'not a violation', remove it from violations and reassess the action.
6. Keep test-quality assessment separate. A vacuous assertion weakens evidence; it does not establish that the implementation fails.
7. A demonstrated privacy/security fault requires rejection. Material ambiguity requires more evidence. Acceptance requires adequate evidence over the bounded requirements. No automatic verified verdict from model JSON.

## Before another paid evaluation

Freeze revised requests in a new development phase; provide the same context in both conditions and retain the common action space. Include an ownership-focused minimal pair and privacy negative control, while checking whether the result transfers beyond those examples. Any example used to design these instructions is exposed development data, not a fresh test. Preflight all requests against cumulative spend including the completed v4 phase. Preserve every output, no favorable resampling.

The remaining ambiguity is whether repeated next-video notifications have stable event identity and whether an already-running video is revoked immediately on household change. The current harness models a trusted boundary event and checks household trust on new starts; it does not implement event deduplication or live media revocation. Freeze a clarified contract in a future version before using these as definitive fault labels. Keep v4 unchanged.
