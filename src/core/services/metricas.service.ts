import { pool } from '../../config/database';

export const guardarMetrica = async (
  endpoint: string,
  tiempoRespuestaMs: number,
  exitoso: boolean
) => {
  await pool.query(
    `
    INSERT INTO metricas_chatbot (endpoint, tiempo_respuesta_ms, exitoso)
    VALUES ($1, $2, $3)
    `,
    [endpoint, tiempoRespuestaMs, exitoso]
  );
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
