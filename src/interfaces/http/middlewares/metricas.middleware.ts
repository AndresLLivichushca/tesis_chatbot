import { Request, Response, NextFunction } from 'express';
import { guardarMetrica } from '../../../core/services/metricas.service';

export const metricasMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const inicio = Date.now();

  res.on('finish', async () => {
    const tiempo = Date.now() - inicio;
    const exitoso = res.statusCode < 400;

    try {
      await guardarMetrica(
        req.originalUrl,
        tiempo,
        exitoso,
        req.requestId || 'unknown'
      );
    } catch (error) {
      console.error('Error guardando métrica', error);
    }
  });

  next();
};