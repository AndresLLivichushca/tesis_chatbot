import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function generarRespuestaIA(
  mensajeUsuario: string,
  factura: any,
  historialChat: string,
  pasoDiagnostico: number,
  intentos: number
): Promise<{ texto: string; esDiagnostico: boolean }> {

  const mensaje = mensajeUsuario.toLowerCase();

  // 1️⃣ Detectar intención
  const esFalla =
    mensaje.includes('lento') ||
    mensaje.includes('sin internet') ||
    mensaje.includes('no tengo internet') ||
    mensaje.includes('fallas');

  const esSaldo =
    mensaje.includes('saldo') ||
    mensaje.includes('debo') ||
    mensaje.includes('pagar');

  // 2️⃣ Respuesta directa de saldo (NO afecta intentos)
  if (esSaldo && !esFalla) {
    return {
      esDiagnostico: false,
      texto: `Tu saldo actual es de $${factura.montoPendiente} y la fecha de vencimiento es el ${factura.fechaVencimiento}.`,
    };
  }

  // 3️⃣ Si NO es falla técnica, responder normal
  if (!esFalla) {
    return {
      esDiagnostico: false,
      texto: '¿En qué más puedo ayudarte? Puedo revisar tu saldo o ayudarte con problemas de internet.',
    };
  }

  // 4️⃣ Si es falla técnica y ya agotó intentos
  if (intentos >= 3) {
    return {
      esDiagnostico: true,
      texto:
        'He agotado las pruebas básicas y no logramos solucionar el problema. ¿Deseas comunicarte con un técnico de soporte humano?',
    };
  }

  // 5️⃣ Diagnóstico paso a paso
  const pasos = [
    'Por favor verifica si las luces del router están encendidas.',
    'Verifica si el router está bien enchufado y si hay luz en tu sector.',
    'Desconecta el router por 10 segundos y vuelve a encenderlo.',
  ];

  return {
    esDiagnostico: true,
    texto: pasos[pasoDiagnostico] || pasos[0],
  };
}
