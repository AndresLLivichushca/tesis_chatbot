import type { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

export const requestIdMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  const incoming = req.header('x-request-id');
  req.requestId = incoming || crypto.randomUUID();
  next();
};
