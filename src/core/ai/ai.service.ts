import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });

export async function generarRespuestaIA(
  mensajeUsuario: string,
  factura: any,
  historial: string,
  paso: number,
  intentos: number
): Promise<{ texto: string; esDiagnostico: boolean }> {

  const msg = mensajeUsuario.toLowerCase();

  const esSaldo = /(saldo|debo|pagar|factura)/.test(msg);
  const esFalla = /(lento|internet|fallas|no tengo)/.test(msg);

  // 1️⃣ SALDO (no toca contadores)
  if (esSaldo && !esFalla) {
    return {
      esDiagnostico: false,
      texto: `Tu saldo actual es $${factura.montoPendiente} y vence el ${factura.fechaVencimiento}.`
    };
  }

  // 2️⃣ DIAGNÓSTICO
  const pasos = [
    'Paso 1: Verifica si las luces del router están encendidas.',
    'Paso 2: Revisa si hay energía eléctrica en tu sector o enchufe.',
    'Paso 3: Reinicia el router desconectándolo 10 segundos.'
  ];

  if (esFalla || paso > 0) {
    if (paso >= pasos.length) {
      return { esDiagnostico: true, texto: 'DIAGNOSTICO_AGOTADO' };
    }

    return { esDiagnostico: true, texto: pasos[paso] };
  }

  // 3️⃣ GENERAL
  return {
    esDiagnostico: false,
    texto: 'Puedo ayudarte con tu saldo o con soporte técnico de internet.'
  };
}
