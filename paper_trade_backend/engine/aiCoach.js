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

    const { regime, rsi, bullishProbability } = biasSummary;

    // 2. Trend Alignment
    if (side === 'BUY') {
      if (regime === 'BULLISH' || regime === 'STRONG_BULL') {
        score += 25;
        insights.push(`✓ Trading with the trend (${regime.toLowerCase().replace('_', ' ')}).`);
      } else if (regime === 'BEARISH' || regime === 'STRONG_BEAR') {
        score -= 20;
        warnings.push(`⚠ Counter-trend trade! Market regime is ${regime}.`);
      } else {
        score += 5;
        insights.push('✓ Market is sideways; breakout potential.');
      }
    } else { // SELL
      if (regime === 'BEARISH' || regime === 'STRONG_BEAR') {
        score += 25;
        insights.push(`✓ Trading with the trend (${regime.toLowerCase().replace('_', ' ')}).`);
      } else if (regime === 'BULLISH' || regime === 'STRONG_BULL') {
        score -= 20;
        warnings.push(`⚠ Exiting/Shorting during a ${regime} regime.`);
      } else {
        score += 5;
      }
    }

    // 3. RSI Analysis (Momentum)
    const currentRSI = rsi[rsi.length - 1] || 50;
    
    if (side === 'BUY') {
      if (currentRSI < 30) {
        score += 15;
        insights.push(`✓ Good value entry (RSI Oversold at ${Math.round(currentRSI)}).`);
      } else if (currentRSI > 70) {
        score -= 15;
        warnings.push(`⚠ FOMO Risk? RSI is Overbought (${Math.round(currentRSI)}). Entry might be late.`);
      } else {
        score += 10;
        insights.push(`✓ Healthy momentum (RSI ${Math.round(currentRSI)}).`);
      }
    } else { // SELL
      if (currentRSI > 70) {
        score += 15;
        insights.push(`✓ Excellent exit timing (RSI Overbought at ${Math.round(currentRSI)}).`);
      } else if (currentRSI < 30) {
        score -= 15;
        warnings.push(`⚠ Panic selling? RSI is Oversold (${Math.round(currentRSI)}).`);
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
      warnings.push(`🚨 Overtrading Alert: You have traded ${symbol} ${recentSameSymbol.length + 1} times in 30 minutes. Focus on high-conviction setups!`);
    }

    // Clamp score
    score = Math.max(0, Math.min(100, Math.round(score)));

    // 5. Verdict Formatting
    let verdict = '';
    let risk = 'Low';
    
    if (score >= 80) {
      verdict = 'High-probability execution';
      risk = 'Low';
    } else if (score >= 60) {
      verdict = 'Solid trade with minor risks';
      risk = 'Medium';
    } else if (score >= 40) {
      verdict = 'Marginal setup; requires strict stop-loss';
      risk = 'High';
    } else {
      verdict = 'Low-probability gamble';
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
