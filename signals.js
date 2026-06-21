function calculateRSI(closes, period = 14) {
  if (closes.length < period + 1) return null;

  let gains = 0;
  let losses = 0;

  for (let i = closes.length - period; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    if (change >= 0) gains += change;
    else losses -= change;
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;

  if (avgLoss === 0) return 100;

  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

function calculateSMA(closes, period) {
  const slice = closes.slice(-period);
  const sum = slice.reduce((a, b) => a + b, 0);
  return sum / slice.length;
}

function calculateVolatility(closes) {
  const returns = [];
  for (let i = 1; i < closes.length; i++) {
    returns.push((closes[i] - closes[i - 1]) / closes[i - 1]);
  }
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
  return Math.sqrt(variance) * 100;
}

async function getSignals(symbol) {
  const url = `https://api.bitget.com/api/v2/spot/market/candles?symbol=${symbol}&granularity=1h&limit=50`;
  const response = await fetch(url);
  const result = await response.json();

  const candles = result.data;
  const closes = candles.map(c => parseFloat(c[4]));

  const currentPrice = closes[closes.length - 1];
  const rsi = calculateRSI(closes, 14);
  const sma20 = calculateSMA(closes, 20);
  const volatility = calculateVolatility(closes);
  const trend = currentPrice > sma20 ? "above_average" : "below_average";
  const trendStrength = (((currentPrice - sma20) / sma20) * 100).toFixed(2);

  return {
    symbol,
    currentPrice,
    rsi: rsi !== null ? rsi.toFixed(2) : "insufficient_data",
    sma20: sma20.toFixed(2),
    trend,
    trendStrengthPercent: trendStrength,
    volatilityPercent: volatility.toFixed(2),
    candlesAnalyzed: candles.length
  };
}

module.exports = { getSignals };