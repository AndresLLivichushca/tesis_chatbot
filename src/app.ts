import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { manychatRouter } from './interfaces/http/routes/manychat.routes';
import { requestIdMiddleware } from './interfaces/http/middlewares/requestId.middleware';

export const createApp = () => {
  const app = express();

  app.use(express.json());
  app.use(cors());
  app.use(helmet());
  app.use(rateLimit({ windowMs: 60_000, max: 120 }));

  app.use(requestIdMiddleware);

  app.get('/health', (_req, res) => res.json({ ok: true, service: 'isp-chatbot-backend' }));
  app.use('/webhooks/manychat', manychatRouter);

  app.use((err: any, _req: any, res: any, _next: any) => {
    console.error('[ERROR]', err);
    res.status(err?.status || 500).json({ error: err?.message || 'Server error' });
  });

  return app;
};
