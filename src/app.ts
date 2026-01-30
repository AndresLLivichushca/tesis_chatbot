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
app.use(metricasMiddleware);
  //  IMPORTANTE PARA RENDER / PROXIES
  app.set('trust proxy', 1);

  // 📦 Middlewares base (SIEMPRE antes de las rutas)
  app.use(express.json());
  app.use(cors());
  app.use(helmet());

  // 🚦 Rate limit global
  app.use(
    rateLimit({
      windowMs: 60_000, // 1 minuto
      max: 120,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  // 🆔 Request ID (para trazabilidad y métricas)
  app.use(requestIdMiddleware);

  // 🩺 Health check
  app.get('/health', (_req, res) => {
    res.json({
      ok: true,
      service: 'isp-chatbot-backend',
      timestamp: new Date().toISOString(),
    });
  });

  // 📊 Métricas
  app.use('/api', metricasRoutes);

  // 🤖 Webhook ManyChat
  app.use('/webhooks/manychat', manychatRouter);

  // ❌ Manejo global de errores
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
