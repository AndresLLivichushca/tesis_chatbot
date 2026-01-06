import { loadEnv } from '../../../config/env';
import { makeHttp } from './make.client';

const env = loadEnv();

export type FacturasRequest = {
  cedula: string;
};

export type FacturasResponse = {
  tieneDeuda: boolean;
  montoPendiente: number;
  fechaVencimiento: string | null;
  estadoServicio: 'ACTIVO' | 'SUSPENDIDO' | 'DESCONOCIDO';
};

export const consultarFacturasEnMake = async (payload: FacturasRequest): Promise<FacturasResponse> => {
  const { data } = await makeHttp.post(env.MAKE_FACTURAS_WEBHOOK_URL, payload);

  return {
    tieneDeuda: Boolean(data?.tieneDeuda),
    montoPendiente: Number(data?.montoPendiente ?? 0),
    fechaVencimiento: data?.fechaVencimiento ?? null,
    estadoServicio: (data?.estadoServicio ?? 'DESCONOCIDO'),
  };
};
