import { Request, Response } from 'express';
import { buscarClientePorCedula } from '../../../core/services/cliente.service';

export async function webhookManychat(req: Request, res: Response) {
  try {
    console.log('--- ENTRADA DE WEBHOOK MANYCHAT ---');
    console.log(req.body);

    const {
      cedula,
      mensaje_usuario = '',
    } = req.body;

    // 🔴 LOG 1
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

    // 🔴 CONSULTA REAL A MAKE / ODOO
    const cliente = await buscarClientePorCedula(cedula);

    // 🔴 LOG MÁS IMPORTANTE DE TODO
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

    // ✅ SI EXISTE, NO HAY DISCUSIÓN
    return res.json({
      ok: true,
      data: {
        mensajeIA: `Hola ${cliente.nombre}. Tu saldo pendiente es $${cliente.saldo}.`,
        estado: 'FINALIZAR',
        finalizar: true,
        paso_diagnostico: 0,
      },
    });

  } catch (error) {
    console.error('[ERROR WEBHOOK MANYCHAT]', error);

    return res.status(500).json({
      ok: false,
      error: 'Error interno del servidor',
    });
  }
}
