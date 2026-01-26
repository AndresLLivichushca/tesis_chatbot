import { Request, Response } from 'express';
import { buscarClientePorCedula } from '../../../core/services/cliente.service';

export async function webhookManychat(req: Request, res: Response) {
  try {
    console.log('--- ENTRADA DE WEBHOOK MANYCHAT ---');
    console.log(req.body);

    const body = req.body || {};
    const { cedula, mensaje_usuario } = body;

    console.log('[DEBUG] Cédula recibida:', cedula);
    console.log('[DEBUG] Mensaje usuario:', mensaje_usuario);

    // 🔹 Clasificador
    function clasificarProblema(texto: string) {
      const t = texto.toLowerCase();

      if (t.includes('saldo') || t.includes('factura') || t.includes('deuda')) {
        return 'SALDO';
      }

      if (
        t.includes('internet') ||
        t.includes('lento') ||
        t.includes('caido') ||
        t.includes('sin servicio')
      ) {
        return 'INTERNET';
      }

      return 'OTROS';
    }

    const tipoProblema = clasificarProblema(mensaje_usuario || '');
    console.log('[DEBUG] Tipo de problema detectado:', tipoProblema);

    // 1️⃣ Validar cédula
    if (!cedula) {
      return res.status(200).json({
        mensajeIA: 'Por favor envíame tu número de cédula.',
        estado: 'PEDIR_CEDULA',
        finalizar: false,
        paso_diagnostico: 0,
        tipo_problema: 'OTROS', // 🔴 SIEMPRE
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
        tipo_problema: tipoProblema, // 🔴 CLAVE
      });
    }

    // 3️⃣ SALDO / FACTURA
    const texto = (mensaje_usuario || '').toLowerCase();

    if (texto.includes('saldo') || texto.includes('deuda') || texto.includes('factura')) {
      return res.status(200).json({
        mensajeIA: `Hola ${cliente.nombre}. Tu saldo pendiente es $${cliente.saldo}.`,
        estado: 'RESPUESTA_SALDO',
        finalizar: false,
        paso_diagnostico: 0,
        tipo_problema: tipoProblema, // 🔴 CLAVE
      });
    }

    // 4️⃣ INTERNET (PASO SIGUIENTE)
    if (tipoProblema === 'INTERNET') {
      return res.status(200).json({
        mensajeIA:
          'Entiendo que tienes un problema con tu servicio de internet 📡 ¿Tu modem está encendido?',
        estado: 'DIAGNOSTICO_INTERNET_1',
        finalizar: false,
        paso_diagnostico: 1,
        tipo_problema: 'INTERNET',
      });
    }

    // 5️⃣ Fallback
    return res.status(200).json({
      mensajeIA:
        'Puedo ayudarte con consultas de saldo, facturas o problemas de internet. ¿En qué te ayudo?',
      estado: 'NO_ENTENDIDO',
      finalizar: false,
      paso_diagnostico: 0,
      tipo_problema: 'OTROS',
    });

  } catch (error) {
    console.error('[ERROR WEBHOOK MANYCHAT]', error);
    return res.status(500).json({
      mensajeIA: 'Error interno del servidor',
      estado: 'ERROR',
      finalizar: false,
      paso_diagnostico: 0,
      tipo_problema: 'OTROS',
    });
  }
}
