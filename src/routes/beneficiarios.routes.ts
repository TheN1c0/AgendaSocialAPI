import { Router } from 'express';
import { getBeneficiarios, getBeneficiarioById, createBeneficiario, updateBeneficiario } from '../controllers/beneficiarios.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { checkLimiteDemo } from '../middlewares/demo.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getBeneficiarios);
router.get('/:id', getBeneficiarioById);
router.post('/', checkLimiteDemo('beneficiarios'), createBeneficiario);
router.put('/:id', updateBeneficiario);

export default router;
