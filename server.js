require("dotenv").config();
const express = require("express");
const path = require("path");
const { loadPortfolio, executeTrade } = require("./trading-engine");
const { getSignals, calculateRSI } = require("./signals");
const { analyzeRisk } = require("./risk-analyst");
const { loadRiskHistory, logRiskAssessment } = require("./risk-log");
const { generateMarketBrief, portfolioDoctor } = require("./ai-narrator");
const { startAgent, stopAgent, getAgentStatus } = require("./agent-engine");

const app = express();
const PORT = 3000;
const SYMBOLS = ["BTCUSDT","ETHUSDT","SOLUSDT","BNBUSDT","XRPUSDT"];

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

async function bgFetch(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url);
      return await res.json();
    } catch (e) {
      if (attempt === 2) throw e;
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
}

app.get("/api/portfolio", (req, res) => res.json(loadPortfolio()));

app.post("/api/trade", (req, res) => {
  const { symbol, side, price, size } = req.body;
  res.json(executeTrade(symbol, side, price, size));
});

app.get("/api/price/:symbol", async (req, res) => {
  try {
    const data = await bgFetch(`https://api.bitget.com/api/v2/spot/market/tickers?symbol=${req.params.symbol}`);
    res.json(data);
  } catch(e) { res.status(503).json({ error: "Bitget unreachable" }); }
});

app.get("/api/candles/:symbol", async (req, res) => {
  try {
    const { symbol } = req.params;
    const granularity = req.query.granularity || "1h";
    const limit = req.query.limit || 120;
    const data = await bgFetch(`https://api.bitget.com/api/v2/spot/market/candles?symbol=${symbol}&granularity=${granularity}&limit=${limit}`);
    if (!data.data) return res.status(500).json({ error: "No candle data" });
    const seen = new Set();
    const candles = data.data.map(c => ({
      time: Math.floor(parseInt(c[0]) / 1000),
      open: parseFloat(c[1]), high: parseFloat(c[2]),
      low: parseFloat(c[3]), close: parseFloat(c[4])
    })).filter(c => {
      if (seen.has(c.time)) return false;
      seen.add(c.time); return true;
    });
    res.json(candles);
  } catch(e) { res.status(503).json({ error: "Bitget unreachable" }); }
});

app.get("/api/market-overview", async (req, res) => {
  try {
    const results = await Promise.all(SYMBOLS.map(async sym => {
      const data = await bgFetch(`https://api.bitget.com/api/v2/spot/market/tickers?symbol=${sym}`);
      return { symbol: sym, ...data.data[0] };
    }));
    res.json(results);
  } catch(e) { res.status(503).json({ error: "Bitget unreachable" }); }
});

app.get("/api/signals/:symbol", async (req, res) => {
  try { res.json(await getSignals(req.params.symbol)); }
  catch(e) { res.status(503).json({ error: e.message }); }
});

app.get("/api/scanner", async (req, res) => {
  try { res.json(await Promise.all(SYMBOLS.map(s => getSignals(s)))); }
  catch(e) { res.status(503).json({ error: e.message }); }
});

