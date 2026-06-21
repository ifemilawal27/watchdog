require("dotenv").config();
const express = require("express");
const path = require("path");
const { loadPortfolio, executeTrade } = require("./trading-engine");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Returns the current paper portfolio: balance, positions, trade history
app.get("/api/portfolio", (req, res) => {
  const portfolio = loadPortfolio();
  res.json(portfolio);
});

// Executes a new simulated trade
app.post("/api/trade", (req, res) => {
  const { symbol, side, price, size } = req.body;
  const result = executeTrade(symbol, side, price, size);
  res.json(result);
});

// Fetches a live price from Bitget, routed through our own server
app.get("/api/price/:symbol", async (req, res) => {
  const { symbol } = req.params;
  const response = await fetch(`https://api.bitget.com/api/v2/spot/market/tickers?symbol=${symbol}`);
  const data = await response.json();
  res.json(data);
});

app.listen(PORT, () => {
  console.log(`Watchdog server running at http://localhost:${PORT}`);
});

const { getSignals } = require("./signals");

app.get("/api/signals/:symbol", async (req, res) => {
  const signals = await getSignals(req.params.symbol);
  res.json(signals);
});

const { analyzeRisk } = require("./risk-analyst");

app.post("/api/risk-analysis", async (req, res) => {
  const { symbol, side, price, size } = req.body;
  const signals = await getSignals(symbol);
  const portfolio = loadPortfolio();
  const analysis = await analyzeRisk({ symbol, side, price, size }, signals, portfolio);
  res.json({ analysis, signals });
});