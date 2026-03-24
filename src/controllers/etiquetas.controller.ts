import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const getEtiquetas = async (req: Request, res: Response) => {
  try {
    const usuarioId = req.user?.id;
    if (!usuarioId) return res.status(401).json({ error: 'No autorizado' });

    const etiquetas = await prisma.etiqueta.findMany({
      where: { usuarioId },
      orderBy: { nombre: 'asc' },
      include: {
        _count: { select: { casos: true } }
      }
    });

    // Formatting for frontend: include 'usada' field
    const formatted = etiquetas.map(e => ({
      ...e,
      usada: e._count.casos
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error al obtener etiquetas:', error);
    res.status(500).json({ error: 'Error al obtener etiquetas' });
  }
};

export const createEtiqueta = async (req: Request, res: Response) => {
  try {
    const usuarioId = req.user?.id;
    if (!usuarioId) return res.status(401).json({ error: 'No autorizado' });

    const { nombre, color } = req.body;
    
    // Solicitud del usuario: Registrar en consola y archivo de texto lo que recibe el backend
    console.log('\n--- DATOS DE ETIQUETA RECIBIDOS EN BACKEND ---');
    console.log(JSON.stringify(req.body, null, 2));
    require('fs').writeFileSync('etiqueta_recibida.txt', JSON.stringify(req.body, null, 2), 'utf-8');

    if (!nombre || !color) {
      return res.status(400).json({ error: 'Nombre y color son requeridos' });
    }

    const isDemo = req.user?.tipo === 'demo';
    if (isDemo) {
      const count = await prisma.etiqueta.count({ where: { usuarioId: req.user!.id } });
      if (count >= 3) {
        return res.status(403).json({ error: 'Límite alcanzado: Las cuentas Demo solo pueden tener hasta 3 etiquetas.' });
      }
    }

    // Check custom uniqueness per user
    const exists = await prisma.etiqueta.findFirst({
      where: { nombre: nombre.trim(), usuarioId }
    });
    
    if (exists) {
      return res.status(400).json({ error: 'Ya tienes una etiqueta con ese nombre' });
    }

    const etiqueta = await prisma.etiqueta.create({
      data: {
        nombre: nombre.trim(),
        color,
        usuarioId,
        creadoPorDemo: isDemo
      }
    });

    res.status(201).json({ ...etiqueta, usada: 0 });
  } catch (error) {
    console.error('Error al crear etiqueta:', error);
    res.status(500).json({ error: 'Error al crear etiqueta' });
  }
};

export const updateEtiqueta = async (req: Request, res: Response) => {
  try {
    const usuarioId = req.user?.id;
    if (!usuarioId) return res.status(401).json({ error: 'No autorizado' });

    const existing = await prisma.etiqueta.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.usuarioId !== usuarioId) {
      return res.status(404).json({ error: 'Etiqueta no encontrada' });
    }

    const { nombre, color } = req.body;
    const etiqueta = await prisma.etiqueta.update({
      where: { id: req.params.id },
      data: {
        nombre: nombre?.trim() || existing.nombre,
        color: color || existing.color
      }
    });

    res.json(etiqueta);
  } catch (error) {
    console.error('Error al actualizar etiqueta:', error);
    res.status(500).json({ error: 'Error al actualizar etiqueta' });
  }
};

export const deleteEtiqueta = async (req: Request, res: Response) => {
  try {
    const usuarioId = req.user?.id;
    if (!usuarioId) return res.status(401).json({ error: 'No autorizado' });

    const existing = await prisma.etiqueta.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.usuarioId !== usuarioId) {
      return res.status(404).json({ error: 'Etiqueta no encontrada' });
    }

    const tieneCasos = await prisma.etiquetaCaso.count({
      where: { etiquetaId: req.params.id }
    });

    if (tieneCasos > 0) {
      return res.status(400).json({ error: 'No se puede eliminar la etiqueta porque tiene casos asociados' });
    }

    await prisma.etiqueta.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    console.error('Error al eliminar etiqueta:', error);
    res.status(500).json({ error: 'Error al eliminar etiqueta' });
  }
};
