import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const usuario = await prisma.usuario.findUnique({ where: { email } });
    if (!usuario || !usuario.activo) {
      return res.status(401).json({ error: 'Credenciales inválidas o usuario inactivo' });
    }
    const isMatch = await bcrypt.compare(password, usuario.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Credenciales inválidas o usuario inactivo' });
    }
    const token = jwt.sign({ id: usuario.id }, (process.env.JWT_SECRET as string) || 'secret', {
      expiresIn: (process.env.JWT_EXPIRES_IN || '24h') as any
    });
    res.json({ token, usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol, tipo: usuario.tipo } });
  } catch (error) {
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

export const me = async (req: Request, res: Response) => {
  res.json({ usuario: req.user });
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!req.user) return res.status(401).json({ error: 'No autenticado' });
    
    const usuario = await prisma.usuario.findUnique({ where: { id: req.user.id } });
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    const isMatch = await bcrypt.compare(currentPassword, usuario.password);
    if (!isMatch) return res.status(400).json({ error: 'Contraseña actual incorrecta' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.usuario.update({
      where: { id: req.user.id },
      data: { password: hashed }
    });

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al cambiar la contraseña' });
  }
};
