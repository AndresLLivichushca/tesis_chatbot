import axios from 'axios';

const MAKE_FACTURAS_WEBHOOK_URL = process.env.MAKE_FACTURAS_WEBHOOK_URL!;
const MAKE_TIMEOUT_MS = Number(process.env.MAKE_TIMEOUT_MS || 12000);

export async function buscarClientePorCedula(cedula: string) {
  console.log('[MAKE] Consultando cliente por cédula:', cedula);
  console.log('[MAKE] URL:', MAKE_FACTURAS_WEBHOOK_URL);

  try {
    const response = await axios.post(
      MAKE_FACTURAS_WEBHOOK_URL,
      { cedula },
      { timeout: MAKE_TIMEOUT_MS }
    );

    // 🔴 LOG CRÍTICO
    console.log('[MAKE] Respuesta cruda:', response.data);

    /**
     * Esperamos algo como:
     * {
     *   existe: true,
     *   nombre: "SALAZAR CANGO JENNY ROSALY",
     *   saldo: 27.74
     * }
     */

    if (!response.data || response.data.existe === false) {
      return null;
    }

    return {
      nombre: response.data.nombre,
      saldo: response.data.saldo,
      estado: response.data.estado ?? 'ACTIVO',
    };

  } catch (error: any) {
    console.error('[MAKE] ERROR consultando cliente');

    if (error.response) {
      console.error('[MAKE] Status:', error.response.status);
      console.error('[MAKE] Body:', error.response.data);
    } else {
      console.error('[MAKE] Error:', error.message);
    }

    throw new Error('Error consultando Make');
  }
}
