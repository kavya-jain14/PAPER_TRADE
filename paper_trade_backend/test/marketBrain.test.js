const test = require('node:test');
const assert = require('node:assert/strict');
const brain = require('../engine/marketBrain');

test('simulation updates one five-minute bucket instead of creating future bars', async () => {
  const symbol = 'RELIANCE';
  const bucket = 1_800_000_000;
  const originalRandom = Math.random;

  brain.cache[symbol] = {
    analyzedAt: Date.now(),
    bias: {
      symbol,
      bullishProbability: 55,
      regime: 'SIDEWAYS',
      rsi: 50,
      atr: 10,
      fairValue: 1000,
      lastRealPrice: 1000,
      analyzedAt: Date.now(),
    },
  };
  brain.syntheticHistory[symbol] = [{ time: bucket, open: 1000, high: 1002, low: 998, close: 1000, volume: 100 }];
  brain.macroEvents[symbol] = undefined;
  Math.random = () => 0.5;

  try {
    const update = await brain.getNextCandle(symbol, null, bucket);
    assert.equal(brain.syntheticHistory[symbol].length, 1);
    assert.equal(update.time, bucket);
    assert.equal(update.open, 1000);

    const next = await brain.getNextCandle(symbol, null, bucket + 300);
    assert.equal(brain.syntheticHistory[symbol].length, 2);
    assert.equal(next.time, bucket + 300);
  } finally {
    Math.random = originalRandom;
    delete brain.cache[symbol];
    delete brain.syntheticHistory[symbol];
    delete brain.macroEvents[symbol];
  }
});
