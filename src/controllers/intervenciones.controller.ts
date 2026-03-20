import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const getIntervenciones = async (req: Request, res: Response) => {
  try {
    const casoId = req.params.id || req.params.casoId;
    const intervenciones = await prisma.intervencion.findMany({
      where: { casoId },
      include: { autor: { select: { nombre: true, email: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(intervenciones);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener intervenciones' });
  }
};

export const createIntervencion = async (req: Request, res: Response) => {
  try {
    const casoId = req.params.id || req.params.casoId || req.body.casoId;
    
    // Validar acceso si es trabajador social
    if (req.user?.rol === 'trabajador_social') {
      const caso = await prisma.caso.findUnique({ where: { id: casoId } });
      if (caso && caso.asignadoAId !== req.user.id) {
        return res.status(403).json({ error: 'No tienes acceso a este caso' });
      }
    }

    const { descripcion } = req.body;

    const intervencion = await prisma.intervencion.create({
      data: {
        descripcion,
        casoId,
        autorId: req.user!.id,
        creadoPorDemo: req.user?.tipo === 'demo'
      },
      include: { autor: { select: { nombre: true } } }
    });
    res.status(201).json(intervencion);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear intervención' });
  }
};
