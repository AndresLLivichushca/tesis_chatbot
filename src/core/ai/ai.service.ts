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
  
  const mensajeActual = mensajeUsuario.toLowerCase();

  // 1️⃣ Detección de intención basada SOLO en el mensaje nuevo para evitar repeticiones
  const esSaldo = mensajeActual.includes('saldo') || mensajeActual.includes('debo') || mensajeActual.includes('pagar');
  const esFalla = mensajeActual.includes('lento') || mensajeActual.includes('internet') || mensajeActual.includes('fallas');

  // 2️⃣ Prioridad: Respuesta de Saldo
  if (esSaldo && !esFalla) {
    return {
      esDiagnostico: false,
      texto: `Hola ${factura.nombreCliente}, tu saldo actual es de $${factura.montoPendiente} y vence el ${factura.fechaVencimiento}.`
    };
  }

  // 3️⃣ Lógica de Falla Técnica (Soporte Humano si intentos >= 3)
  if (esFalla || pasoDiagnostico > 0) {
    if (intentos >= 3) {
      return {
        esDiagnostico: true,
        texto: 'He agotado las pruebas básicas. ¿Deseas comunicarte con soporte técnico humano?'
      };
    }

    // 4️⃣ Diagnóstico Secuencial
    const pasos = [
      'Por favor verifica si las luces del router están encendidas.', // Paso 0
      'Verifica si el router está bien enchufado y si hay luz en tu sector.', // Paso 1
      'Desconecta el router por 10 segundos y vuelve a encenderlo.' // Paso 2
    ];

    // Retorna el paso actual según lo que envíe ManyChat
    return {
      esDiagnostico: true,
      texto: pasos[pasoDiagnostico] || pasos[0]
    };
  }

  // 5️⃣ Respuesta por defecto (Saludo/Ayuda general)
  return {
    esDiagnostico: false,
    texto: `¡Hola ${factura.nombreCliente}! ¿En qué puedo ayudarte? Puedo darte tu saldo o ayudarte con fallas de internet.`
  };
}