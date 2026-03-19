import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import fs from 'fs';

export const getDocumentos = async (req: Request, res: Response) => {
  try {
    const casoId = req.params.id || req.params.casoId;
    const documentos = await prisma.documento.findMany({
      where: { casoId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(documentos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener documentos' });
  }
};

export const uploadDocumento = async (req: Request, res: Response) => {
  try {
    const casoId = req.params.id || req.params.casoId || req.body.casoId;
    
    if (!req.file) return res.status(400).json({ error: 'Archivo no proporcionado' });

    // Validate size for demo
    if (req.user?.tipo === 'demo') {
      const maxMb = parseInt(process.env.DEMO_MAX_TAMANIO_ARCHIVO_MB || '2');
      if (req.file.size > maxMb * 1024 * 1024) {
        fs.unlinkSync(req.file.path);
        return res.status(403).json({ error: `El archivo supera el límite de ${maxMb}MB para cuentas demo.` });
      }
    }

    const documento = await prisma.documento.create({
      data: {
        nombre: req.file.originalname,
        url: `/uploads/${req.file.filename}`,
        tipo: 'otro', 
        casoId,
        creadoPorDemo: req.user?.tipo === 'demo'
      }
    });

    res.status(201).json(documento);
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: 'Error al subir documento' });
  }
};

export const deleteDocumento = async (req: Request, res: Response) => {
  try {
    const doc = await prisma.documento.findUnique({ where: { id: req.params.id } });
    if (!doc) return res.status(404).json({ error: 'Documento no encontrado' });

    if (fs.existsSync(`.${doc.url}`)) fs.unlinkSync(`.${doc.url}`);

    await prisma.documento.delete({ where: { id: req.params.id } });
    res.json({ message: 'Documento eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar documento' });
  }
};
