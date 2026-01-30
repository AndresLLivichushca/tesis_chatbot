import { pool } from '../../config/database';

export const guardarMetrica = async (
  endpoint: string,
  tiempoRespuestaMs: number,
  exitoso: boolean,
  requestId?: string
) => {
  try {
    await pool.query(
      `
      INSERT INTO metricas_chatbot (
        endpoint,
        tiempo_respuesta_ms,
        exitoso,
        request_id
      )
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (request_id) DO NOTHING
      `,
      [endpoint, tiempoRespuestaMs, exitoso, requestId ?? null]
    );
  } catch (error) {
    console.error('Error guardando métrica:', error);
  }
};

export const obtenerMetricas = async () => {
  const result = await pool.query(`
    SELECT
      COUNT(*) AS total,
      AVG(tiempo_respuesta_ms) AS tiempo_promedio,
      (SUM(CASE WHEN exitoso THEN 1 ELSE 0 END)::float / COUNT(*)) * 100 AS porcentaje_exito
    FROM metricas_chatbot
  `);

  return result.rows[0];
};
