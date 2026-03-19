import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const getEtiquetas = async (req: Request, res: Response) => {
  try {
    const etiquetas = await prisma.etiqueta.findMany({
      orderBy: { nombre: 'asc' }
    });
    res.json(etiquetas);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener etiquetas' });
  }
};

export const createEtiqueta = async (req: Request, res: Response) => {
  try {
    const etiqueta = await prisma.etiqueta.create({
      data: req.body
    });
    res.status(201).json(etiqueta);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear etiqueta' });
  }
};

export const updateEtiqueta = async (req: Request, res: Response) => {
  try {
    const etiqueta = await prisma.etiqueta.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(etiqueta);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar etiqueta' });
  }
};

export const deleteEtiqueta = async (req: Request, res: Response) => {
  try {
    const tieneCasos = await prisma.etiquetaCaso.count({
      where: { etiquetaId: req.params.id }
    });
    if (tieneCasos > 0) {
      return res.status(400).json({ error: 'No se puede eliminar la etiqueta porque tiene casos asociados' });
    }
    await prisma.etiqueta.delete({ where: { id: req.params.id } });
    res.json({ message: 'Etiqueta eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar etiqueta' });
  }
};
