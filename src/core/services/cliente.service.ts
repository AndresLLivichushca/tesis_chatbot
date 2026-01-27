import axios from 'axios';

const FINETIC_URL = 'https://finetic.odoosoluciones.com/chatbotlivingnet';
const TIMEOUT_MS = 15000;

type ProveedorData = {
  nombre?: string;
  saldototal?: number;
  identificacion?: string;
  contratos?: any[];
};

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

  if (!livingnet) {
    console.log('[FINETIC] Respuesta sin livingnet');
    return null;
  }

  // 🔍 Buscar cliente en TODOS los proveedores
  const proveedores: ProveedorData[] = [
    livingnet.sonet,
    livingnet.soticom,
    livingnet.finetic,
    livingnet.seinttel,
  ];

  const data = proveedores.find(
    (p) => p && typeof p.nombre === 'string' && p.nombre.trim() !== ''
  );

  if (!data) {
    console.log('[FINETIC] Cliente no encontrado en ningún proveedor');
    return null;
  }

  const cliente = {
    nombre: data.nombre!,
    saldo: Number(data.saldototal ?? 0),
    identificacion: data.identificacion ?? cedula,
    contratos: Array.isArray(data.contratos) ? data.contratos : [],
  };

  console.log('[DEBUG CLIENTE MAPEADO]', cliente);
  return cliente;
}
