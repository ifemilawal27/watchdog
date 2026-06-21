const { analyzeRisk } = require("./risk-analyst");
const { getSignals } = require("./signals");
const { loadPortfolio } = require("./trading-engine");

async function run() {
  const signals = await getSignals("BTCUSDT");
  const portfolio = loadPortfolio();
  const trade = { symbol: "BTCUSDT", side: "buy", price: signals.currentPrice, size: 0.05 };

  const result = await analyzeRisk(trade, signals, portfolio);
  console.log(JSON.stringify(result, null, 2));
}

run();