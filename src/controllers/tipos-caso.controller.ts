import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getTiposCaso = async (req: Request, res: Response) => {
  try {
    const usuarioId = req.user?.id;
    if (!usuarioId) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const tiposCaso = await prisma.tipoCaso.findMany({
      where: { usuarioId },
      orderBy: { createdAt: 'asc' }
    });

    res.json(tiposCaso);
  } catch (error) {
    console.error('Error al obtener tipos de caso:', error);
    res.status(500).json({ error: 'Error al obtener tipos de caso' });
  }
};

export const createTipoCaso = async (req: Request, res: Response) => {
  try {
    const usuarioId = req.user?.id;
    if (!usuarioId) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const { nombre } = req.body;
    if (!nombre || typeof nombre !== 'string' || nombre.trim() === '') {
      return res.status(400).json({ error: 'El nombre es obligatorio' });
    }

    const isDemo = req.user?.tipo === 'demo';
    
    // Check limit for demo users
    if (isDemo) {
      const count = await prisma.tipoCaso.count({
        where: { usuarioId }
      });
      if (count >= 8) {
        return res.status(403).json({ error: 'Límite alcanzado: Las cuentas Demo solo pueden crear hasta 8 tipos de caso personalizados.' });
      }
    }

    const nuevoTipo = await prisma.tipoCaso.create({
      data: {
        nombre: nombre.trim(),
        usuarioId,
        creadoPorDemo: isDemo
      }
    });

    res.status(201).json(nuevoTipo);
  } catch (error) {
    console.error('Error al crear tipo de caso:', error);
    res.status(500).json({ error: 'Error interno del servidor al crear tipo de caso' });
  }
};

export const updateTipoCaso = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nombre } = req.body;
    const usuarioId = req.user?.id;

    if (!usuarioId) {
       return res.status(401).json({ error: 'No autorizado' });
    }
    if (!nombre || typeof nombre !== 'string' || nombre.trim() === '') {
      return res.status(400).json({ error: 'El nombre es obligatorio' });
    }

    const existing = await prisma.tipoCaso.findUnique({ where: { id } });
    if (!existing || existing.usuarioId !== usuarioId) {
      return res.status(404).json({ error: 'Tipo de caso no encontrado' });
    }

    const tipoActualizado = await prisma.tipoCaso.update({
      where: { id },
      data: { nombre: nombre.trim() }
    });

    res.json(tipoActualizado);
  } catch (error) {
    console.error('Error al actualizar tipo de caso:', error);
    res.status(500).json({ error: 'Error al actualizar tipo de caso' });
  }
};

export const deleteTipoCaso = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const usuarioId = req.user?.id;

    if (!usuarioId) {
       return res.status(401).json({ error: 'No autorizado' });
    }

    const existing = await prisma.tipoCaso.findUnique({ where: { id } });
    if (!existing || existing.usuarioId !== usuarioId) {
      return res.status(404).json({ error: 'Tipo de caso no encontrado' });
    }

    await prisma.tipoCaso.delete({ where: { id } });

    res.status(204).send();
  } catch (error) {
    console.error('Error al eliminar tipo de caso:', error);
    res.status(500).json({ error: 'Error al eliminar tipo de caso' });
  }
};
