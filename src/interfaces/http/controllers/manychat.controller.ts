import type { Request, Response } from 'express';
import { logError, logInfo } from '../../../shared/logger';
import { consultarFacturasEnMake } from '../../../core/services/make/make.facturas.service';

export const manychatController = {
  handleIncoming: async (req: Request, res: Response) => {
    const requestId = (req as any).requestId;

    try {
      const body = req.body;
      const startedAt = Date.now();
      logInfo('Incoming ManyChat', { requestId, body });

      const cedula = String(body.cedula ?? '').trim();

      if (body.action === 'FACTURAS_ESTADO') {
        const resultData = await consultarFacturasEnMake({ cedula });
        
        logInfo('FACTURAS_ESTADO OK', { requestId, ms: Date.now() - startedAt });

        // IMPORTANTE: Devolvemos 'data' como objeto plano para ManyChat
        return res.json({
          ok: true,
          requestId,
          data: resultData
        });
      }

      return res.status(400).json({ ok: false, error: 'Acción no soportada' });

    } catch (err: any) {
      logError('ManyChat handler error', { requestId, message: err?.message });
      return res.status(502).json({ ok: false, error: 'Error externo' });
    }
  },
};