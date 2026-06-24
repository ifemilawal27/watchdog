const fs = require("fs");

const content = `# Watchdog — AI-Powered Trading Infrastructure for Bitget Agent Hub

**Bitget AI Hackathon S1 | Track: Trading Infra**
**Repository:** https://github.com/ifemilawal27/watchdog

---

## What Is Watchdog

Watchdog is a complete paper trading sandbox and AI risk intelligence platform built on the Bitget Agent Hub ecosystem. It gives traders and autonomous trading agents something Bitget's own infrastructure deliberately does not provide: a pre-trade risk gate, a real-time signal engine, and a persistent, auditable decision log.

Bitget's documentation states directly: "Bitget MCP is an interface for AI-agent tool access. It does not replace strategy validation, position sizing, stop-loss planning, backtesting, or independent risk management."

Watchdog is exactly that missing layer.

---

## The Problem It Solves

Trading agents built on Bitget Agent Hub can place orders and read market data. What they cannot do natively is:

- Simulate a strategy safely before committing real capital
- Score the risk of an individual trade against live multi-signal market context
- Generate a narrative briefing across multiple pairs simultaneously
- Diagnose an entire portfolio's health using AI reasoning
- Maintain a timestamped, auditable log of every decision made and why

Watchdog solves all five.

---

## Feature Overview

### Dashboard
- Live candlestick chart for 5 pairs (BTC, ETH, SOL, BNB, XRP) with 4 granularities (15m, 1H, 4H, 1D)
- Real-time RSI, SMA20 trend deviation, and volatility signals with contextual explanations
- Composite Entry Score (0-100) computed from all three signals combined, displayed as an animated SVG gauge
- Pre-trade AI risk gate: every trade is analyzed before execution
- Full portfolio tracking: positions, average entry price, live P&L, return percentage

### AI Market Brief
- On startup, Watchdog reads all 5 pairs simultaneously and sends them to the AI reasoning model
- The model generates a sentiment classification (BULLISH / BEARISH / NEUTRAL / CAUTIOUS), a headline, a 2-3 sentence narrative briefing referencing specific pairs and RSI values by name, and a watchlist recommendation with reasoning
- Updates on demand via Refresh Brief button

### Portfolio Doctor
- One-click full portfolio diagnosis powered by the AI reasoning model
- Returns a health score (0-100) displayed as an animated circular gauge
- Provides a plain-English diagnosis, three numbered actionable recommendations, and a highlighted risk warning
- The model reads your actual open positions, current prices, P&L, and all five pairs signals before generating its assessment

### Market Scanner
- Scans all 5 pairs simultaneously on demand
- Shows entry score, signal badge (OVERSOLD / OVERBOUGHT / UPTREND / DOWNTREND / VOLATILE / NEUTRAL), RSI bar, and trend deviation for each pair
- 14-day regime history displayed as a color-coded strip of squares (green = bullish, red = bearish, grey = neutral) computed from daily candles
- Clicking any scanner card navigates directly to that pair's chart on the Dashboard

### Risk Lab
- Persistent log of every AI risk assessment ever generated
- Columns: timestamp, asset, side, risk score (color-coded badge), RSI at time of analysis, trend at time of analysis, full AI explanation
- Acts as a complete audit trail of all AI decisions made by Watchdog

### Trade History
- Complete timestamped ledger of every paper trade executed
- Columns: time, asset, side, price, size, trade value, balance after
- One-click CSV export for external verification

---

## AI Reasoning Architecture

Model: openai/gpt-oss-120b via Groq API
Reasoning effort: high (maximum reasoning depth)

Watchdog makes four distinct types of AI calls:

| Call Type | Trigger | What the model receives | What it returns |
|---|---|---|---|
| Pre-trade Risk Assessment | Every trade analysis request | Proposed trade, portfolio balance, RSI, trend, volatility | Risk score 1-10, plain-English explanation, full reasoning chain |
| Market Brief | Dashboard load, Refresh Brief | Live signals for all 5 pairs | Sentiment, headline, narrative brief, watchlist call |
| Portfolio Doctor | Run Diagnosis button | All positions with P&L, all 5 pair signals | Health score 0-100, diagnosis, 3 recommendations, risk warning |

The full internal reasoning chain of every AI call is preserved and exposed in the UI via a "View AI Reasoning Chain" toggle. This allows a trader or agent operator to audit not just what the AI concluded, but exactly how it got there.

---

## Technical Signal Engine

All signals are computed locally from live Bitget OHLCV data. No third-party signal provider is used.

| Signal | Computation | Interpretation |
|---|---|---|
| RSI (14) | Wilder smoothing over 50 hourly candles | Below 30: oversold. Above 70: overbought |
| SMA20 Deviation | (Price - SMA20) / SMA20 x 100 | Positive: above recent average (uptrend) |
| Volatility | Std dev of hourly log returns x 100 | Higher = wider price swings = higher directional risk |
| Composite Entry Score | Weighted blend: RSI 40%, Trend 35%, Volatility 25% | 0-100. Higher = more favorable entry conditions |
| 14-Day Regime | Daily candles: RSI + SMA classify each day as bullish/bearish/neutral | Visual history of market character |

---

## Bitget Integration

All market data is sourced directly from Bitget Agent Hub REST APIs:

| Endpoint | Usage |
|---|---|
| GET /api/v2/spot/market/tickers | Live prices for all 5 pairs, 24h change, volume |
| GET /api/v2/spot/market/candles | OHLCV data for chart rendering and signal computation |

No private endpoints are used. The full system runs on public market data only, making it deployable and testable by anyone without account credentials.

---

## Verifiable Usage Records

All paper trades are stored in portfolio.json with full timestamps:

{
  "id": 1782077643085,
  "timestamp": "2026-06-21T21:34:03.085Z",
  "symbol": "BTCUSDT",
  "side": "buy",
  "price": 63534.7,
  "size": 0.1,
  "balanceAfter": 3646.53
}

All AI risk assessments are stored in risk-history.json with the full explanation preserved.
Both files are committed to this repository and span multiple sessions, confirming the system ran continuously over multiple days.

---

## Installation

Requirements: Node.js v18 or later

git clone https://github.com/ifemilawal27/watchdog.git
cd watchdog
npm install

Create a .env file in the project root:

BITGET_API_KEY=your_bitget_api_key
BITGET_SECRET_KEY=your_bitget_secret_key
BITGET_PASSPHRASE=your_bitget_passphrase
GROQ_API_KEY=your_groq_api_key

Start the server:

node server.js

Open your browser at http://localhost:3000

The dashboard loads immediately. The AI Market Brief generates automatically in the background on first load.

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | /api/portfolio | Full portfolio: balance, positions, trade history |
| POST | /api/trade | Execute a paper trade |
| GET | /api/price/:symbol | Live spot price from Bitget |
| GET | /api/candles/:symbol | OHLCV data with granularity and limit params |
| GET | /api/market-overview | All 5 pairs: price and 24h change |
| GET | /api/signals/:symbol | RSI, trend, volatility, entry score |
| GET | /api/scanner | Signals for all 5 pairs simultaneously |
| GET | /api/ai-brief | AI-generated market narrative across all pairs |
| POST | /api/portfolio-doctor | Full portfolio health diagnosis |
| GET | /api/risk-history | All past AI risk assessments |
| GET | /api/regime/:symbol | 14-day daily regime classification |
| POST | /api/risk-analysis | Pre-trade AI risk assessment |

---

## Stack

- Runtime: Node.js + Express
- Market Data: Bitget Agent Hub REST API (spot market, candles)
- AI Reasoning: Groq API — openai/gpt-oss-120b (reasoning_effort: high)
- Charts: Lightweight Charts (TradingView open-source library)
- Icons: Lucide
- Frontend: Vanilla HTML, CSS, JavaScript
- Storage: JSON file ledger (zero-dependency, fully portable)

---

## Architecture

Browser Dashboard (public/index.html)
           |
           v
  Express.js Backend (server.js)
           |
    _______|_________________________________
    |           |           |               |
    v           v           v               v
Bitget      Bitget       Signal          Groq API
Market      Candles      Engine          gpt-oss-120b
API         API          (RSI, SMA,      (4 AI call types:
(prices,    (OHLCV       volatility,     risk, brief,
 overview)   data)        regime)         doctor)

All AI calls preserve the full reasoning chain.
All trades and assessments are logged to disk with timestamps.

---

## Post-Hackathon Roadmap

- Backtest engine: replay strategies against historical OHLCV data with performance metrics
- Stop-loss and take-profit automation for paper positions
- Multi-session portfolio persistence with charted equity curve
- Alert system: AI flags a risk threshold breach and surfaces it immediately
- Integration with Bitget Agent Hub MCP server for fully autonomous agent monitoring
- WebSocket price feeds replacing polling for true real-time updates
`;

fs.writeFileSync("README.md", content, "utf8");
console.log("README written. Size: " + fs.statSync("README.md").size + " bytes");