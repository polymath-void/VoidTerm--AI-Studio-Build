import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.use(express.json());

// Serve static files from Vite's build directory
app.use(express.static(path.join(__dirname, 'dist')));

// API Endpoint for diagnostics in production
app.post('/api/diagnose', async (req, res) => {
  try {
    const { errorOutput } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.json({
        suggestion: "Verify command syntax or package installation. (Offline Mode: Set GEMINI_API_KEY in Environment Settings for full live AI insights)"
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        "You are VoidTerm AI, a helpful shell assistant integrated inside an Android terminal launcher. The user's android command crashed or returned an error. Analyze the error output, diagnose the root cause, and provide a single concise 2-line suggested action in clean text. Keep it short and highly actionable.",
        `Error output:\n${errorOutput}`
      ]
    });

    const suggestion = response.text || 'Unable to analyze error context.';
    res.json({ suggestion });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Fallback to SPA router
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`🚀 Production server running on http://localhost:${port}`);
});
