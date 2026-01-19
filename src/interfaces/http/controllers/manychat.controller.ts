import type { Request, Response } from 'express';
import { logInfo, logError } from '../../../shared/logger';
import { consultarFacturasEnMake } from '../../../core/services/make/make.facturas.service';

export const manychatController = {
  handleIncoming: async (req: Request, res: Response) => {
    const requestId = (req as any).requestId;

    try {
      const body = req.body;
      logInfo('Incoming ManyChat', { requestId, body });

      if (body.action === 'FACTURAS_ESTADO') {
        const result = await consultarFacturasEnMake({ cedula: body.cedula });
        
        // La respuesta debe ir dentro de la llave 'data' para el mapeo de ManyChat
        return res.json({
          ok: true,
          requestId,
          data: result
        });
      }

      return res.status(400).json({ ok: false, error: 'Acción no soportada' });
    } catch (err: any) {
      logError('Error en controlador', { requestId, message: err.message });
      return res.status(502).json({ ok: false, error: 'Error externo' });
    }
  },
};