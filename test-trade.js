const { executeTrade } = require("./trading-engine");

// Simulate buying 0.1 BTC at the live price we already confirmed earlier
const result = executeTrade("BTCUSDT", "buy", 63534.7, 0.1);

console.log(JSON.stringify(result, null, 2));