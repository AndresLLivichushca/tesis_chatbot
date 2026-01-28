import { Request, Response } from 'express';
import { buscarClientePorCedula } from '../../../core/services/cliente.service';
import { AIService } from '../../../core/ai/ai.service';

function clasificarProblema(texto: string): 'SALDO' | 'INTERNET' | 'OTRO' {
  const t = texto.toLowerCase();

  if (
    t.includes('saldo') ||
    t.includes('factura') ||
    t.includes('deuda') ||
    t.includes('pagar')
  ) return 'SALDO';

  if (
    t.includes('internet') ||
    t.includes('lento') ||
    t.includes('no tengo') ||
    t.includes('sin servicio') ||
    t.includes('caido')
  ) return 'INTERNET';

  return 'OTRO';
}

export const webhookManychat = async (req: Request, res: Response) => {
  try {
    console.log('--- MANYCHAT WEBHOOK ---');
    console.log('[BODY]', req.body);

    const secret = req.headers['x-webhook-secret'];
    if (secret !== process.env.MANYCHAT_WEBHOOK_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      cedula,
      mensaje_usuario,
      tipo_problema,
      intentos_soporte = 0,
    } = req.body;

    if (!mensaje_usuario) {
      console.warn('[WARN] mensaje_usuario vacío');
      return res.json({
        respuesta_ia_ips: 'No recibí tu mensaje, ¿puedes repetirlo?',
        estado: 'SEGUIR',
        finalizar: false,
        tipo_problema: tipo_problema ?? 'OTRO',
      });
    }

    const esPlaceholderManychat =
  typeof tipo_problema === 'string' &&
  tipo_problema.includes('{{');

let tipoDetectado: 'SALDO' | 'INTERNET' | 'OTRO';

if (
  tipo_problema &&
  !esPlaceholderManychat &&
  tipo_problema !== 'OTRO'
) {
  tipoDetectado = tipo_problema;
} else {
  tipoDetectado = clasificarProblema(mensaje_usuario);
}

console.log('[TIPO FINAL]', tipoDetectado);

    if (!cedula) {
      return res.json({
        respuesta_ia_ips: 'Por favor envíame tu número de cédula.',
        estado: 'PEDIR_CEDULA',
        finalizar: false,
        tipo_problema: 'OTRO',
      });
    }

    const cliente = await buscarClientePorCedula(cedula);
    console.log('[CLIENTE]', cliente);

    if (!cliente) {
      return res.json({
        respuesta_ia_ips: '❌ Cédula no encontrada.',
        estado: 'CEDULA_NO_ENCONTRADA',
        finalizar: false,
        tipo_problema: 'OTRO',
      });
    }

    // 💰 SALDO (INTOCABLE)
    if (tipoDetectado === 'SALDO') {
      return res.json({
        respuesta_ia_ips: `👨‍💻 Hola ${cliente.nombre}, tu saldo pendiente es $${cliente.saldo}.`,
        estado: 'RESPUESTA_SALDO',
        finalizar: false,
        tipo_problema: 'SALDO',
      });
    }

    // 🌐 INTERNET
    if (tipoDetectado === 'INTERNET') {
      const ia = await AIService.procesarMensaje({
        mensaje_usuario,
        intentos_soporte: Number(intentos_soporte) || 0,
      });

      return res.json({
        ...ia,
        tipo_problema: 'INTERNET',
      });
    }

    return res.json({
      respuesta_ia_ips:
        'Puedo ayudarte con saldo o problemas de internet. ¿Qué deseas consultar?',
      estado: 'NO_ENTENDIDO',
      finalizar: false,
      tipo_problema: 'OTRO',
    });
  } catch (error) {
    console.error('[ERROR MANYCHAT]', error);

    return res.json({
      respuesta_ia_ips: 'Ocurrió un error. Te derivaré con un agente.',
      estado: 'ERROR',
      finalizar: true,
      tipo_problema: 'OTRO',
    });
  }
};
