import axios from 'axios';

const MAKE_FACTURAS_WEBHOOK_URL = process.env.MAKE_FACTURAS_WEBHOOK_URL!;
const MAKE_TIMEOUT_MS = Number(process.env.MAKE_TIMEOUT_MS || 12000);

export async function buscarClientePorCedula(cedula: string) {
  console.log('[MAKE] Consultando cliente por cédula:', cedula);
  console.log('[MAKE] URL:', MAKE_FACTURAS_WEBHOOK_URL);

  const response = await axios.post(
    MAKE_FACTURAS_WEBHOOK_URL,
    { cedula },
    { timeout: MAKE_TIMEOUT_MS }
  );

  console.log('[MAKE] Respuesta cruda:', response.data);

  /**
   * 🔥 AQUÍ ESTABA TODO EL PROBLEMA 🔥
   */
  const soticom = response.data?.livingnet?.soticom;

  if (!soticom || !soticom.nombre) {
    return null;
  }

  const cliente = {
    nombre: soticom.nombre,
    saldo: soticom.saldototal,
    estado: 'ACTIVO',
  };

  // 🔴 LOG CLAVE FINAL
  console.log('[DEBUG CLIENTE MAPEADO]', cliente);

  return cliente;
}
