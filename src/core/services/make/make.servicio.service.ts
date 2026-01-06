import { loadEnv } from '../../../config/env';
import { makeHttp } from './make.client';

const env = loadEnv();

export type ServicioEstadoRequest = {
  cedula: string;
};

export type ServicioEstadoResponse = {
  estadoServicio: 'ACTIVO' | 'SUSPENDIDO' | 'CORTE' | 'DESCONOCIDO';
  plan?: string | null;
  ultimaConexion?: string | null;
  mensaje?: string | null;
};

export const consultarEstadoServicioEnMake = async (
  payload: ServicioEstadoRequest
): Promise<ServicioEstadoResponse> => {
  const { data } = await makeHttp.post(env.MAKE_SERVICIO_WEBHOOK_URL, payload);

  return {
    estadoServicio: (data?.estadoServicio ?? 'DESCONOCIDO'),
    plan: data?.plan ?? null,
    ultimaConexion: data?.ultimaConexion ?? null,
    mensaje: data?.mensaje ?? null,
  };
};
