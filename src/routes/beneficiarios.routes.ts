import { Router } from 'express';
import { getBeneficiarios, getBeneficiarioById, createBeneficiario, updateBeneficiario, deleteBeneficiario } from '../controllers/beneficiarios.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { checkLimiteDemo } from '../middlewares/demo.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getBeneficiarios);
router.get('/:id', getBeneficiarioById);
router.post('/', checkLimiteDemo('beneficiarios'), createBeneficiario);
router.put('/:id', updateBeneficiario);
router.delete('/:id', deleteBeneficiario);

export default router;
