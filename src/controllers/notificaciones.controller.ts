import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const getMisNotificaciones = async (req: Request, res: Response) => {
  try {
    const usuarioId = (req as any).user.id;
    const notificaciones = await prisma.notificacion.findMany({
      where: { usuarioId },
      orderBy: { createdAt: 'desc' },
      include: { caso: { select: { codigoVisible: true } } }
    });
    const result = notificaciones.map((n: any) => ({
      ...n,
      casoNumero: n.caso?.codigoVisible ? `#${n.caso.codigoVisible}` : null
    }));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener notificaciones' });
  }
};

export const marcarLeidas = async (req: Request, res: Response) => {
  try {
    const usuarioId = (req as any).user.id;
    const { id } = req.params;
    
    if (id === 'todas') {
      await prisma.notificacion.updateMany({
        where: { usuarioId, leida: false },
        data: { leida: true }
      });
      return res.json({ message: 'Todas marcadas como leídas' });
    }

    const notificacion = await prisma.notificacion.updateMany({
      where: { id, usuarioId },
      data: { leida: true }
    });
    res.json(notificacion);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar notificación' });
  }
};

export const eliminarNotificacion = async (req: Request, res: Response) => {
  try {
    const usuarioId = (req as any).user.id;
    const { id } = req.params;
    await prisma.notificacion.deleteMany({
      where: { id, usuarioId }
    });
    res.json({ message: 'Notificación eliminada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar notificación' });
  }
};
