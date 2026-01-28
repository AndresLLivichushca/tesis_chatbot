import { Request, Response } from 'express';
import { buscarClientePorCedula } from '../../../core/services/cliente.service';
import { AIService } from '../../../core/ai/ai.service';

/**
 * Clasificación del problema (BACKEND decide, NO ManyChat)
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
    // 🔐 Seguridad
    const secret = req.headers['x-webhook-secret'];
    if (secret !== process.env.MANYCHAT_WEBHOOK_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('--- WEBHOOK MANYCHAT ---');
    console.log('[BODY]', req.body);

    const {
      cedula,
      mensaje_usuario,
      intentos_soporte = 0,
    } = req.body;

    if (!mensaje_usuario) {
      return res.json({
        mensajeIA: 'No recibí tu mensaje, ¿puedes repetirlo?',
        estado: 'SEGUIR',
        finalizar: false,
        paso_diagnostico: 0,
        tipo_problema: 'OTRO',
      });
    }

    console.log('[CEDULA]', cedula);
    console.log('[MENSAJE]', mensaje_usuario);

    // 🔎 Clasificación REAL
    const tipoDetectado =
    req.body.tipo_problema || clasificarProblema(mensaje_usuario);

    console.log('[TIPO DETECTADO]', tipoDetectado);

    // 1️⃣ Validar cédula
    if (!cedula) {
      return res.json({
        mensajeIA: 'Por favor envíame tu número de cédula para continuar.',
        estado: 'PEDIR_CEDULA',
        finalizar: false,
        paso_diagnostico: 0,
        tipo_problema: 'OTRO',
      });
    }

    // 2️⃣ Buscar cliente
    const cliente = await buscarClientePorCedula(cedula);
    console.log('[CLIENTE]', cliente);

    if (!cliente) {
      return res.json({
        mensajeIA:
          '❌ No encontré información asociada a esa cédula. Verifícala e inténtalo nuevamente.',
        estado: 'CEDULA_NO_ENCONTRADA',
        finalizar: false,
        paso_diagnostico: 0,
        tipo_problema: 'OTRO',
      });
    }

    // ==========================
    // 💰 CASO SALDO (CERRADO)
    // ==========================
    if (tipoDetectado === 'SALDO') {
      return res.json({
        mensajeIA: `👨‍💻 Hola ${cliente.nombre}, tu saldo pendiente es $${cliente.saldo}.`,
        nombre: cliente.nombre,
        estado: 'RESPUESTA_SALDO',
        finalizar: false, // 👈 IMPORTANTE (ManyChat sigue)
        paso_diagnostico: 0,
        tipo_problema: 'SALDO',
      });
    }

   
// 🌐 INTERNET (IA REAL)
// ==========================
      if (tipoDetectado === 'INTERNET') {

        const iaResponse = await AIService.procesarMensaje({
          mensaje_usuario,
          intentos_soporte,
        });

        return res.json({
          mensajeIA: iaResponse.mensajeIA,
          estado: iaResponse.estado,        // SEGUIR | ESCALAR
          finalizar: iaResponse.finalizar,  // true | false
          tipo_problema: 'INTERNET',
        });
      }


    // ==========================
    // ❓ FALLBACK
    // ==========================
    return res.json({
      mensajeIA:
        'Puedo ayudarte con consultas de saldo, facturas o problemas de internet. ¿En qué te ayudo?',
      estado: 'NO_ENTENDIDO',
      finalizar: false,
      paso_diagnostico: 0,
      tipo_problema: 'OTRO',
    });

  } catch (error) {
    console.error('[ERROR WEBHOOK MANYCHAT]', error);

    return res.json({
      mensajeIA:
        'Ocurrió un error inesperado. Te derivaré con un agente.',
      estado: 'ERROR',
      finalizar: true,
      paso_diagnostico: 0,
      tipo_problema: 'OTRO',
    });
  }
};
