import OpenAI from 'openai';

// Inicialización directa para Render
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '', 
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
          content: `Eres el asistente inteligente de la empresa de internet IPS.
          
          DATOS DEL CLIENTE ACTUAL:
          - Nombre: ${factura.nombreCliente}
          - Estado del Servicio: ${factura.estadoServicio}
          - Deuda Pendiente: ${factura.tieneDeuda ? 'Sí' : 'No'} ($${factura.montoPendiente})
          - Vencimiento: ${factura.fechaVencimiento ?? 'No disponible'}

          PROTOCOLO DE SOPORTE TÉCNICO:
          Si el cliente reporta problemas de lentitud o falta de internet:
          1. Verifica si su estado es ACTIVO. Si tiene deuda, menciona que el pago podría regularizar el servicio.
          2. Si está al día, pide verificar luces del router y energía en el sector.
          3. Recomienda reiniciar el equipo (desconectar 10 segundos).
          4. Solo si el fallo persiste tras estas pruebas, indica que debe contactar a soporte humano al [Número de Soporte].` 
        },
        { 
          role: 'user', 
          content: mensajeUsuario 
        },
      ],
      temperature: 0.7, // Para que la conversación suene natural
    });

    return response.choices[0].message.content ?? 'Lo siento, no pude procesar tu solicitud.';
  } catch (error) {
    console.error("Error en OpenAI Service:", error);
    return "Hola, estamos experimentando una alta demanda. Por favor, intenta de nuevo en un momento.";
  }
}