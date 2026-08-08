const test = require('node:test');
const assert = require('node:assert/strict');
const { getMarketSession } = require('../services/marketSession');

test('uses simulation before the normal session', () => {
  const preMarket = getMarketSession('2026-08-10T03:29:00.000Z'); // 08:59 IST
  assert.equal(preMarket.state, 'PRE_MARKET');
  assert.equal(preMarket.mode, 'SIMULATED');

  const preOpen = getMarketSession('2026-08-10T03:35:00.000Z'); // 09:05 IST
  assert.equal(preOpen.state, 'PRE_OPEN');
  assert.equal(preOpen.mode, 'SIMULATED');
});

test('uses live mode only during the NSE normal market', () => {
  const open = getMarketSession('2026-08-10T03:45:00.000Z'); // 09:15 IST
  assert.equal(open.state, 'LIVE');
  assert.equal(open.mode, 'LIVE');

  const finalSecond = getMarketSession('2026-08-10T09:59:59.000Z'); // 15:29:59 IST
  assert.equal(finalSecond.mode, 'LIVE');

  const closeBoundary = getMarketSession('2026-08-10T10:00:00.000Z'); // 15:30 IST
  assert.equal(closeBoundary.mode, 'SIMULATED');

  const closed = getMarketSession('2026-08-10T10:00:01.000Z'); // after 15:30 IST
  assert.equal(closed.state, 'POST_MARKET');
  assert.equal(closed.mode, 'SIMULATED');
});

test('keeps weekends and published NSE holidays in simulation', () => {
  assert.equal(getMarketSession('2026-08-08T06:30:00.000Z').state, 'WEEKEND');

  const holiday = getMarketSession('2026-10-02T06:30:00.000Z');
  assert.equal(holiday.state, 'HOLIDAY');
  assert.equal(holiday.holidayName, 'Mahatma Gandhi Jayanti');
});

test('honours the announced Union Budget special Sunday session', () => {
  const specialSession = getMarketSession('2026-02-01T04:00:00.000Z'); // 09:30 IST
  assert.equal(specialSession.state, 'LIVE');
  assert.equal(specialSession.isTradingDay, true);
});

test('reports exchange timezone and the next live transition', () => {
  const session = getMarketSession('2026-08-08T06:30:00.000Z');
  assert.equal(session.exchangeTimeZone, 'Asia/Kolkata');
  assert.equal(session.nextTransitionAt, '2026-08-10T03:45:00.000Z');
});
