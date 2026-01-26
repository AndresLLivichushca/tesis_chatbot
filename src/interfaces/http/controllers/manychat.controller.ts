import { Request, Response } from 'express';
import { buscarClientePorCedula } from '../../../core/services/cliente.service';

export async function webhookManychat(req: Request, res: Response) {
  try {
    console.log('--- ENTRADA DE WEBHOOK MANYCHAT ---');
    console.log(req.body);

    const { cedula } = req.body;
    console.log('[DEBUG] Cédula recibida:', cedula);

    if (!cedula) {
      return res.status(200).json({
        mensajeIA: 'Por favor envíame tu número de cédula.',
        estado: 'PEDIR_CEDULA',
        finalizar: false,
        paso_diagnostico: 0,
      });
    }

    const cliente = await buscarClientePorCedula(cedula);
    console.log('[DEBUG CLIENTE]', cliente);

    if (!cliente) {
      return res.status(200).json({
        mensajeIA:
          'Hola Cliente No Registrado 🙌. No tienes deudas pendientes. Tu servicio está desconocido.',
        estado: 'FINALIZAR',
        finalizar: true,
        paso_diagnostico: 0,
      });
    }

    return res.status(200).json({
      mensajeIA: '🧪 TEST BACKEND OK - MENSAJE DESDE API',
      estado: 'FINALIZAR',
      finalizar: true,
      paso_diagnostico: 0,
    });


  } catch (error) {
    console.error('[ERROR WEBHOOK MANYCHAT]', error);
    return res.status(500).json({
      mensajeIA: 'Error interno del servidor',
      estado: 'ERROR',
      finalizar: true,
    });
  }
}
