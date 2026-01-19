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
  
  let dataRaw = response.data;
  let infoReal;

  try {
    // PASO 1: Si dataRaw es un String, lo limpiamos de caracteres que rompen el JSON
    if (typeof dataRaw === 'string') {
        // Limpiamos saltos de línea y espacios que Odoo v9 suele enviar
        const cleanedData = dataRaw.replace(/\n/g, "").replace(/\r/g, "").trim();
        dataRaw = JSON.parse(cleanedData);
    }

    // PASO 2: Extraer y limpiar livingnet
    let livingnetRaw = dataRaw?.livingnet;
    
    if (typeof livingnetRaw === 'string') {
        // Limpieza profunda del String interno antes del parseo
        const cleanedLivingnet = livingnetRaw
            .replace(/\\n/g, "")
            .replace(/\\r/g, "")
            .replace(/\s{2,}/g, " ") // Reduce múltiples espacios a uno solo
            .trim();
        livingnetRaw = JSON.parse(cleanedLivingnet);
    }
    
    infoReal = livingnetRaw?.finetic;
  } catch (error) {
    console.error("Error definitivo procesando JSON:", error);
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