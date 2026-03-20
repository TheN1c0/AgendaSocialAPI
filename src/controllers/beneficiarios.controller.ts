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
    const data = { ...req.body };
    if (data.fechaNacimiento) {
      data.fechaNacimiento = new Date(data.fechaNacimiento).toISOString();
    } else {
      delete data.fechaNacimiento;
    }

    const beneficiario = await prisma.beneficiario.create({
      data: {
        ...data,
        creadoPorDemo: req.user?.tipo === 'demo'
      }
    });
    res.status(201).json(beneficiario);
  } catch (error: any) {
    console.error('Error creating beneficiario:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'El RUT ingresado ya se encuentra registrado.' });
    }
    res.status(500).json({ error: 'Error interno al crear el beneficiario.' });
  }
};

export const updateBeneficiario = async (req: Request, res: Response) => {
  try {
    const data = { ...req.body };
    delete data.creadoPorDemo; // No permitir cambiar esto
    
    if (data.fechaNacimiento) {
      data.fechaNacimiento = new Date(data.fechaNacimiento).toISOString();
    } else {
      delete data.fechaNacimiento;
    }

    const beneficiario = await prisma.beneficiario.update({
      where: { id: req.params.id },
      data
    });
    res.json(beneficiario);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'El RUT ingresado ya se encuentra registrado.' });
    }
    res.status(500).json({ error: 'Error al actualizar beneficiario' });
  }
};
