async function getCandles() {
  const url = "https://api.bitget.com/api/v2/spot/market/candles?symbol=BTCUSDT&granularity=1h&limit=5";
  const response = await fetch(url);
  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
}

getCandles();