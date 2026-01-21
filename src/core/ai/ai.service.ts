import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function generarRespuestaIA(
  mensajeUsuario: string,
  factura: any,
  historialChat: string = "",
  pasoActual: number = 0
): Promise<string> {

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `
Eres el asistente técnico de la empresa de internet IPS.

DATOS DEL CLIENTE:
- Nombre: ${factura.nombreCliente}
- Saldo pendiente: $${factura.montoPendiente}
- Estado del servicio: Activo

HISTORIAL DE CONVERSACIÓN:
${historialChat}

PASO ACTUAL DEL DIAGNÓSTICO: ${pasoActual}

REGLAS ABSOLUTAS:
1. Responde SOLO UNA instrucción por mensaje.
2. NO repitas pasos anteriores.
3. NO menciones números de paso.
4. NO ofrezcas soporte humano (eso lo maneja el sistema).
5. Sé claro, corto y amable.

PROTOCOLO TÉCNICO:
- pasoActual = 0 → Pedir verificar luces del router
- pasoActual = 1 → Pedir verificar energía / enchufe
- pasoActual = 2 → Pedir reiniciar router (10 segundos)
- pasoActual >= 3 → Responde exactamente: "DIAGNOSTICO_COMPLETADO"

Si el mensaje del usuario NO es técnico (saldo, pagos, info):
- Responde normalmente usando los datos del cliente.
`
        },
        {
          role: 'user',
          content: mensajeUsuario,
        },
      ],
      temperature: 0.4,
    });

    return response.choices[0].message.content ?? '';

  } catch (error) {
    return "Lo siento, tuve un problema técnico. ¿Podemos intentar de nuevo?";
  }
}
