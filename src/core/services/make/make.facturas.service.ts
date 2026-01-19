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
  
  // Obtenemos los datos de Make (pueden venir en .Body o directo en .data)
  let dataRaw = response.data?.Body || response.data;
  let infoReal;

  try {
    // PASO 1: Si Make envía un String, lo limpiamos de saltos de línea
    if (typeof dataRaw === 'string') {
        dataRaw = JSON.parse(dataRaw.replace(/[\n\r]/g, ""));
    }

    // PASO 2: Extraer livingnet y limpiar las barras invertidas y espacios triples
    let livingnetStr = dataRaw?.livingnet;
    
    if (typeof livingnetStr === 'string') {
        // Esta línea elimina las barras de escape y limpia espacios que rompen el JSON
        const cleanLivingnet = livingnetStr
            .replace(/\\"/g, '"')    // Cambia \" por "
            .replace(/\\n/g, "")     // Elimina saltos de línea de texto
            .replace(/\s{2,}/g, " ") // Cambia espacios múltiples por uno solo
            .trim();
        
        const parsed = JSON.parse(cleanLivingnet);
        infoReal = parsed?.finetic;
    } else {
        infoReal = dataRaw?.livingnet?.finetic;
    }
  } catch (error) {
    console.error("Error procesando JSON de Odoo:", error);
  }

  // PASO 3: Extracción segura de valores
  const contratos = infoReal?.contratos ?? [];
  const primerContrato = contratos[0];
  const primeraFactura = primerContrato?.facturas?.[0];
  
  // Limpiamos el saldo de espacios (Odoo v9 envía "   24.48")
  const saldoTotal = Number(String(infoReal?.saldototal ?? 0).trim());

  return {
    ok: true,
    nombreCliente: infoReal?.nombre ?? 'No encontrado',
    tieneDeuda: saldoTotal > 0,
    montoPendiente: saldoTotal,
    fechaVencimiento: primeraFactura?.fechaemision ?? null,
    estadoServicio: primerContrato?.estadocontrato === 'ejecucion' ? 'ACTIVO' : 'SUSPENDIDO',
  };
};