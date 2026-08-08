import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { GoogleGenAI } from '@google/genai';

// Custom Vite plugin to handle /api/diagnose during development
function apiDevPlugin() {
  return {
    name: 'api-dev-server',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        if (req.url?.startsWith('/api/diagnose')) {
          if (req.method === 'POST') {
            let body = '';
            req.on('data', (chunk: any) => { body += chunk; });
            req.on('end', async () => {
              try {
                const { errorOutput } = JSON.parse(body);
                const apiKey = process.env.GEMINI_API_KEY;

                if (!apiKey) {
                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({
                    suggestion: "Verify command syntax or package installation. (Offline Mode: Set GEMINI_API_KEY in Environment Settings for full live AI insights)"
                  }));
                  return;
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
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ suggestion }));
              } catch (err: any) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: err.message }));
              }
            });
          } else {
            res.writeHead(405);
            res.end('Method Not Allowed');
          }
        } else {
          next();
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), apiDevPlugin()],
  server: {
    port: 3000,
    host: '0.0.0.0',
    strictPort: true,
  }
});
