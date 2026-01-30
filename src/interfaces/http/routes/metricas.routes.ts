import { Router } from 'express';
import { obtenerMetricasController } from '../controllers/metricas.controller';

const router = Router();

router.get('/metricas', obtenerMetricasController);

export default router;
