import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });

// ai.service.ts

import { DIAGNOSTICO_PROMPT } from './ai.prompt';
import { DiagnosticoIAResponse } from './ai.types';

export async function ejecutarDiagnosticoIA({
  mensajeUsuario,
  pasoDiagnostico,
  intentosIps,
  ultimoFueFalla,
}: {
  mensajeUsuario: string;
  pasoDiagnostico: number;
  intentosIps: number;
  ultimoFueFalla: boolean;
}): Promise<DiagnosticoIAResponse> {

  console.log('[IA] Input:', {
    mensajeUsuario,
    pasoDiagnostico,
    intentosIps,
    ultimoFueFalla,
  });

  const prompt = DIAGNOSTICO_PROMPT
    .replace('{{mensaje_usuario}}', mensajeUsuario)
    .replace('{{paso_diagnostico}}', pasoDiagnostico.toString())
    .replace('{{intentos_ips}}', intentosIps.toString())
    .replace('{{ultimo_fue_falla}}', ultimoFueFalla.toString());

  console.log('[IA] Prompt enviado');

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.3,
    messages: [
      { role: 'system', content: prompt },
    ],
  });

  const raw = completion.choices[0].message.content;

  console.log('[IA] Respuesta cruda:', raw);

  let parsed: DiagnosticoIAResponse;

  try {
    parsed = JSON.parse(raw || '');
  } catch (error) {
    console.error('[IA] ERROR JSON inválido', error);
    throw new Error('Respuesta IA inválida');
  }

  console.log('[IA] Respuesta parseada:', parsed);

  return parsed;
}
