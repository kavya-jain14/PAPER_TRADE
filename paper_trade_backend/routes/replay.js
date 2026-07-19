const express = require('express');
const router = express.Router();
const YahooFinance = require('yahoo-finance2').default;

const yahooFinance = new YahooFinance({
  suppressNotices: ['yahooSurvey', 'ripHistorical']
});

// ─────────────────────────────────────────────────────────────────────────────
// 🟢 ROUTE: Fetch Replay Data Chunk
// Fetches a massive chunk of historical data (e.g., 6 months back from target date)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/data/:symbol', async (req, res) => {
  try {
    let { symbol } = req.params;
    const { date, interval = '1d' } = req.query;

    if (!date) return res.status(400).json({ message: 'Target date required for replay.' });

    let yfSymbol = symbol;
    if (symbol === 'NIFTY 50') yfSymbol = '^NSEI';
    else if (symbol === 'SENSEX') yfSymbol = '^BSESN';
    else if (symbol === 'NIFTY BANK') yfSymbol = '^NSEBANK';
    else if (!symbol.includes('.NS') && !symbol.includes('^')) yfSymbol = `${symbol}.NS`;

    // Calculate dates
    const targetDate = new Date(date);
    
    // For 1D interval, we fetch 1 year BEFORE the target date (for historical context)
    // and up to 3 months AFTER the target date (the replay chunk)
    // For intraday (1h, 15m), YF limits us to max 60-730 days depending on interval.
    // We'll stick to 1D and 1h mostly.
    let period1Time = targetDate.getTime();
    let period2Time = targetDate.getTime();

    if (['1d', '1wk'].includes(interval)) {
      period1Time -= 365 * 24 * 60 * 60 * 1000; // 1 year back
      period2Time += 90 * 24 * 60 * 60 * 1000;  // 3 months forward
    } else {
      period1Time -= 60 * 24 * 60 * 60 * 1000;  // 60 days back (safe for 1h/15m)
      period2Time += 14 * 24 * 60 * 60 * 1000;  // 14 days forward
    }

    // Cap period2Time to strictly NOT exceed Date.now()
    if (period2Time > Date.now()) {
      period2Time = Date.now();
    }

    const queryOptions = {
      period1: new Date(period1Time),
      period2: new Date(period2Time),
      interval: interval,
    };

    const fetchWithTimeout = (timeoutMs) => {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Yahoo Finance request timed out')), timeoutMs)
      );
      return Promise.race([
        yahooFinance.chart(yfSymbol, queryOptions, { validateResult: false }),
        timeoutPromise,
      ]);
    };

    const result = await fetchWithTimeout(15000); // 15 second max for large queries

    if (!result || !result.quotes || result.quotes.length === 0) {
      return res.status(404).json({ message: 'No replay data available for this range.' });
    }

    const chartData = result.quotes
      .filter(c => c.close !== null && c.close !== undefined)
      .map(c => ({
        time: Math.floor(new Date(c.date).getTime() / 1000),
        open: Number(c.open?.toFixed(2) || c.close.toFixed(2)),
        high: Number(c.high?.toFixed(2) || c.close.toFixed(2)),
        low: Number(c.low?.toFixed(2) || c.close.toFixed(2)),
        close: Number(c.close.toFixed(2)),
        volume: c.volume || 0
      }));

    // Split data into two chunks:
    // 1. Initial State: All candles BEFORE the target date
    // 2. Replay Buffer: All candles ON or AFTER the target date
    const targetTimestamp = Math.floor(targetDate.getTime() / 1000);
    
    const initialState = chartData.filter(c => c.time < targetTimestamp);
    const replayBuffer = chartData.filter(c => c.time >= targetTimestamp);

    res.json({
      initialState,
      replayBuffer,
      message: `Loaded ${initialState.length} context candles and ${replayBuffer.length} replay candles.`
    });

  } catch (error) {
    console.error(`Replay Data Error for ${req.params.symbol}:`, error.message);
    res.status(500).json({ message: 'Replay fetch failed' });
  }
});

module.exports = router;
