import { Router } from 'express';
import { getTiposCaso, createTipoCaso, updateTipoCaso, deleteTipoCaso } from '../controllers/tipos-caso.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Protect all routes
router.use(authenticate);

router.get('/', getTiposCaso);
router.post('/', createTipoCaso);
router.put('/:id', updateTipoCaso);
router.delete('/:id', deleteTipoCaso);

export default router;
