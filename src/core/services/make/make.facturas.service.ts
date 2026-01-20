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

export const consultarFacturasEnMake = async (payload: FacturasRequest) => {
  const { data } = await makeHttp.post(env.MAKE_FACTURAS_WEBHOOK_URL, payload);

  // Limpiamos la respuesta si Make la envía con escapes
  let cleanData = data;
  if (typeof data === 'string') {
    cleanData = JSON.parse(data.replace(/\\"/g, '"').replace(/\\n/g, ""));
  }

  const finetic = cleanData?.livingnet?.finetic || JSON.parse(cleanData?.livingnet || '{}').finetic;

  const contrato = finetic?.contratos?.[0];
  const saldo = Number(finetic?.saldototal ?? 0);

  return {
    ok: true,
    nombreCliente: finetic?.nombre ?? 'No encontrado',
    tieneDeuda: saldo > 0,
    montoPendiente: saldo,
    fechaVencimiento: contrato?.facturas?.[0]?.fechaemision ?? null,
    estadoServicio: contrato?.estadocontrato === 'ejecucion' ? 'ACTIVO' : 'SUSPENDIDO',
  };
};