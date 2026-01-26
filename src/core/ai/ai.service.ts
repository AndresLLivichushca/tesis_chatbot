import OpenAI from 'openai';
import { limpiarMensaje } from '../utils/limpiarMensaje';
import { DIAGNOSTICO_PROMPT } from './ai.prompt';
import { DiagnosticoIAResponse } from './ai.types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

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

  const mensajeLimpio = limpiarMensaje(mensajeUsuario);

  console.log('[IA] Input limpio:', {
    mensajeLimpio,
    pasoDiagnostico,
    intentosIps,
    ultimoFueFalla,
  });

  const prompt = DIAGNOSTICO_PROMPT
    .replace('{{mensaje_usuario}}', mensajeLimpio)
    .replace('{{paso_diagnostico}}', pasoDiagnostico.toString())
    .replace('{{intentos_ips}}', intentosIps.toString())
    .replace('{{ultimo_fue_falla}}', ultimoFueFalla.toString());

  console.log('[IA] Prompt enviado a OpenAI');

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.3,
    messages: [{ role: 'system', content: prompt }],
  });

  const raw = completion.choices[0].message.content;

  console.log('[IA] Respuesta cruda:', raw);

  try {
    const parsed = JSON.parse(raw || '');
    console.log('[IA] Respuesta parseada:', parsed);
    return parsed;
  } catch (error) {
    console.error('[IA] ERROR JSON inválido', error);
    throw new Error('Respuesta IA inválida');
  }
}
