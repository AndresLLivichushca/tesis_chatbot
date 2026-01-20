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

  let infoReal;
  try {
    // 1. Manejamos el caso donde 'data' mismo sea un string o el objeto livingnet sea string
    const baseData = typeof data === 'string' ? JSON.parse(data) : data;
    
    const livingnetParsed = typeof baseData?.livingnet === 'string' 
      ? JSON.parse(baseData.livingnet) 
      : baseData?.livingnet;
    
    infoReal = livingnetParsed?.finetic;
  } catch (error) {
    console.error("Error al parsear livingnet:", error);
  }

  const contratos = infoReal?.contratos ?? [];
  const primerContrato = contratos[0];
  const primeraFactura = primerContrato?.facturas?.[0];

  // 2. Limpiamos el saldo: Odoo a veces envía "   24.48" como string con espacios
  const saldoRaw = infoReal?.saldototal ?? 0;
  const saldoTotal = typeof saldoRaw === 'string' 
    ? Number(saldoRaw.trim()) 
    : Number(saldoRaw);

  return {
    ok: true,
    nombreCliente: infoReal?.nombre ?? 'No encontrado',
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