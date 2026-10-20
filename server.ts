import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './src/server/api.ts';
import { getDb } from './src/server/db.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  // Initialize SQLite database
  getDb();

  // Middleware for JSON body parsing
  app.use(express.json());

  // Mount API endpoints: support both /api/* and direct /* routes (e.g. /expenses, /reports)
  app.use('/api', apiRouter);
  app.use('/', apiRouter);

  // In development, hook up Vite middleware; in production, serve built dist files
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res, next) => {
      // Don't intercept API requests that weren't matched
      if (req.path.startsWith('/api') || req.path.startsWith('/reports') || req.path.startsWith('/expenses')) {
        return next();
      }
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SpendWise server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start SpendWise server:', err);
  process.exit(1);
});
