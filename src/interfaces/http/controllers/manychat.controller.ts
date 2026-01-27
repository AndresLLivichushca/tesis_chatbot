// src/controllers/manychat.controller.ts

import { Request, Response } from 'express';
import { AIService } from '../../../core/ai/ai.service';

export const webhookManychat = async (
  req: Request,
  res: Response
) => {
  try {
    // 🔐 Seguridad básica
    const secret = req.headers['x-webhook-secret'];
    if (secret !== process.env.MANYCHAT_WEBHOOK_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 📥 Datos desde ManyChat
    const {
      cedula,
      mensaje_usuario,
      intentos_soporte = 0,
      tipo_problema,
    } = req.body;
console.log('[MANYCHAT BODY]', req.body);

    if (!mensaje_usuario) {
      return res.json({
        mensajeIA: 'No recibí el mensaje del usuario.',
        estado: 'SEGUIR',
        finalizar: false,
        paso_diagnostico: 1,
        tipo_problema: 'OTRO',
      });
    }
console.log('[CEDULA]', cedula);
console.log('[MENSAJE]', mensaje_usuario);

    // 🤖 Llamada a la IA
    const iaResponse = await AIService.procesarMensaje({
      mensaje_usuario,
      intentos_soporte,
      tipo_problema,
    });

    // 📤 RESPUESTA A MANYCHAT (CLAVE)
    return res.json({
      mensajeIA: iaResponse.mensajeIA,
      estado: iaResponse.estado,
      finalizar: iaResponse.finalizar,
      paso_diagnostico: iaResponse.paso_diagnostico,
      tipo_problema: iaResponse.tipo_problema,
    });
  } catch (error) {
    console.error('Error webhook ManyChat:', error);

    // 🧯 Fallback seguro
    return res.json({
      mensajeIA:
        'Ocurrió un error inesperado. Te derivaré con un agente.',
      estado: 'ESCALAR',
      finalizar: true,
      paso_diagnostico: 0,
      tipo_problema: 'OTRO',
    });
  }
};
