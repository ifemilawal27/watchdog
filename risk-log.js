const fs = require("fs");
const path = require("path");

const RISK_LOG_FILE = path.join(__dirname, "risk-history.json");

function loadRiskHistory() {
  if (!fs.existsSync(RISK_LOG_FILE)) {
    fs.writeFileSync(RISK_LOG_FILE, JSON.stringify([]));
    return [];
  }
  return JSON.parse(fs.readFileSync(RISK_LOG_FILE, "utf-8"));
}

function logRiskAssessment(trade, signals, analysis) {
  const history = loadRiskHistory();
  history.unshift({
    id: Date.now(),
    timestamp: new Date().toISOString(),
    symbol: trade.symbol,
    side: trade.side,
    price: trade.price,
    size: trade.size,
    riskScore: analysis.riskScore,
    explanation: analysis.explanation,
    rsi: signals.rsi,
    trend: signals.trendStrengthPercent,
    volatility: signals.volatilityPercent
  });
  fs.writeFileSync(RISK_LOG_FILE, JSON.stringify(history, null, 2));
}

module.exports = { loadRiskHistory, logRiskAssessment };