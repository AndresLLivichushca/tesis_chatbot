import { Request, Response } from 'express';
import { buscarClientePorCedula } from '../../../core/services/cliente.service';
import { guardarMetrica } from '../../../core/services/metricas.service';

type TipoProblema = 'SALDO' | 'INTERNET' | 'SERVICIO' | 'OTRO';

function clasificarProblema(texto: string): TipoProblema {
  const t = texto.toLowerCase();

  if (t.includes('saldo') || t.includes('factura') || t.includes('deuda') || t.includes('pagar'))
    return 'SALDO';

  if (
    t.includes('internet') ||
    t.includes('lento') ||
    t.includes('no tengo') ||
    t.includes('sin servicio') ||
    t.includes('caido') ||
    t.includes('no funciona')
  ) return 'INTERNET';

  if (
    t.includes('servicio') ||
    t.includes('planes') ||
    t.includes('paquetes') ||
    t.includes('camaras') ||
    t.includes('cámaras') ||
    t.includes('stream') ||
    t.includes('netflix') ||
    t.includes('hbo') ||
    t.includes('disney')
  ) return 'SERVICIO';

  return 'OTRO';
}

type EmpresaContrato = 'SONET' | 'SOTICOM' | 'FINETIC' | 'SEINTTEL' | 'DESCONOCIDO';

function detectarEmpresaPorContrato(contratos: any[]): EmpresaContrato {
  if (!Array.isArray(contratos) || contratos.length === 0) return 'DESCONOCIDO';

  const numero = contratos[0]?.numerocontrato ?? '';

  if (numero.startsWith('CCR')) return 'SONET';
  if (numero.startsWith('SOTI')) return 'SOTICOM';
  if (numero.startsWith('CHM')) return 'FINETIC';
  if (numero.startsWith('KND')) return 'SEINTTEL';

  return 'DESCONOCIDO';
}

function obtenerFechaVencimiento(cliente: any): string {
  for (const contrato of cliente.contratos || []) {
    if (contrato.facturas && contrato.facturas.length > 0) {
      return contrato.facturas[0].fechaemision;
    }
  }
  return 'NO_REGISTRADA';
}

export const webhookManychat = async (req: Request, res: Response) => {
  const inicio = Date.now();
  const requestId = req.requestId || 'unknown';

  try {
    const secret = req.headers['x-webhook-secret'];
    if (secret !== process.env.MANYCHAT_WEBHOOK_SECRET) {
      await guardarMetrica('manychat_webhook', Date.now() - inicio, false, requestId);
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      cedula,
      mensaje_usuario,
      problema_cliente,
      tipo_problema,
      resultado_paso,
      intentos_soporte = 0,
    } = req.body;

    const mensaje = mensaje_usuario || problema_cliente || '';
    const intentos = Number(intentos_soporte) || 0;

    // 1️⃣ Pedir cédula
    if (!cedula) {
      await guardarMetrica('manychat_webhook', Date.now() - inicio, false, requestId);
      return res.json({
        respuesta_ia_ips: 'Por favor envíame tu número de cédula.',
        estado: 'PEDIR_CEDULA',
        finalizar: false,
      });
    }

    const cliente = await buscarClientePorCedula(cedula);

    if (!cliente) {
      await guardarMetrica('manychat_webhook', Date.now() - inicio, false, requestId);
      return res.json({
        respuesta_ia_ips: '❌ Cliente no registrado.',
        estado: 'CLIENTE_NO_REGISTRADO',
        finalizar: true,
      });
    }

    const empresa_contrato = detectarEmpresaPorContrato(cliente.contratos);
    const fechaVencimiento = obtenerFechaVencimiento(cliente);

    const baseCliente = {
      cliente_existe: true,
      nombre_cliente: cliente.nombre,
      fecha_vencimiento: fechaVencimiento,
      empresa_contrato,
      intentos_soporte: intentos,
    };

    const tipoDetectado =
      tipo_problema && tipo_problema !== 'OTRO'
        ? tipo_problema
        : clasificarProblema(mensaje);

    if (tipoDetectado === 'SALDO') {
      await guardarMetrica('manychat_webhook', Date.now() - inicio, true, requestId);
      return res.json({
        ...baseCliente,
        respuesta_ia_ips: `💰 Tu saldo pendiente es $${cliente.saldo}.`,
        estado: 'RESPUESTA_SALDO',
        finalizar: false,
      });
    }

    if (tipoDetectado === 'INTERNET') {
      await guardarMetrica('manychat_webhook', Date.now() - inicio, true, requestId);
      return res.json({
        ...baseCliente,
        respuesta_ia_ips: '🔌 Reinicia tu router por 30 segundos.',
        estado: 'SOPORTE_INTERNET',
        finalizar: false,
      });
    }

    await guardarMetrica('manychat_webhook', Date.now() - inicio, false, requestId);
    return res.json({
      ...baseCliente,
      respuesta_ia_ips: 'No entendí tu solicitud.',
      estado: 'NO_ENTENDIDO',
      finalizar: false,
    });

  } catch (error) {
    console.error(error);
    await guardarMetrica('manychat_webhook', Date.now() - inicio, false, requestId);
    return res.json({
      respuesta_ia_ips: 'Ocurrió un error interno.',
      estado: 'ERROR',
      finalizar: true,
    });
  }
};
