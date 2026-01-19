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
  
  // Obtenemos los datos crudos de la respuesta
  let dataRaw = response.data;
  let infoReal;

  try {
    // PASO 1: Si la data es un string, intentamos limpiarla y parsearla
    if (typeof dataRaw === 'string') {
        // Eliminamos posibles caracteres invisibles o escapes duplicados que rompen el JSON
        dataRaw = JSON.parse(dataRaw);
    }

    // PASO 2: Extraer livingnet. Odoo v9 lo envía como String dentro del JSON
    let livingnetData = dataRaw?.livingnet;
    
    // Si livingnet es un texto, lo convertimos en objeto
    const parsedLivingnet = typeof livingnetData === 'string' 
      ? JSON.parse(livingnetData) 
      : livingnetData;
    
    infoReal = parsedLivingnet?.finetic;
  } catch (error) {
    console.error("Error definitivo procesando JSON de Odoo:", error);
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