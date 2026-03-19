import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const getBeneficiarios = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    let whereClause = {};

    if (q) {
      const search = String(q);
      whereClause = {
        OR: [
          { nombre: { contains: search, mode: 'insensitive' } },
          { rut: { contains: search, mode: 'insensitive' } },
        ]
      };
    }

    const beneficiarios = await prisma.beneficiario.findMany({
      where: whereClause,
      include: {
        _count: { select: { casos: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(beneficiarios);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener beneficiarios' });
  }
};

export const getBeneficiarioById = async (req: Request, res: Response) => {
  try {
    const beneficiario = await prisma.beneficiario.findUnique({
      where: { id: req.params.id },
      include: {
        casos: {
          include: {
            asignadoA: { select: { nombre: true, email: true } }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    if (!beneficiario) return res.status(404).json({ error: 'Beneficiario no encontrado' });
    res.json(beneficiario);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener beneficiario' });
  }
};

export const createBeneficiario = async (req: Request, res: Response) => {
  try {
    const beneficiario = await prisma.beneficiario.create({
      data: {
        ...req.body,
        creadoPorDemo: req.user?.tipo === 'demo'
      }
    });
    res.status(201).json(beneficiario);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear beneficiario' });
  }
};

export const updateBeneficiario = async (req: Request, res: Response) => {
  try {
    delete req.body.creadoPorDemo; // No permitir cambiar esto
    const beneficiario = await prisma.beneficiario.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(beneficiario);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar beneficiario' });
  }
};
