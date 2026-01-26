import axios from 'axios';

const MAKE_FACTURAS_WEBHOOK_URL = process.env.MAKE_FACTURAS_WEBHOOK_URL!;
const MAKE_TIMEOUT_MS = Number(process.env.MAKE_TIMEOUT_MS || 12000);

type ProveedorKey = 'soticom' | 'sonet' | 'finetic' | 'seinttel';

export async function buscarClientePorCedula(cedula: string) {
  console.log('[MAKE] Consultando cliente por cédula:', cedula);
  console.log('[MAKE] URL:', MAKE_FACTURAS_WEBHOOK_URL);

  const response = await axios.post(
    MAKE_FACTURAS_WEBHOOK_URL,
    { cedula },
    { timeout: MAKE_TIMEOUT_MS }
  );

  console.log('[MAKE] Respuesta cruda:', response.data);

  const livingnet = response.data?.livingnet;
  if (!livingnet) {
    console.log('[MAKE] Respuesta sin livingnet');
    return null;
  }

  const proveedores: ProveedorKey[] = [
    'soticom',
    'sonet',
    'finetic',
    'seinttel',
  ];

  let proveedorEncontrado: ProveedorKey | null = null;
  let dataCliente: any = null;

  for (const proveedor of proveedores) {
    const candidato = livingnet[proveedor];

    if (candidato && candidato.identificacion) {
      proveedorEncontrado = proveedor;
      dataCliente = candidato;
      break;
    }
  }

  if (!dataCliente) {
    console.log('[MAKE] Cliente no encontrado en ningún proveedor');
    return null;
  }

  const cliente = {
    nombre: dataCliente.nombre,
    saldo: Number(dataCliente.saldototal || 0),
    estado: 'ACTIVO',
    proveedor: proveedorEncontrado,
  };

  console.log('[DEBUG CLIENTE MAPEADO]', cliente);

  return cliente;
}
