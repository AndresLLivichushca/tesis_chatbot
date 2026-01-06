import { loadEnv } from '../../../config/env';
import { makeHttp } from './make.client';

const env = loadEnv();

export type CrearTicketRequest = {
  cedula: string;
  telefono?: string;
  tipoProblema: 'SIN_SERVICIO' | 'LENTO' | 'INTERMITENTE' | 'OTRO';
  descripcion?: string;
  ubicacion?: string;
};

export type CrearTicketResponse = {
  ticketId: string;
  estado: 'CREADO' | 'EN_PROCESO' | 'ERROR';
  mensaje: string;
};

export const crearTicketEnMake = async (payload: CrearTicketRequest): Promise<CrearTicketResponse> => {
  const { data } = await makeHttp.post(env.MAKE_TICKETS_WEBHOOK_URL, payload);

  return {
    ticketId: String(data?.ticketId ?? ''),
    estado: (data?.estado ?? 'ERROR'),
    mensaje: String(data?.mensaje ?? 'Ticket procesado'),
  };
};
