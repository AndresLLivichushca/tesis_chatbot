import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '', 
});

export async function generarRespuestaIA(
  mensajeUsuario: string,
  factura: any,
  historialChat: string = "",
  pasoActual: number = 0 // Recibimos el contador de ManyChat

): Promise<string> {

  if (pasoActual >= 3) {
    return "HE_AGOTADO_INTENTOS"; 
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { 
          role: 'system', 
          content: `Eres el asistente inteligente de la empresa de internet IPS.
          
          DATOS DEL CLIENTE ACTUAL:
          - Nombre: ${factura.nombreCliente}
          - Deuda/Saldo: $${factura.montoPendiente}
          - Fecha de Vencimiento: ${factura.fechaVencimiento || 'No disponible'}
          - Estado del Servicio: Activo

          HISTORIAL DE CONVERSACIÓN (MEMORIA):
          ${historialChat}
          INTENTO ACTUAL: ${pasoActual} de 3.
          
          INSTRUCCIONES DE COMPORTAMIENTO:
          1. IDENTIFICA LA INTENCIÓN: 
             - Si el usuario pregunta por SALDO o PAGOS: Responde cuánto debe y cuándo vence.
             - Si el usuario reporta FALLA TÉCNICA (lento, sin internet): Inicia el diagnóstico.
             - Si el usuario responde a un paso previo: Mira el HISTORIAL y da el siguiente paso.

          2. PROTOCOLO TÉCNICO (Solo para fallas, un paso a la vez):
             - Paso 1: Verificar que las luces del router estén encendidas.
             - Paso 2: Verificar si el router está bien enchufado o si hay luz en el sector.
             - Paso 3: Reiniciar el router (desconectarlo 10 segundos).
             
          3. REGLA DE SALIDA (SOPORTE HUMANO):
             - Si en el HISTORIAL ya se realizaron los 3 pasos técnicos y el usuario sigue con problemas, debes decir: 
               "He agotado las pruebas básicas. ¿Deseas que te comunique con un técnico de soporte humano para una revisión avanzada?"
          
          4. RESTRICCIONES:
             - No repitas pasos que ya están en el historial.
             - Respuestas cortas, amables y en español.` 
        },
        { role: 'user', content: mensajeUsuario },
      ],
      temperature: 0.5,
    });

    return response.choices[0].message.content ?? '';
  } catch (error) {
    return "Lo siento, tuve un problema con mi sistema. Por favor, intenta de nuevo en un momento.";
  }
}