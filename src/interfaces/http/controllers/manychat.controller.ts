import { Request, Response } from 'express';
import { buscarClientePorCedula } from '../../../core/services/cliente.service';

type TipoProblema = 'SALDO' | 'INTERNET' | 'SERVICIO' | 'OTRO';

function clasificarProblema(texto: string): TipoProblema {
  const t = texto.toLowerCase();

  if (
    t.includes('saldo') ||
    t.includes('factura') ||
    t.includes('deuda') ||
    t.includes('pagar')
  ) return 'SALDO';

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
    t.includes('servicios') ||
    t.includes('planes') ||
    t.includes('paquetes') ||
    t.includes('camaras') ||
    t.includes('cámaras') ||
    t.includes('stream') ||
    t.includes('streaming') ||
    t.includes('plataforma') ||
    t.includes('netflix') ||
    t.includes('hbo') ||
    t.includes('disney')
  ) return 'SERVICIO';

  return 'OTRO';
}


type EmpresaContrato = 'SONET' | 'SOTICOM' | 'FINETIC' | 'SEINTTEL' | 'DESCONOCIDO';

function detectarEmpresaPorContrato(contratos: any[]): EmpresaContrato {
  if (!Array.isArray(contratos) || contratos.length === 0) {
    return 'DESCONOCIDO';
  }

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
  try {
    const secret = req.headers['x-webhook-secret'];
    if (secret !== process.env.MANYCHAT_WEBHOOK_SECRET) {
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
      return res.json({
        respuesta_ia_ips: 'Por favor envíame tu número de cédula.',
        estado: 'PEDIR_CEDULA',
        cliente_existe: null,
        nombre_cliente: null,
        fecha_vencimiento: null,
        intentos_soporte: 0,
        finalizar: false,
      });
    }

    const cliente = await buscarClientePorCedula(cedula);
    
    if (!cliente) {
      return res.json({
        respuesta_ia_ips:
          '❌ Cliente no registrado.\n\nNo encontramos información asociada a esta cédula.',
        estado: 'CLIENTE_NO_REGISTRADO',
        cliente_existe: false,
        nombre_cliente: null,
        fecha_vencimiento: null,
        intentos_soporte: 0,
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

    // 💰 SALDO
    if (tipoDetectado === 'SALDO') {
      return res.json({
        ...baseCliente,
        respuesta_ia_ips: `👨‍💻 Hola ${cliente.nombre}, tu saldo pendiente es de $${cliente.saldo}.`,
        estado: 'RESPUESTA_SALDO',
        tipo_problema: 'SALDO',
        finalizar: false,
      });
    }

    // 🌐 INTERNET
    if (tipoDetectado === 'INTERNET') {
      if (intentos === 0) {
        return res.json({
          ...baseCliente,
          respuesta_ia_ips: '🔌 Reinicia tu router desconectándolo por 30 segundos.',
          estado: 'PASO_1',
          tipo_problema: 'INTERNET',
          intentos_soporte: 1,
          finalizar: false,
        });
      }

      // 🧾 SERVICIOS
        if (tipoDetectado === 'SERVICIO') {
          return res.json({
            ...baseCliente,
            respuesta_ia_ips: '📦 Estos son los servicios disponibles actualmente.',
            estado: 'SERVICIOS',
            tipo_problema: 'SERVICIO',
            finalizar: false,
          });
        }


      if (resultado_paso === 'SI') {
        return res.json({
          ...baseCliente,
          respuesta_ia_ips: '✅ ¡Excelente! El servicio fue restablecido.',
          estado: 'RESUELTO',
          tipo_problema: 'INTERNET',
          finalizar: true,
        });
      }
    }

    return res.json({
      ...baseCliente,
      respuesta_ia_ips: 'Puedo ayudarte con saldo o problemas de internet.',
      estado: 'NO_ENTENDIDO',
      finalizar: false,
    });

  } catch (error) {
    console.error(error);
    return res.json({
      respuesta_ia_ips: 'Ocurrió un error. Un agente te contactará.',
      estado: 'ERROR',
      cliente_existe: true,
      nombre_cliente: null,
      fecha_vencimiento: null,
      intentos_soporte: 0,
      finalizar: true,
    });
  }
};
