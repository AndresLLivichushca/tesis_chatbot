import type { Request, Response } from 'express';
import { consultarFacturasEnMake } from '../../../core/services/make/make.facturas.service';
import { generarRespuestaIA } from '../../../core/ai/ai.service';

export const handleIncoming = async (req: Request, res: Response) => {
  const {
    cedula,
    mensaje_usuario,
    historial_chat = '',
    paso_diagnostico = 0
  } = req.body;
// Limpieza de historial en el controlador
let historialLimpio = historial_chat;
if (historial_chat.includes('{{cuf') || historial_chat === 'null' || historial_chat === '.') {
    historialLimpio = ""; 
}
  const factura = await consultarFacturasEnMake({ cedula });

  const resultado = await generarRespuestaIA(
    mensaje_usuario,
    factura,
    historial_chat,
    paso_diagnostico
  );

  return res.json({
    ok: true,
    data: {
      mensajeIA: resultado.texto,
      nuevo_historial:
        `${historial_chat}\nUsuario: ${mensaje_usuario}\nIA: ${resultado.texto}`.trim(),
      puntos_a_sumar: resultado.esDiagnostico ? 1 : 0,
      reset_paso: resultado.resetPaso || false
    }
  });
};
