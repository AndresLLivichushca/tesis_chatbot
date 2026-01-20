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

    // Extraemos las variables, incluyendo el historial que configuraremos en ManyChat
    const { action, cedula, last_user_message, historial_chat } = body;

    if (action === 'CONSULTA_GENERAL' || action === 'FACTURAS_ESTADO') {
      
      // 1. Consultamos datos reales en Odoo
      const factura = await consultarFacturasEnMake({ 
        cedula: String(cedula || body.cedula_cliente || '').trim() 
      });
      
      // 2. Generamos respuesta pasando el historial para que tenga memoria
      const respuestaIA = await generarRespuestaIA(
        last_user_message || body.mensaje_usuario || "Hola", 
        factura,
        historial_chat || ""
      );

      logInfo('Respuesta con memoria generada', { requestId, ms: Date.now() - startedAt });

      // Enviamos el objeto 'data' incluyendo el nuevo historial acumulado
      return res.json({
        ok: true,
        data: {
          ...factura,
          mensajeIA: respuestaIA,
          // Guardamos el hilo de la charla para la siguiente interacción
          nuevo_historial: `${historial_chat || ''}\nUsuario: ${last_user_message}\nIA: ${respuestaIA}`.trim()
        }
      });
    }

    return res.status(400).json({ ok: false, error: 'Acción no soportada' });

  } catch (err: any) {
    logError('Error en el controlador', { requestId, message: err?.message });
    return res.status(502).json({ ok: false, error: 'Error en la comunicación' });
  }
};