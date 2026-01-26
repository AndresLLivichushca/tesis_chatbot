import axios from 'axios';

const FINETIC_URL = 'https://finetic.odoosoluciones.com/chatbotlivingnet';
const TIMEOUT_MS = 15000;

export async function buscarClientePorCedula(cedula: string) {
  console.log('[FINETIC] Consultando cliente:', cedula);

  const response = await axios.post(
    FINETIC_URL,
    new URLSearchParams({ cedula }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      timeout: TIMEOUT_MS,
    }
  );

  console.log('[FINETIC] Respuesta cruda:', response.data);

  const livingnet = response.data?.livingnet;
  const sonet = livingnet?.sonet;

  if (!sonet || !sonet.nombre) {
    console.log('[FINETIC] Cliente no encontrado');
    return null;
  }

  const cliente = {
    nombre: sonet.nombre,
    saldo: sonet.saldototal,
    identificacion: sonet.identificacion,
    contratos: sonet.contratos || [],
  };

  console.log('[DEBUG CLIENTE MAPEADO]', cliente);
  return cliente;
}
