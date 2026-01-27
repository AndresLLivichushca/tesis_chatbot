// src/ai/ai.service.ts

import OpenAI from 'openai';
import { SYSTEM_PROMPT, buildUserPrompt } from './ai.prompt';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface IARequestData {
  mensaje_usuario: string;
  intentos_soporte: number;
  tipo_problema?: string;
}

export interface IAResponseData {
  mensajeIA: string;
  tipo_problema: 'INTERNET' | 'SALDO' | 'OTRO';
  estado: 'SEGUIR' | 'ESCALAR';
  finalizar: boolean;
  paso_diagnostico: number;
}

export class AIService {
  static async procesarMensaje(
    data: IARequestData
  ): Promise<IAResponseData> {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.3,
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: buildUserPrompt(data),
          },
        ],
      });

      const rawContent =
        completion.choices[0]?.message?.content ?? '';

      // 🛡️ Protección: asegurar JSON válido
      const jsonStart = rawContent.indexOf('{');
      const jsonEnd = rawContent.lastIndexOf('}');

      if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error('Respuesta IA no es JSON válido');
      }

      const jsonString = rawContent.substring(
        jsonStart,
        jsonEnd + 1
      );

      const parsed: IAResponseData = JSON.parse(jsonString);

      // 🧹 Normalización defensiva
      return {
        mensajeIA: parsed.mensajeIA ?? 'Estamos revisando tu caso.',
        tipo_problema: parsed.tipo_problema ?? 'OTRO',
        estado: parsed.estado ?? 'SEGUIR',
        finalizar: Boolean(parsed.finalizar),
        paso_diagnostico: Number(parsed.paso_diagnostico ?? 1),
      };
    } catch (error) {
      console.error('Error IA:', error);

      // 🔴 Fallback seguro (NUNCA rompe ManyChat)
      return {
        mensajeIA:
          'No pude analizar tu problema en este momento. Te derivaré con un agente técnico.',
        tipo_problema: 'OTRO',
        estado: 'ESCALAR',
        finalizar: true,
        paso_diagnostico: 0,
      };
    }
  }
}
