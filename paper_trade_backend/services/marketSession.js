const EXCHANGE_TIME_ZONE = 'Asia/Kolkata';
const LIVE_OPEN_MINUTE = 9 * 60 + 15;
const LIVE_CLOSE_MINUTE = 15 * 60 + 30;
const PRE_OPEN_MINUTE = 9 * 60;

// NSE Capital Market holidays for calendar year 2026.
// Source: NSE circular NSE/CMTR/71775 (12 December 2025).
const NSE_HOLIDAYS_2026 = new Map([
  ['2026-01-26', 'Republic Day'],
  ['2026-03-03', 'Holi'],
  ['2026-03-26', 'Shri Ram Navami'],
  ['2026-03-31', 'Shri Mahavir Jayanti'],
  ['2026-04-03', 'Good Friday'],
  ['2026-04-14', 'Dr. Baba Saheb Ambedkar Jayanti'],
  ['2026-05-01', 'Maharashtra Day'],
  ['2026-05-28', 'Bakri Id'],
  ['2026-06-26', 'Muharram'],
  ['2026-09-14', 'Ganesh Chaturthi'],
  ['2026-10-02', 'Mahatma Gandhi Jayanti'],
  ['2026-10-20', 'Dussehra'],
  ['2026-11-10', 'Diwali-Balipratipada'],
  ['2026-11-24', 'Prakash Gurpurb Sri Guru Nanak Dev'],
  ['2026-12-25', 'Christmas'],
]);

// Official exceptional live session announced for the Union Budget.
const SPECIAL_TRADING_DAYS = new Set(['2026-02-01']);

const formatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: EXCHANGE_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

function getExchangeParts(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new TypeError('Invalid market-session timestamp');

  const parts = Object.fromEntries(
    formatter.formatToParts(date)
      .filter(part => part.type !== 'literal')
      .map(part => [part.type, part.value]),
  );

  const year = Number(parts.year);
  const month = Number(parts.month);
  const day = Number(parts.day);
  const hour = Number(parts.hour);
  const minute = Number(parts.minute);
  const second = Number(parts.second);

  return {
    year,
    month,
    day,
    hour,
    minute,
    second,
    weekday: parts.weekday,
    dateKey: `${parts.year}-${parts.month}-${parts.day}`,
    totalMinutes: hour * 60 + minute,
  };
}

function getConfiguredDates(envName) {
  return new Set(
    String(process.env[envName] || '')
      .split(',')
      .map(value => value.trim())
      .filter(value => /^\d{4}-\d{2}-\d{2}$/.test(value)),
  );
}

function isTradingDay(parts) {
  const specialDays = new Set([
    ...SPECIAL_TRADING_DAYS,
    ...getConfiguredDates('NSE_SPECIAL_TRADING_DAYS'),
  ]);
  if (specialDays.has(parts.dateKey)) return true;

  const isWeekend = parts.weekday === 'Sat' || parts.weekday === 'Sun';
  const extraHolidays = getConfiguredDates('NSE_HOLIDAYS');
  return !isWeekend && !NSE_HOLIDAYS_2026.has(parts.dateKey) && !extraHolidays.has(parts.dateKey);
}

function istLocalToUtcIso(year, month, day, hour, minute) {
  return new Date(Date.UTC(year, month - 1, day, hour - 5, minute - 30)).toISOString();
}

function addCalendarDays(parts, numberOfDays) {
  // Noon UTC always lands on the same calendar date in IST and avoids boundary ambiguity.
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + numberOfDays, 6, 30));
  return getExchangeParts(date);
}

function findNextTradingOpen(parts) {
  for (let offset = 1; offset <= 14; offset += 1) {
    const candidate = addCalendarDays(parts, offset);
    if (isTradingDay(candidate)) {
      return istLocalToUtcIso(candidate.year, candidate.month, candidate.day, 9, 15);
    }
  }
  return null;
}

function getMarketSession(value = new Date()) {
  const now = value instanceof Date ? value : new Date(value);
  const parts = getExchangeParts(now);
  const tradingDay = isTradingDay(parts);
  const isWeekend = parts.weekday === 'Sat' || parts.weekday === 'Sun';
  const holidayName = NSE_HOLIDAYS_2026.get(parts.dateKey) || null;

  let state;
  let label;
  let nextTransitionAt = null;

  if (!tradingDay) {
    state = holidayName ? 'HOLIDAY' : isWeekend ? 'WEEKEND' : 'HOLIDAY';
    label = holidayName ? `NSE holiday · ${holidayName}` : isWeekend ? 'NSE weekend' : 'NSE holiday';
    nextTransitionAt = findNextTradingOpen(parts);
  } else if (parts.totalMinutes < PRE_OPEN_MINUTE) {
    state = 'PRE_MARKET';
    label = 'Pre-market simulation';
    nextTransitionAt = istLocalToUtcIso(parts.year, parts.month, parts.day, 9, 15);
  } else if (parts.totalMinutes < LIVE_OPEN_MINUTE) {
    state = 'PRE_OPEN';
    label = 'NSE pre-open · simulation active';
    nextTransitionAt = istLocalToUtcIso(parts.year, parts.month, parts.day, 9, 15);
  } else if (parts.totalMinutes < LIVE_CLOSE_MINUTE) {
    state = 'LIVE';
    label = 'NSE normal market · live prices';
    nextTransitionAt = istLocalToUtcIso(parts.year, parts.month, parts.day, 15, 30);
  } else {
    state = 'POST_MARKET';
    label = 'Post-market simulation';
    nextTransitionAt = findNextTradingOpen(parts);
  }

  return {
    mode: state === 'LIVE' ? 'LIVE' : 'SIMULATED',
    state,
    label,
    isLiveTrading: state === 'LIVE',
    isTradingDay: tradingDay,
    exchangeTimeZone: EXCHANGE_TIME_ZONE,
    exchangeTime: `${parts.dateKey}T${String(parts.hour).padStart(2, '0')}:${String(parts.minute).padStart(2, '0')}:${String(parts.second).padStart(2, '0')}+05:30`,
    serverTime: now.toISOString(),
    dateKey: parts.dateKey,
    holidayName,
    nextTransitionAt,
    calendarVersion: 'NSE-CM-172-2025',
    holidayCalendarCovered: parts.year === 2026,
  };
}

module.exports = {
  EXCHANGE_TIME_ZONE,
  NSE_HOLIDAYS_2026,
  SPECIAL_TRADING_DAYS,
  getExchangeParts,
  getMarketSession,
  isTradingDay,
};
