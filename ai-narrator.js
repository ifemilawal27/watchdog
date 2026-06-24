require("dotenv").config();

async function callGroq(prompt) {
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
  return data.choices[0].message.content;
}

async function generateMarketBrief(signalsArray) {
  const lines = signalsArray.map(s =>
    `${s.symbol}: $${s.currentPrice} | RSI ${s.rsi} | Trend ${s.trendStrengthPercent}% vs SMA20 | 24h ${(parseFloat(s.change24h)*100).toFixed(2)}% | Volatility ${s.volatilityPercent}%`
  ).join("\n");

  const prompt = `You are a senior crypto market strategist delivering a real-time briefing to a trading desk. Current UTC time: ${new Date().toUTCString()}.

Live market data across 5 pairs:
${lines}

Provide a concise, professional briefing in this exact format (no extra text before or after):
SENTIMENT: [exactly one of: BULLISH / BEARISH / NEUTRAL / CAUTIOUS]
HEADLINE: [one punchy 8-12 word sentence capturing the dominant market theme right now]
BRIEF: [2-3 sentences. Reference specific pairs by name. Be specific about what the signals mean collectively. Sound like a Bloomberg terminal alert, not a textbook.]
WATCHLIST: [Symbol only e.g. ETHUSDT] — [one sentence: exactly why this pair deserves attention right now based on its specific signal values]`;

  const content = await callGroq(prompt);
  return {
    sentiment: content.match(/SENTIMENT:\s*(\w+)/i)?.[1]?.toUpperCase() || "NEUTRAL",
    headline: content.match(/HEADLINE:\s*(.+)/i)?.[1]?.trim() || "Market signals require attention",
    brief: content.match(/BRIEF:\s*([\s\S]*?)(?=WATCHLIST:|$)/i)?.[1]?.trim() || "",
    watchlist: content.match(/WATCHLIST:\s*(.+)/i)?.[1]?.trim() || "",
    timestamp: new Date().toISOString()
  };
}

async function portfolioDoctor(portfolio, signalsArray) {
  const totalValue = portfolio.balance + Object.entries(portfolio.positions).reduce((sum, [sym, pos]) => {
    const sig = signalsArray.find(s => s.symbol === sym);
    return sum + (sig ? pos.size * sig.currentPrice : pos.size * pos.avgEntryPrice);
  }, 0);

  const positionSummary = Object.entries(portfolio.positions).map(([sym, pos]) => {
    const sig = signalsArray.find(s => s.symbol === sym);
    const cp = sig ? sig.currentPrice : pos.avgEntryPrice;
    const pnl = ((cp - pos.avgEntryPrice) * pos.size);
    const pnlPct = ((pnl / (pos.avgEntryPrice * pos.size)) * 100).toFixed(2);
    return `${sym}: ${pos.size} units @ avg $${pos.avgEntryPrice.toFixed(2)} | current $${cp.toFixed(2)} | PnL ${pnlPct}%`;
  }).join("\n") || "No open positions.";

  const signalSummary = signalsArray.map(s =>
    `${s.symbol}: RSI ${s.rsi}, trend ${s.trendStrengthPercent}% vs SMA20`
  ).join(" | ");

  const prompt = `You are a portfolio risk manager reviewing a paper trading simulation account. No real money is involved.

Account:
- Total value: $${totalValue.toFixed(2)} (started at $10,000.00)
- Cash available: $${portfolio.balance.toFixed(2)}
- Total trades executed: ${portfolio.trades.length}

Open positions:
${positionSummary}

Live market signals: ${signalSummary}

Provide your diagnosis in this exact format (no extra text):
HEALTH_SCORE: [integer 0-100 where 100 is optimal]
DIAGNOSIS: [one professional sentence summarizing portfolio health]
REC_1: [specific actionable recommendation based on positions and current signals]
REC_2: [second specific recommendation]
REC_3: [third specific recommendation]
WARNING: [the single most important risk to flag right now, or "Portfolio appears well-balanced." if genuinely healthy]`;

  const content = await callGroq(prompt);
  return {
    healthScore: Math.min(100, Math.max(0, parseInt(content.match(/HEALTH_SCORE:\s*(\d+)/i)?.[1] || "50"))),
    diagnosis: content.match(/DIAGNOSIS:\s*(.+)/i)?.[1]?.trim() || "Analysis complete.",
    recommendations: [
      content.match(/REC_1:\s*(.+)/i)?.[1]?.trim(),
      content.match(/REC_2:\s*(.+)/i)?.[1]?.trim(),
      content.match(/REC_3:\s*(.+)/i)?.[1]?.trim()
    ].filter(Boolean),
    warning: content.match(/WARNING:\s*(.+)/i)?.[1]?.trim() || "None",
    timestamp: new Date().toISOString()
  };
}

module.exports = { generateMarketBrief, portfolioDoctor };