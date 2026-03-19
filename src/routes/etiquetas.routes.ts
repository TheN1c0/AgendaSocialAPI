import { Router } from 'express';
import { getEtiquetas, createEtiqueta, updateEtiqueta, deleteEtiqueta } from '../controllers/etiquetas.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getEtiquetas);
router.post('/', requireRole('admin'), createEtiqueta);
router.put('/:id', requireRole('admin'), updateEtiqueta);
router.delete('/:id', requireRole('admin'), deleteEtiqueta);

export default router;
