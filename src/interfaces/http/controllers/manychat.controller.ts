import type { Request, Response } from 'express';
import { consultarFacturasEnMake } from '../../../core/services/make/make.facturas.service';
import { ejecutarDiagnosticoIA } from '../../../core/ai/ai.service';

export const handleIncoming = async (req: Request, res: Response) => {
  try {
    const {
      cedula,
      mensaje_usuario,
      historial_chat = '',
      paso_diagnostico = 0,
      intentos_ips = 0,
      ultimo_fue_falla = false
    } = req.body;

    // 🧼 Limpieza de historial (bug {{cuf}})
    let historialLimpio = historial_chat;
    if (
      historial_chat.includes('{{cuf') ||
      historial_chat === 'null' ||
      historial_chat === '.'
    ) {
      historialLimpio = '';
    }

    // 📡 Consulta a Make (facturación)
    const factura = await consultarFacturasEnMake({ cedula });

    // 🤖 IA manda TODO el flujo
    const resultado = await ejecutarDiagnosticoIA({
      mensajeUsuario: mensaje_usuario,
      pasoDiagnostico: paso_diagnostico,
      intentosIps: intentos_ips,
      ultimoFueFalla: ultimo_fue_falla
    });

    // 🧠 Historial nuevo
    const nuevoHistorial = `
${historialLimpio}
Usuario: ${mensaje_usuario}
IA: ${resultado.mensaje}
`.trim();

    // 📤 RESPUESTA LIMPIA PARA MANYCHAT
    return res.json({
      ok: true,
      data: {
        mensajeIA: resultado.mensaje,

        // Estado del flujo
        estado: resultado.estado,
        finalizar: resultado.finalizar,

        // Control del diagnóstico
        paso_incremento: resultado.paso_incremento,
        intentos_incremento: resultado.intentos_incremento,
        reset_paso: resultado.reset_paso,
        ultimo_fue_falla: resultado.ultimo_fue_falla,

        // Memoria
        nuevo_historial: nuevoHistorial
      }
    });
  } catch (error) {
    console.error('[handleIncoming] ERROR:', error);

    return res.status(500).json({
      ok: false,
      error: 'Error procesando la solicitud'
    });
  }
};
