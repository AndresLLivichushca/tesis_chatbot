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

  // Intentamos obtener la info de soticom o finetic
  const infoReal = data?.livingnet?.soticom || data?.livingnet?.finetic;

  // Si no hay info o el nombre no existe, devolvemos un estado controlado
  if (!infoReal || !infoReal.nombre) {
    return {
      ok: true,
      nombreCliente: 'Cliente No Registrado', // Cambiamos 'No encontrado' por algo más claro
      tieneDeuda: false,
      montoPendiente: 0,
      fechaVencimiento: null,
      estadoServicio: 'DESCONOCIDO',
    };
  }

  const contratos = infoReal.contratos ?? [];
  const primerContrato = contratos[0];
  const primeraFactura = primerContrato?.facturas?.[0];
  const saldoTotal = Number(infoReal.saldototal ?? 0);

  return {
    ok: true,
    nombreCliente: infoReal.nombre,
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