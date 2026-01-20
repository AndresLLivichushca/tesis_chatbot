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

  let infoReal: any = null;

  try {
    // PASO 1: Asegurar objeto base (Make a veces envía string o objeto)
    const baseData = typeof data === 'string' ? JSON.parse(data) : data;
    
    // PASO 2: Limpieza profunda del string sucio de Odoo
    if (typeof baseData?.livingnet === 'string') {
      // Eliminamos saltos de línea y carácteres de escape que rompen el parseo
      const cleanedString = baseData.livingnet
        .replace(/\\"/g, '"')       // Corrige comillas escapadas
        .replace(/[\n\r\t]/g, "")    // Quita saltos de línea y tabs
        .trim();
      
      const livingnetParsed = JSON.parse(cleanedString);
      infoReal = livingnetParsed?.finetic;
    } else {
      infoReal = baseData?.livingnet?.finetic;
    }
  } catch (error: any) {
    // Esto captura el error de la posición 16 y te da más detalle en Render
    console.error("Fallo al limpiar el JSON de Odoo:", error.message);
  }

  const contratos = infoReal?.contratos ?? [];
  const primerContrato = contratos[0];
  const primeraFactura = primerContrato?.facturas?.[0];

  // Limpieza del saldo (Odoo a veces envía espacios en blanco como "  24.48")
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