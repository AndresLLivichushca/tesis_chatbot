import { Request, Response } from 'express';
import { buscarClientePorCedula } from '../../../core/services/cliente.service';

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
    t.includes('caido') ||
    t.includes('no funciona')
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
      problema_cliente,
      tipo_problema,
      resultado_paso,
      intentos_soporte = 0,
    } = req.body;

    const mensaje = mensaje_usuario || problema_cliente || '';
    const intentos = Number(intentos_soporte) || 0;

    // 1️⃣ Sin mensaje
    if (!mensaje && !resultado_paso) {
      return res.json({
        respuesta_ia_ips: 'Cuéntame si deseas consultar tu saldo o tienes problemas con el internet.',
        estado: 'PEDIR_PROBLEMA',
        finalizar: false,
        tipo_problema: 'OTRO',
      });
    }

    // 2️⃣ Detectar tipo problema
    const esPlaceholderManychat =
      typeof tipo_problema === 'string' && tipo_problema.includes('{{');

    let tipoDetectado: 'SALDO' | 'INTERNET' | 'OTRO';

    if (tipo_problema && !esPlaceholderManychat && tipo_problema !== 'OTRO') {
      tipoDetectado = tipo_problema;
    } else {
      tipoDetectado = clasificarProblema(mensaje);
    }

    console.log('[TIPO DETECTADO]', tipoDetectado);

    // 3️⃣ Validar cédula
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
        respuesta_ia_ips: '❌ No encontré un cliente con esa cédula.',
        estado: 'CEDULA_NO_ENCONTRADA',
        finalizar: false,
        tipo_problema: 'OTRO',
      });
    }

    // 💰 FLUJO SALDO (YA FUNCIONA)
    if (tipoDetectado === 'SALDO') {
      return res.json({
        respuesta_ia_ips: `👨‍💻 Hola ${cliente.nombre}, tu saldo pendiente es de $${cliente.saldo}.`,
        estado: 'RESPUESTA_SALDO',
        finalizar: false,
        tipo_problema: 'SALDO',
      });
    }

    // 🌐 FLUJO INTERNET (MENSAJES ESTÁTICOS)
    if (tipoDetectado === 'INTERNET') {

      // Paso 1
      if (intentos === 0) {
        return res.json({
          respuesta_ia_ips:
            '🔌 Por favor reinicia tu router desconectándolo por 30 segundos y vuelve a conectarlo.\n\n¿El servicio ya funciona?',
          estado: 'PASO_1',
          finalizar: false,
          tipo_problema: 'INTERNET',
          intentos_soporte: 1,
        });
      }

      // Paso 2
      if (resultado_paso === 'NO' && intentos === 1) {
        return res.json({
          respuesta_ia_ips:
            '📶 Verifica que las luces del router estén encendidas correctamente.\n\n¿Tu internet ya funciona?',
          estado: 'PASO_2',
          finalizar: false,
          tipo_problema: 'INTERNET',
          intentos_soporte: 2,
        });
      }

      // Resuelto
      if (resultado_paso === 'SI') {
        return res.json({
          respuesta_ia_ips: '✅ ¡Excelente! Me alegra saber que tu internet ya funciona.',
          estado: 'RESUELTO',
          finalizar: true,
          tipo_problema: 'INTERNET',
        });
      }

      // Escalar
      return res.json({
        respuesta_ia_ips:
          '❗ No se pudo resolver automáticamente. Un agente de soporte se comunicará contigo.',
        estado: 'ESCALAR',
        finalizar: true,
        tipo_problema: 'INTERNET',
      });
    }

    // ❓ Fallback
    return res.json({
      respuesta_ia_ips:
        'Puedo ayudarte con consultar tu saldo o con problemas de internet. ¿Qué deseas hacer?',
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
