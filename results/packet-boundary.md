# Development packet and scoring boundary

Four packets in model-input/development/ contain identical public requirements, opaque task IDs, candidate service/validation source, and instructions for test generation and code-only review. Evaluator labels, explanations, and hashes are stored separately in evaluator/development-manifest.json.

The set contains one reference and three controlled faults: partner eligibility, attempt limit, and expiry. This document, evaluator manifest, builder, tests, checks, results, and this chat must NOT be sent to the model. Only send the selected JSON packet, selecting the appropriate stage instructions. Use fresh contexts for test generation and review. The code-only condition must never receive generated tests or their results.

Directory separation is organizational, NOT a filesystem sandbox. Do not give model tools access to evaluator files. No API runner exists yet, so actual model tool isolation has not been verified. Packet checks enforce expected fields, source filenames, common specification, absence of known evaluator markers, and content hashes. They cannot guarantee absence of every semantic clue. Candidate source behavior is intentionally visible: finding its fault is the task.

The scorer accepts structured verdicts with task ID, accept/reject, and nonempty rationale. It rejects unknown IDs, duplicates, unsupported verdicts, and empty rationale. Missing responses remain incomplete, not passing. Empty rate denominators produce null. False acceptance and false rejection are counted separately using reviewed-task denominators.

Scoring measures verdict agreement with constructed development labels. It does not validate rationale correctness. It does not execute or measure generated tests. Executing generated code requires a separate isolated runner that distinguishes test failures from harness errors. Test-assisted and evidence-assisted review conditions are not implemented.

58 development tests pass, including six packet/scorer tests. The scorer tests use synthetic verdict fixtures, not real model responses. The small, unbalanced candidate set is neither held-out evaluation nor independent evidence. No model calls or spending occurred.

Rebuild: node experiment/packets/build.js
Verify: node --test test/*.test.js

Next: offline run records binding packet hashes, condition, configuration, and completion status; independent label review; then model selection and a cost estimate before paid runs.
