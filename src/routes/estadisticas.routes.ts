import { Router } from 'express';
import {
  getCasosPorEstado,
  getCasosPorMes,
  getCasosPorTipo
} from '../controllers/estadisticas.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/casos-por-estado', getCasosPorEstado);
router.get('/casos-por-mes', getCasosPorMes);
router.get('/casos-por-tipo', getCasosPorTipo);

export default router;
