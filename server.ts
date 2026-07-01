import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

// Import Vercel serverless handlers
import sendAlertHandler from './api/mail/send-alert.js';
import rssHandler from './api/rss.xml.js';
import adsHandler from './api/ads.txt.js';

// Load environment variables
dotenv.config();

// Helper to adapt Vercel serverless handler (req, res) to Express middleware (req, res)
const adaptVercelHandler = (handler: any) => {
  return async (req: express.Request, res: express.Response) => {
    try {
      // Vercel serverless request body is already parsed by express.json()
      await handler(req as any, res as any);
    } catch (error: any) {
      console.error('Error in adapted Vercel handler:', error);
      if (!res.headersSent) {
        res.status(500).send(error?.message || 'Internal Server Error');
      }
    }
  };
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Enable JSON request body parsing
  app.use(express.json());

  // Backend mail endpoint for automated subscriber alerting adapted from the Vercel handler
  app.post('/api/mail/send-alert', adaptVercelHandler(sendAlertHandler));

  // Dynamically serve dynamic RSS Feed endpoint adapted from the Vercel handler
  app.get('/rss.xml', adaptVercelHandler(rssHandler));

  // Serve the ads.txt file adapted from the Vercel handler
  app.get('/ads.txt', adaptVercelHandler(adsHandler));

  // Connect Vite configuration dynamically to support dev vs prod modes
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server successfully started. Running on http://localhost:${PORT}`);
  });
}

startServer();
