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

  // 🔒 Protección total contra null / undefined
  const infoFinetic = data?.livingnet?.finetic ?? null;

  const saldoTotal = Number(infoFinetic?.saldototal ?? 0);

  const contrato = infoFinetic?.contratos?.[0] ?? null;
  const factura = contrato?.facturas?.[0] ?? null;

  return {
    ok: true,

    nombreCliente: infoFinetic?.nombre ?? 'No encontrado',

    tieneDeuda: saldoTotal > 0,

    montoPendiente: saldoTotal,

    fechaVencimiento: factura?.fechaemision ?? null,

    estadoServicio:
      contrato?.estadocontrato === 'ejecucion'
        ? 'ACTIVO'
        : contrato?.estadocontrato
        ? 'SUSPENDIDO'
        : 'DESCONOCIDO',
  };
};
