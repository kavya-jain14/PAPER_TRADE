/**
 * aiCoach.js
 * 
 * Pure evaluation engine for analyzing trades instantly post-execution.
 * O(1) time complexity. Analyzes trend alignment, RSI, and FOMO patterns.
 */

class AICoach {
  
  /**
   * Evaluates a trade and returns a structured AI feedback payload.
   * 
   * @param {string} symbol - Ticker
   * @param {string} side - 'BUY' or 'SELL'
   * @param {number} quantity - Number of shares
   * @param {number} price - Execution price
   * @param {object} biasSummary - Result of brain.getBiasSummary()
   * @param {array} recentTrades - Array of user's recent Transaction docs
   */
  evaluateTrade(symbol, side, quantity, price, biasSummary, recentTrades = []) {
    let score = 50; // Base score
    const insights = [];
    const warnings = [];
    
    // 1. Context missing (e.g., market open but no synthetic history yet)
    if (!biasSummary) {
      return {
        score: 50,
        verdict: 'Neutral execution',
        risk: 'Unknown',
        confidence: 0,
        insights: ['Not enough market context available.'],
        warnings: []
      };
    }

    const { regime = 'SIDEWAYS', rsi, bullishProbability = 50 } = biasSummary;
    const isBullishRegime = regime.includes('BULLISH');
    const isBearishRegime = regime.includes('BEARISH');

    // 2. Trend Alignment
    if (side === 'BUY') {
      if (isBullishRegime) {
        score += 25;
        insights.push(`Execution aligns with the ${regime.toLowerCase().replaceAll('_', ' ')} regime.`);
      } else if (isBearishRegime) {
        score -= 20;
        warnings.push(`Buy is counter-trend while the detected regime is ${regime}.`);
      } else {
        score += 5;
        insights.push('The regime is sideways; direction needs price confirmation.');
      }
    } else { // SELL
      if (isBearishRegime) {
        score += 25;
        insights.push(`Execution aligns with the ${regime.toLowerCase().replaceAll('_', ' ')} regime.`);
      } else if (isBullishRegime) {
        score -= 20;
        warnings.push(`Sell is counter-trend while the detected regime is ${regime}.`);
      } else {
        score += 5;
      }
    }

    // 3. RSI Analysis (Momentum)
    const currentRSI = Array.isArray(rsi)
      ? Number(rsi[rsi.length - 1]) || 50
      : Number(rsi) || 50;
    
    if (side === 'BUY') {
      if (currentRSI < 30) {
        score += 15;
        insights.push(`RSI is oversold at ${Math.round(currentRSI)}; confirm the reversal before relying on it.`);
      } else if (currentRSI > 70) {
        score -= 15;
        warnings.push(`RSI is overbought at ${Math.round(currentRSI)}; the entry may be extended.`);
      } else {
        score += 10;
        insights.push(`RSI is neutral at ${Math.round(currentRSI)}.`);
      }
    } else { // SELL
      if (currentRSI > 70) {
        score += 15;
        insights.push(`RSI is overbought at ${Math.round(currentRSI)}.`);
      } else if (currentRSI < 30) {
        score -= 15;
        warnings.push(`RSI is oversold at ${Math.round(currentRSI)}; review whether the exit is reactive.`);
      } else {
        score += 10;
      }
    }

    // 4. Overtrading / FOMO Detection
    // Check if user traded this symbol multiple times in the last 30 minutes
    const THIRTY_MINUTES = 30 * 60 * 1000;
    const now = Date.now();
    const recentSameSymbol = recentTrades.filter(t => 
      t.symbol === symbol && (now - new Date(t.createdAt).getTime() < THIRTY_MINUTES)
    );

    if (recentSameSymbol.length >= 3) {
      score -= 25;
      warnings.push(`Overtrading risk: ${symbol} has been traded ${recentSameSymbol.length + 1} times in 30 minutes.`);
    }

    // Clamp score
    score = Math.max(0, Math.min(100, Math.round(score)));

    // 5. Verdict Formatting
    let verdict = '';
    let risk = 'Low';
    
    if (score >= 80) {
      verdict = 'Aligned with the detected conditions';
      risk = 'Low';
    } else if (score >= 60) {
      verdict = 'Mostly aligned; review the stated risks';
      risk = 'Medium';
    } else if (score >= 40) {
      verdict = 'Mixed conditions; define a clear invalidation';
      risk = 'High';
    } else {
      verdict = 'Counter to several detected conditions';
      risk = 'Extreme';
    }

    return {
      score,
      verdict,
      risk,
      confidence: Math.round(Math.abs(50 - bullishProbability) * 2), // Example derived metric
      insights,
      warnings
    };
  }
}

module.exports = new AICoach();
