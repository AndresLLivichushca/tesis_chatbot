import { Request, Response } from 'express';

export const handleIncoming = async (req: Request, res: Response) => {
  try {
    // 🔹 Variables que llegan desde ManyChat
    const {
      mensaje_usuario,
      paso_diagnostico,
      intentos_ips,
      ultimo_fue_falla
    } = req.body;

    let mensajeIA = '';
    let finalizar = false;

    // 🔹 Ejemplo de lógica simple (puedes reemplazar por IA)
    if (!mensaje_usuario) {
      mensajeIA = 'No recibí tu mensaje, ¿puedes repetirlo?';
    } else if (mensaje_usuario.toLowerCase().includes('gracias')) {
      mensajeIA = '¡Con gusto! Si necesitas algo más, aquí estaré 😊';
      finalizar = true;
    } else {
      mensajeIA = `Entiendo tu mensaje: "${mensaje_usuario}". Dame un momento para ayudarte.`;
    }

    // 🔹 RESPUESTA OBLIGATORIA PARA MANYCHAT
    return res.json({
      mensajeIA,
      finalizar,
      paso_diagnostico: paso_diagnostico ?? 0,
      intentos_ips: intentos_ips ?? 0,
      ultimo_fue_falla: false
    });

  } catch (error) {
    console.error('[ManyChat Error]', error);

    return res.json({
      mensajeIA: 'Ocurrió un error interno. Intenta nuevamente.',
      finalizar: true
    });
  }
};
