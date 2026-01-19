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

  const response = await makeHttp.post(
    env.MAKE_FACTURAS_WEBHOOK_URL,
    payload
  );

  const data = response.data;
  console.log('RAW RESPONSE:', JSON.stringify(data));

  let finetic: any = null;

  try {
    // 🔥 Caso REAL: livingnet.livingnet es string JSON
    if (typeof data?.livingnet?.livingnet === 'string') {
      finetic = JSON.parse(data.livingnet.livingnet)?.finetic;
    }
    // 🟢 Caso ideal
    else if (data?.livingnet?.finetic) {
      finetic = data.livingnet.finietic;
    }
  } catch (err) {
    console.error('ERROR parseando livingnet:', err);
  }

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
    estadoServicio:
      contrato?.estadocontrato === 'ejecucion'
        ? 'ACTIVO'
        : 'SUSPENDIDO',
  };
};
