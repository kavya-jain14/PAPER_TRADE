import React, { useState, useRef, useEffect } from 'react';
import { patternsData } from '../data/patterns';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ─── Knowledge Base ───────────────────────────────────────────────────────────
const patternIndex = {};
patternsData.forEach(p => {
  patternIndex[p.id]                   = p;
  patternIndex[p.title.toLowerCase()]  = p;
});

const INDICATORS = {
  rsi: {
    name: 'RSI (Relative Strength Index)',
    explain: (val) => {
      if (!val) return 'RSI measures the speed and magnitude of price changes on a 0–100 scale.\n• RSI < 30 → Oversold (potential buying zone)\n• RSI 30–70 → Neutral\n• RSI > 70 → Overbought (potential selling zone)\n\nAlways combine RSI with trend direction for best results.';
      if (val < 30) return `RSI is ${val.toFixed(1)} — OVERSOLD zone. The stock has fallen sharply. Watch for reversal signals like a Hammer or Bullish Engulfing. This is a potential accumulation zone.`;
      if (val > 70) return `RSI is ${val.toFixed(1)} — OVERBOUGHT zone. The stock has risen sharply. Watch for reversal signals like a Shooting Star or Bearish Engulfing. Consider booking partial profits.`;
      return `RSI is ${val.toFixed(1)} — NEUTRAL zone. No extreme reading. Focus on trend and volume confirmation.`;
    }
  },
  macd: { name: 'MACD', explain: () => 'MACD (Moving Average Convergence Divergence) shows momentum.\n• MACD line crosses SIGNAL line upward → Bullish signal\n• MACD line crosses SIGNAL line downward → Bearish signal\n• Histogram growing green → Increasing bullish momentum\n• Histogram growing red → Increasing bearish momentum\n\nBest combined with RSI and volume analysis.' },
  bollinger: { name: 'Bollinger Bands', explain: () => 'Bollinger Bands measure volatility.\n• Price touching UPPER band → Overbought or breakout\n• Price touching LOWER band → Oversold or breakdown\n• Bands squeezing (narrow) → Low volatility, big move incoming\n• Bands expanding → High volatility, trend is strong\n\nBest used with RSI to distinguish breakouts from reversals.' },
  ema: { name: 'EMA (Exponential Moving Average)', explain: () => 'EMA gives more weight to recent prices.\n• Price above EMA → Bullish trend\n• Price below EMA → Bearish trend\n• EMA20 above EMA50 → Golden Cross (bullish)\n• EMA20 below EMA50 → Death Cross (bearish)\n\nEMA reacts faster than SMA, making it preferred for short-term traders.' },
};

const MARKET_CONCEPTS = {
  support: 'SUPPORT is a price level where buying pressure consistently stops the stock from falling further. Think of it as a "floor". When price approaches support, look for bullish candlestick patterns (Hammer, Engulfing) to confirm a bounce.\n\nKey tip: The more times a support holds, the stronger it is — and the more explosive the breakout when it eventually breaks.',
  resistance: 'RESISTANCE is a price level where selling pressure consistently stops the stock from rising. Think of it as a "ceiling". When price approaches resistance, look for bearish candlestick patterns (Shooting Star, Engulfing) to confirm rejection.\n\nKey tip: Old resistance becomes new support once broken — this is called a "Role Reversal".',
  trend: 'A TREND is the general direction the market is moving:\n• UPTREND: Series of higher highs and higher lows\n• DOWNTREND: Series of lower highs and lower lows\n• SIDEWAYS: Price moving in a range (accumulation or distribution)\n\nThe golden rule: "The trend is your friend until it bends."',
  volume: 'VOLUME is the number of shares traded. It\'s the fuel behind price moves.\n• Rising price + Rising volume → Strong uptrend (conviction)\n• Rising price + Falling volume → Weak uptrend (beware reversal)\n• Falling price + Rising volume → Strong downtrend (panic selling)\n• Falling price + Falling volume → Weak downtrend (may reverse soon)',
  fib: 'FIBONACCI RETRACEMENT levels (23.6%, 38.2%, 50%, 61.8%) show potential support/resistance after a move.\n• 61.8% is the "Golden Ratio" — the strongest retracement level\n• After a rally: watch 38.2% and 61.8% for pullback support\n• After a crash: watch 38.2% and 61.8% for bounce resistance',
};

