import type { Request, Response } from 'express';
import { consultarFacturasEnMake } from '../../../core/services/make/make.facturas.service';
import { generarRespuestaIA } from '../../../core/ai/ai.service';

export const handleIncoming = async (req: Request, res: Response) => {
  try {
    console.log('--- NUEVA SOLICITUD MANYCHAT ---');
    console.log('Body recibido:', JSON.stringify(req.body, null, 2));

    const { cedula, mensaje_usuario, historial_chat, paso_diagnostico = 0, intentos_ips = 0 } = req.body;

    const factura = await consultarFacturasEnMake({ cedula });
    const resultado = await generarRespuestaIA(mensaje_usuario, factura, historial_chat, paso_diagnostico, intentos_ips);

    console.log(`[Render] Respuesta generada: ${resultado.texto}`);
    console.log(`[Render] ¿Es diagnóstico?: ${resultado.esDiagnostico}`);

   return res.json({
    ok: true,
    data: {
      mensajeIA: resultado.texto,
      nuevo_historial: `${historial_chat}\nUsuario: ${mensaje_usuario}\nIA: ${resultado.texto}`.trim(),
      // Si la IA dice que es diagnóstico, mandamos un 1, si no un 0
      puntos_a_sumar: resultado.esDiagnostico ? 1 : 0 
    },
  });
  } catch (error) {
    console.error('[Error Render]:', error);
    return res.status(500).json({ ok: false });
  }
};