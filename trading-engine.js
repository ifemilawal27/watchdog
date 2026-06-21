const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "portfolio.json");
const STARTING_BALANCE = 10000;

// Load the portfolio from disk, or create a fresh one if this is our first time running
function loadPortfolio() {
  if (!fs.existsSync(DATA_FILE)) {
    const freshPortfolio = {
      balance: STARTING_BALANCE,
      positions: {},
      trades: []
    };
    savePortfolio(freshPortfolio);
    return freshPortfolio;
  }
  const raw = fs.readFileSync(DATA_FILE, "utf-8");
  return JSON.parse(raw);
}

// Save the portfolio back to disk
function savePortfolio(portfolio) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(portfolio, null, 2));
}

// Execute a simulated trade. side must be "buy" or "sell"
function executeTrade(symbol, side, price, size) {
  const portfolio = loadPortfolio();
  const cost = price * size;

  if (side === "buy") {
    if (cost > portfolio.balance) {
      return { success: false, message: "Not enough paper balance for this trade." };
    }
    portfolio.balance -= cost;

    if (!portfolio.positions[symbol]) {
      portfolio.positions[symbol] = { size: 0, avgEntryPrice: 0 };
    }
    const existing = portfolio.positions[symbol];
    const totalSize = existing.size + size;
    const totalCost = (existing.size * existing.avgEntryPrice) + cost;
    existing.avgEntryPrice = totalCost / totalSize;
    existing.size = totalSize;
  }

  if (side === "sell") {
    const existing = portfolio.positions[symbol];
    if (!existing || existing.size < size) {
      return { success: false, message: "Not enough of this asset to sell." };
    }
    portfolio.balance += price * size;
    existing.size -= size;
    if (existing.size === 0) {
      delete portfolio.positions[symbol];
    }
  }

  const trade = {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    symbol,
    side,
    price,
    size,
    balanceAfter: portfolio.balance
  };
  portfolio.trades.push(trade);
  savePortfolio(portfolio);

  return { success: true, trade, portfolio };
}

module.exports = { loadPortfolio, executeTrade };