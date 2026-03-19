import { Router } from 'express';
import { getUsuarios, createUsuario, updateUsuario } from '../controllers/usuarios.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';

const router = Router();

router.use(authenticate);
router.use(requireRole('admin'));

router.get('/', getUsuarios);
router.post('/', createUsuario);
router.put('/:id', updateUsuario);

export default router;
