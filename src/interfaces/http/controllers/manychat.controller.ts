import type { Request, Response } from 'express';
import { logError, logInfo } from '../../../shared/logger';
import { consultarFacturasEnMake } from '../../../core/services/make/make.facturas.service';
import { generarRespuestaIA } from '../../../core/ai/ai.service';

export const handleIncoming = async (req: Request, res: Response) => {
  const requestId = (req as any).requestId;

  try {
    const body = req.body;
    logInfo('Incoming ManyChat', { requestId, body });

    const {
      action,
      cedula,
      mensaje_usuario,
      historial_ips,
      paso_diagnostico,
      intentos_ips
    } = body;

    if (!cedula) {
      return res.status(400).json({ ok: false, error: 'Cédula requerida' });
    }

    const factura = await consultarFacturasEnMake({
      cedula: String(cedula).trim(),
    });

    const respuestaIA = await generarRespuestaIA(
      mensaje_usuario || "Hola",
      factura,
      historial_ips || "",
      Number(paso_diagnostico || 0)
    );

    const nuevoHistorial = `
Usuario: ${mensaje_usuario}
IA: ${respuestaIA}
`.trim();

    return res.json({
      ok: true,
      data: {
        mensaje_ia: respuestaIA,
        nuevo_historial: `${historial_ips || ''}\n${nuevoHistorial}`.trim(),
      },
    });

  } catch (err: any) {
    logError('Error en controlador ManyChat', {
      requestId,
      message: err?.message,
    });

    return res.status(502).json({
      ok: false,
      error: 'Error procesando solicitud',
    });
  }
};
