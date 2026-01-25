import { Request, Response } from 'express';
import { consultarFacturasEnMake } from '../../../core/services/make/make.facturas.service';
import { ejecutarDiagnosticoIA } from '../../../core/ai/ai.service';
import { detectarIntencionIA } from '../../../core/ai/ai.router.service';

export const handleIncoming = async (req: Request, res: Response) => {
  console.log('--- ENTRADA DE WEBHOOK MANYCHAT ---');
  console.log(JSON.stringify(req.body, null, 2));

  try {
    const {
      cedula = '',
      mensaje_usuario = '',
      paso_diagnostico = 0,
      intentos_ips = 0,
      ultimo_fue_falla = false
    } = req.body;

    // 🛑 PRUEBA BASE: ¿LLEGA EL MENSAJE?
    if (!mensaje_usuario) {
      return res.json({
        ok: true,
        data: {
          mensajeIA: 'Mensaje vacío recibido desde ManyChat.',
          finalizar: true
        }
      });
    }

    // 1️⃣ Detectar intención
    const router = await detectarIntencionIA(mensaje_usuario);
    console.log('[Router IA]', router);

    // 🟢 SALUDO / GENERAL → RESPUESTA SIMPLE (NO IA)
    if (router.intencion === 'GENERAL') {
      return res.json({
        ok: true,
        data: {
          mensajeIA: 'Hola 👋, dime en qué puedo ayudarte: saldo, factura o internet.',
          estado: 'CONTINUAR',
          finalizar: false,
          paso_diagnostico
        }
      });
    }

    // 🟢 SALDO / FACTURA
    if (router.intencion === 'SALDO' || router.intencion === 'FACTURA') {
      const factura = await consultarFacturasEnMake({ cedula });

      return res.json({
        ok: true,
        data: {
          mensajeIA: `Hola ${factura.nombreCliente}. Tu saldo pendiente es $${factura.montoPendiente}.`,
          estado: 'FINALIZAR',
          finalizar: true,
          paso_diagnostico: 0
        }
      });
    }

    // 🟢 INTERNET / SOPORTE → IA DIAGNÓSTICO
    const resultadoIA = await ejecutarDiagnosticoIA({
      mensajeUsuario: mensaje_usuario,
      pasoDiagnostico: paso_diagnostico,
      intentosIps: intentos_ips,
      ultimoFueFalla: ultimo_fue_falla
    });

    return res.json({
      ok: true,
      data: {
        mensajeIA: resultadoIA.mensaje,
        estado: resultadoIA.estado,
        finalizar: resultadoIA.finalizar,
        paso_diagnostico: resultadoIA.reset_paso
          ? 0
          : paso_diagnostico + 1,
        intentos_ips: intentos_ips + 1,
        ultimo_fue_falla: resultadoIA.ultimo_fue_falla
      }
    });

  } catch (error) {
    console.error('[ERROR MANYCHAT]', error);
    return res.json({
      ok: false,
      data: {
        mensajeIA: 'Error interno procesando tu mensaje.',
        finalizar: true
      }
    });
  }
};
