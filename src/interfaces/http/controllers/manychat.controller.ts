import { Request, Response } from 'express';
import { consultarFacturasEnMake } from '../../../core/services/make/make.facturas.service';
import { ejecutarDiagnosticoIA } from '../../../core/ai/ai.service';
import { detectarIntencionIA } from '../../../core/ai/ai.router.service';

export const handleIncoming = async (req: Request, res: Response) => {
  try {
    const {
      cedula, // Campo cedula_cliente de ManyChat
      mensaje_usuario,
      paso_diagnostico = 0,
      intentos_ips = 0,
      ultimo_fue_falla = false
    } = req.body;

    console.log('[ManyChat] Mensaje recibido:', mensaje_usuario);

    // 1️⃣ Detectar intención con la IA
    const router = await detectarIntencionIA(mensaje_usuario);
    console.log('[IA] Intención detectada:', router.intencion);

    /**
     * ===============================
     * 🟢 CASO: SALDO / FACTURA
     * ===============================
     */
    if (router.intencion === 'SALDO' || router.intencion === 'FACTURA') {
      const factura = await consultarFacturasEnMake({ cedula });
      
      const mensajeSaldo = factura.tieneDeuda
        ? `Hola ${factura.nombreCliente} 😊. Tu saldo es de $${factura.montoPendiente}. Vence el: ${factura.fechaVencimiento ?? 'no disponible'}.`
        : `Hola ${factura.nombreCliente} 🙌. No tienes deudas pendientes. Tu servicio está ${factura.estadoServicio.toLowerCase()}.`;

      return res.json({
        ok: true,
        data: {
          mensajeIA: mensajeSaldo,
          estado: 'FINALIZAR',
          finalizar: true,
          paso_diagnostico: 0
        }
      });
    }

    /**
     * ===============================
     * 🟢 CASO: SOPORTE TÉCNICO EXPERTO
     * ===============================
     */
    const resultadoIA = await ejecutarDiagnosticoIA({
      mensajeUsuario: mensaje_usuario,
      pasoDiagnostico: paso_diagnostico,
      intentosIps: intentos_ips,
      ultimoFueFalla: ultimo_fue_falla
    });

    // Lógica de escalamiento (5 intentos o decisión de la IA)
    const limiteAlcanzado = intentos_ips >= 5 || resultadoIA.estado === 'DIAGNOSTICO_AGOTADO' || router.intencion === 'SOPORTE';

    if (limiteAlcanzado) {
      return res.json({
        ok: true,
        data: {
          mensajeIA: "He agotado mis opciones técnicas 🛠️. Te transferiré con un asesor humano para una revisión avanzada.",
          estado: 'DIAGNOSTICO_AGOTADO',
          finalizar: true,
          intentos_ips: intentos_ips + 1
        }
      });
    }

    // Respuesta normal del experto
    return res.json({
      ok: true,
      data: {
        mensajeIA: resultadoIA.mensaje,
        estado: resultadoIA.estado,
        finalizar: resultadoIA.finalizar,
        paso_diagnostico: resultadoIA.reset_paso ? 0 : paso_diagnostico + (resultadoIA.paso_incremento || 1),
        intentos_ips: intentos_ips + 1,
        ultimo_fue_falla: resultadoIA.ultimo_fue_falla
      }
    });

  } catch (error) {
    console.error('[ManyChat Error]', error);
    return res.status(500).json({
      ok: false,
      data: {
        mensajeIA: 'Ocurrió un error al procesar tu solicitud con la IA.',
        finalizar: true
      }
    });
  }
};