import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { detectarDispositivo } from '../lib/dispositivo';

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

    const esProduccion = process.env.NODE_ENV === 'production';
    const recordarme = req.body.recordarme ?? false;

    // Crear SesionActiva solo en producción
    if (esProduccion) {
      await prisma.sesionActiva.create({
        data: {
          usuarioId: usuario.id,
          token,
          dispositivo: detectarDispositivo(req.headers['user-agent'] || ''),
          ip: req.ip,
          activo: true,
          expiraEn: new Date(Date.now() + (recordarme ? 30 : 1) * 24 * 60 * 60 * 1000)
        }
      });
    }

    // Setear cookie (reemplaza el envío del token en el body)
    res.cookie('token', token, {
      httpOnly: true,
      secure: esProduccion,
      sameSite: esProduccion ? 'strict' : 'lax',
      domain: esProduccion ? process.env.COOKIE_DOMAIN : undefined,
      maxAge: recordarme
        ? 30 * 24 * 60 * 60 * 1000
        :  8 * 60 * 60 * 1000
    });

    res.json({ token, usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol, tipo: usuario.tipo } });
  } catch (error) {
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const esProduccion = process.env.NODE_ENV === 'production';
    const token = esProduccion
      ? req.cookies?.token
      : req.cookies?.token || req.headers.authorization?.split(' ')[1];

    if (esProduccion && token) {
      await prisma.sesionActiva.updateMany({
        where: { token },
        data: { activo: false }
      });
    }

    res.clearCookie('token', {
      httpOnly: true,
      secure: esProduccion,
      domain: esProduccion ? process.env.COOKIE_DOMAIN : undefined,
    });
    res.json({ data: 'Sesión cerrada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al cerrar sesión' });
  }
};

export const me = async (req: Request, res: Response) => {
  res.json({ usuario: req.user });
};

export const getSesiones = async (req: Request, res: Response) => {
  try {
    const esProduccion = process.env.NODE_ENV === 'production';
    if (!esProduccion) {
      return res.json({ data: [] });
    }

    const tokenRequerimiento = req.cookies?.token;
    
    if (!req.user) return res.status(401).json({ error: 'No autenticado' });

    const sesiones = await prisma.sesionActiva.findMany({
      where: { usuarioId: req.user.id, activo: true, expiraEn: { gt: new Date() } },
      orderBy: { creadoEn: 'desc' },
      select: { id: true, dispositivo: true, ip: true, creadoEn: true, token: true }
    });

    const data = sesiones.map(s => ({
      id: s.id,
      dispositivo: s.dispositivo,
      ip: s.ip,
      creadoEn: s.creadoEn,
      esActual: s.token === tokenRequerimiento
    }));

    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener sesiones' });
  }
};

export const cerrarSesion = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!req.user) return res.status(401).json({ error: 'No autenticado' });

    const sesion = await prisma.sesionActiva.findUnique({ where: { id } });
    
    if (!sesion || sesion.usuarioId !== req.user.id) {
      return res.status(404).json({ error: 'Sesión no encontrada' });
    }

    await prisma.sesionActiva.update({
      where: { id },
      data: { activo: false }
    });

    const tokenActual = req.cookies?.token;
    if (sesion.token === tokenActual) {
      const esProduccion = process.env.NODE_ENV === 'production';
      res.clearCookie('token', {
        httpOnly: true,
        secure: esProduccion,
        domain: esProduccion ? process.env.COOKIE_DOMAIN : undefined,
      });
    }

    res.json({ data: 'Sesión eliminada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al cerrar sesión' });
  }
};

export const cerrarTodasSesiones = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autenticado' });

    await prisma.sesionActiva.updateMany({
      where: { usuarioId: req.user.id, activo: true },
      data: { activo: false }
    });

    const esProduccion = process.env.NODE_ENV === 'production';
    res.clearCookie('token', {
      httpOnly: true,
      secure: esProduccion,
      domain: esProduccion ? process.env.COOKIE_DOMAIN : undefined,
    });

    res.json({ data: 'Todas las sesiones cerradas' });
  } catch (error) {
    res.status(500).json({ error: 'Error al cerrar sesiones' });
  }
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
