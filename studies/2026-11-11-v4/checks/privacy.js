import assert from 'node:assert/strict';
// Explicitly checks exact sensitive canaries, not vague substring placeholders.
// This is an evaluator helper; never send it to the test-generating model.
export function assertNoPersonalValues(response, sensitiveValues) {
  const serialized = JSON.stringify(response);
  for (const value of sensitiveValues) {
    assert.equal(typeof value,'string');
    assert.ok(value.length >= 8,'Use distinctive synthetic canaries');
    assert.equal(serialized.includes(value),false,'Response disclosed a forbidden value');
  }
}
