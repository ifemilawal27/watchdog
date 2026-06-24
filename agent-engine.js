require("dotenv").config();
const { getSignals } = require("./signals");
const { analyzeRisk } = require("./risk-analyst");
const { executeTrade, loadPortfolio } = require("./trading-engine");
const { logRiskAssessment } = require("./risk-log");

const SYMBOLS = ["BTCUSDT","ETHUSDT","SOLUSDT","BNBUSDT","XRPUSDT"];

let agentRunning = false;
let agentInterval = null;
let agentLog = [];
let agentStats = { cycles: 0, tradesExecuted: 0, tradesSkipped: 0, aiCallsMade: 0 };
let agentConfig = { maxRiskScore: 5, tradePercent: 3, intervalMs: 120000 };

function addLog(type, message, detail = null) {
  agentLog.unshift({
    id: Date.now(),
    timestamp: new Date().toISOString(),
    type,
    message,
    detail
  });
  if (agentLog.length > 60) agentLog = agentLog.slice(0, 60);
}

async function getAgentDecision(allSignals, portfolio) {
  agentStats.aiCallsMade++;
  const sigLines = allSignals.map(s => {
    const ch = (parseFloat(s.change24h) * 100).toFixed(2);
    return `${s.symbol}: $${s.currentPrice} | RSI ${s.rsi} | trend ${s.trendStrengthPercent}% vs SMA20 | volatility ${s.volatilityPercent}% | 24h ${ch}%`;
  }).join("\n");

  const openPositions = Object.entries(portfolio.positions)
    .map(([sym, pos]) => `${sym}: ${pos.size} units @ avg $${pos.avgEntryPrice.toFixed(2)}`)
    .join(", ") || "none";

  const prompt = `You are an autonomous paper trading agent operating a simulated account with no real money. You scan the market every 2 minutes and decide whether to act.

Portfolio state:
- Available cash: $${portfolio.balance.toFixed(2)}
- Open positions: ${openPositions}
- Trade budget this cycle: $${((portfolio.balance * agentConfig.tradePercent) / 100).toFixed(2)} (${agentConfig.tradePercent}% of cash)

Live market signals:
${sigLines}

Decision rules you must follow:
- HOLD if no signal is compelling or if cash is below $50
- BUY if one pair has RSI below 40 AND is not already in open positions AND cash budget allows
- SELL if an open position's pair now has RSI above 62 OR trend has reversed significantly negative
- Never allocate more than the trade budget in one cycle

Respond in EXACTLY this format with no other text:
ACTION: [BUY or SELL or HOLD]
SYMBOL: [exact symbol like BTCUSDT, or NONE if HOLD]
SIZE_USD: [dollar amount e.g. 180.00, or 0 if HOLD]
REASON: [one sentence referencing specific signal values that drove this decision]`;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: "openai/gpt-oss-120b",
      reasoning_effort: "high",
      messages: [{ role: "user", content: prompt }]
    })
  });

  const data = await response.json();
  const content = data.choices[0].message.content;
  return {
    action: content.match(/ACTION:\s*(BUY|SELL|HOLD)/i)?.[1]?.toUpperCase() || "HOLD",
    symbol: content.match(/SYMBOL:\s*(\w+)/i)?.[1]?.toUpperCase() || "NONE",
    sizeUSD: parseFloat(content.match(/SIZE_USD:\s*([\d.]+)/i)?.[1] || "0"),
    reason: content.match(/REASON:\s*(.+)/i)?.[1]?.trim() || "No reason provided"
  };
}

async function runCycle() {
  if (!agentRunning) return;
  agentStats.cycles++;

  try {
    addLog("scan", `Cycle #${agentStats.cycles} — scanning all 5 pairs...`);
    const allSignals = await Promise.all(SYMBOLS.map(s => getSignals(s)));
    const portfolio = loadPortfolio();
    const decision = await getAgentDecision(allSignals, portfolio);

    addLog("decision",
      `Decision: ${decision.action}${decision.symbol !== "NONE" ? " " + decision.symbol : ""}`,
      decision.reason
    );

    if (decision.action === "HOLD" || decision.symbol === "NONE" || decision.sizeUSD <= 0) {
      agentStats.tradesSkipped++;
      addLog("skip", "Holding — no favorable opportunity detected this cycle.", decision.reason);
      return;
    }

    const signals = allSignals.find(s => s.symbol === decision.symbol) || allSignals[0];
    const price = signals.currentPrice;
    const size = parseFloat((decision.sizeUSD / price).toFixed(6));

    if (size <= 0) {
      addLog("skip", "Computed size too small — skipping.", null);
      return;
    }

    addLog("scan", `Running risk check: ${decision.action} ${size} ${decision.symbol} @ $${price.toFixed(2)}...`);

    const analysis = await analyzeRisk(
      { symbol: decision.symbol, side: decision.action.toLowerCase(), price, size },
      signals, portfolio
    );
    logRiskAssessment(
      { symbol: decision.symbol, side: decision.action.toLowerCase(), price, size },
      signals, analysis
    );

    if (analysis.riskScore > agentConfig.maxRiskScore) {
      agentStats.tradesSkipped++;
      addLog("skip",
        `Trade blocked — risk score ${analysis.riskScore}/10 exceeds threshold of ${agentConfig.maxRiskScore}/10.`,
        analysis.explanation
      );
      return;
    }

    const result = executeTrade(decision.symbol, decision.action.toLowerCase(), price, size);

    if (result.success) {
      agentStats.tradesExecuted++;
      addLog("trade",
        `EXECUTED: ${decision.action} ${size} ${decision.symbol} @ $${price.toFixed(2)} — Risk ${analysis.riskScore}/10`,
        decision.reason
      );
    } else {
      agentStats.tradesSkipped++;
      addLog("skip", `Execution failed: ${result.message}`, null);
    }
  } catch (err) {
    addLog("error", `Agent error: ${err.message}`, null);
  }
}

function startAgent(config = {}) {
  if (agentRunning) return { success: false, message: "Agent already running" };
  agentConfig = { ...agentConfig, ...config };
  agentRunning = true;
  agentStats = { cycles: 0, tradesExecuted: 0, tradesSkipped: 0, aiCallsMade: 0 };
  agentLog = [];
  addLog("scan", `Agent initializing — max risk ${agentConfig.maxRiskScore}/10, ${agentConfig.tradePercent}% per trade, cycle every ${agentConfig.intervalMs / 1000}s`);
  agentInterval = setInterval(runCycle, agentConfig.intervalMs);
  runCycle();
  return { success: true };
}

function stopAgent() {
  if (!agentRunning) return { success: false, message: "Agent not running" };
  clearInterval(agentInterval);
  agentRunning = false;
  addLog("decision", `Agent stopped. Cycles completed: ${agentStats.cycles} | Trades executed: ${agentStats.tradesExecuted}`);
  return { success: true };
}

function getAgentStatus() {
  return { running: agentRunning, config: agentConfig, stats: agentStats, log: agentLog };
}

module.exports = { startAgent, stopAgent, getAgentStatus };