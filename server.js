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

// ✅ New route for dynamic prompt generation
app.post('/api/generate-prompts', async (req, res) => {
  const { question, alignment } = req.body;
  const creativity = alignment < 34 ? "very creative" : alignment < 67 ? "balanced" : "literal";

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

    const raw = response.data.choices[0].message.content;
    const prompts = raw.split('\n').filter(line => line.trim()).slice(0, 3);
    res.json({ prompts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Existing chat completion route
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
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
