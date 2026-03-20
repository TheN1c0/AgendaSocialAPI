import { Router } from 'express';
import { getUsuarios, createUsuario, updateUsuario } from '../controllers/usuarios.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getUsuarios);
router.post('/', requireRole('admin'), createUsuario);
router.put('/:id', requireRole('admin'), updateUsuario);

export default router;
