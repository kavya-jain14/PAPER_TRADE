export const patternsData = [

  // ================= 📚 MARKET EDUCATION GUIDE =================
  {
    id: "how_to_study", title: "How to Study the Market", category: "Market Guide", type: "Education",
    desc: "Markets move in 4 phases: Accumulation (smart money buys quietly), Markup (price rises as public buys), Distribution (smart money exits), Markdown (price falls). Identifying which phase a stock is in is step 1 of any trade setup.",
    preTrendDir: -1,
    animationCandles: [
      { o: 0, c: 2, h: 8, l: -3 }, { o: 2, c: -1, h: 6, l: -4 }, { o: -1, c: 3, h: 7, l: -2 },
      { o: 3, c: 20, h: 25, l: 2 }, { o: 20, c: 35, h: 40, l: 18 }, { o: 35, c: 50, h: 55, l: 32 }
    ],
  },

  // ================= 🕯️ DOJI CANDLE FAMILY =================
  {
    id: "standard_doji", title: "Standard Doji", category: "Single Candle", type: "Indecision Signal",
    desc: "Open and close are almost identical, forming a cross or plus sign. Neither bulls nor bears won the session. A Doji after a strong trend is a WARNING — it signals that the trend is losing momentum and a reversal may be near.",
    preTrendDir: 1,
    animationCandles: [ { o: 0, c: 0, h: 20, l: -20 } ],
  },
  {
    id: "gravestone_doji", title: "Gravestone Doji", category: "Single Candle", type: "Bearish Reversal",
    desc: "Open, close, and low are all the same — forming a long upper wick. Buyers pushed the price up dramatically during the session, but sellers completely crushed them, closing at the open. A powerful TOP reversal signal.",
    preTrendDir: 1,
    animationCandles: [ { o: 0, c: 0, h: 40, l: -2 } ],
  },
  {
    id: "longlegged_doji", title: "Long-Legged Doji", category: "Single Candle", type: "High Volatility Signal",
    desc: "Very long upper AND lower wicks with an almost equal open/close. Extreme tug-of-war between bulls and bears. When this appears after a major trend, a big move is loading — the market is deciding its next direction.",
    preTrendDir: 1,
    animationCandles: [ { o: 0, c: 1, h: 40, l: -40 } ],
  },
  {
    id: "spinning_top", title: "Spinning Top", category: "Single Candle", type: "Indecision Warning",
    desc: "A small real body with upper and lower wicks of roughly equal length. Similar to a Doji but with a visible body. It shows that while a direction was decided (small body), neither side fully committed. Context is everything — bearish at a top, bullish at a bottom.",
    preTrendDir: 1,
    animationCandles: [ { o: 0, c: 5, h: 20, l: -20 } ],
  },

  // ================= 🟢 SINGLE CANDLE BULLISH =================
  {
    id: "hammer", title: "The Hammer", category: "Single Candle", type: "Bullish Reversal",
    desc: "Found at the bottom of a downtrend. It has a small body and a long lower wick, indicating buyers are rejecting lower prices.",
    preTrendDir: -1,
    animationCandles: [ { o: 0, c: 8, h: 12, l: -35 } ],
  },
  {
    id: "inverted_hammer", title: "Inverted Hammer", category: "Single Candle", type: "Bullish Reversal",
    desc: "Appears at the bottom of a downtrend. Long upper wick shows buyers tried to push prices up, indicating potential trend change.",
    preTrendDir: -1,
    animationCandles: [ { o: 0, c: 8, h: 35, l: -5 } ],
  },
  {
    id: "dragonfly_doji", title: "Dragonfly Doji", category: "Single Candle", type: "Bullish Reversal",
    desc: "Open, close, and high are the same, creating a long lower wick. Looks like a 'T'. Massive rejection of lower prices.",
    preTrendDir: -1,
    animationCandles: [ { o: 0, c: 0, h: 2, l: -40 } ],
  },
  {
    id: "bullish_belt_hold", title: "Bullish Belt Hold", category: "Single Candle", type: "Bullish Reversal",
    desc: "Opens with a gap down but immediately rallies to close as a massive green candle with no lower wick. Shows absolute dominance by buyers.",
    preTrendDir: -1,
    animationCandles: [ { o: -15, c: 35, h: 40, l: -15 } ],
  },

  // ================= 🟢 DOUBLE CANDLE BULLISH =================
  {
    id: "bullish_engulfing", title: "Bullish Engulfing", category: "Double Candle", type: "Strong Bullish",
    desc: "A small red candle is completely 'engulfed' by a large green candle. Shows massive buying pressure overturning sellers.",
    preTrendDir: -1,
    animationCandles: [ { o: 0, c: -12, h: 5, l: -18 }, { o: -18, c: 15, h: 20, l: -22 } ],
  },
  {
    id: "piercing_line", title: "Piercing Pattern", category: "Double Candle", type: "Bullish Reversal",
    desc: "Green candle opens below the previous red candle's low, but closes above its midpoint.",
    preTrendDir: -1,
    animationCandles: [ { o: 0, c: -30, h: 5, l: -35 }, { o: -40, c: -10, h: -5, l: -45 } ],
  },
  {
    id: "bullish_harami", title: "Bullish Harami", category: "Double Candle", type: "Reversal Warning",
    desc: "A large red candle followed by a small green 'inside' candle. Signals the downtrend is losing breath.",
    preTrendDir: -1,
    animationCandles: [ { o: 0, c: -40, h: 5, l: -45 }, { o: -25, c: -15, h: -10, l: -30 } ],
  },
  {
    id: "bullish_kicker", title: "Bullish Kicker", category: "Double Candle", type: "Aggressive Bullish",
    desc: "A massive gap-up reversal. Green candle opens completely above the previous red candle's high.",
    preTrendDir: -1,
    animationCandles: [ { o: 0, c: -20, h: 0, l: -20 }, { o: 10, c: 35, h: 35, l: 10 } ],
  },

  // ================= 🟢 TRIPLE+ CANDLE BULLISH =================
  {
    id: "morning_star", title: "Morning Star", category: "Triple Candle", type: "Major Reversal",
    desc: "Long red, short body gapping down, and a long green pushing into the first candle's body.",
    preTrendDir: -1,
    animationCandles: [ { o: 0, c: -25, h: 5, l: -30 }, { o: -30, c: -28, h: -20, l: -40 }, { o: -30, c: 5, h: 10, l: -35 } ],
  },
  {
    id: "three_white_soldiers", title: "Three White Soldiers", category: "Triple Candle", type: "Strong Bullish",
    desc: "Three consecutive long-bodied green candles closing higher. A very reliable signal of strong buying.",
    preTrendDir: -1,
    animationCandles: [ { o: 0, c: 15, h: 20, l: -5 }, { o: 10, c: 25, h: 30, l: 5 }, { o: 20, c: 35, h: 40, l: 15 } ],
  },
  {
    id: "bullish_abandoned_baby", title: "Bullish Abandoned Baby", category: "Triple Candle", type: "Rare Reversal",
    desc: "A Doji gaps below the prior red candle, and the next green candle gaps back up. The Doji is completely isolated (abandoned).",
    preTrendDir: -1,
    animationCandles: [ { o: 0, c: -20, h: 0, l: -20 }, { o: -30, c: -30, h: -28, l: -32 }, { o: -10, c: 10, h: 10, l: -10 } ],
  },
  {
    id: "three_inside_up", title: "Three Inside Up", category: "Triple Candle", type: "Bullish Confirmation",
    desc: "Starts with a Bullish Harami, followed by a third green candle that closes above the first red candle's high.",
    preTrendDir: -1,
    animationCandles: [ { o: 0, c: -30, h: 5, l: -35 }, { o: -25, c: -10, h: -5, l: -30 }, { o: -10, c: 10, h: 15, l: -15 } ],
  },
  {
    id: "three_line_strike", title: "Three Line Strike (Bullish)", category: "Complex Pattern", type: "Continuation",
    desc: "Three consecutive green candles, followed by a massive red 'strike' candle that opens higher but closes below the first green candle's open. Often a fake-out before continuing higher.",
    preTrendDir: 1,
    animationCandles: [ { o: 0, c: 15, h: 20, l: 0 }, { o: 15, c: 30, h: 35, l: 15 }, { o: 30, c: 45, h: 50, l: 30 }, { o: 50, c: -5, h: 55, l: -10 } ],
  },

  // ================= 🔴 SINGLE CANDLE BEARISH =================
  {
    id: "shooting_star", title: "Shooting Star", category: "Single Candle", type: "Bearish Reversal",
    desc: "Appears at the top of an uptrend. Long upper wick shows sellers aggressively rejected higher prices.",
    preTrendDir: 1,
    animationCandles: [ { o: 0, c: -8, h: 35, l: -12 } ],
  },
  {
    id: "hanging_man", title: "Hanging Man", category: "Single Candle", type: "Trend Warning",
    desc: "Looks like a Hammer but occurs at the TOP of an uptrend. Long lower wick shows heavy intraday selling pressure.",
    preTrendDir: 1,
    animationCandles: [ { o: 0, c: -5, h: 5, l: -35 } ],
  },
  {
    id: "bearish_belt_hold", title: "Bearish Belt Hold", category: "Single Candle", type: "Bearish Reversal",
    desc: "Opens with a gap up in an uptrend, but immediately crashes to close as a massive red candle with no upper wick.",
    preTrendDir: 1,
    animationCandles: [ { o: 15, c: -35, h: 15, l: -40 } ],
  },

  // ================= 🔴 DOUBLE CANDLE BEARISH =================
  {
    id: "bearish_engulfing", title: "Bearish Engulfing", category: "Double Candle", type: "Strong Bearish",
    desc: "Small green candle is completely engulfed by a large red candle. Bears have taken total control.",
    preTrendDir: 1,
    animationCandles: [ { o: 0, c: 12, h: 18, l: -5 }, { o: 15, c: -20, h: 22, l: -25 } ],
  },
  {
    id: "dark_cloud_cover", title: "Dark Cloud Cover", category: "Double Candle", type: "Bearish Reversal",
    desc: "Red candle opens higher but closes more than halfway down the body of the previous green candle.",
    preTrendDir: 1,
    animationCandles: [ { o: 0, c: 30, h: 35, l: -5 }, { o: 40, c: 10, h: 45, l: 5 } ],
  },
  {
    id: "tweezer_top", title: "Tweezer Top", category: "Double Candle", type: "Resistance Confirmed",
    desc: "Two consecutive candles that hit the exact same high price, creating a flat upper resistance level.",
    preTrendDir: 1,
    animationCandles: [ { o: 0, c: 20, h: 30, l: -5 }, { o: 20, c: -5, h: 30, l: -10 } ],
  },
  {
    id: "bearish_kicker", title: "Bearish Kicker", category: "Double Candle", type: "Aggressive Bearish",
    desc: "Massive gap-down reversal. Red candle opens completely below the previous green candle's low.",
    preTrendDir: 1,
    animationCandles: [ { o: 0, c: 20, h: 25, l: -5 }, { o: -10, c: -35, h: -10, l: -40 } ],
  },

  // ================= 🔴 TRIPLE+ CANDLE BEARISH =================
  {
    id: "three_black_crows", title: "Three Black Crows", category: "Triple Candle", type: "Heavy Bearish",
    desc: "Three consecutive long-bodied red candles. Pure panic selling indicator.",
    preTrendDir: 1,
    animationCandles: [ { o: 0, c: -15, h: 5, l: -20 }, { o: -10, c: -30, h: -5, l: -35 }, { o: -25, c: -45, h: -20, l: -50 } ],
  },
  {
    id: "evening_star", title: "Evening Star", category: "Triple Candle", type: "Major Reversal",
    desc: "Long green, small star gapping up, followed by a long red candle crashing down.",
    preTrendDir: 1,
    animationCandles: [ { o: 0, c: 25, h: 30, l: -5 }, { o: 30, c: 28, h: 40, l: 20 }, { o: 30, c: -5, h: 35, l: -10 } ],
  },
  {
    id: "bearish_abandoned_baby", title: "Bearish Abandoned Baby", category: "Triple Candle", type: "Rare Reversal",
    desc: "A Doji gaps above the prior green candle, and the next red candle gaps back down. Doji is isolated.",
    preTrendDir: 1,
    animationCandles: [ { o: 0, c: 20, h: 25, l: -5 }, { o: 30, c: 30, h: 35, l: 25 }, { o: 10, c: -10, h: 15, l: -15 } ],
  }
  // ================= 📈 CHART PATTERNS (MACRO STRUCTURES) =================
  ,{
    id: "head_and_shoulders", title: "Head & Shoulders", category: "Chart Pattern", type: "Trend Reversal",
    desc: "A baseline with three peaks, where the outside two are close in height and the middle is highest. A classic sign of a major bullish-to-bearish reversal.",
    preTrendDir: 1,
    animationCandles: [ 
      { o: 0, c: 15, h: 20, l: -5 },   // Left Shoulder Up
      { o: 15, c: -10, h: 18, l: -15 }, // Left Shoulder Down (Neckline)
      { o: -10, c: 30, h: 35, l: -15 }, // Head Up
      { o: 30, c: -30, h: 32, l: -35 }, // Head Down (Neckline)
      { o: -30, c: 12, h: 15, l: -35 }, // Right Shoulder Up
      { o: 12, c: -25, h: 15, l: -30 }  // Right Shoulder Breakdown
    ],
  },
  {
    id: "inverse_head_and_shoulders", title: "Inverse Head & Shoulders", category: "Chart Pattern", type: "Bullish Reversal",
    desc: "The exact opposite of Head & Shoulders. Three bottoms where the middle is the lowest. Signals the end of a long downtrend.",
    preTrendDir: -1,
    animationCandles: [ 
      { o: 0, c: -15, h: 5, l: -20 },   // Left Shoulder Down
      { o: -15, c: 10, h: 15, l: -18 }, // Left Shoulder Up (Neckline)
      { o: 10, c: -30, h: 15, l: -35 }, // Head Down
      { o: -30, c: 30, h: 35, l: -32 }, // Head Up (Neckline)
      { o: 30, c: -12, h: 35, l: -15 }, // Right Shoulder Down
      { o: -12, c: 25, h: 30, l: -15 }  // Right Shoulder Breakout
    ],
  },
  {
    id: "double_top", title: "Double Top (M Pattern)", category: "Chart Pattern", type: "Bearish Reversal",
    desc: "Looks like the letter 'M'. The price peaks, pulls back, rallies to the exact same peak, and then breaks down the neckline.",
    preTrendDir: 1,
    animationCandles: [ 
      { o: 0, c: 25, h: 30, l: -5 },   // First Top
      { o: 25, c: -15, h: 28, l: -20 }, // Pullback (Neckline)
      { o: -15, c: 15, h: 20, l: -18 }, // Second Top
      { o: 15, c: -30, h: 18, l: -35 }  // Breakdown
    ],
  },
  {
    id: "double_bottom", title: "Double Bottom (W Pattern)", category: "Chart Pattern", type: "Bullish Reversal",
    desc: "Looks like the letter 'W'. The price drops, rebounds, drops to the exact same support level, then breaks out upwards.",
    preTrendDir: -1,
    animationCandles: [ 
      { o: 0, c: -25, h: 5, l: -30 },   // First Bottom
      { o: -25, c: 15, h: 20, l: -28 }, // Pullback (Neckline)
      { o: 15, c: -15, h: 18, l: -20 }, // Second Bottom
      { o: -15, c: 35, h: 40, l: -20 }  // Breakout
    ],
  },
  {
    id: "bull_flag", title: "Bull Flag", category: "Chart Pattern", type: "Bullish Continuation",
    desc: "A steep vertical rally (the flagpole) followed by a tight, downward-sloping consolidation channel (the flag). Breakout leads to another vertical leg.",
    preTrendDir: 1, // Pretrend creates the pole
    animationCandles: [ 
      { o: 0, c: -5, h: 2, l: -8 },   // Flag consolidation 1
      { o: -5, c: -4, h: 2, l: -6 },  // Flag consolidation 2
      { o: -4, c: -5, h: 1, l: -8 },  // Flag consolidation 3
      { o: -5, c: 35, h: 40, l: -5 }  // Flag Breakout (Next leg up)
    ],
  }
];