// ─── Answer Engine ────────────────────────────────────────────────────────────
function generateAnswer(msg, bias) {
  const q = msg.toLowerCase().trim();

  // Current market / bias questions
  if (/current|regime|right now|today|bias|market (is|now)/.test(q) && bias) {
    const isB = bias.bullishProbability >= 50;
    return `📊 **Current AI Analysis for ${bias.symbol || 'this stock'}:**\n\n` +
      `• **Regime:** ${bias.regime?.replace('_', ' ') || 'Unknown'}\n` +
      `• **Bull Probability:** ${bias.bullishProbability}%\n` +
      `• **RSI:** ${INDICATORS.rsi.explain(bias.rsi)}\n` +
      `• **Detected Patterns:** ${bias.patterns?.length ? bias.patterns.join(', ') : 'No strong pattern'}\n\n` +
      `**Suggestion:** ${isB ? '🟢 Bias is bullish. Look for pullbacks to enter long. Confirm with volume.' : '🔴 Bias is bearish. Avoid buying weakness. Wait for reversal signals or trade short.'}`;
  }

  // RSI
  if (/rsi|relative strength/.test(q)) return `📈 ${INDICATORS.rsi.explain(bias?.rsi)}`;

  // MACD
  if (/macd|convergence|divergence|histogram|signal line/.test(q)) return `📊 ${INDICATORS.macd.explain()}`;

  // Bollinger
  if (/bollinger|bands|bandwidth|squeeze/.test(q)) return `📊 ${INDICATORS.bollinger.explain()}`;

  // EMA/MA
  if (/ema|exponential moving|moving average|golden cross|death cross/.test(q)) return `📊 ${INDICATORS.ema.explain()}`;

  // Support/Resistance
  if (/support/.test(q)) return `🏛️ ${MARKET_CONCEPTS.support}`;
  if (/resistance/.test(q)) return `🏰 ${MARKET_CONCEPTS.resistance}`;
  if (/trend|uptrend|downtrend|sideways/.test(q)) return `📈 ${MARKET_CONCEPTS.trend}`;
  if (/volume/.test(q)) return `📊 ${MARKET_CONCEPTS.volume}`;
  if (/fibonacci|fib|retracement/.test(q)) return `🌀 ${MARKET_CONCEPTS.fib}`;

  // Pattern matching — search all patterns
  const matched = patternsData.find(p =>
    q.includes(p.title.toLowerCase()) || q.includes(p.id.replace('_', ' '))
  );
  if (matched) {
    return `🕯️ **${matched.title}** (${matched.type})\n\n` +
      `${matched.desc}\n\n` +
      `📚 **Real Example:**\n${matched.caseStudy}`;
  }

  // Doji family catch-all
  if (/doji/.test(q)) {
    const dojis = patternsData.filter(p => p.id.includes('doji') || p.title.toLowerCase().includes('doji'));
    return `🕯️ **Doji Candle Family:**\n\n` +
      dojis.map(d => `• **${d.title}**: ${d.desc.slice(0, 100)}...`).join('\n\n') +
      `\n\nAsk me about a specific Doji (e.g., "Gravestone Doji" or "Dragonfly Doji") for full details!`;
  }

  // How to trade / strategy
  if (/how to (trade|start|study|invest|analyze)/.test(q)) {
    return `📖 **How to Study the Market (Step-by-Step):**\n\n` +
      `1. **Identify the Phase** — Is the stock in Accumulation, Markup, Distribution, or Markdown?\n` +
      `2. **Check the Trend** — Is price making Higher Highs (uptrend) or Lower Lows (downtrend)?\n` +
      `3. **Find Key Levels** — Mark Support and Resistance on the chart\n` +
      `4. **Look for Patterns** — Candlestick patterns near S&R levels have higher probability\n` +
      `5. **Confirm with Indicators** — RSI for strength, MACD for momentum, Volume for conviction\n` +
      `6. **Plan the Trade** — Entry, Stop Loss (just below support), Target\n\n` +
      `🎯 **Golden Rule:** Never trade a pattern in isolation. Context is everything.`;
  }

  // Greetings
  if (/^(hi|hello|hey|hii|yo|sup)/.test(q)) {
    return `👋 **Hello! I'm your Market Intelligence Assistant.**\n\nI can help you with:\n• 🕯️ Any candlestick pattern (Doji, Hammer, Engulfing...)\n• 📊 Technical indicators (RSI, MACD, Bollinger, EMA)\n• 📈 Market concepts (Support, Resistance, Trend, Volume)\n• 🧠 Current AI analysis for the open stock\n\nWhat would you like to learn?`;
  }

  // Patterns list
  if (/list|all patterns|show patterns|what patterns/.test(q)) {
    const categories = [...new Set(patternsData.map(p => p.category))];
    return `📚 **All Available Patterns:**\n\n` +
      categories.map(cat => {
        const ps = patternsData.filter(p => p.category === cat);
        return `**${cat}:**\n${ps.map(p => `  • ${p.title} (${p.type})`).join('\n')}`;
      }).join('\n\n');
  }

  // Fallback
  return `🤔 I didn't quite understand that. Try asking me about:\n• A specific pattern: "What is a Doji?", "Explain Hammer"\n• An indicator: "What is RSI?", "Explain MACD"\n• A concept: "What is support?", "How to study the market?"\n• Current analysis: "What is the current regime?"`;
}

