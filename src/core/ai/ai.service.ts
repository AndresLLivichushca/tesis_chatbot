// src/core/ai/ai.service.ts

import OpenAI from 'openai';
import { buildInternetPrompt } from './ai.prompt';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface IARequestData {
  mensaje_usuario: string;
  intentos_soporte: number;
}

export interface IAResponseData {
  respuesta_ia_ips: string;
  estado: 'SEGUIR' | 'ESCALAR';
  finalizar: boolean;
}
export class AIService {
  static async procesarMensaje(
    data: IARequestData
  ): Promise<IAResponseData> {
    try {
      const prompt = buildInternetPrompt(data);

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.3,
        messages: [
          { role: 'system', content: prompt.system },
          { role: 'user', content: prompt.user },
        ],
      });

      const raw = completion.choices[0]?.message?.content ?? '';
      const json = raw.substring(raw.indexOf('{'), raw.lastIndexOf('}') + 1);
      const parsed = JSON.parse(json);

      return {
        respuesta_ia_ips: parsed.respuesta_ia_ips,
        estado: parsed.estado === 'ESCALAR' ? 'ESCALAR' : 'SEGUIR',
        finalizar: Boolean(parsed.finalizar),
      };
    } catch (error) {
      console.error('[AI INTERNET ERROR]', error);
      return {
        respuesta_ia_ips:
          'No pude resolver el problema automáticamente.',
        estado: 'ESCALAR',
        finalizar: true,
      };
    }
  }
}
