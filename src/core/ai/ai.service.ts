// src/core/ai/ai.service.ts
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '', 
});

export async function generarRespuestaIA(
  mensajeUsuario: string,
  factura: any,
  historial: any[] = [] // Opcional: para mantener el hilo de la charla
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { 
          role: 'system', 
          content: `Eres el soporte técnico de IPS. Tu objetivo es diagnosticar fallas de internet PASO A PASO. 
          
          REGLA DE ORO: Da solo UNA instrucción a la vez y espera que el cliente responda.
          
          DATOS: Cliente: ${factura.nombreCliente}, Deuda: $${factura.montoPendiente}, Estado: ${factura.estadoServicio}.
          
          FLUJO DE DIAGNÓSTICO:
          1. Primero: Pide verificar si las luces del router están encendidas.
          2. Segundo: Pide verificar si hay luz en el sector o si el router está bien enchufado.
          3. Tercero: Pide reiniciar el equipo (10 segundos fuera de la corriente).
          4. LÍMITE: Si después de estos 3 pasos el cliente sigue con fallas, dile: "En vista de que no hemos podido solucionar el inconveniente por aquí, ¿deseas que te comunique con un miembro de soporte humano?".` 
        },
        ...historial, // Aquí podrías pasar los últimos mensajes de ManyChat
        { role: 'user', content: mensajeUsuario },
      ],
      temperature: 0.5, // Menor temperatura para ser más preciso con el protocolo
    });

    return response.choices[0].message.content ?? '';
  } catch (error) {
    return "Lo siento, tuve un problema técnico. Intenta de nuevo.";
  }
}