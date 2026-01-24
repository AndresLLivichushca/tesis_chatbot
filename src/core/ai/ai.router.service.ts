import OpenAI from 'openai';
import { ROUTER_PROMPT } from './ai.router.prompt';
import { RouterIAResponse } from './ai.types';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });

export async function detectarIntencionIA(
  mensajeUsuario: string
): Promise<RouterIAResponse> {

  const prompt = ROUTER_PROMPT.replace('{{mensaje_usuario}}', mensajeUsuario);

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0,
    messages: [{ role: 'system', content: prompt }]
  });

  const raw = completion.choices[0].message.content;

  try {
    return JSON.parse(raw || '');
  } catch {
    return { intencion: 'GENERAL', finalizar: false };
  }
}
