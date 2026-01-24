import type { Request, Response } from 'express';
import { consultarFacturasEnMake } from '../../../core/services/make/make.facturas.service';
import { ejecutarDiagnosticoIA } from '../../../core/ai/ai.service';
import { detectarIntencionIA } from '../../../core/ai/ai.router.service';

export const handleIncoming = async (req: Request, res: Response) => {
  try {
    const {
      cedula,
      mensaje_usuario,
      historial_chat = '',
      paso_diagnostico = 0,
      intentos_ips = 0,
      ultimo_fue_falla = false
    } = req.body;

    // 1️⃣ Detectar intención
    const router = await detectarIntencionIA(mensaje_usuario);
    console.log('INTENCION DETECTADA:', router);

    const mensajeLower = mensaje_usuario.toLowerCase();

    if (
      mensajeLower.includes('saldo') ||
      mensajeLower.includes('deuda') ||
      mensajeLower.includes('factura') ||
      mensajeLower.includes('pagar')
    ) {
      const factura = await consultarFacturasEnMake({ cedula });

      const mensajeSaldo = factura.tieneDeuda
        ? `Hola ${factura.nombreCliente} 😊  
    Tu saldo pendiente es de $${factura.montoPendiente}.  
    Fecha de vencimiento: ${factura.fechaVencimiento ?? 'no registrada'}.

    ¿Deseas pagar ahora o necesitas ayuda?`
        : `Hola ${factura.nombreCliente} 🙌  
    No registramos valores pendientes.  
    Tu servicio se encuentra ${factura.estadoServicio.toLowerCase()}.`;

      return res.json({
        ok: true,
        data: {
          mensajeIA: mensajeSaldo,
          estado: 'FINALIZAR',
          finalizar: true
        }
      });
    }

    if (router.intencion === 'SOPORTE') {
      return res.json({
        ok: true,
        data: {
          mensajeIA: 'Te comunicaré con un asesor humano 👨‍💻',
          estado: 'FINALIZAR',
          finalizar: true
        }
      });
    }

    // 3️⃣ SOLO AQUÍ entra diagnóstico de internet
    if (router.intencion === 'INTERNET') {
      const resultado = await ejecutarDiagnosticoIA({
        mensajeUsuario: mensaje_usuario,
        pasoDiagnostico: paso_diagnostico,
        intentosIps: intentos_ips,
        ultimoFueFalla: ultimo_fue_falla
      });

      return res.json({
        ok: true,
        data: {
          mensajeIA: resultado.mensaje,
          estado: resultado.estado,
          finalizar: resultado.finalizar,
          paso_diagnostico: resultado.reset_paso ? 0 : paso_diagnostico + resultado.paso_incremento,
          intentos_ips: intentos_ips + resultado.intentos_incremento,
          ultimo_fue_falla: resultado.ultimo_fue_falla
        }
      });
    }

    // 4️⃣ General
    return res.json({
      ok: true,
      data: {
        mensajeIA: '¿Podrías explicarme un poco más para ayudarte mejor?',
        estado: 'CONTINUAR',
        finalizar: false
      }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false });
  }
};
