import { Router } from 'express';
import { getDocumentos, uploadDocumento, deleteDocumento } from '../controllers/documentos.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { checkLimiteDemo } from '../middlewares/demo.middleware';
import multer from 'multer';

const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }
});

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get('/', getDocumentos);
router.post('/', upload.single('archivo'), checkLimiteDemo('documentos'), uploadDocumento);
router.delete('/:id', deleteDocumento);

export default router;
