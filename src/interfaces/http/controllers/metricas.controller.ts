import { Request, Response } from 'express';
import { obtenerMetricas } from '../../../core/services/metricas.service';

export const obtenerMetricasController = async (_req: Request, res: Response) => {
  try {
    const metricas = await obtenerMetricas();

    return res.json({
      total_solicitudes: Number(metricas.total),
      tiempo_medio_respuesta_ms: Number(metricas.tiempo_promedio),
      porcentaje_correctas: Number(metricas.porcentaje_exito),
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: 'Error obteniendo métricas',
    });
  }
};
