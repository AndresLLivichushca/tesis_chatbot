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

  const { data } = await makeHttp.post(
    env.MAKE_FACTURAS_WEBHOOK_URL,
    payload
  );

  console.log('RAW RESPONSE:', JSON.stringify(data));

  let finetic: any = null;

  try {
    /**
     * CASO REAL:
     * data.livingnet viene como STRING con JSON
     */
    if (typeof data?.livingnet === 'string') {
      const parsed = JSON.parse(data.livingnet);
      finetic = parsed?.finetic;
    }

    /**
     * CASO IDEAL (por si luego arreglas Make)
     */
    else if (data?.livingnet?.finetic) {
      finetic = data.livingnet.finetic;
    }
  } catch (error) {
    console.error('ERROR parseando livingnet:', error);
  }

  // 🛑 Si no existe información
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
    nombreCliente: finetic.nombre ?? 'No encontrado',
    tieneDeuda: saldo > 0,
    montoPendiente: saldo,
    fechaVencimiento: factura?.fechaemision ?? null,
    estadoServicio:
      contrato?.estadocontrato === 'ejecucion'
        ? 'ACTIVO'
        : 'SUSPENDIDO',
  };
};
