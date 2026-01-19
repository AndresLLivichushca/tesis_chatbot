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
  // 1. Llamada a Make
  const response = await makeHttp.post(env.MAKE_FACTURAS_WEBHOOK_URL, payload);
  const data = response.data; 

  // LOG DE CONTROL: Esto te permitirá ver en Render qué está llegando exactamente
  console.log("DEBUG - Datos recibidos de Make:", JSON.stringify(data));

  let infoReal;
  try {
    // 2. Parseo de la respuesta (Odoo v9 devuelve livingnet como String)
    const livingnetParsed = typeof data?.livingnet === 'string' 
      ? JSON.parse(data.livingnet) 
      : data?.livingnet;
    
    infoReal = livingnetParsed?.finetic;
  } catch (error) {
    console.error("Error crítico al parsear livingnet:", error);
  }

  // 3. Extracción de datos financieros
  const contratos = infoReal?.contratos ?? [];
  const primerContrato = contratos[0];
  const primeraFactura = primerContrato?.facturas?.[0];
  const saldoTotal = Number(infoReal?.saldototal ?? 0);

  // 4. Respuesta estructurada para ManyChat
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