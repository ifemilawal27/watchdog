# Watchdog - AI Risk Intelligence Dashboard for Bitget Agent Hub

**Bitget AI Hackathon S1 | Track: Trading Infra**

Watchdog is a paper trading sandbox and AI-powered risk intelligence dashboard built on top of the Bitget Agent Hub ecosystem. It addresses a gap Bitget's own documentation explicitly identifies: their MCP server and Agent Hub tools do not include strategy validation, risk scoring, or independent position monitoring. Watchdog fills exactly that gap.

---

## The Problem It Solves

Most trading agent frameworks - including those built on Bitget Agent Hub - have no built-in way to:

- Simulate a strategy safely before committing real capital
- Score the risk of an individual trade against live market signals
- Maintain a timestamped, verifiable log of agent decisions
- Show a human operator a clear, real-time view of what the agent is doing and why

Watchdog solves all four.

---

## How It Works

A user (or an upstream trading agent) proposes a trade. Before execution, Watchdog:

1. Fetches live price and candlestick data from the Bitget Market API
2. Computes three technical signals locally: RSI (14-period), 20-period SMA trend deviation, and recent volatility
3. Sends those signals plus the proposed trade details to the openai/gpt-oss-120b reasoning model via the Groq API
4. The model returns a risk score (1-10) and a plain-English explanation, with its full reasoning chain exposed
5. The user confirms or cancels - if confirmed, the trade is logged to a persistent, timestamped ledger

The result is a complete pre-trade risk gate, not just a display layer.

---

## Architecture

Browser Dashboard
      |
      v
Express.js Backend (Node.js)
      |
 _____|_____________________
 |           |             |
 v           v             v
Bitget     Signal        Groq API
Market     Engine        (openai/gpt-oss-120b)
API        (RSI, SMA,    (risk scoring +
(prices,    volatility)   reasoning chain)
 candles)

---

## Technical Signals Computed

| Signal | Method | Interpretation |
|---|---|---|
| RSI (14) | Wilder smoothing on 50 hourly candles | Below 30: oversold. Above 70: overbought |
| SMA Deviation | (Price - SMA20) / SMA20 x 100 | Positive: trading above recent average |
| Volatility | Std dev of hourly returns x 100 | Higher = more unpredictable price swings |

---

## AI Risk Analyst

Model: openai/gpt-oss-120b via Groq (reasoning_effort: high)

The model receives a structured briefing containing the proposed trade, current portfolio balance, and all three computed signals. It returns:

- A risk score from 1-10
- A 2-3 sentence plain-English explanation referencing the specific signal values
- Its full internal reasoning chain (exposed in the dashboard via "View AI's Full Reasoning")

The reasoning chain is intentionally visible - it allows an operator to audit why the AI flagged a trade, not just what it flagged it as.

---

## Bitget Integration

- Market API: GET /api/v2/spot/market/tickers for live prices
- Candle API: GET /api/v2/spot/market/candles for OHLCV data (1h granularity, 50 candles)
- No private endpoints are called. The system is fully functional with read-only or no API key for market data.

---

## Verifiable Usage Records

All paper trades are stored in portfolio.json with the following schema:

{
  "id": 1782077643085,
  "timestamp": "2026-06-21T21:34:03.085Z",
  "symbol": "BTCUSDT",
  "side": "buy",
  "price": 63534.7,
  "size": 0.1,
  "balanceAfter": 3646.53
}

Every entry has a UTC timestamp, asset pair, direction, execution price, size, and resulting balance. This log is append-only and persists across sessions.

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

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | /api/portfolio | Current balance, open positions, trade history |
| POST | /api/trade | Execute a paper trade |
| GET | /api/price/:symbol | Live price from Bitget |
| GET | /api/signals/:symbol | RSI, SMA deviation, volatility |
| POST | /api/risk-analysis | Full AI risk assessment for a proposed trade |

---

## Stack

- Runtime: Node.js + Express
- Market Data: Bitget Agent Hub REST API
- AI Reasoning: Groq API - openai/gpt-oss-120b (reasoning_effort: high)
- Frontend: Vanilla HTML/CSS/JS with Lucide icons
- Storage: JSON file ledger (zero-dependency, fully portable)

---

## What Is Next (Post-Hackathon Roadmap)

- Multi-asset support (ETH, SOL, and other Bitget-listed pairs)
- Backtest engine running strategies against historical candle data
- Integration with Bitget Agent Hub MCP server for fully autonomous agent monitoring
- Persistent database replacing the JSON ledger for scale
- Alert system: risk score threshold triggers a notification