// ─── Chat Message Component ───────────────────────────────────────────────────
const ChatMessage = ({ msg }) => (
  <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} mb-3`}>
    {msg.role === 'ai' && (
      <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-[11px] font-black text-white mr-2 mt-1 shrink-0">AI</div>
    )}
    <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-[13px] leading-relaxed whitespace-pre-wrap ${
      msg.role === 'user'
        ? 'bg-[#3de530]/10 text-white/90 border border-[#3de530]/20 rounded-tr-sm'
        : 'bg-[#1a1a1a] text-white/85 border border-white/8 rounded-tl-sm'
    }`}>
      {msg.text}
    </div>
  </div>
);

// ─── Main AIChat Component ────────────────────────────────────────────────────
export default function AIChat({ symbol = null }) {
  const [isOpen,    setIsOpen]    = useState(false);
  const [messages,  setMessages]  = useState([
    { role: 'ai', text: '👋 Hi! I\'m your Market Intelligence Assistant. Ask me about any candlestick pattern, indicator, or get an analysis of the current market regime!' }
  ]);
  const [input,     setInput]     = useState('');
  const [isTyping,  setIsTyping]  = useState(false);
  const [bias,      setBias]      = useState(null);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  // Fetch bias when symbol changes
  useEffect(() => {
    if (!symbol) return;
    fetch(`${API_URL}/api/synthetic/bias/${encodeURIComponent(symbol)}`)
      .then(r => r.json())
      .then(b => setBias(b))
      .catch(() => {});
  }, [symbol]);

  // Auto-scroll
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);

  // Focus input when open
  useEffect(() => { if (isOpen) setTimeout(() => inputRef.current?.focus(), 100); }, [isOpen]);

  // Global toggle listener
  useEffect(() => {
    const toggle = () => setIsOpen(v => !v);
    window.addEventListener('toggle-ai-chat', toggle);
    return () => window.removeEventListener('toggle-ai-chat', toggle);
  }, []);

  const sendMessage = async (text) => {
    const q = text.trim();
    if (!q) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: q }]);
    setIsTyping(true);

    // Simulate AI "thinking" delay for realism
    await new Promise(r => setTimeout(r, 600 + Math.random() * 400));

    const answer = generateAnswer(q, bias ? { ...bias, symbol } : null);
    setMessages(prev => [...prev, { role: 'ai', text: answer }]);
    setIsTyping(false);
  };

  const QUICK_PROMPTS = symbol
    ? [`What is the current regime for ${symbol}?`, 'Explain RSI', 'What is a Doji?', 'How to study the market?']
    : ['What is a Doji?', 'Explain RSI', 'What is support?', 'How to study the market?'];

  return (
    <>
      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[360px] max-h-[500px] bg-[#111111] border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden font-inter">
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-white/8 bg-gradient-to-r from-purple-900/40 to-blue-900/40">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-sm font-black text-white">AI</div>
            <div>
              <p className="text-sm font-bold text-white">Market Intelligence</p>
              <p className="text-[10px] text-purple-300/70 uppercase tracking-widest">{symbol ? `Analyzing ${symbol}` : 'Pattern & Market Expert'}</p>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[9px] text-green-400 font-bold uppercase">Online</span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar" style={{ maxHeight: '280px' }}>
            {messages.map((m, i) => <ChatMessage key={i} msg={m} />)}
            {isTyping && (
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-[11px] font-black text-white shrink-0">AI</div>
                <div className="bg-[#1a1a1a] border border-white/8 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-white/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-white/50 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick prompts */}
          <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-none">
            {QUICK_PROMPTS.map((p, i) => (
              <button key={i} onClick={() => sendMessage(p)}
                className="text-[10px] text-purple-300/80 bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 rounded-full whitespace-nowrap hover:bg-purple-500/20 transition-colors shrink-0">
                {p}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-white/8 flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
              placeholder="Ask about any pattern or indicator..."
              className="flex-1 bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-2.5 text-[13px] text-white outline-none focus:border-purple-500/50 placeholder-white/30 transition-colors"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isTyping}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white hover:opacity-90 disabled:opacity-30 transition-opacity shrink-0"
            >
              <span className="material-symbols-outlined text-[18px]">send</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
