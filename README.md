# 📈 Paper Trade | Advanced Market Simulator

> Master the markets with institutional-grade execution speed. Our professional simulation environment mirrors live terminal performance without the capital risk.

An elite, sleek, and highly responsive paper trading simulator designed for precision and speed. Built with a robust MERN architecture, it features a custom AI "Market Brain" that generates synthetic, mathematically sound market data (using RSI, MACD, and ATR logic) when real markets are closed, ensuring a 24/7 trading experience.

## 🚀 Key Features

* **⚡ Ultra-Low Latency Terminal:** High-performance UI built with Framer Motion and React, ensuring zero-lag navigation and order execution.
* **🧠 AI Market Engine (Synthetic Data):** When live markets sleep, the AI engine wakes up. It simulates realistic market regimes (Bullish, Bearish, Neutral) using advanced math to draw breathing, dynamic candlestick/area charts.
* **📊 Institutional-Grade Charting:** Integrated with TradingView's `lightweight-charts` for seamless, glitch-free data visualization, complete with auto-scaling and time normalization.
* **🔐 Secure Protocol Architecture:** Dual-layer authentication featuring Google OAuth 2.0 (SSO) and JWT-based custom encrypted sessions, rate limiting, and helmet security.
* **💰 Real-Time Portfolio Tracking:** Virtual ledger system starting with ₹10,00,000 capital to track P&L, average cost basis, and real-time margin updates.
* **📰 Live Sentiment & Market Updates:** Sub-zone analysis engine and dynamic news feed to keep traders informed of global market conditions.
* **💬 AI Chat Assistant:** Rule-based market intelligence bot with deep knowledge of all candlestick patterns and indicators.
* **📚 Pattern Academy:** 20+ candlestick & chart patterns with animated SVG charts, candle/line toggle, and real case studies.
* **👤 User Profile:** Avatar upload, bio editing, and trading stats.

## 💻 Tech Stack

**Frontend (Client Terminal):**
* React.js (Vite)
* Tailwind CSS (Custom sleek dark mode UI `#0e0e0e`)
* Framer Motion (Advanced animations & loaders)
* Lightweight Charts (TradingView)
* Google OAuth (`@react-oauth/google`)

**Backend (Core Engine):**
* Node.js & Express.js
* MongoDB Atlas & Mongoose (Data modeling)
* JSON Web Tokens (JWT) & Google Auth Library
* Server-Sent Events (SSE) for real-time synthetic data streaming
* Yahoo Finance API (`yahoo-finance2`) for live market checks

## ⚙️ Quick Setup (Local Development)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/kavya-jain14/PAPER_TRADE.git
   cd PAPER_TRADE
   ```
2. **Backend Setup:**
   ```bash
   cd paper_trade_backend
   npm install
   cp .env.example .env # Configure variables
   npm run dev
   ```
3. **Frontend Setup:**
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   npm run dev
   ```
