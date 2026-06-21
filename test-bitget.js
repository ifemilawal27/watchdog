// This is our first test: can we pull a real, live price from Bitget?

async function getBitcoinPrice() {
  const url = "https://api.bitget.com/api/v2/spot/market/tickers?symbol=BTCUSDT";

  const response = await fetch(url);
  const data = await response.json();

  console.log("Full response from Bitget:");
  console.log(JSON.stringify(data, null, 2));
}

getBitcoinPrice();