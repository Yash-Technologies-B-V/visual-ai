
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const AZURE_OPENAI_KEY = process.env.AZURE_OPENAI_KEY;
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;

app.post('/api/chat', async (req, res) => {
  try {
    const response = await axios.post(
      `${AZURE_OPENAI_ENDPOINT}/openai/deployments/YOUR_DEPLOYMENT_NAME/chat/completions?api-version=2023-03-15-preview`,
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
