import { Request, Response } from 'express';
import { buscarClientePorCedula } from '../../../core/services/cliente.service';

type TipoProblema = 'SALDO' | 'INTERNET' | 'OTRO';

function clasificarProblema(texto: string): TipoProblema {
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

    // 🔐 Seguridad
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

    // 1️⃣ Pedir cédula
    if (!cedula) {
      return res.json({
        respuesta_ia_ips: 'Por favor envíame tu número de cédula.',
        estado: 'PEDIR_CEDULA',
        cliente_existe: null,
        nombre_cliente: null,
        intentos_soporte: 0,
        finalizar: false,
      });
    }

    // 2️⃣ Validación dura de cliente
    const cliente = await buscarClientePorCedula(cedula);

    if (!cliente) {
      return res.json({
        respuesta_ia_ips:
          '❌ Cliente no registrado.\n\n' +
          'No encontramos información asociada a esta cédula.\n' +
          'Por favor revisa tu contrato o acércate a un centro de atención.',
        estado: 'CLIENTE_NO_REGISTRADO',
        cliente_existe: false,
        nombre_cliente: null,
        intentos_soporte: 0,
        finalizar: true,
      });
    }

    // 🧱 BASE PARA CLIENTE VÁLIDO (CLAVE)
    const baseCliente = {
      cliente_existe: true,
      nombre_cliente: cliente.nombre,
      intentos_soporte: intentos,
    };

    // 3️⃣ Detectar tipo de problema
    const esPlaceholder =
      typeof tipo_problema === 'string' && tipo_problema.includes('{{');

    const tipoDetectado: TipoProblema =
      tipo_problema && !esPlaceholder && tipo_problema !== 'OTRO'
        ? tipo_problema
        : clasificarProblema(mensaje);

    // 💰 SALDO
    if (tipoDetectado === 'SALDO') {
      return res.json({
        ...baseCliente,
        respuesta_ia_ips: `👨‍💻 Hola ${cliente.nombre}, tu saldo pendiente es de $${cliente.saldo}.`,
        estado: 'RESPUESTA_SALDO',
        tipo_problema: 'SALDO',
        finalizar: true,
      });
    }

    // 🌐 INTERNET
    if (tipoDetectado === 'INTERNET') {

      if (intentos === 0) {
        return res.json({
          ...baseCliente,
          respuesta_ia_ips:
            '🔌 Reinicia tu router desconectándolo por 30 segundos.',
          estado: 'PASO_1',
          tipo_problema: 'INTERNET',
          intentos_soporte: 1,
          finalizar: false,
        });
      }

      if (resultado_paso === 'NO' && intentos === 1) {
        return res.json({
          ...baseCliente,
          respuesta_ia_ips:
            '📶 Verifica que las luces del router estén encendidas.',
          estado: 'PASO_2',
          tipo_problema: 'INTERNET',
          intentos_soporte: 2,
          finalizar: false,
        });
      }

      if (resultado_paso === 'SI') {
        return res.json({
          ...baseCliente,
          respuesta_ia_ips: '✅ ¡Excelente! El servicio fue restablecido.',
          estado: 'RESUELTO',
          tipo_problema: 'INTERNET',
          finalizar: true,
        });
      }

      return res.json({
        ...baseCliente,
        respuesta_ia_ips:
          '❗ No se pudo resolver automáticamente. Un agente te contactará.',
        estado: 'ESCALAR',
        tipo_problema: 'INTERNET',
        finalizar: true,
      });
    }

    // ❓ NO ENTENDIDO
    return res.json({
      ...baseCliente,
      respuesta_ia_ips:
        'Puedo ayudarte con consultar tu saldo o con problemas de internet.',
      estado: 'NO_ENTENDIDO',
      finalizar: false,
    });

  } catch (error) {
    console.error('[ERROR MANYCHAT]', error);
    return res.json({
      respuesta_ia_ips: 'Ocurrió un error. Te derivaré con un agente.',
      estado: 'ERROR',
      cliente_existe: true,
      nombre_cliente: null,
      intentos_soporte: 0,
      finalizar: true,
    });
  }
};
