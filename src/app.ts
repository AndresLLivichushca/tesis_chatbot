import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { manychatRouter } from './interfaces/http/routes/manychat.routes';
import metricasRoutes from './interfaces/http/routes/metricas.routes';
import { requestIdMiddleware } from './interfaces/http/middlewares/requestId.middleware';
import { metricasMiddleware } from './interfaces/http/middlewares/metricas.middleware';
export const createApp = () => {
  const app = express();

  // IMPORTANTE PARA RENDER
  app.set('trust proxy', 1);

  app.use(express.json());
  app.use(cors());
  app.use(helmet());

  app.use(
    rateLimit({
      windowMs: 60_000,
      max: 120,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  // 🆔 PRIMERO requestId
  app.use(requestIdMiddleware);

  // 📊 DESPUÉS métricas
  app.use(metricasMiddleware);

  app.get('/health', (_req, res) => {
    res.json({
      ok: true,
      service: 'isp-chatbot-backend',
      timestamp: new Date().toISOString(),
    });
  });

  app.use('/api', metricasRoutes);
  app.use('/webhooks/manychat', manychatRouter);

  app.use((err: any, _req: any, res: any, _next: any) => {
    console.error('[ERROR]', err);
    res.status(err?.status || 500).json({
      mensajeIA: 'Error interno del servidor',
      estado: 'ERROR',
      finalizar: false,
    });
  });

  return app;
};
