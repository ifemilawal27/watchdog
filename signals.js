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
  return slice.reduce((a, b) => a + b, 0) / slice.length;
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
  const [candlesRes, tickerRes] = await Promise.all([
    fetch(`https://api.bitget.com/api/v2/spot/market/candles?symbol=${symbol}&granularity=1h&limit=50`),
    fetch(`https://api.bitget.com/api/v2/spot/market/tickers?symbol=${symbol}`)
  ]);

  const candleData = await candlesRes.json();
  const tickerData = await tickerRes.json();
  const ticker = tickerData.data[0];
  const candles = candleData.data;
  const closes = candles.map(c => parseFloat(c[4]));

  const currentPrice = closes[closes.length - 1];
  const rsi = calculateRSI(closes, 14);
  const sma20 = calculateSMA(closes, 20);
  const volatility = calculateVolatility(closes);
  const trendStrength = ((currentPrice - sma20) / sma20) * 100;

  return {
    symbol,
    currentPrice,
    change24h: parseFloat(ticker.change24h),
    high24h: parseFloat(ticker.high24h),
    low24h: parseFloat(ticker.low24h),
    rsi: rsi !== null ? rsi.toFixed(2) : "insufficient_data",
    sma20: sma20.toFixed(2),
    trend: currentPrice > sma20 ? "above_average" : "below_average",
    trendStrengthPercent: trendStrength.toFixed(2),
    volatilityPercent: volatility.toFixed(2),
    candlesAnalyzed: candles.length
  };
}

module.exports = { getSignals, calculateRSI };