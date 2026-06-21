require("dotenv").config();

async function analyzeRisk(trade, signals, portfolio) {
  const prompt = `You are a risk analyst reviewing a simulated (paper) crypto trade. No real money is involved — this is a paper trading sandbox for a hackathon project.

Trade being considered:
- Asset: ${trade.symbol}
- Side: ${trade.side.toUpperCase()}
- Price: $${trade.price}
- Size: ${trade.size}
- Total value: $${(trade.price * trade.size).toFixed(2)}

Current portfolio:
- Cash balance: $${portfolio.balance.toFixed(2)}

Market signals (computed from live Bitget data):
- RSI (14-period): ${signals.rsi}
- Current price vs 20-period average: ${signals.trendStrengthPercent}% (${signals.trend})
- Recent volatility: ${signals.volatilityPercent}%

Provide your analysis in this exact format:
RISK_SCORE: [a number from 1 to 10, where 1 is very low risk and 10 is very high risk]
EXPLANATION: [2-3 sentences explaining the score, referencing the specific signals above]`;

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
  const message = data.choices[0].message;
  const content = message.content;
  const reasoning = message.reasoning || "";

  const scoreMatch = content.match(/RISK_SCORE:\s*(\d+)/i);
  const explanationMatch = content.match(/EXPLANATION:\s*([\s\S]*)/i);

  return {
    riskScore: scoreMatch ? parseInt(scoreMatch[1]) : null,
    explanation: explanationMatch ? explanationMatch[1].trim() : content,
    fullReasoning: reasoning
  };
}

module.exports = { analyzeRisk };