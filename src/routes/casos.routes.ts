import { Router } from 'express';
import { getCasos, getCasoById, createCaso, updateCaso, deleteCaso } from '../controllers/casos.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { checkLimiteDemo } from '../middlewares/demo.middleware';
import { requireRole } from '../middlewares/role.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getCasos);
router.get('/:id', getCasoById);
router.post('/', checkLimiteDemo('casos'), createCaso);
router.put('/:id', updateCaso);
router.delete('/:id', deleteCaso);

export default router;
