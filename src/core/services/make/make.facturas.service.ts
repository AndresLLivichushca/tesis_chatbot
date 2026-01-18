import { loadEnv } from '../../../config/env';
import { makeHttp } from './make.client';
//correcion
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

  // Extraemos la info real desde el WebService
  const infoFinetic = data?.livingnet?.finetic;

  const contratos = infoFinetic?.contratos ?? [];
  const primerContrato = contratos[0];
  const primeraFactura = primerContrato?.facturas?.[0];

  const saldoTotal = Number(infoFinetic?.saldototal ?? 0);

  return {
    ok: true,

    nombreCliente: infoFinetic?.nombre ?? 'No encontrado',

    tieneDeuda: saldoTotal > 0,

    montoPendiente: saldoTotal,

    fechaVencimiento: primeraFactura?.fechaemision ?? null,

    estadoServicio:
      primerContrato?.estadocontrato === 'ejecucion'
        ? 'ACTIVO'
        : primerContrato
        ? 'SUSPENDIDO'
        : 'DESCONOCIDO',
  };
};
