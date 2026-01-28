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
      console.log('[AI] INPUT:', data);

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
      console.log('[AI] RAW RESPONSE:', raw);

      const jsonStart = raw.indexOf('{');
      const jsonEnd = raw.lastIndexOf('}');

      if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error('Respuesta IA sin JSON válido');
      }

      const parsed = JSON.parse(raw.substring(jsonStart, jsonEnd + 1));
      console.log('[AI] PARSED:', parsed);

      return {
        respuesta_ia_ips: parsed.respuesta_ia_ips,
        estado: parsed.estado === 'ESCALAR' ? 'ESCALAR' : 'SEGUIR',
        finalizar:
          parsed.estado === 'ESCALAR' ? true : Boolean(parsed.finalizar),
      };
    } catch (error) {
      console.error('[AI INTERNET ERROR]', error);

      return {
        respuesta_ia_ips:
          'No pude resolver el problema automáticamente. Te derivaré con un agente técnico.',
        estado: 'ESCALAR',
        finalizar: true,
      };
    }
  }
}
