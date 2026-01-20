import OpenAI from 'openai';
import { loadEnv } from '../../config/env';
//integracia IA
const env = loadEnv();
const openai = new OpenAI({
  apiKey: (env as any).OPENAI_API_KEY, 
});

export async function generarRespuestaIA(
  mensajeUsuario: string,
  factura: {
    nombreCliente: string;
    tieneDeuda: boolean;
    montoPendiente: number;
    fechaVencimiento: string | null;
    estadoServicio: string;
  }
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { 
          role: 'system', 
          content: 'Eres un asistente de atención al cliente amable de la empresa de internet IPS.' 
        },
        { 
          role: 'user', 
          content: `Datos del cliente:
            Nombre: ${factura.nombreCliente}
            Estado: ${factura.estadoServicio}
            Deuda: ${factura.tieneDeuda ? 'Sí' : 'No'} ($${factura.montoPendiente})
            Vencimiento: ${factura.fechaVencimiento ?? 'No disponible'}

            Mensaje del cliente: "${mensajeUsuario}"` 
        },
      ],
    });

    return response.choices[0].message.content ?? 'Lo siento, no pude procesar tu solicitud.';
  } catch (error) {
    console.error("Error en OpenAI Service:", error);
    return "Hola, estamos experimentando una alta demanda. Por favor, intenta de nuevo en un momento.";
  }
}