import { Request, Response } from 'express';
import { buscarClientePorCedula } from '../../../core/services/cliente.service';

export async function webhookManychat(req: Request, res: Response) {
  try {
    console.log('--- ENTRADA DE WEBHOOK MANYCHAT ---');
    console.log(req.body);

    const { cedula, mensaje_usuario } = req.body;

    console.log('[DEBUG] Cédula recibida:', cedula);
    console.log('[DEBUG] Mensaje usuario:', mensaje_usuario);

    // 1️⃣ Validación de cédula
    if (!cedula) {
      return res.status(200).json({
        mensajeIA: 'Por favor envíame tu número de cédula.',
        estado: 'PEDIR_CEDULA',
        finalizar: false,
        paso_diagnostico: 0,
      });
    }

    // 2️⃣ Buscar cliente
    const cliente = await buscarClientePorCedula(cedula);
    console.log('[DEBUG CLIENTE]', cliente);

    if (!cliente) {
      return res.status(200).json({
        mensajeIA:
          '❌ No encontré información asociada a esa cédula. Verifícala e inténtalo nuevamente.',
        estado: 'CEDULA_NO_ENCONTRADA',
        finalizar: false,
        paso_diagnostico: 0,
      });
    }

    // 3️⃣ Clasificación SIMPLE de intención (PASO 6 empieza aquí)
    const texto = (mensaje_usuario || '').toLowerCase();

    if (texto.includes('saldo') || texto.includes('deuda') || texto.includes('factura')) {
      return res.status(200).json({
        mensajeIA: `Hola ${cliente.nombre}. Tu saldo pendiente es $${cliente.saldo}.`,
        estado: 'RESPUESTA_SALDO',
        finalizar: false, // ⬅️ OJO: NO FINALIZA
        paso_diagnostico: 0,
      });
    }

    // 4️⃣ Fallback
    return res.status(200).json({
      mensajeIA:
        'Puedo ayudarte con consultas de saldo, facturas o problemas de internet. ¿En qué te ayudo?',
      estado: 'NO_ENTENDIDO',
      finalizar: false,
      paso_diagnostico: 0,
    });

  } catch (error) {
    console.error('[ERROR WEBHOOK MANYCHAT]', error);
    return res.status(500).json({
      mensajeIA: 'Error interno del servidor',
      estado: 'ERROR',
      finalizar: false,
    });
  }
}
