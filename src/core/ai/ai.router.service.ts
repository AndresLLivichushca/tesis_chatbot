// src/ai/ai.service.ts

import OpenAI from 'openai';
import { buildInternetPrompt } from './ai.prompt';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class AIService {
  static async procesarMensaje({
    mensaje_usuario,
    intentos_soporte,
  }: {
    mensaje_usuario: string;
    intentos_soporte: number;
    tipo_problema?: string;
  }) {
    const prompt = buildInternetPrompt({
      mensaje_usuario,
      intentos_soporte,
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Eres un asistente técnico experto en soporte de internet.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.4,
    });

    const raw = completion.choices[0].message?.content || '{}';

    // 🧠 Parse seguro
    const parsed = JSON.parse(raw);

    return {
      mensajeIA: parsed.mensajeIA,
      tipo_problema: parsed.tipo_problema,
      estado: parsed.estado,
      finalizar: parsed.finalizar,
      paso_diagnostico: parsed.paso_diagnostico,
    };
  }
}
