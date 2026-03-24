import { Router } from 'express';
import { getEtiquetas, createEtiqueta, updateEtiqueta, deleteEtiqueta } from '../controllers/etiquetas.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getEtiquetas);
router.post('/', createEtiqueta);
router.put('/:id', updateEtiqueta);
router.delete('/:id', deleteEtiqueta);

export default router;
