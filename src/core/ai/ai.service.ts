import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });

export async function generarRespuestaIA(
  mensajeUsuario: string,
  factura: any,
  historialChat: string,
  pasoDiagnostico: number,
  intentos: number
): Promise<{ texto: string; esDiagnostico: boolean }> {
  
  const mensaje = mensajeUsuario.toLowerCase();

  // 1️⃣ Detección de intención
  const esFalla = mensaje.includes('lento') || mensaje.includes('internet') || mensaje.includes('fallas');
  const esSaldo = mensaje.includes('saldo') || mensaje.includes('debo') || mensaje.includes('pagar');

  console.log(`[IA] Intención detectada - Falla: ${esFalla}, Saldo: ${esSaldo}`);

  // 2️⃣ Respuesta de saldo (No afecta el contador de diagnóstico)
  if (esSaldo && !esFalla) {
    return {
      esDiagnostico: false,
      texto: `Hola ${factura.nombreCliente}, tu saldo es de $${factura.montoPendiente} venciendo el ${factura.fechaVencimiento}.`
    };
  }

  // 3️⃣ Protocolo de Falla Técnica
  if (esFalla || pasoDiagnostico > 0) {
    const pasos = [
      'Paso 1: Verifica si las luces del router están encendidas.',
      'Paso 2: Revisa que los cables estén bien conectados.',
      'Paso 3: Reinicia el router desconectándolo 10 segundos.'
    ];

    // Si ya superó los pasos, preparamos el mensaje de soporte
    if (pasoDiagnostico >= 3) {
       return { esDiagnostico: true, texto: 'DIAGNOSTICO_AGOTADO' };
    }

    return { esDiagnostico: true, texto: pasos[pasoDiagnostico] || pasos[0] };
  }

  // 4️⃣ Respuesta General
  return {
    esDiagnostico: false,
    texto: `¡Hola! Puedo ayudarte con tu saldo o soporte técnico de internet. ¿Qué necesitas?`
  };
}