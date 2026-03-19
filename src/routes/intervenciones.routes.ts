import { Router } from 'express';
import { getIntervenciones, createIntervencion } from '../controllers/intervenciones.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { checkLimiteDemo } from '../middlewares/demo.middleware';

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get('/', getIntervenciones);
router.post('/', checkLimiteDemo('intervenciones'), createIntervencion);

export default router;
