import type { Request, Response } from 'express';
import { consultarFacturasEnMake } from '../../../core/services/make/make.facturas.service';
import { generarRespuestaIA } from '../../../core/ai/ai.service';

export const handleIncoming = async (req: Request, res: Response) => {
  try {
    const {
      cedula,
      mensaje_usuario,
      historial_chat,
      paso_diagnostico = 0,
      intentos_ips = 0,
    } = req.body;

    // Consultar datos de la factura
    const factura = await consultarFacturasEnMake({ cedula });

    // Generar respuesta con la nueva lógica
    const resultado = await generarRespuestaIA(
      mensaje_usuario,
      factura,
      historial_chat || '',
      Number(paso_diagnostico),
      Number(intentos_ips)
    );

    // Formatear el nuevo historial para ManyChat
    const nuevoHistorial = `${historial_chat || ''}\nUsuario: ${mensaje_usuario}\nIA: ${resultado.texto}`.trim();

    return res.json({
      ok: true,
      data: {
        mensajeIA: resultado.texto,
        nuevo_historial: nuevoHistorial,
        // Informamos a ManyChat si debe aumentar el contador
        es_diagnostico: resultado.esDiagnostico
      },
    });
  } catch (error) {
    console.error('Error en controlador:', error);
    return res.status(500).json({ ok: false });
  }
};