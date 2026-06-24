const fs = require("fs");

const content = `# Watchdog — AI-Powered Trading Infrastructure for Bitget Agent Hub

**Bitget AI Hackathon S1 | Track: Trading Infra**
**Repository:** https://github.com/ifemilawal27/watchdog

---

## What Is Watchdog

Watchdog is a complete paper trading sandbox and AI risk intelligence platform built on the Bitget Agent Hub ecosystem. It gives traders and autonomous trading agents something Bitget's own infrastructure deliberately does not provide: a pre-trade risk gate, a real-time signal engine, an autonomous trading agent, a strategy backtester, and a persistent auditable decision log.

Bitget's documentation states directly: "Bitget MCP is an interface for AI-agent tool access. It does not replace strategy validation, position sizing, stop-loss planning, backtesting, or independent risk management."

Watchdog is exactly that missing layer.

---

## The Problem It Solves

Trading agents built on Bitget Agent Hub can place orders and read market data. What they cannot do natively is:

- Simulate a strategy safely before committing real capital
- Score the risk of an individual trade against live multi-signal market context
- Operate autonomously with a full reasoning trail of every decision made
- Backtest a strategy against real historical data with AI-written performance analysis
- Generate a real-time narrative briefing synthesizing conditions across multiple pairs
- Diagnose an entire portfolio's health with numbered AI recommendations
- Fire instant alerts when extreme market conditions are detected
- Maintain a timestamped, auditable log of every AI decision made and why

Watchdog solves all eight.

---

## Feature Overview

### Dashboard
- Live candlestick chart for 5 pairs (BTC, ETH, SOL, BNB, XRP) with 4 granularities (15m, 1H, 4H, 1D)
- Real-time RSI, SMA20 trend deviation, and volatility signals with contextual plain-English explanations
- Composite Entry Score (0-100) computed from all three signals, displayed as an animated SVG gauge
- Pre-trade AI risk gate: every trade is analyzed by the reasoning model before execution
- Full portfolio tracking: positions, average entry price, live P&L, return percentage
- AI Market Brief banner: real-time sentiment and headline generated on startup

### Agent Mode (Autonomous Trading)
- A fully autonomous AI trading agent that watches all 5 pairs on a configurable cycle (default: every 2 minutes)
- Each cycle: scans all pairs, makes an independent BUY/SELL/HOLD decision with stated reasoning, runs a full AI risk check, and executes or skips with explanation
- Configurable parameters: max risk score threshold (1-9), trade size as percentage of balance
- Live activity feed shows every agent action in real time: scan, decision, risk check result, execution or skip reason
- Session statistics: cycles completed, trades executed, trades skipped, total AI calls made
- Every autonomous trade passes through the same risk gate as manual trades and is logged to the audit trail

### Strategy Backtester
- Backtests the RSI Reversal strategy (Buy below RSI 30, Sell above RSI 70) against 120 real historical hourly candles from Bitget
- Runs on any of the 5 supported pairs
- Returns: total return percentage, number of trades, win rate, final balance, and full simulated trade log
- The AI reasoning model writes a 3-4 sentence professional analysis of the results, referencing specific numbers and suggesting one concrete improvement

### AI Market Brief
- On startup, reads all 5 pairs simultaneously and generates: sentiment classification (BULLISH/BEARISH/NEUTRAL/CAUTIOUS), an 8-12 word headline, a 2-3 sentence narrative referencing specific pairs and RSI values by name, and a watchlist recommendation with reasoning
- Full expanded view available in AI Center
- Refreshable on demand

### Portfolio Doctor
- One-click full portfolio diagnosis powered by the AI reasoning model
- Returns a health score (0-100) as an animated circular gauge
- Provides plain-English diagnosis, three numbered actionable recommendations, and a highlighted risk warning
- The model reads your actual positions, current prices, P&L, and all five pairs signals before generating its assessment

### Market Scanner
- Scans all 5 pairs simultaneously
- Entry score, signal badge (OVERSOLD/OVERBOUGHT/UPTREND/DOWNTREND/VOLATILE/NEUTRAL), RSI bar, trend deviation
- 14-day regime history as a color-coded strip (green = bullish, red = bearish, grey = neutral) computed from daily candles
- Clicking any card navigates directly to that pair's live chart

### Live Alert Engine
- Background process checks all 5 pairs every 60 seconds
- Fires toast notifications and logs to the notification bell when: RSI drops below 25 (extreme oversold), RSI rises above 75 (overbought), or price deviates more than 2.8% from SMA20
- Alerts are deduplicated with a 10-minute cooldown per symbol per condition

### Risk Lab
- Persistent log of every AI risk assessment ever generated, by both manual trades and the autonomous agent
- Columns: timestamp, asset, side, risk score (color-coded badge), RSI at time of assessment, trend deviation, full AI explanation
- Complete audit trail of every AI decision Watchdog has made

### Trade History
- Complete timestamped ledger of every paper trade executed (manual and autonomous)
- One-click CSV export for external verification

---

## AI Architecture

Model: openai/gpt-oss-120b via Groq API
Reasoning effort: high (maximum reasoning depth on all calls)

Watchdog makes five distinct types of AI calls:

| Call Type | Trigger | Input | Output |
|---|---|---|---|
| Pre-trade Risk Assessment | Every trade analysis | Proposed trade, portfolio balance, RSI, trend, volatility | Risk score 1-10, explanation, full reasoning chain |
| Autonomous Agent Decision | Every agent cycle | All 5 pairs signals, portfolio state, open positions | BUY/SELL/HOLD with symbol, size, and reason |
| Market Brief | Dashboard load, Refresh | Live signals for all 5 pairs | Sentiment, headline, narrative, watchlist call |
| Portfolio Doctor | Run Diagnosis | All positions, P&L, all 5 pair signals | Health score, diagnosis, 3 recommendations, warning |
| Backtest Analysis | Backtest completion | Strategy metrics, return, win rate | 3-4 sentence professional performance analysis |

The full internal reasoning chain of every pre-trade AI call is preserved and exposed in the UI via a toggle. This allows a trader or agent operator to audit not just what the AI concluded, but exactly how it got there.

---

## Technical Signal Engine

All signals are computed locally from live Bitget OHLCV data. No third-party signal provider is used.

| Signal | Method | Interpretation |
|---|---|---|
| RSI (14) | Wilder smoothing over 50 hourly candles | Below 30: oversold. Above 70: overbought |
| SMA20 Deviation | (Price - SMA20) / SMA20 x 100 | Positive: above recent average |
| Volatility | Std dev of hourly returns x 100 | Higher = wider price swings |
| Composite Entry Score | Weighted: RSI 40%, Trend 35%, Volatility 25% | 0-100, higher = more favorable entry |
| 14-Day Regime | Daily RSI + SMA classification per day | Visual history: bullish/bearish/neutral |

---

## Bitget Integration

| Endpoint | Usage |
|---|---|
| GET /api/v2/spot/market/tickers | Live prices, 24h change, volume for all pairs |
| GET /api/v2/spot/market/candles | OHLCV data for charts, signal computation, backtesting, and regime history |

All market data comes from Bitget's Agent Hub REST API. No private endpoints are used. The system runs entirely on public market data, making it deployable by anyone without account credentials.

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
Both files are committed to this repository and span multiple real sessions, confirming the system ran continuously over multiple days.

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

The AI Market Brief generates automatically in the background on first load.
Agent Mode, Backtester, Portfolio Doctor, and Market Scanner are all available immediately via the sidebar.

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | /api/portfolio | Full portfolio: balance, positions, trade history |
| POST | /api/trade | Execute a paper trade |
| GET | /api/price/:symbol | Live spot price from Bitget |
| GET | /api/candles/:symbol | OHLCV data (granularity and limit params) |
| GET | /api/market-overview | All 5 pairs: price and 24h change |
| GET | /api/signals/:symbol | RSI, trend, volatility, entry score |
| GET | /api/scanner | Signals for all 5 pairs simultaneously |
| GET | /api/ai-brief | AI market narrative across all pairs |
| POST | /api/portfolio-doctor | Full portfolio health diagnosis |
| GET | /api/risk-history | All past AI risk assessments |
| GET | /api/regime/:symbol | 14-day daily regime classification |
| POST | /api/risk-analysis | Pre-trade AI risk assessment |
| POST | /api/agent/start | Start autonomous trading agent |
| POST | /api/agent/stop | Stop autonomous trading agent |
| GET | /api/agent/status | Agent status, stats, and live activity log |
| POST | /api/backtest | Run RSI Reversal backtest with AI analysis |

---

## Stack

- Runtime: Node.js + Express
- Market Data: Bitget Agent Hub REST API
- AI Reasoning: Groq API — openai/gpt-oss-120b (reasoning_effort: high)
- Charts: Lightweight Charts (TradingView open-source)
- Icons: Lucide
- Frontend: Vanilla HTML, CSS, JavaScript
- Storage: JSON file ledger (zero-dependency, portable)

---

## Architecture

Browser Dashboard
        |
        v
Express.js Backend (server.js)
        |
  ______|__________________________________________________
  |          |           |              |                 |
  v          v           v              v                 v
Bitget    Bitget      Signal         Groq AI          Agent
Market    Candles     Engine         gpt-oss-120b     Engine
API       API         (RSI, SMA,     (5 call types:   (autonomous
(prices,  (charts,    volatility,    risk, agent,     decisions,
overview)  backtest,  regime)        brief, doctor,   2-min cycles,
           regime)                   backtest)        risk-gated)

All AI calls preserve reasoning chains.
All trades and assessments are timestamped and logged to disk.
The agent is fully risk-gated: no trade executes without passing the AI risk check.

---

## Post-Hackathon Roadmap

- WebSocket price feeds replacing polling for true real-time data
- Additional backtest strategies: MACD crossover, Bollinger Band breakout
- Stop-loss and take-profit automation for paper positions
- Multi-session portfolio with charted equity curve
- Integration with Bitget Agent Hub MCP server for Claude Code compatibility
- Alert delivery via Telegram or email webhook
`;

fs.writeFileSync("README.md", content, "utf8");
console.log("README.md written. Size: " + fs.statSync("README.md").size + " bytes");