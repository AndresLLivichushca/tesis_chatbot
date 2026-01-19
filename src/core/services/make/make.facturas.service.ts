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

export const consultarFacturasEnMake = async (payload: FacturasRequest): Promise<FacturasResponse> => {
  const { data } = await makeHttp.post(env.MAKE_FACTURAS_WEBHOOK_URL, payload);

  // 'data' ahora es directamente el objeto finetic { nombre, saldototal, ... }
  if (!data || !data.nombre) {
    return {
      ok: true,
      nombreCliente: 'No encontrado',
      tieneDeuda: false,
      montoPendiente: 0,
      fechaVencimiento: null,
      estadoServicio: 'DESCONOCIDO',
    };
  }

  const contrato = data.contratos?.[0];
  const saldo = Number(String(data.saldototal ?? 0).trim());

  return {
    ok: true,
    nombreCliente: data.nombre,
    tieneDeuda: saldo > 0,
    montoPendiente: saldo,
    fechaVencimiento: contrato?.facturas?.[0]?.fechaemision ?? null,
    estadoServicio: contrato?.estadocontrato === 'ejecucion' ? 'ACTIVO' : 'SUSPENDIDO',
  };
};