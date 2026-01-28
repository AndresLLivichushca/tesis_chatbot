// src/core/ai/ai.prompt.ts

export function buildInternetPrompt({
  mensaje_usuario,
  intentos_soporte,
}: {
  mensaje_usuario: string;
  intentos_soporte: number;
}) {
  return {
    system: `
Eres un asistente técnico de soporte de internet (ISP).

Tu tarea es ayudar a resolver problemas de conexión paso a paso.

REGLAS ESTRICTAS:
- Da SOLO UNA instrucción concreta por mensaje
- No repitas instrucciones anteriores
- Sé claro, breve y técnico
- Si ya hubo 3 intentos fallidos, indica que se debe escalar a un agente humano
- Devuelve ÚNICAMENTE JSON válido
- Nunca escribas texto fuera del JSON

FORMATO:
{
  "respuesta_ia_ips": "texto",
  "estado": "SEGUIR | ESCALAR",
  "finalizar": boolean
}
`.trim(),

    user: `
Mensaje del cliente:
"${mensaje_usuario}"

Intentos previos: ${intentos_soporte}
`.trim(),
  };
}
