import { Request, Response } from 'express';
import { buscarClientePorCedula } from '../../../core/services/cliente.service';
import { AIService } from '../../../core/ai/ai.service';

/**
 * Clasificación del problema (BACKEND decide)
 */
function clasificarProblema(texto: string): 'SALDO' | 'INTERNET' | 'OTRO' {
  const t = texto.toLowerCase();

  if (
    t.includes('saldo') ||
    t.includes('factura') ||
    t.includes('deuda') ||
    t.includes('pagar')
  ) {
    return 'SALDO';
  }

  if (
    t.includes('internet') ||
    t.includes('lento') ||
    t.includes('no tengo') ||
    t.includes('sin servicio') ||
    t.includes('caido')
  ) {
    return 'INTERNET';
  }

  return 'OTRO';
}

export const webhookManychat = async (req: Request, res: Response) => {
  try {
    const {
      cedula,
      mensaje_usuario,
      intentos_soporte = 0,
      tipo_problema,
    } = req.body;

    // 1️⃣ Pedir cédula
    if (!cedula) {
      return res.json({
        respuesta_ia_ips: 'Por favor envíame tu número de cédula para continuar.',
        estado: 'PEDIR_CEDULA',
        finalizar: false,
        tipo_problema: 'OTRO',
      });
    }

    const cliente = await buscarClientePorCedula(cedula);

    if (!cliente) {
      return res.json({
        respuesta_ia_ips: 'No encontré información con esa cédula.',
        estado: 'PEDIR_CEDULA',
        finalizar: false,
        tipo_problema: 'OTRO',
      });
    }

    if (!mensaje_usuario) {
      return res.json({
        respuesta_ia_ips: 'No recibí tu mensaje, ¿puedes repetirlo?',
        estado: 'SEGUIR',
        finalizar: false,
        tipo_problema: tipo_problema ?? 'OTRO',
      });
    }

    // 🔒 Congelar intención
    const tipoDetectado =
      tipo_problema && tipo_problema !== 'OTRO'
        ? tipo_problema
        : clasificarProblema(mensaje_usuario);

    // 💰 SALDO
    if (tipoDetectado === 'SALDO') {
      return res.json({
        respuesta_ia_ips: `👋 Hola ${cliente.nombre}, tu saldo pendiente es $${cliente.saldo}.`,
        estado: 'SALDO',
        finalizar: true,
        tipo_problema: 'SALDO',
      });
    }

    // 🌐 INTERNET
    if (tipoDetectado === 'INTERNET') {
      const ia = await AIService.procesarMensaje({
        mensaje_usuario,
        intentos_soporte: Number(intentos_soporte),
      });

      return res.json({
        respuesta_ia_ips: ia.respuesta_ia_ips,
        estado: ia.estado,
        finalizar: ia.finalizar,
        tipo_problema: 'INTERNET',
      });
    }

    // ❓ Fallback
    return res.json({
      respuesta_ia_ips:
        'Puedo ayudarte con saldo o problemas de internet. ¿Qué deseas consultar?',
      estado: 'SEGUIR',
      finalizar: false,
      tipo_problema: 'OTRO',
    });
  } catch (error) {
    console.error('[WEBHOOK ERROR]', error);
    return res.json({
      respuesta_ia_ips: 'Ocurrió un error inesperado.',
      estado: 'ESCALAR',
      finalizar: true,
      tipo_problema: 'OTRO',
    });
  }
};
