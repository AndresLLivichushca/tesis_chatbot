import type { Request, Response } from 'express';
import { logError, logInfo } from '../../../shared/logger';
import { consultarFacturasEnMake } from '../../../core/services/make/make.facturas.service';
import { generarRespuestaIA } from '../../../core/ai/ai.service';
//integracion controlador
export const handleIncoming = async (req: Request, res: Response) => {
  const requestId = (req as any).requestId;

  try {
    const body = req.body;
    const startedAt = Date.now();
    logInfo('Incoming ManyChat', { requestId, body });

    const { action, cedula, last_user_message } = body;

    if (action === 'FACTURAS_ESTADO') {
      // 1. Obtenemos los datos de la factura
      const factura = await consultarFacturasEnMake({ cedula: String(cedula).trim() });
      
      // 2. Generamos la respuesta con IA usando el mensaje del usuario y los datos de la factura
      const respuestaIA = await generarRespuestaIA(last_user_message || "Hola, ¿cuál es mi estado?", factura);

      logInfo('FACTURAS_ESTADO con IA OK', { requestId, ms: Date.now() - startedAt });

      return res.json({
        ok: true,
        requestId,
        data: {
          ...factura,
          mensajeIA: respuestaIA // Esta es la variable que debes mapear en ManyChat
        }
      });
    }

    return res.status(400).json({ ok: false, error: 'Acción no soportada' });

  } catch (err: any) {
    logError('ManyChat handler error', { requestId, message: err?.message });
    return res.status(502).json({ ok: false, error: 'Error externo' });
  }
};