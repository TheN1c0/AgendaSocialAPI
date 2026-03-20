import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';

export const getUsuarios = async (req: Request, res: Response) => {
  try {
    if (req.user?.tipo === 'demo') {
      return res.status(403).json({ error: 'Listar usuarios no está disponible en acceso demo' });
    }

    const usuarios = await prisma.usuario.findMany({
      select: { id: true, nombre: true, email: true, rol: true, tipo: true, activo: true, createdAt: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};

export const createUsuario = async (req: Request, res: Response) => {
  try {
    const { password, ...data } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const usuario = await prisma.usuario.create({
      data: {
        ...data,
        password: hashedPassword
      },
      select: { id: true, nombre: true, email: true, rol: true, tipo: true, activo: true }
    });
    res.status(201).json(usuario);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear usuario' });
  }
};

export const updateUsuario = async (req: Request, res: Response) => {
  try {
    //  no puede desactivarse a sí mismo
    //  no puede cambiar email ni password desde aquí
    const { email, password, activo, ...data } = req.body;
    
    if (activo === false && req.user!.id === req.params.id) {
      return res.status(400).json({ error: 'Un administrador no puede desactivarse a sí mismo' });
    }

    const updateData: any = { ...data };
    if (typeof activo === 'boolean') {
      updateData.activo = activo;
    }

    const usuario = await prisma.usuario.update({
      where: { id: req.params.id },
      data: updateData,
      select: { id: true, nombre: true, email: true, rol: true, tipo: true, activo: true }
    });
    res.json(usuario);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
};
