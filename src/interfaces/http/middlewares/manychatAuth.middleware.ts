import type { Request, Response, NextFunction } from 'express';
import { loadEnv } from '../../../config/env';

const env = loadEnv();

/**
 * ManyChat -> Node: validar header secreto
 * ManyChat puede enviar headers custom en External Request.
 */
export const manychatAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const secret = req.header('x-webhook-secret');
  if (!secret || secret !== env.MANYCHAT_WEBHOOK_SECRET) {
    return res.status(401).json({
      ok: false,
      error: 'Unauthorized webhook',
      requestId: (req as any).requestId,
    });
  }
  next();
};
