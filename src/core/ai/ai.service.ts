import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });

export async function generarRespuestaIA(
  mensajeUsuario: string,
  factura: any,
  historial: string,
  paso: number
): Promise<{ texto: string; esDiagnostico: boolean; resetPaso?: boolean }> {

  const msg = mensajeUsuario.toLowerCase();

  const esSaldo = /(saldo|debo|pagar|factura)/.test(msg);
  const esFalla = /(lento|internet|fallas|no tengo|problema)/.test(msg);

  // 1️⃣ SALDO (resetea diagnóstico)
  if (esSaldo) {
    return {
      texto: `Tu saldo actual es $${factura.montoPendiente} y vence el ${factura.fechaVencimiento}.`,
      esDiagnostico: false,
      resetPaso: true
    };
  }

  // 2️⃣ SOPORTE TÉCNICO
  if (esFalla) {
    const pasos = [
      'Paso 1: Verifica si las luces del router están encendidas.',
      'Paso 2: Revisa que los cables estén correctamente conectados.',
      'Paso 3: Reinicia el router desconectándolo 10 segundos.'
    ];

    if (paso >= pasos.length) {
      return {
        texto: 'DIAGNOSTICO_AGOTADO',
        esDiagnostico: true
      };
    }

    return {
      texto: pasos[paso],
      esDiagnostico: true
    };
  }

  // 3️⃣ MENSAJE GENERAL
  return {
    texto: 'Puedo ayudarte con tu saldo o con soporte técnico de internet.',
    esDiagnostico: false
  };
}
