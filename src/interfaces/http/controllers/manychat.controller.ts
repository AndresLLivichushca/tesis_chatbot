import type { Request, Response } from 'express';
import { logError, logInfo } from '../../../shared/logger';
import { consultarFacturasEnMake } from '../../../core/services/make/make.facturas.service';
import { generarRespuestaIA } from '../../../core/ai/ai.service';

export const handleIncoming = async (req: Request, res: Response) => {
  const requestId = (req as any).requestId;

  try {
    const body = req.body;
    const startedAt = Date.now();
    logInfo('Incoming ManyChat', { requestId, body });

    // Extraemos las variables que configuraste en ManyChat
    const { action, cedula, last_user_message } = body;

    // Acción unificada para tu tesis
    if (action === 'CONSULTA_GENERAL' || action === 'FACTURAS_ESTADO') {
      
      // 1. Consultamos datos reales en Odoo vía Make
      const factura = await consultarFacturasEnMake({ 
        cedula: String(cedula || body.cedula_cliente || '').trim() 
      });
      
      // 2. La IA genera la respuesta usando los datos técnicos y el mensaje del usuario
      const respuestaIA = await generarRespuestaIA(
        last_user_message || body.mensaje_usuario || "Hola", 
        factura
      );

      logInfo('Respuesta generada con éxito', { requestId, ms: Date.now() - startedAt });

      // Enviamos el objeto 'data' que ManyChat mapeará
      return res.json({
        ok: true,
        data: {
          ...factura,
          mensajeIA: respuestaIA 
        }
      });
    }

    return res.status(400).json({ ok: false, error: 'Acción no soportada' });

  } catch (err: any) {
    logError('Error en el controlador', { requestId, message: err?.message });
    return res.status(502).json({ ok: false, error: 'Error en la comunicación con servicios externos' });
  }
};