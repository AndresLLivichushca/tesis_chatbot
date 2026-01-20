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

  let infoReal;
  try {
    // 1. Odoo envía un string sucio. Primero, quitamos las envolturas si existen.
    const rawData = typeof data === 'string' ? JSON.parse(data) : data;
    const livingnetStr = rawData?.livingnet;

    // 2. PASO CLAVE: Si livingnet es un string con JSON adentro, lo parseamos
    if (typeof livingnetStr === 'string') {
      // Intentamos un parseo profundo para Jessica Pugo
      infoReal = JSON.parse(livingnetStr).finetic;
    } else {
      infoReal = livingnetStr?.finetic;
    }
  } catch (error) {
    console.error("Error crítico de parseo:", error);
  }

  const contrato = infoReal?.contratos?.[0];

  return {
    ok: true,
    nombreCliente: infoReal?.nombre ?? 'No encontrado', // Ahora sí saldrá Jessica
    tieneDeuda: Number(infoReal?.saldototal ?? 0) > 0,
    montoPendiente: Number(infoReal?.saldototal ?? 0),
    fechaVencimiento: contrato?.facturas?.[0]?.fechaemision ?? null,
    estadoServicio: contrato?.estadocontrato === 'ejecucion' ? 'ACTIVO' : 'SUSPENDIDO',
  };
};