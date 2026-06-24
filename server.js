require("dotenv").config();
const express = require("express");
const path = require("path");
const { loadPortfolio, executeTrade } = require("./trading-engine");
const { getSignals, calculateRSI } = require("./signals");
const { analyzeRisk } = require("./risk-analyst");
const { loadRiskHistory, logRiskAssessment } = require("./risk-log");
const { generateMarketBrief, portfolioDoctor } = require("./ai-narrator");

const app = express();
const PORT = 3000;
const SYMBOLS = ["BTCUSDT","ETHUSDT","SOLUSDT","BNBUSDT","XRPUSDT"];

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/portfolio", (req, res) => res.json(loadPortfolio()));

app.post("/api/trade", (req, res) => {
  const { symbol, side, price, size } = req.body;
  res.json(executeTrade(symbol, side, price, size));
});

app.get("/api/price/:symbol", async (req, res) => {
  const r = await fetch(`https://api.bitget.com/api/v2/spot/market/tickers?symbol=${req.params.symbol}`);
  res.json(await r.json());
});

app.get("/api/candles/:symbol", async (req, res) => {
  const { symbol } = req.params;
  const granularity = req.query.granularity || "1h";
  const limit = req.query.limit || 120;
  const r = await fetch(`https://api.bitget.com/api/v2/spot/market/candles?symbol=${symbol}&granularity=${granularity}&limit=${limit}`);
  const data = await r.json();
  if (!data.data) return res.status(500).json({ error: "No candle data" });
  const seen = new Set();
  const candles = data.data.map(c => ({
    time: Math.floor(parseInt(c[0]) / 1000),
    open: parseFloat(c[1]), high: parseFloat(c[2]),
    low: parseFloat(c[3]), close: parseFloat(c[4])
  })).filter(c => { if (seen.has(c.time)) return false; seen.add(c.time); return true; });
  res.json(candles);
});

app.get("/api/market-overview", async (req, res) => {
  const results = await Promise.all(SYMBOLS.map(async sym => {
    const r = await fetch(`https://api.bitget.com/api/v2/spot/market/tickers?symbol=${sym}`);
    const d = await r.json();
    return { symbol: sym, ...d.data[0] };
  }));
  res.json(results);
});

app.get("/api/signals/:symbol", async (req, res) => res.json(await getSignals(req.params.symbol)));

app.get("/api/scanner", async (req, res) => res.json(await Promise.all(SYMBOLS.map(s => getSignals(s)))));

app.post("/api/risk-analysis", async (req, res) => {
  const { symbol, side, price, size } = req.body;
  const signals = await getSignals(symbol);
  const portfolio = loadPortfolio();
  const analysis = await analyzeRisk({ symbol, side, price, size }, signals, portfolio);
  logRiskAssessment({ symbol, side, price, size }, signals, analysis);
  res.json({ analysis, signals });
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
    const r = await fetch(`https://api.bitget.com/api/v2/spot/market/candles?symbol=${req.params.symbol}&granularity=1day&limit=30`);
    const data = await r.json();
    if (!data.data) return res.json([]);
    const candles = data.data;
    const closes = candles.map(c => parseFloat(c[4]));
    const regimes = [];
    for (let i = 14; i < closes.length; i++) {
      const slice = closes.slice(i - 14, i + 1);
      const rsi = calculateRSI(slice, 14);
      const sma = slice.reduce((a, b) => a + b, 0) / slice.length;
      const price = closes[i];
      const regime = rsi === null ? "neutral" : (rsi > 55 && price > sma ? "bullish" : rsi < 45 && price < sma ? "bearish" : "neutral");
      const d = new Date(parseInt(candles[i][0]));
      regimes.push({ date: `${d.getMonth()+1}/${d.getDate()}`, regime, rsi: rsi ? rsi.toFixed(1) : "N/A" });
    }
    res.json(regimes.slice(-14));
  } catch(e) { res.json([]); }
});

app.listen(PORT, () => console.log(`Watchdog running at http://localhost:${PORT}`));