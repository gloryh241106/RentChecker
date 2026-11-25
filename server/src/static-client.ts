import path from 'node:path';
import express from 'express';
import type { Express } from 'express';

// Docker only. Vercel ignores express.static and serves client/dist itself.
export function mountClient(app: Express, staticDir: string): void {
  const indexFile = path.resolve(staticDir, 'index.html');
  app.use(express.static(staticDir));
  app.get('/{*splat}', (_req, res, next) => {
    res.sendFile(indexFile, (error) => {
      if (error) next(error);
    });
  });
}
