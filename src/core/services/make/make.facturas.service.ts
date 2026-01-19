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
  const { data } = await makeHttp.post(env.MAKE_FACTURAS_WEBHOOK_URL, payload);

  console.log('RAW RESPONSE:', JSON.stringify(data));

  // PASO CRÍTICO: Odoo v9 envía 'livingnet' como un String. Debemos convertirlo.
  let livingnetObj;
  try {
    livingnetObj = typeof data?.livingnet === 'string' 
      ? JSON.parse(data.livingnet) 
      : data?.livingnet;
  } catch (e) {
    console.error("Error parseando JSON de Odoo:", e);
  }

  const finetic = livingnetObj?.finetic;

  if (!finetic) {
    return {
      ok: true,
      nombreCliente: 'No encontrado',
      tieneDeuda: false,
      montoPendiente: 0,
      fechaVencimiento: null,
      estadoServicio: 'DESCONOCIDO',
    };
  }

  const contrato = finetic.contratos?.[0];
  const factura = contrato?.facturas?.[0];
  const saldo = Number(finetic.saldototal ?? 0);

  return {
    ok: true,
    nombreCliente: finetic.nombre,
    tieneDeuda: saldo > 0,
    montoPendiente: saldo,
    fechaVencimiento: factura?.fechaemision ?? null,
    estadoServicio: contrato?.estadocontrato === 'ejecucion' ? 'ACTIVO' : 'SUSPENDIDO',
  };
};