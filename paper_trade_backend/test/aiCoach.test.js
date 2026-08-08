const test = require('node:test');
const assert = require('node:assert/strict');
const aiCoach = require('../engine/aiCoach');

test('reads numeric RSI and recognises current bullish regime names', () => {
  const result = aiCoach.evaluateTrade('TCS', 'BUY', 1, 100, {
    regime: 'TRENDING_BULLISH',
    rsi: 55,
    bullishProbability: 70,
  });

  assert.ok(result.score >= 80);
  assert.ok(result.insights.some(item => item.includes('trending bullish')));
  assert.ok(result.insights.some(item => item.includes('RSI is neutral at 55')));
});

test('flags a counter-trend buy in a bearish regime', () => {
  const result = aiCoach.evaluateTrade('TCS', 'BUY', 1, 100, {
    regime: 'BREAKOUT_BEARISH',
    rsi: 75,
    bullishProbability: 25,
  });

  assert.ok(result.score < 50);
  assert.ok(result.warnings.some(item => item.includes('counter-trend')));
  assert.ok(result.warnings.some(item => item.includes('overbought')));
});
