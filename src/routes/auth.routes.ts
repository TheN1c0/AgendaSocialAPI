import { Router } from 'express';
import { login, logout, me, changePassword, getSesiones, cerrarSesion, cerrarTodasSesiones } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.post('/login', login);
router.post('/logout', logout);
router.get('/me', authenticate, me);
router.put('/password', authenticate, changePassword);

router.get('/sesiones', authenticate, getSesiones);
router.delete('/sesiones/:id', authenticate, cerrarSesion);
router.delete('/sesiones', authenticate, cerrarTodasSesiones);

export default router;
