import { Request, Response } from 'express';
import { buscarClientePorCedula } from '../../../core/services/cliente.service';

export async function webhookManychat(req: Request, res: Response) {
  try {
    console.log('--- ENTRADA DE WEBHOOK MANYCHAT ---');
    console.log(req.body);

    const { cedula } = req.body;

    // 🔴 LOG CLAVE
    console.log('[DEBUG] Cédula recibida:', cedula);

    if (!cedula) {
      return res.json({
        ok: true,
        data: {
          mensajeIA: 'Por favor envíame tu número de cédula.',
          estado: 'PEDIR_CEDULA',
          finalizar: false,
          paso_diagnostico: 0,
        },
      });
    }

    // 🔴 LLAMADA REAL A MAKE
    const cliente = await buscarClientePorCedula(cedula);

    // 🔴 LOG DEFINITIVO
    console.log('[DEBUG CLIENTE]', cliente);

    if (!cliente) {
      return res.json({
        ok: true,
        data: {
          mensajeIA:
            'Hola Cliente No Registrado 🙌. No tienes deudas pendientes. Tu servicio está desconocido.',
          estado: 'FINALIZAR',
          finalizar: true,
          paso_diagnostico: 0,
        },
      });
    }

    // ✅ AQUÍ YA NO DEBE HABER undefined
    return res.status(200).json({
  mensajeIA: `Hola ${cliente.nombre}. Tu saldo pendiente es $${cliente.saldo}.`,
  estado: 'FINALIZAR',
  finalizar: true,
  paso_diagnostico: 0,
});


  } catch (error) {
    console.error('[ERROR WEBHOOK MANYCHAT]', error);
    return res.status(500).json({
      ok: false,
      error: 'Error interno del servidor',
    });
  }
}
