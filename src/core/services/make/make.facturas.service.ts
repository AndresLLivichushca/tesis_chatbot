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
  const response = await makeHttp.post(env.MAKE_FACTURAS_WEBHOOK_URL, payload);
  
  // PASO 1: Forzar que 'data' sea un objeto si Make lo envía como String
  let data = response.data;
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch (e) {
      console.error("Error parseando data inicial:", e);
    }
  }

  let infoReal;
  try {
    // PASO 2: Doble parseo por la estructura de Odoo v9 observada en logs
    let livingnetRaw = data?.livingnet;
    
    // Si livingnet sigue siendo un string con escapes (como se ve en tus logs), lo parseamos de nuevo
    const livingnetParsed = typeof livingnetRaw === 'string' 
      ? JSON.parse(livingnetRaw) 
      : livingnetRaw;
    
    infoReal = livingnetParsed?.finetic;
  } catch (error) {
    console.error("Error procesando livingnet:", error);
  }

  const contratos = infoReal?.contratos ?? [];
  const primerContrato = contratos[0];
  const primeraFactura = primerContrato?.facturas?.[0];
  const saldoTotal = Number(infoReal?.saldototal ?? 0);

  return {
    ok: true,
    nombreCliente: infoReal?.nombre ?? 'No encontrado',
    tieneDeuda: saldoTotal > 0,
    montoPendiente: saldoTotal,
    fechaVencimiento: primeraFactura?.fechaemision ?? null,
    estadoServicio: primerContrato?.estadocontrato === 'ejecucion' ? 'ACTIVO' : 'SUSPENDIDO',
  };
};