app.post("/api/risk-analysis", async (req, res) => {
  try {
    const { symbol, side, price, size } = req.body;
    const signals = await getSignals(symbol);
    const portfolio = loadPortfolio();
    const analysis = await analyzeRisk({ symbol, side, price, size }, signals, portfolio);
    logRiskAssessment({ symbol, side, price, size }, signals, analysis);
    res.json({ analysis, signals });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get("/api/risk-history", (req, res) => res.json(loadRiskHistory()));

app.get("/api/ai-brief", async (req, res) => {
  try {
    const signals = await Promise.all(SYMBOLS.map(s => getSignals(s)));
    res.json(await generateMarketBrief(signals));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/portfolio-doctor", async (req, res) => {
  try {
    const portfolio = loadPortfolio();
    const signals = await Promise.all(SYMBOLS.map(s => getSignals(s)));
    res.json(await portfolioDoctor(portfolio, signals));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get("/api/regime/:symbol", async (req, res) => {
  try {
    const data = await bgFetch(`https://api.bitget.com/api/v2/spot/market/candles?symbol=${req.params.symbol}&granularity=1day&limit=30`);
    if (!data.data) return res.json([]);
    const candles = data.data;
    const closes = candles.map(c => parseFloat(c[4]));
    const regimes = [];
    for (let i = 14; i < closes.length; i++) {
      const slice = closes.slice(i - 14, i + 1);
      const rsi = calculateRSI(slice, 14);
      const sma = slice.reduce((a, b) => a + b, 0) / slice.length;
      const price = closes[i];
      const regime = rsi === null ? "neutral"
        : (rsi > 55 && price > sma ? "bullish"
        : rsi < 45 && price < sma ? "bearish" : "neutral");
      const d = new Date(parseInt(candles[i][0]));
      regimes.push({ date: `${d.getMonth()+1}/${d.getDate()}`, regime, rsi: rsi ? rsi.toFixed(1) : "N/A" });
    }
    res.json(regimes.slice(-14));
  } catch(e) { res.json([]); }
});

app.post("/api/agent/start", (req, res) => {
  const { maxRiskScore, tradePercent } = req.body;
  res.json(startAgent({
    maxRiskScore: parseInt(maxRiskScore) || 5,
    tradePercent: parseFloat(tradePercent) || 3
  }));
});

app.post("/api/agent/stop", (req, res) => res.json(stopAgent()));

app.get("/api/agent/status", (req, res) => res.json(getAgentStatus()));

app.post("/api/backtest", async (req, res) => {
  try {
    const { symbol = "BTCUSDT" } = req.body;
    const data = await bgFetch(`https://api.bitget.com/api/v2/spot/market/candles?symbol=${symbol}&granularity=1h&limit=120`);
    if (!data.data) return res.status(500).json({ error: "No candle data" });

    const candles = data.data.map(c => ({ time: parseInt(c[0]), close: parseFloat(c[4]) }));
    const closes = candles.map(c => c.close);

    const rsiValues = [];
    for (let i = 14; i < closes.length; i++) {
      const slice = closes.slice(i - 14, i + 1);
      rsiValues.push({ rsi: calculateRSI(slice, 14), close: closes[i], time: candles[i].time });
    }

    let balance = 10000, position = 0, entryPrice = 0;
    const trades = [];

    for (let i = 1; i < rsiValues.length; i++) {
      const prev = rsiValues[i - 1];
      const curr = rsiValues[i];
      if (prev.rsi > 30 && curr.rsi <= 30 && position === 0 && balance > 100) {
        const size = parseFloat(((balance * 0.95) / curr.close).toFixed(6));
        balance -= size * curr.close;
        position = size; entryPrice = curr.close;
        trades.push({ type:"BUY", time:curr.time, price:curr.close, size, rsi:curr.rsi.toFixed(1), balance:parseFloat(balance.toFixed(2)) });
      }
      if (prev.rsi < 70 && curr.rsi >= 70 && position > 0) {
        const pnl = (position * curr.close) - (position * entryPrice);
        balance += position * curr.close;
        trades.push({ type:"SELL", time:curr.time, price:curr.close, size:position, rsi:curr.rsi.toFixed(1), pnl:parseFloat(pnl.toFixed(2)), balance:parseFloat(balance.toFixed(2)) });
        position = 0; entryPrice = 0;
      }
    }

    if (position > 0) {
      const lastClose = closes[closes.length - 1];
      const pnl = (position * lastClose) - (position * entryPrice);
      balance += position * lastClose;
      trades.push({ type:"CLOSE", time:candles[candles.length-1].time, price:lastClose, size:position, pnl:parseFloat(pnl.toFixed(2)), balance:parseFloat(balance.toFixed(2)) });
    }

    const completed = trades.filter(t => t.type === "SELL" || t.type === "CLOSE");
    const wins = completed.filter(t => t.pnl > 0).length;
    const totalPnl = balance - 10000;
    const winRate = completed.length > 0 ? ((wins / completed.length) * 100).toFixed(1) : "0.0";

    const prompt = `Analyze this paper trading backtest (no real money involved):
Strategy: RSI Reversal on ${symbol} — Buy when RSI crosses below 30, sell when RSI crosses above 70
Timeframe: Last 120 hourly candles (~5 days). Starting capital: $10,000. Final balance: $${balance.toFixed(2)}.
Total return: ${totalPnl >= 0?"+":""}${((totalPnl/10000)*100).toFixed(2)}%. Trades: ${completed.length}. Win rate: ${winRate}%.
Write a 3-4 sentence professional analysis referencing specific numbers, comment on whether RSI reversal suits current ${symbol} conditions, and suggest one concrete improvement.`;

    let aiAnalysis = "AI analysis unavailable.";
    try {
      const groqKey = process.env.GROQ_API_KEY || "";
      if (!groqKey) throw new Error("No key");
      const aiRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + groqKey },
        body: JSON.stringify({ model: "openai/gpt-oss-120b", reasoning_effort: "high", messages: [{ role:"user", content:prompt }] })
      });
      const aiData = await aiRes.json();
      if (aiData.choices && aiData.choices[0]) {
        aiAnalysis = aiData.choices[0].message.content;
      }
    } catch(e) { aiAnalysis = "AI analysis unavailable: " + e.message; }

    res.json({
      symbol,
      metrics: {
        startingBalance: 10000, finalBalance: parseFloat(balance.toFixed(2)),
        totalPnl: parseFloat(totalPnl.toFixed(2)),
        returnPct: parseFloat(((totalPnl/10000)*100).toFixed(2)),
        totalTrades: completed.length, wins, losses: completed.length - wins,
        winRate: parseFloat(winRate), candlesAnalyzed: candles.length
      },
      trades: trades.slice(-15),
      aiAnalysis
    });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.listen(PORT, () => console.log(`Watchdog running at http://localhost:${PORT}`));