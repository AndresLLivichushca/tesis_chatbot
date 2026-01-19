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
  
  // Con el parseJSON de Make, 'data' ya es el objeto limpio
  const data = response.data; 
  
  // Acceso directo a la estructura de Odoo
  const infoFinetic = data?.livingnet?.finetic;
  const contrato = infoFinetic?.contratos?.[0];
  const factura = contrato?.facturas?.[0];
  const saldo = Number(infoFinetic?.saldototal ?? 0);

  return {
    ok: true,
    nombreCliente: infoFinetic?.nombre ?? 'No encontrado',
    tieneDeuda: saldo > 0,
    montoPendiente: saldo,
    fechaVencimiento: factura?.fechaemision ?? null,
    estadoServicio: contrato?.estadocontrato === 'ejecucion' ? 'ACTIVO' : 'SUSPENDIDO',
  };
};