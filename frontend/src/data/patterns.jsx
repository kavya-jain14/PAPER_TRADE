import React from 'react';

export const patternsData = [

  // ================= 📚 MARKET EDUCATION GUIDE =================
  {
    id: "how_to_study", title: "How to Study the Market", category: "Market Guide", type: "Education",
    color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20",
    desc: "Markets move in 4 phases: Accumulation (smart money buys quietly), Markup (price rises as public buys), Distribution (smart money exits), Markdown (price falls). Identifying which phase a stock is in is step 1 of any trade setup.",
    caseStudy: "Phase 1 (Accumulation): SBIN sideways ₹480-500 for 2 months.\nPhase 2 (Markup): Volume surge + price breaks ₹500, rockets to ₹620.\nPhase 3 (Distribution): Price stalls near ₹620 with high volume but no new highs.\nPhase 4 (Markdown): FII selling triggers breakdown, stock falls to ₹540.",
    exampleStock: "SBIN", exampleDate: "2023-08-01", preTrendDir: -1,
    animationCandles: [
      { o: 0, c: 2, h: 8, l: -3 }, { o: 2, c: -1, h: 6, l: -4 }, { o: -1, c: 3, h: 7, l: -2 },
      { o: 3, c: 20, h: 25, l: 2 }, { o: 20, c: 35, h: 40, l: 18 }, { o: 35, c: 50, h: 55, l: 32 }
    ],
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
        <text x="50" y="45" textAnchor="middle" fontSize="32" fill="#60a5fa">📖</text>
        <text x="50" y="70" textAnchor="middle" fontSize="10" fill="#60a5fa" fontWeight="bold">LEARN</text>
      </svg>
    )
  },

  // ================= 🕯️ DOJI CANDLE FAMILY =================
  {
    id: "standard_doji", title: "Standard Doji", category: "Single Candle", type: "Indecision Signal",
    color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20",
    desc: "Open and close are almost identical, forming a cross or plus sign. Neither bulls nor bears won the session. A Doji after a strong trend is a WARNING — it signals that the trend is losing momentum and a reversal may be near.",
    caseStudy: "📈 Before: RELIANCE was in a strong uptrend reaching ₹2900.\n📊 Instance: 15 Jan 2024. Opened and closed at almost the exact same price ₹2895, with wicks both ways.\n⚠️ After: Doji appeared at resistance — price consolidated and then reversed to ₹2750 within 10 days.",
    exampleStock: "RELIANCE", exampleDate: "2024-01-15", preTrendDir: 1,
    animationCandles: [ { o: 0, c: 0, h: 20, l: -20 } ],
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]">
        <line x1="50" y1="10" x2="50" y2="90" stroke="#eab308" strokeWidth="4" strokeLinecap="round" />
        <line x1="30" y1="50" x2="70" y2="50" stroke="#eab308" strokeWidth="6" strokeLinecap="round" />
      </svg>
    )
  },
  {
    id: "gravestone_doji", title: "Gravestone Doji", category: "Single Candle", type: "Bearish Reversal",
    color: "text-[#ff3b30]", bg: "bg-[#ff3b30]/10", border: "border-[#ff3b30]/20",
    desc: "Open, close, and low are all the same — forming a long upper wick. Buyers pushed the price up dramatically during the session, but sellers completely crushed them, closing at the open. A powerful TOP reversal signal.",
    caseStudy: "📈 Before: TCS was running up towards ₹4000 in a strong rally.\n📊 Instance: 7 Feb 2024. Opened at ₹3960, hit ₹4050 intraday, but institutional selling hammered it shut at ₹3962.\n📉 After: 'Gravestone' marked the top. Correction to ₹3750 followed (-5%).",
    exampleStock: "TCS", exampleDate: "2024-02-07", preTrendDir: 1,
    animationCandles: [ { o: 0, c: 0, h: 40, l: -2 } ],
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_8px_rgba(255,59,48,0.4)]">
        <line x1="50" y1="10" x2="50" y2="90" stroke="#ff3b30" strokeWidth="4" strokeLinecap="round" />
        <line x1="35" y1="90" x2="65" y2="90" stroke="#ff3b30" strokeWidth="6" strokeLinecap="round" />
      </svg>
    )
  },
  {
    id: "longlegged_doji", title: "Long-Legged Doji", category: "Single Candle", type: "High Volatility Signal",
    color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20",
    desc: "Very long upper AND lower wicks with an almost equal open/close. Extreme tug-of-war between bulls and bears. When this appears after a major trend, a big move is loading — the market is deciding its next direction.",
    caseStudy: "📊 Instance: ZOMATO on key results day. Swung from ₹140 low to ₹165 high intraday but closed at ₹152.\n⚠️ Signal: Extreme indecision. Next 3 candles determine direction. A break of the wick high = bullish, break of wick low = bearish.",
    exampleStock: "ZOMATO", exampleDate: "2024-02-14", preTrendDir: 1,
    animationCandles: [ { o: 0, c: 1, h: 40, l: -40 } ],
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_8px_rgba(234,179,8,0.3)]">
        <line x1="50" y1="5" x2="50" y2="95" stroke="#eab308" strokeWidth="4" strokeLinecap="round" />
        <line x1="32" y1="50" x2="68" y2="50" stroke="#eab308" strokeWidth="6" strokeLinecap="round" />
      </svg>
    )
  },
  {
    id: "spinning_top", title: "Spinning Top", category: "Single Candle", type: "Indecision Warning",
    color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20",
    desc: "A small real body with upper and lower wicks of roughly equal length. Similar to a Doji but with a visible body. It shows that while a direction was decided (small body), neither side fully committed. Context is everything — bearish at a top, bullish at a bottom.",
    caseStudy: "📈 Before: HDFCBANK was in a 3-week uptrend.\n📊 Instance: 5 March 2024. Small green body, equal wicks — market indecision.\n📉 After: Located at a key resistance, it preceded a 6% pullback.",
    exampleStock: "HDFCBANK", exampleDate: "2024-03-05", preTrendDir: 1,
    animationCandles: [ { o: 0, c: 5, h: 20, l: -20 } ],
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <line x1="50" y1="10" x2="50" y2="90" stroke="#eab308" strokeWidth="4" strokeLinecap="round" />
        <rect x="40" y="42" width="20" height="16" fill="#eab308" rx="3" />
      </svg>
    )
  },

  // ================= 🟢 SINGLE CANDLE BULLISH =================
  {
    id: "hammer", title: "The Hammer", category: "Single Candle", type: "Bullish Reversal",
    color: "text-[#FFFFFF]", bg: "bg-[#FFFFFF]/10", border: "border-[#FFFFFF]/20",
    desc: "Found at the bottom of a downtrend. It has a small body and a long lower wick, indicating buyers are rejecting lower prices.",
    caseStudy: "📉 Before: RELIANCE was falling from ₹2350 to ₹2220.\n📊 Instance: Formed on 26 Oct 2023 at support level.\n📈 After: Massive buying triggered, stock rallied to ₹2600 (+17%) within 4 weeks.",
    exampleStock: "RELIANCE", exampleDate: "2023-10-26", preTrendDir: -1,
    animationCandles: [ { o: 0, c: 8, h: 12, l: -35 } ],
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
        <line x1="50" y1="20" x2="50" y2="90" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
        <rect x="40" y="20" width="20" height="25" fill="#FFFFFF" rx="4" />
      </svg>
    )
  },
  {
    id: "inverted_hammer", title: "Inverted Hammer", category: "Single Candle", type: "Bullish Reversal",
    color: "text-[#FFFFFF]", bg: "bg-[#FFFFFF]/10", border: "border-[#FFFFFF]/20",
    desc: "Appears at the bottom of a downtrend. Long upper wick shows buyers tried to push prices up, indicating potential trend change.",
    caseStudy: "📉 Before: TATAMOTORS dropped from ₹1050 to ₹950.\n📊 Instance: Formed on 12 Dec 2023. Bears couldn't close it near the lows.\n📈 After: Trend reversed, stock pushed back to ₹1100 (+15%).",
    exampleStock: "TATAMOTORS", exampleDate: "2023-12-12", preTrendDir: -1,
    animationCandles: [ { o: 0, c: 8, h: 35, l: -5 } ],
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
        <line x1="50" y1="20" x2="50" y2="80" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
        <rect x="40" y="65" width="20" height="15" fill="#FFFFFF" rx="4" />
      </svg>
    )
  },
  {
    id: "dragonfly_doji", title: "Dragonfly Doji", category: "Single Candle", type: "Bullish Reversal",
    color: "text-[#FFFFFF]", bg: "bg-[#FFFFFF]/10", border: "border-[#FFFFFF]/20",
    desc: "Open, close, and high are the same, creating a long lower wick. Looks like a 'T'. Massive rejection of lower prices.",
    caseStudy: "📉 Before: ICICIBANK dropped sharply from ₹1050 to ₹980 due to panic.\n📊 Instance: 24 Jan 2024. Sellers pushed it to ₹950, but aggressive buyers recovered everything.\n📈 After: V-shape recovery to ₹1100 (+12%).",
    exampleStock: "ICICIBANK", exampleDate: "2024-01-24", preTrendDir: -1,
    animationCandles: [ { o: 0, c: 0, h: 2, l: -40 } ],
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">
        <line x1="50" y1="15" x2="50" y2="85" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
        <line x1="35" y1="15" x2="65" y2="15" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" />
      </svg>
    )
  },
  {
    id: "bullish_belt_hold", title: "Bullish Belt Hold", category: "Single Candle", type: "Bullish Reversal",
    color: "text-[#FFFFFF]", bg: "bg-[#FFFFFF]/10", border: "border-[#FFFFFF]/20",
    desc: "Opens with a gap down but immediately rallies to close as a massive green candle with no lower wick. Shows absolute dominance by buyers.",
    caseStudy: "📉 Before: HINDALCO corrected from ₹620 to ₹550.\n📊 Instance: Formed 18 Aug 2023. Opened gap down at ₹540 but never looked back.\n📈 After: Rallied vertically to ₹640 (+16%).",
    exampleStock: "HINDALCO", exampleDate: "2023-08-18", preTrendDir: -1,
    animationCandles: [ { o: -15, c: 35, h: 40, l: -15 } ],
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <line x1="50" y1="10" x2="50" y2="90" stroke="#FFFFFF" strokeWidth="4" />
        <rect x="40" y="20" width="20" height="70" fill="#FFFFFF" rx="2" />
      </svg>
    )
  },

  // ================= 🟢 DOUBLE CANDLE BULLISH =================
  {
    id: "bullish_engulfing", title: "Bullish Engulfing", category: "Double Candle", type: "Strong Bullish",
    color: "text-[#FFFFFF]", bg: "bg-[#FFFFFF]/10", border: "border-[#FFFFFF]/20",
    desc: "A small red candle is completely 'engulfed' by a large green candle. Shows massive buying pressure overturning sellers.",
    caseStudy: "📉 Before: HDFCBANK was struggling, dropping from ₹1530 to ₹1460.\n📊 Instance: 28 Nov 2023, completely swallowing previous day's red candle.\n📈 After: Trend reversed sharply, hitting ₹1700 (+16%).",
    exampleStock: "HDFCBANK", exampleDate: "2023-11-28", preTrendDir: -1,
    animationCandles: [ { o: 0, c: -12, h: 5, l: -18 }, { o: -18, c: 15, h: 20, l: -22 } ],
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <line x1="30" y1="40" x2="30" y2="70" stroke="#ff3b30" strokeWidth="4" />
        <rect x="22" y="45" width="16" height="20" fill="#ff3b30" rx="2" />
        <line x1="70" y1="20" x2="70" y2="90" stroke="#FFFFFF" strokeWidth="4" />
        <rect x="62" y="25" width="16" height="60" fill="#FFFFFF" rx="2" />
      </svg>
    )
  },
  {
    id: "piercing_line", title: "Piercing Pattern", category: "Double Candle", type: "Bullish Reversal",
    color: "text-[#FFFFFF]", bg: "bg-[#FFFFFF]/10", border: "border-[#FFFFFF]/20",
    desc: "Green candle opens below the previous red candle's low, but closes above its midpoint.",
    caseStudy: "📉 Before: INFY corrected heavily from ₹1600 to ₹1360.\n📊 Instance: 18 April 2024. Gap down open trapped bears, followed by recovery.\n📈 After: Recovered to ₹1500 (+10%) in 8 sessions.",
    exampleStock: "INFY", exampleDate: "2024-04-18", preTrendDir: -1,
    animationCandles: [ { o: 0, c: -30, h: 5, l: -35 }, { o: -40, c: -10, h: -5, l: -45 } ],
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <line x1="30" y1="10" x2="30" y2="80" stroke="#ff3b30" strokeWidth="4" />
        <rect x="22" y="15" width="16" height="60" fill="#ff3b30" rx="2" />
        <line x1="70" y1="30" x2="70" y2="90" stroke="#FFFFFF" strokeWidth="4" />
        <rect x="62" y="40" width="16" height="45" fill="#FFFFFF" rx="2" />
      </svg>
    )
  },
  {
    id: "bullish_harami", title: "Bullish Harami", category: "Double Candle", type: "Reversal Warning",
    color: "text-[#FFFFFF]", bg: "bg-[#FFFFFF]/10", border: "border-[#FFFFFF]/20",
    desc: "A large red candle followed by a small green 'inside' candle. Signals the downtrend is losing breath.",
    caseStudy: "📉 Before: WIPRO fell continuously from ₹520 to ₹450.\n📊 Instance: 1 Nov 2023. Selling dried up completely forming an inside day.\n📈 After: Slow climb back to ₹530 (+17%).",
    exampleStock: "WIPRO", exampleDate: "2023-11-01", preTrendDir: -1,
    animationCandles: [ { o: 0, c: -40, h: 5, l: -45 }, { o: -25, c: -15, h: -10, l: -30 } ],
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <line x1="30" y1="10" x2="30" y2="90" stroke="#ff3b30" strokeWidth="4" />
        <rect x="22" y="20" width="16" height="60" fill="#ff3b30" rx="2" />
        <line x1="70" y1="40" x2="70" y2="60" stroke="#FFFFFF" strokeWidth="4" />
        <rect x="62" y="45" width="16" height="10" fill="#FFFFFF" rx="2" />
      </svg>
    )
  },
  {
    id: "bullish_kicker", title: "Bullish Kicker", category: "Double Candle", type: "Aggressive Bullish",
    color: "text-[#FFFFFF]", bg: "bg-[#FFFFFF]/10", border: "border-[#FFFFFF]/20",
    desc: "A massive gap-up reversal. Green candle opens completely above the previous red candle's high.",
    caseStudy: "📉 Before: SBIN was dragging lower towards ₹550.\n📊 Instance: 16 May 2023. Massive earnings gap up trapped all short sellers instantly.\n📈 After: Vertical run to ₹620 (+12%) in 3 days.",
    exampleStock: "SBIN", exampleDate: "2023-05-16", preTrendDir: -1,
    animationCandles: [ { o: 0, c: -20, h: 0, l: -20 }, { o: 10, c: 35, h: 35, l: 10 } ],
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <rect x="22" y="55" width="16" height="30" fill="#ff3b30" rx="2" />
        <rect x="62" y="15" width="16" height="35" fill="#FFFFFF" rx="2" />
      </svg>
    )
  },

  // ================= 🟢 TRIPLE+ CANDLE BULLISH =================
  {
    id: "morning_star", title: "Morning Star", category: "Triple Candle", type: "Major Reversal",
    color: "text-[#FFFFFF]", bg: "bg-[#FFFFFF]/10", border: "border-[#FFFFFF]/20",
    desc: "Long red, short body gapping down, and a long green pushing into the first candle's body.",
    caseStudy: "📉 Before: ZOMATO was correcting from ₹140 to ₹115.\n📊 Instance: 20 March 2024. The 'star' showed indecision, green confirmed bulls.\n📈 After: Stock exploded to ₹190 (+65%).",
    exampleStock: "ZOMATO", exampleDate: "2024-03-20", preTrendDir: -1,
    animationCandles: [ { o: 0, c: -25, h: 5, l: -30 }, { o: -30, c: -28, h: -20, l: -40 }, { o: -30, c: 5, h: 10, l: -35 } ],
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <rect x="15" y="20" width="16" height="40" fill="#ff3b30" rx="2" />
        <rect x="42" y="65" width="16" height="10" fill="#bbcbb2" rx="2" />
        <rect x="69" y="30" width="16" height="35" fill="#FFFFFF" rx="2" />
      </svg>
    )
  },
  {
    id: "three_white_soldiers", title: "Three White Soldiers", category: "Triple Candle", type: "Strong Bullish",
    color: "text-[#FFFFFF]", bg: "bg-[#FFFFFF]/10", border: "border-[#FFFFFF]/20",
    desc: "Three consecutive long-bodied green candles closing higher. A very reliable signal of strong buying.",
    caseStudy: "📉 Before: TATASTEEL was consolidating sideways around ₹115.\n📊 Instance: 2-4 Nov 2023. Three back-to-back strong daily closes.\n📈 After: Multi-month breakout reaching ₹155 (+34%).",
    exampleStock: "TATASTEEL", exampleDate: "2023-11-04", preTrendDir: -1,
    animationCandles: [ { o: 0, c: 15, h: 20, l: -5 }, { o: 10, c: 25, h: 30, l: 5 }, { o: 20, c: 35, h: 40, l: 15 } ],
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <rect x="15" y="60" width="16" height="30" fill="#FFFFFF" rx="2" />
        <rect x="42" y="40" width="16" height="30" fill="#FFFFFF" rx="2" />
        <rect x="69" y="20" width="16" height="30" fill="#FFFFFF" rx="2" />
      </svg>
    )
  },
  {
    id: "bullish_abandoned_baby", title: "Bullish Abandoned Baby", category: "Triple Candle", type: "Rare Reversal",
    color: "text-[#FFFFFF]", bg: "bg-[#FFFFFF]/10", border: "border-[#FFFFFF]/20",
    desc: "A Doji gaps below the prior red candle, and the next green candle gaps back up. The Doji is completely isolated (abandoned).",
    caseStudy: "📉 Before: AXISBANK crashed from ₹1000 to ₹930.\n📊 Instance: 26 Oct 2023. Gap down Doji trapped late shorts, followed by an aggressive gap up.\n📈 After: Direct rally to ₹1100 (+18%).",
    exampleStock: "AXISBANK", exampleDate: "2023-10-26", preTrendDir: -1,
    animationCandles: [ { o: 0, c: -20, h: 0, l: -20 }, { o: -30, c: -30, h: -28, l: -32 }, { o: -10, c: 10, h: 10, l: -10 } ],
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <rect x="15" y="20" width="16" height="30" fill="#ff3b30" rx="2" />
        <rect x="42" y="70" width="16" height="4" fill="#bbcbb2" rx="2" />
        <rect x="69" y="20" width="16" height="30" fill="#FFFFFF" rx="2" />
      </svg>
    )
  },
  {
    id: "three_inside_up", title: "Three Inside Up", category: "Triple Candle", type: "Bullish Confirmation",
    color: "text-[#FFFFFF]", bg: "bg-[#FFFFFF]/10", border: "border-[#FFFFFF]/20",
    desc: "Starts with a Bullish Harami, followed by a third green candle that closes above the first red candle's high.",
    caseStudy: "📉 Before: JSWSTEEL was trending down to ₹730.\n📊 Instance: 15 Mar 2024. Harami paused the selling, and the 3rd candle broke out, confirming the reversal.\n📈 After: Stock pushed into a new uptrend to ₹880 (+20%).",
    exampleStock: "JSWSTEEL", exampleDate: "2024-03-15", preTrendDir: -1,
    animationCandles: [ { o: 0, c: -30, h: 5, l: -35 }, { o: -25, c: -10, h: -5, l: -30 }, { o: -10, c: 10, h: 15, l: -15 } ],
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <rect x="15" y="30" width="16" height="50" fill="#ff3b30" rx="2" />
        <rect x="42" y="50" width="16" height="20" fill="#FFFFFF" rx="2" />
        <rect x="69" y="15" width="16" height="55" fill="#FFFFFF" rx="2" />
      </svg>
    )
  },
  {
    id: "three_line_strike", title: "Three Line Strike (Bullish)", category: "Complex Pattern", type: "Continuation",
    color: "text-[#FFFFFF]", bg: "bg-[#FFFFFF]/10", border: "border-[#FFFFFF]/20",
    desc: "Three consecutive green candles, followed by a massive red 'strike' candle that opens higher but closes below the first green candle's open. Often a fake-out before continuing higher.",
    caseStudy: "📉 Before: HAL was rallying strong to ₹2800.\n📊 Instance: 10 Jan 2024. A sudden red wash-out candle wiped 3 days of gains, shaking out weak hands.\n📈 After: Buyers immediately stepped back in, taking it to ₹3400 (+21%).",
    exampleStock: "HAL", exampleDate: "2024-01-10", preTrendDir: 1,
    animationCandles: [ { o: 0, c: 15, h: 20, l: 0 }, { o: 15, c: 30, h: 35, l: 15 }, { o: 30, c: 45, h: 50, l: 30 }, { o: 50, c: -5, h: 55, l: -10 } ],
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <rect x="10" y="60" width="12" height="20" fill="#FFFFFF" rx="1" />
        <rect x="30" y="40" width="12" height="20" fill="#FFFFFF" rx="1" />
        <rect x="50" y="20" width="12" height="20" fill="#FFFFFF" rx="1" />
        <rect x="75" y="15" width="14" height="70" fill="#ff3b30" rx="1" />
      </svg>
    )
  },

  // ================= 🔴 SINGLE CANDLE BEARISH =================
  {
    id: "shooting_star", title: "Shooting Star", category: "Single Candle", type: "Bearish Reversal",
    color: "text-[#ff3b30]", bg: "bg-[#ff3b30]/10", border: "border-[#ff3b30]/20",
    desc: "Appears at the top of an uptrend. Long upper wick shows sellers aggressively rejected higher prices.",
    caseStudy: "📈 Before: TCS rallied to ₹4150 prior to earnings.\n📊 Instance: 9 Feb 2024. Hit a new high but collapsed intraday as smart money booked profits.\n📉 After: Corrected back to ₹3800 (-8.5%).",
    exampleStock: "TCS", exampleDate: "2024-02-09", preTrendDir: 1,
    animationCandles: [ { o: 0, c: -8, h: 35, l: -12 } ],
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_10px_rgba(255,59,48,0.3)]">
        <line x1="50" y1="10" x2="50" y2="80" stroke="#ff3b30" strokeWidth="4" strokeLinecap="round" />
        <rect x="40" y="55" width="20" height="25" fill="#ff3b30" rx="4" />
      </svg>
    )
  },
  {
    id: "hanging_man", title: "Hanging Man", category: "Single Candle", type: "Trend Warning",
    color: "text-[#ffcc00]", bg: "bg-[#ffcc00]/10", border: "border-[#ffcc00]/20",
    desc: "Looks like a Hammer but occurs at the TOP of an uptrend. Long lower wick shows heavy intraday selling pressure.",
    caseStudy: "📈 Before: BAJFINANCE rallied to ₹7500.\n📊 Instance: 12 Sep 2023. Closed green, but long wick revealed deep internal weakness.\n📉 After: Uptrend stalled, slid back to ₹7000.",
    exampleStock: "BAJFINANCE", exampleDate: "2023-09-12", preTrendDir: 1,
    animationCandles: [ { o: 0, c: -5, h: 5, l: -35 } ],
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <line x1="50" y1="20" x2="50" y2="90" stroke="#ff3b30" strokeWidth="4" />
        <rect x="40" y="20" width="20" height="25" fill="#ff3b30" rx="4" />
      </svg>
    )
  },
  {
    id: "bearish_belt_hold", title: "Bearish Belt Hold", category: "Single Candle", type: "Bearish Reversal",
    color: "text-[#ff3b30]", bg: "bg-[#ff3b30]/10", border: "border-[#ff3b30]/20",
    desc: "Opens with a gap up in an uptrend, but immediately crashes to close as a massive red candle with no upper wick.",
    caseStudy: "📈 Before: TECHM rallied hard to ₹1350.\n📊 Instance: 24 Jan 2024. Gapped up but faced instant institutional dumping.\n📉 After: Crushed back to ₹1150 (-15%).",
    exampleStock: "TECHM", exampleDate: "2024-01-24", preTrendDir: 1,
    animationCandles: [ { o: 15, c: -35, h: 15, l: -40 } ],
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <line x1="50" y1="10" x2="50" y2="90" stroke="#ff3b30" strokeWidth="4" />
        <rect x="40" y="10" width="20" height="70" fill="#ff3b30" rx="2" />
      </svg>
    )
  },

  // ================= 🔴 DOUBLE CANDLE BEARISH =================
  {
    id: "bearish_engulfing", title: "Bearish Engulfing", category: "Double Candle", type: "Strong Bearish",
    color: "text-[#ff3b30]", bg: "bg-[#ff3b30]/10", border: "border-[#ff3b30]/20",
    desc: "Small green candle is completely engulfed by a large red candle. Bears have taken total control.",
    caseStudy: "📈 Before: BHARTIARTL was on an uptrend hitting ₹1200.\n📊 Instance: 12 Jan 2024. Giant red candle swallowed 3 days of gains.\n📉 After: Sharp pullback to ₹1080 (-10%).",
    exampleStock: "BHARTIARTL", exampleDate: "2024-01-12", preTrendDir: 1,
    animationCandles: [ { o: 0, c: 12, h: 18, l: -5 }, { o: 15, c: -20, h: 22, l: -25 } ],
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <rect x="22" y="45" width="16" height="20" fill="#FFFFFF" rx="2" />
        <rect x="62" y="25" width="16" height="60" fill="#ff3b30" rx="2" />
      </svg>
    )
  },
  {
    id: "dark_cloud_cover", title: "Dark Cloud Cover", category: "Double Candle", type: "Bearish Reversal",
    color: "text-[#ff3b30]", bg: "bg-[#ff3b30]/10", border: "border-[#ff3b30]/20",
    desc: "Red candle opens higher but closes more than halfway down the body of the previous green candle.",
    caseStudy: "📈 Before: MARUTI was cruising at ₹10,800.\n📊 Instance: 16 Jan 2024. Opened gap up (trapping buyers) and crashed down.\n📉 After: Multi-week correction dragging stock below ₹10,000.",
    exampleStock: "MARUTI", exampleDate: "2024-01-16", preTrendDir: 1,
    animationCandles: [ { o: 0, c: 30, h: 35, l: -5 }, { o: 40, c: 10, h: 45, l: 5 } ],
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <rect x="22" y="40" width="16" height="45" fill="#FFFFFF" rx="2" />
        <rect x="62" y="15" width="16" height="50" fill="#ff3b30" rx="2" />
      </svg>
    )
  },
  {
    id: "tweezer_top", title: "Tweezer Top", category: "Double Candle", type: "Resistance Confirmed",
    color: "text-[#ff3b30]", bg: "bg-[#ff3b30]/10", border: "border-[#ff3b30]/20",
    desc: "Two consecutive candles that hit the exact same high price, creating a flat upper resistance level.",
    caseStudy: "📈 Before: M&M rallied vertically to ₹2050.\n📊 Instance: 5 March 2024. Twice the stock touched exactly ₹2055 and was sold off.\n📉 After: Heavy rejection confirmed, corrected to ₹1850.",
    exampleStock: "M&M", exampleDate: "2024-03-05", preTrendDir: 1,
    animationCandles: [ { o: 0, c: 20, h: 30, l: -5 }, { o: 20, c: -5, h: 30, l: -10 } ],
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <line x1="30" y1="20" x2="30" y2="80" stroke="#FFFFFF" strokeWidth="4" />
        <rect x="22" y="45" width="16" height="30" fill="#FFFFFF" rx="2" />
        <line x1="70" y1="20" x2="70" y2="60" stroke="#ff3b30" strokeWidth="4" />
        <rect x="62" y="25" width="16" height="30" fill="#ff3b30" rx="2" />
        <line x1="20" y1="20" x2="80" y2="20" stroke="white" strokeWidth="1" strokeDasharray="2 2" />
      </svg>
    )
  },
  {
    id: "bearish_kicker", title: "Bearish Kicker", category: "Double Candle", type: "Aggressive Bearish",
    color: "text-[#ff3b30]", bg: "bg-[#ff3b30]/10", border: "border-[#ff3b30]/20",
    desc: "Massive gap-down reversal. Red candle opens completely below the previous green candle's low.",
    caseStudy: "📈 Before: PAYTM was recovering near ₹760.\n📊 Instance: 1 Feb 2024 (RBI Action). Opened gap down completely below all recent structure.\n📉 After: Traded lower circuits continuously down to ₹400.",
    exampleStock: "PAYTM", exampleDate: "2024-02-01", preTrendDir: 1,
    animationCandles: [ { o: 0, c: 20, h: 25, l: -5 }, { o: -10, c: -35, h: -10, l: -40 } ],
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <rect x="22" y="15" width="16" height="30" fill="#FFFFFF" rx="2" />
        <rect x="62" y="60" width="16" height="35" fill="#ff3b30" rx="2" />
      </svg>
    )
  },

  // ================= 🔴 TRIPLE+ CANDLE BEARISH =================
  {
    id: "three_black_crows", title: "Three Black Crows", category: "Triple Candle", type: "Heavy Bearish",
    color: "text-[#ff3b30]", bg: "bg-[#ff3b30]/10", border: "border-[#ff3b30]/20",
    desc: "Three consecutive long-bodied red candles. Pure panic selling indicator.",
    caseStudy: "📈 Before: ADANIENT was flying above ₹3500.\n📊 Instance: Jan 2023 (Hindenburg). Three massive red daily closures wiping out weeks of progress.\n📉 After: Unprecedented crash hitting ₹1100.",
    exampleStock: "ADANIENT", exampleDate: "2023-01-25", preTrendDir: 1,
    animationCandles: [ { o: 0, c: -15, h: 5, l: -20 }, { o: -10, c: -30, h: -5, l: -35 }, { o: -25, c: -45, h: -20, l: -50 } ],
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <rect x="15" y="10" width="16" height="25" fill="#ff3b30" rx="2" />
        <rect x="42" y="30" width="16" height="25" fill="#ff3b30" rx="2" />
        <rect x="69" y="50" width="16" height="25" fill="#ff3b30" rx="2" />
      </svg>
    )
  },
  {
    id: "evening_star", title: "Evening Star", category: "Triple Candle", type: "Major Reversal",
    color: "text-[#ff3b30]", bg: "bg-[#ff3b30]/10", border: "border-[#ff3b30]/20",
    desc: "Long green, small star gapping up, followed by a long red candle crashing down.",
    caseStudy: "📈 Before: ITC was running towards ₹500.\n📊 Instance: July 2023. Retail trapped at the top (star), followed by institutional dumping.\n📉 After: Multi-month downtrend to ₹400 (-20%).",
    exampleStock: "ITC", exampleDate: "2023-07-24", preTrendDir: 1,
    animationCandles: [ { o: 0, c: 25, h: 30, l: -5 }, { o: 30, c: 28, h: 40, l: 20 }, { o: 30, c: -5, h: 35, l: -10 } ],
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <rect x="15" y="40" width="16" height="40" fill="#FFFFFF" rx="2" />
        <rect x="42" y="20" width="16" height="10" fill="#bbcbb2" rx="2" />
        <rect x="69" y="35" width="16" height="45" fill="#ff3b30" rx="2" />
      </svg>
    )
  },
  {
    id: "bearish_abandoned_baby", title: "Bearish Abandoned Baby", category: "Triple Candle", type: "Rare Reversal",
    color: "text-[#ff3b30]", bg: "bg-[#ff3b30]/10", border: "border-[#ff3b30]/20",
    desc: "A Doji gaps above the prior green candle, and the next red candle gaps back down. Doji is isolated.",
    caseStudy: "📈 Before: BHARATFORG rallied vertically to ₹1300.\n📊 Instance: 19 Feb 2024. Exhaustion gap up left the Doji hanging, followed by a gap down dump.\n📉 After: Severe correction to ₹1120.",
    exampleStock: "BHARATFORG", exampleDate: "2024-02-19", preTrendDir: 1,
    animationCandles: [ { o: 0, c: 20, h: 25, l: -5 }, { o: 30, c: 30, h: 35, l: 25 }, { o: 10, c: -10, h: 15, l: -15 } ],
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <rect x="15" y="50" width="16" height="30" fill="#FFFFFF" rx="2" />
        <rect x="42" y="20" width="16" height="4" fill="#bbcbb2" rx="2" />
        <rect x="69" y="50" width="16" height="30" fill="#ff3b30" rx="2" />
      </svg>
    )
  }
  // ================= 📈 CHART PATTERNS (MACRO STRUCTURES) =================
  ,{
    id: "head_and_shoulders", title: "Head & Shoulders", category: "Chart Pattern", type: "Trend Reversal",
    color: "text-[#ffcc00]", bg: "bg-[#ffcc00]/10", border: "border-[#ffcc00]/20",
    desc: "A baseline with three peaks, where the outside two are close in height and the middle is highest. A classic sign of a major bullish-to-bearish reversal.",
    caseStudy: "📈 Before: SBIN rallied continuously to ₹620.\n📊 Instance: Formed between May-July 2023. The right shoulder failed to make a new high, showing buyer exhaustion, followed by a neckline break.\n📉 After: Breakdown triggered a harsh selloff down to ₹540 (-13%).",
    exampleStock: "SBIN", exampleDate: "2023-07-20", preTrendDir: 1,
    animationCandles: [ 
      { o: 0, c: 15, h: 20, l: -5 },   // Left Shoulder Up
      { o: 15, c: -10, h: 18, l: -15 }, // Left Shoulder Down (Neckline)
      { o: -10, c: 30, h: 35, l: -15 }, // Head Up
      { o: 30, c: -30, h: 32, l: -35 }, // Head Down (Neckline)
      { o: -30, c: 12, h: 15, l: -35 }, // Right Shoulder Up
      { o: 12, c: -25, h: 15, l: -30 }  // Right Shoulder Breakdown
    ],
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="#ffcc00" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M 10 80 L 30 40 L 40 60 L 55 15 L 70 60 L 80 40 L 95 80" className="drop-shadow-[0_0_8px_rgba(255,204,0,0.5)]" />
        <line x1="20" y1="70" x2="85" y2="70" stroke="#bbcbb2" strokeWidth="2" strokeDasharray="4 4" />
      </svg>
    )
  },
  {
    id: "inverse_head_and_shoulders", title: "Inverse Head & Shoulders", category: "Chart Pattern", type: "Bullish Reversal",
    color: "text-[#FFFFFF]", bg: "bg-[#FFFFFF]/10", border: "border-[#FFFFFF]/20",
    desc: "The exact opposite of Head & Shoulders. Three bottoms where the middle is the lowest. Signals the end of a long downtrend.",
    caseStudy: "📉 Before: TATASTEEL was in a prolonged bear market hitting ₹100.\n📊 Instance: Formed over Oct-Nov 2023. The right shoulder held a higher low, and buyers aggressively broke the neckline.\n📈 After: Initiated a massive multi-month rally to ₹140 (+40%).",
    exampleStock: "TATASTEEL", exampleDate: "2023-11-20", preTrendDir: -1,
    animationCandles: [ 
      { o: 0, c: -15, h: 5, l: -20 },   // Left Shoulder Down
      { o: -15, c: 10, h: 15, l: -18 }, // Left Shoulder Up (Neckline)
      { o: 10, c: -30, h: 15, l: -35 }, // Head Down
      { o: -30, c: 30, h: 35, l: -32 }, // Head Up (Neckline)
      { o: 30, c: -12, h: 35, l: -15 }, // Right Shoulder Down
      { o: -12, c: 25, h: 30, l: -15 }  // Right Shoulder Breakout
    ],
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M 10 20 L 30 60 L 40 40 L 55 85 L 70 40 L 80 60 L 95 20" className="drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
        <line x1="20" y1="30" x2="85" y2="30" stroke="#bbcbb2" strokeWidth="2" strokeDasharray="4 4" />
      </svg>
    )
  },
  {
    id: "double_top", title: "Double Top (M Pattern)", category: "Chart Pattern", type: "Bearish Reversal",
    color: "text-[#ff3b30]", bg: "bg-[#ff3b30]/10", border: "border-[#ff3b30]/20",
    desc: "Looks like the letter 'M'. The price peaks, pulls back, rallies to the exact same peak, and then breaks down the neckline.",
    caseStudy: "📈 Before: KOTAKBANK surged heavily to ₹1950.\n📊 Instance: Formed in Jan 2024. Buyers tried twice but failed to cross ₹1950, creating a massive supply zone.\n📉 After: Neckline broke at ₹1850, stock slid to ₹1700 (-13%).",
    exampleStock: "KOTAKBANK", exampleDate: "2024-01-18", preTrendDir: 1,
    animationCandles: [ 
      { o: 0, c: 25, h: 30, l: -5 },   // First Top
      { o: 25, c: -15, h: 28, l: -20 }, // Pullback (Neckline)
      { o: -15, c: 15, h: 20, l: -18 }, // Second Top
      { o: 15, c: -30, h: 18, l: -35 }  // Breakdown
    ],
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="#ff3b30" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M 10 80 L 35 20 L 50 50 L 65 20 L 90 80" className="drop-shadow-[0_0_8px_rgba(255,59,48,0.5)]" />
        <line x1="10" y1="50" x2="90" y2="50" stroke="#bbcbb2" strokeWidth="2" strokeDasharray="4 4" />
      </svg>
    )
  },
  {
    id: "double_bottom", title: "Double Bottom (W Pattern)", category: "Chart Pattern", type: "Bullish Reversal",
    color: "text-[#FFFFFF]", bg: "bg-[#FFFFFF]/10", border: "border-[#FFFFFF]/20",
    desc: "Looks like the letter 'W'. The price drops, rebounds, drops to the exact same support level, then breaks out upwards.",
    caseStudy: "📉 Before: HINDUNILVR (HUL) corrected down to ₹2400.\n📊 Instance: Formed across Nov-Dec 2023. The ₹2400 zone acted as a concrete floor twice, shaking out retail.\n📈 After: Confirmed breakout pushed the stock to ₹2650 (+10%).",
    exampleStock: "HINDUNILVR", exampleDate: "2023-12-05", preTrendDir: -1,
    animationCandles: [ 
      { o: 0, c: -25, h: 5, l: -30 },   // First Bottom
      { o: -25, c: 15, h: 20, l: -28 }, // Pullback (Neckline)
      { o: 15, c: -15, h: 18, l: -20 }, // Second Bottom
      { o: -15, c: 35, h: 40, l: -20 }  // Breakout
    ],
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M 10 20 L 35 80 L 50 50 L 65 80 L 90 20" className="drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
        <line x1="10" y1="50" x2="90" y2="50" stroke="#bbcbb2" strokeWidth="2" strokeDasharray="4 4" />
      </svg>
    )
  },
  {
    id: "bull_flag", title: "Bull Flag", category: "Chart Pattern", type: "Bullish Continuation",
    color: "text-[#FFFFFF]", bg: "bg-[#FFFFFF]/10", border: "border-[#FFFFFF]/20",
    desc: "A steep vertical rally (the flagpole) followed by a tight, downward-sloping consolidation channel (the flag). Breakout leads to another vertical leg.",
    caseStudy: "📈 Before: IRFC surged vertically from ₹40 to ₹80 (Pole).\n📊 Instance: Jan 2024. Stock consolidated cleanly between ₹70-80 for 3 weeks, lowering volatility.\n📈 After: Flag breakout triggered a mega-rally to ₹170 (+112%).",
    exampleStock: "IRFC", exampleDate: "2024-01-20", preTrendDir: 1, // Pretrend creates the pole
    animationCandles: [ 
      { o: 0, c: -5, h: 2, l: -8 },   // Flag consolidation 1
      { o: -5, c: -4, h: 2, l: -6 },  // Flag consolidation 2
      { o: -4, c: -5, h: 1, l: -8 },  // Flag consolidation 3
      { o: -5, c: 35, h: 40, l: -5 }  // Flag Breakout (Next leg up)
    ],
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M 10 90 L 30 30" strokeWidth="6" className="drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]" /> {/* Pole */}
        <path d="M 30 30 L 45 45 L 60 35 L 75 50" stroke="#bbcbb2" strokeWidth="3" /> {/* Flag */}
        <line x1="20" y1="20" x2="70" y2="45" stroke="#ff3b30" strokeWidth="2" strokeDasharray="2 2" /> {/* Upper bound */}
        <line x1="30" y1="50" x2="80" y2="75" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="2 2" /> {/* Lower bound */}
      </svg>
    )
  }
];