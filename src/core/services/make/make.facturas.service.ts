import { loadEnv } from '../../../config/env';
import { makeHttp } from './make.client';
//correcion
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
  // CAMBIO AQUÍ: Recibimos la respuesta completa de Make
  const response = await makeHttp.post(env.MAKE_FACTURAS_WEBHOOK_URL, payload);
  const data = response.data; // Los datos reales que configuraste en el módulo rojo

  let infoReal;
  try {
    // Verificamos si livingnet viene como string (Odoo v9) o ya parseado
    const livingnetParsed = typeof data?.livingnet === 'string' 
      ? JSON.parse(data.livingnet) 
      : data?.livingnet;
    
    infoReal = livingnetParsed?.finetic;
  } catch (error) {
    console.error("Error al parsear livingnet:", error);
  }

  // ... (el resto del código igual)
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
