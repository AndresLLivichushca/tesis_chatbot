import { loadEnv } from '../../../config/env';
import { makeHttp } from './make.client';

const env = loadEnv();

export type FacturasRequest = {
  cedula: string;
};

export type FacturasResponse = {
  ok: boolean;
  nombreCliente: string;
  tieneDeuda: boolean;
  montoPendiente: number;
  fechaVencimiento: string | null;
  estadoServicio: 'ACTIVO' | 'SUSPENDIDO' | 'DESCONOCIDO';
};

export const consultarFacturasEnMake = async (
  payload: FacturasRequest
): Promise<FacturasResponse> => {

  const response = await makeHttp.post(env.MAKE_FACTURAS_WEBHOOK_URL, payload);
  let data = response.data;

  console.log('RAW RESPONSE:', data);

  let livingnetObj: any = null;

  try {
    // 🔴 Caso Odoo v9: livingnet viene como string mal formado
    if (typeof data?.livingnet === 'string') {
      const cleaned = data.livingnet
        .replace(/^\s*"/, '')   // quita comilla inicial
        .replace(/"\s*$/, '')   // quita comilla final
        .replace(/\\"/g, '"');  // arregla escapes

      livingnetObj = JSON.parse(cleaned);
    } 
    // 🟢 Caso normal
    else {
      livingnetObj = data?.livingnet;
    }
  } catch (err) {
    console.error('ERROR parseando livingnet:', err);
  }

  const finetic = livingnetObj?.finetic;
  const contratos = finetic?.contratos ?? [];
  const contrato = contratos[0];
  const factura = contrato?.facturas?.[0];

  const saldo = Number(finetic?.saldototal ?? 0);

  return {
    ok: true,
    nombreCliente: finetic?.nombre ?? 'No encontrado',
    tieneDeuda: saldo > 0,
    montoPendiente: saldo,
    fechaVencimiento: factura?.fechaemision ?? null,
    estadoServicio:
      contrato?.estadocontrato === 'ejecucion'
        ? 'ACTIVO'
        : contrato
        ? 'SUSPENDIDO'
        : 'DESCONOCIDO',
  };
};
