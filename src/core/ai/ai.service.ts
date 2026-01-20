import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '', 
});

export async function generarRespuestaIA(
  mensajeUsuario: string,
  factura: any,
  historialChat: string = ""
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { 
          role: 'system', 
          content: `Eres el soporte técnico experto de IPS. Tu misión es resolver fallas de internet PASO A PASO. 
          
          MEMORIA DE LA CONVERSACIÓN:
          ${historialChat}

          REGLAS CRÍTICAS:
          1. Analiza el historial arriba. Si YA pediste revisar luces, energía o reiniciar, NO lo repitas. Pasa al SIGUIENTE paso.
          2. Da solo UNA instrucción corta y clara por mensaje.
          
          FLUJO OBLIGATORIO:
          - Paso 1: Pedir verificar luces del router.
          - Paso 2: Pedir verificar energía en el sector/enchufe.
          - Paso 3: Pedir reiniciar el router (10 seg fuera).
          - Final: Si tras los 3 pasos sigue fallando, pregunta si desea hablar con soporte humano.

          DATOS CLIENTE: ${factura.nombreCliente}, Deuda: $${factura.montoPendiente}.` 
        },
        { role: 'user', content: mensajeUsuario },
      ],
      temperature: 0.4, // Más bajo para ser más estricto con el protocolo
    });

    return response.choices[0].message.content ?? '';
  } catch (error) {
    return "Lo siento, tuve un problema técnico. ¿Podemos intentar de nuevo?";
  }
}