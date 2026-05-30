# 📈 Paper Trade Elite

A full-stack paper trading platform for the Indian stock market (NSE/BSE) with real-time market data, AI-powered after-hours simulation, candlestick pattern academy, and an intelligent trading assistant.

---

## ✨ Features

| Feature | Description |
|---|---|
| 📊 **Live Market Data** | Real-time NSE/BSE prices via Yahoo Finance during market hours (9:15 AM – 3:30 PM IST) |
| 🤖 **AI Market Engine** | After-hours simulation using RSI, MACD, Bollinger Bands, EMA — pattern-aware with macro event injection |
| 💬 **AI Chat Assistant** | Rule-based market intelligence bot with deep knowledge of all candlestick patterns and indicators |
| 📚 **Pattern Academy** | 20+ candlestick & chart patterns with animated SVG charts, candle/line toggle, and real case studies |
| 💼 **Paper Portfolio** | Buy/sell with ₹10,00,000 virtual capital. MAX button, available units display, P&L graph |
| 👤 **User Profile** | Avatar upload, bio editing, trading stats |
| 🔐 **Secure Auth** | Google OAuth + Email/Password. Refresh tokens (httpOnly cookies), rate limiting, helmet |

---

## 🗂 Project Structure

```
PAPER_TRADE/
├── frontend/               # React + Vite + Tailwind CSS
│   ├── src/
│   │   ├── pages/          # Dashboard, Markets, Portfolio, Academy, History, Profile
│   │   ├── components/     # Sidebar, SmartChart, AIChat
│   │   └── data/           # patterns.jsx (pattern knowledge base)
│   └── .env.example        # Frontend env template
│
└── paper_trade_backend/    # Node.js + Express + MongoDB
    ├── routes/             # auth.js, trade.js, syntheticRoutes.js
    ├── engine/             # marketBrain.js (AI simulation engine)
    ├── models/             # User.js, Trade.js
    ├── middleware/         # fetchuser.js (JWT auth)
    └── .env.example        # Backend env template
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Google Cloud Console project (for OAuth)

### 1. Clone the repo
```bash
git clone https://github.com/your-username/paper-trade.git
cd paper-trade
```

### 2. Backend Setup
```bash
cd paper_trade_backend
npm install

# Copy the template and fill in your values
cp .env.example .env
# Edit .env with your MongoDB URI, JWT secrets, Google Client ID

npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install

# Copy the template and fill in your values
cp .env.example .env
# Edit .env with your backend URL and Google Client ID

npm run dev
```

### 4. Open the app
Navigate to `http://localhost:5173`

---

## 🔐 Security

- **Rate Limiting**: Auth routes limited to 10 req/15min per IP
- **Helmet**: HTTP security headers on all responses  
- **CORS**: Restricted to whitelisted origins only
- **Refresh Tokens**: 30-day refresh token stored in `httpOnly` cookie
- **Access Tokens**: 1-day lifespan, stored in `localStorage`
- **MongoDB Sanitize**: NoSQL injection prevention
- **Password Hashing**: bcrypt with 12 salt rounds

> ⚠️ **Never commit your `.env` files.** They are gitignored. Use `.env.example` as a template.

---

## 🧠 AI Engine Architecture

The `marketBrain.js` engine:
1. **Fetches** real Yahoo Finance data (daily + 5-min intraday) for each symbol
2. **Computes** RSI, EMA(20/50), MACD, Bollinger Bands, ATR
3. **Detects** 9 candlestick patterns (Doji, Hammer, Engulfing, Morning/Evening Star, etc.)
4. **Determines** market regime (TRENDING_BULLISH, REVERSAL_BEARISH, SIDEWAYS, etc.)
5. **Calculates** bullish probability (18–82%)
6. **Generates** synthetic OHLC candles in real-time via SSE
7. **Injects** random macro events (FII buy/sell, earnings, RBI decisions) for realism

---

## 📜 License

MIT — free to use, fork, and modify.
