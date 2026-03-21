import { Router } from 'express';
import {
  getMisNotificaciones,
  marcarLeidas,
  eliminarNotificacion
} from '../controllers/notificaciones.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getMisNotificaciones);
router.patch('/:id/leida', marcarLeidas);
router.delete('/:id', eliminarNotificacion);

export default router;
