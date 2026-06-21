require("dotenv").config();

async function testGroq() {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: "openai/gpt-oss-120b",
      reasoning_effort: "high",
      messages: [
        { role: "user", content: "In one sentence, what is Bitcoin?" }
      ]
    })
  });

  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
}

testGroq();