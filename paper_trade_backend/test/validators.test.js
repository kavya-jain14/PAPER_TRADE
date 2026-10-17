const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validateQuantity, validateReplayDate } = require('../utils/validators');

test('quantities require positive safe integers, without coercing JSON objects or booleans', () => {
  for (const value of [1, '2', ' 3 ']) assert.equal(validateQuantity(value), true);
  for (const value of [true, false, null, [], [1], {}, '', ' ', 0, -1, 1.5, Infinity, NaN, Number.MAX_SAFE_INTEGER + 1]) {
    assert.equal(validateQuantity(value), false, JSON.stringify(value));
  }
});

test('replay dates reject calendar overflow and future dates', () => {
  assert.equal(validateReplayDate('2024-02-29'), true);
  for (const date of ['2024-02-30', '2025-02-29', '2024-13-01', '2999-01-01', '2024-2-1']) {
    assert.equal(validateReplayDate(date), false);
  }
});
