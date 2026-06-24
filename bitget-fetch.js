async function bitgetFetch(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      return await response.json();
    } catch (e) {
      if (i === retries - 1) throw new Error(`Bitget unreachable after ${retries} attempts: ${e.message}`);
      await new Promise(r => setTimeout(r, 1200 * (i + 1)));
    }
  }
}

module.exports = { bitgetFetch };