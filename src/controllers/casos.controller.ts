import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { EstadoCaso, PrioridadCaso } from '@prisma/client';

export const getCasos = async (req: Request, res: Response) => {
  try {
    const { beneficiarioId, estado, prioridad, profesionalId, q, page = '1', limit = '10' } = req.query;
    
    let whereClause: any = {};

    // Limitacion por rol trabajador_social
    if (req.user?.rol === 'trabajador_social') {
      whereClause.asignadoAId = req.user.id;
    } else if (profesionalId) {
      whereClause.asignadoAId = String(profesionalId);
    }

    if (beneficiarioId) whereClause.beneficiarioId = String(beneficiarioId);
    if (estado) whereClause.estado = estado as EstadoCaso;
    if (prioridad) whereClause.prioridad = prioridad as PrioridadCaso;
    
    if (q) {
      const search = String(q);
      whereClause.OR = [
        { descripcion: { contains: search, mode: 'insensitive' } },
        { objetivos: { contains: search, mode: 'insensitive' } },
        {
          beneficiario: {
            OR: [
              { nombre: { contains: search, mode: 'insensitive' } },
              { rut: { contains: search, mode: 'insensitive' } }
            ]
          }
        }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const [casos, total] = await Promise.all([
      prisma.caso.findMany({
        where: whereClause,
        include: {
          beneficiario: { select: { nombre: true, rut: true } },
          asignadoA: { select: { nombre: true } },
          etiquetas: { include: { etiqueta: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take
      }),
      prisma.caso.count({ where: whereClause })
    ]);

    res.json({
      data: casos,
      meta: {
        total,
        page: Number(page),
        limit: take,
        totalPages: Math.ceil(total / take)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener casos' });
  }
};

export const getCasoById = async (req: Request, res: Response) => {
  try {
    const caso = await prisma.caso.findUnique({
      where: { id: req.params.id },
      include: {
        beneficiario: true,
        asignadoA: { select: { id: true, nombre: true, email: true } },
        intervenciones: {
          include: { autor: { select: { nombre: true } } },
          orderBy: { createdAt: 'desc' }
        },
        documentos: {
          orderBy: { createdAt: 'desc' }
        },
        etiquetas: {
          include: { etiqueta: true }
        }
      }
    });

    if (!caso) return res.status(404).json({ error: 'Caso no encontrado' });

    if (req.user?.rol === 'trabajador_social' && caso.asignadoAId !== req.user.id) {
      return res.status(403).json({ error: 'No tienes acceso a este caso' });
    }

    res.json(caso);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener caso' });
  }
};

export const createCaso = async (req: Request, res: Response) => {
  try {
    const { etiquetas, profesionalId, ...data } = req.body;
    
    let asignadoAId = profesionalId || null;
    if (req.user?.rol === 'trabajador_social') {
      asignadoAId = req.user.id;
    }

    const caso = await prisma.caso.create({
      data: {
        ...data,
        asignadoAId,
        creadoPorDemo: req.user?.tipo === 'demo',
        ...(etiquetas?.length > 0 && {
          etiquetas: {
            create: etiquetas.map((etiquetaId: string) => ({
              etiqueta: { connect: { id: etiquetaId } }
            }))
          }
        })
      },
      include: {
        beneficiario: true,
        etiquetas: { include: { etiqueta: true } }
      }
    });
    res.status(201).json(caso);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear caso' });
  }
};

export const updateCaso = async (req: Request, res: Response) => {
  try {
    const { etiquetas, profesionalId, ...data } = req.body;
    delete data.creadoPorDemo; // Seguridad

    const currentCaso = await prisma.caso.findUnique({ where: { id: req.params.id } });
    if (!currentCaso) return res.status(404).json({ error: 'Caso no encontrado' });

    if (req.user?.rol === 'trabajador_social' && currentCaso.asignadoAId !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permisos para editar este caso' });
    }

    let intervencionAutomatica = undefined;
    
    if (data.estado && data.estado !== currentCaso.estado) {
      intervencionAutomatica = {
        descripcion: `Cambio de estado automático: de ${currentCaso.estado} a ${data.estado}`,
        autorId: req.user!.id,
        creadoPorDemo: req.user?.tipo === 'demo'
      };
    }

    const updateData: any = { ...data };
    if (profesionalId !== undefined) {
      updateData.asignadoAId = profesionalId;
    }

    const caso = await prisma.caso.update({
      where: { id: req.params.id },
      data: {
        ...updateData,
        ...(etiquetas && {
          etiquetas: {
            deleteMany: {},
            create: etiquetas.map((etiquetaId: string) => ({
              etiqueta: { connect: { id: etiquetaId } }
            }))
          }
        }),
        ...(intervencionAutomatica && {
          intervenciones: {
            create: intervencionAutomatica
          }
        })
      },
      include: {
        etiquetas: { include: { etiqueta: true } }
      }
    });

    res.json(caso);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar caso' });
  }
};

export const deleteCaso = async (req: Request, res: Response) => {
  try {
    const casoId = req.params.id;
    await prisma.$transaction([
      prisma.etiquetaCaso.deleteMany({ where: { casoId } }),
      prisma.documento.deleteMany({ where: { casoId } }),
      prisma.intervencion.deleteMany({ where: { casoId } }),
      prisma.caso.delete({ where: { id: casoId } })
    ]);
    res.json({ message: 'Caso eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el caso' });
  }
};
