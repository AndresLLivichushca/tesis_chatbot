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
  
  // 2. Extraemos el cuerpo de la respuesta de Make
  // Según tu captura image_a959a6, los datos vienen en 'Body' o directamente en 'data'
  const data = response.data?.Body || response.data; 

  console.log("DEBUG - Estructura recibida:", JSON.stringify(data));

  let infoReal;
  try {
    // 3. Parseo de Odoo (vViemos que livingnet es un String en tus capturas)
    const livingnetParsed = typeof data?.livingnet === 'string' 
      ? JSON.parse(data.livingnet) 
      : data?.livingnet;
    
    infoReal = livingnetParsed?.finetic;
  } catch (error) {
    console.error("Error al procesar livingnet:", error);
  }

  // 4. Mapeo final de campos
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
    estadoServicio:
      primerContrato?.estadocontrato === 'ejecucion'
        ? 'ACTIVO'
        : primerContrato
        ? 'SUSPENDIDO'
        : 'DESCONOCIDO',
  };
};