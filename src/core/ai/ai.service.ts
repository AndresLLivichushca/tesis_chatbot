import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });

export async function generarRespuestaIA(
  mensajeUsuario: string,
  factura: any,
  historial: string,
  paso: number
): Promise<{ texto: string; esDiagnostico: boolean; resetPaso?: boolean }> {

  console.log('==============================');
  console.log('[IA] Nueva ejecución');
  console.log('[IA] Mensaje usuario:', mensajeUsuario);
  console.log('[IA] Paso recibido:', paso);
  console.log('[IA] Historial:', historial);

  const msg = mensajeUsuario.toLowerCase();

  const esSaldo = /(saldo|debo|pagar|factura)/.test(msg);
  const esFalla = /(lento|internet|fallas|no tengo|problema)/.test(msg)|| paso > 0;

  console.log('[IA] Intenciones detectadas →');
  console.log('     esSaldo:', esSaldo);
  console.log('     esFalla:', esFalla);

  // 1️⃣ SALDO
  if (esSaldo) {
    console.log('[IA] Ruta: SALDO');
    console.log('[IA] → Resetear paso diagnóstico');

    return {
      texto: `Tu saldo actual es $${factura.montoPendiente} y vence el ${factura.fechaVencimiento}.`,
      esDiagnostico: false,
      resetPaso: true
    };
  }

  // 2️⃣ SOPORTE TÉCNICO
  if (esFalla) {
    console.log('[IA] Ruta: SOPORTE TÉCNICO');

    const pasos = [
      'Paso 1: Verifica si las luces del router están encendidas.',
      'Paso 2: Revisa que los cables estén correctamente conectados.',
      'Paso 3: Reinicia el router desconectándolo 10 segundos.'
    ];

    console.log('[IA] Total pasos diagnóstico:', pasos.length);

    if (paso >= pasos.length) {
      console.log('[IA] Diagnóstico agotado');
      return {
        texto: 'DIAGNOSTICO_AGOTADO',
        esDiagnostico: true
      };
    }

    console.log(`[IA] Enviando paso índice: ${paso}`);
    console.log(`[IA] Texto enviado: ${pasos[paso]}`);

    return {
      texto: pasos[paso],
      esDiagnostico: true
    };
  }

  // 3️⃣ MENSAJE GENERAL
  console.log('[IA] Ruta: MENSAJE GENERAL');

  return {
    texto: 'Puedo ayudarte con tu saldo o con soporte técnico de internet.',
    esDiagnostico: false
  };
}
