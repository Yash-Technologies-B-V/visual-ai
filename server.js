require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Serve static files from the public folder
app.use(express.static('public'));

const AZURE_OPENAI_KEY = process.env.AZURE_OPENAI_KEY;
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const AZURE_OPENAI_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT;

// ✅ Route for dynamic prompt generation with logging
app.post('/api/generate-prompts', async (req, res) => {
  const { question, alignment } = req.body;
  const creativity = alignment < 34 ? "very creative" : alignment < 67 ? "balanced" : "literal";

  console.log("🔍 Incoming request to /api/generate-prompts");
  console.log("Question:", question);
  console.log("Alignment:", alignment);
  console.log("Creativity level:", creativity);

  try {
    const response = await axios.post(
      `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=2023-03-15-preview`,
      {
        messages: [
          {
            role: "system",
            content: `You are a prompt engineer. Suggest 3 ${creativity} prompt variations for the user query. Return them as a list.`
          },
          {
            role: "user",
            content: question
          }
        ],
        temperature: 0.8,
        max_tokens: 300
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'api-key': AZURE_OPENAI_KEY
        }
      }
    );

    console.log("✅ OpenAI response received:", response.data);

    const raw = response.data.choices[0].message.content;
    const prompts = raw.split('\n').filter(line => line.trim()).slice(0, 3);
    res.json({ prompts });
  } catch (error) {
    console.error("❌ Error generating prompts:", error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Route for chat completion
app.post('/api/chat', async (req, res) => {
  try {
    const response = await axios.post(
      `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=2023-03-15-preview`,
      req.body,
      {
        headers: {
          'Content-Type': 'application/json',
          'api-key': AZURE_OPENAI_KEY,
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error("❌ Error in /api/chat:", error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
