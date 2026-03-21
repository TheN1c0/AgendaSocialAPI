import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { Rol, Tipo } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        nombre: string;
        email: string;
        rol: Rol;
        tipo: Tipo;
      }
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const esProduccion = process.env.NODE_ENV === 'production';

    // Leer token desde cookie o header según entorno
    const token = esProduccion
      ? req.cookies?.token
      : req.cookies?.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { id: string };

    // Después de verificar firma JWT → solo en producción verificar SesionActiva:
    if (esProduccion) {
      const sesion = await prisma.sesionActiva.findFirst({
        where: { token, activo: true, expiraEn: { gt: new Date() } }
      });
      if (!sesion) return res.status(401).json({ error: 'Sesión inválida o expirada' });
    }

    const usuario = await prisma.usuario.findUnique({ where: { id: decoded.id } });
    
    if (!usuario) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    
    if (!usuario.activo) {
      return res.status(403).json({ error: 'Usuario inactivo' });
    }

    req.user = {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      tipo: usuario.tipo
    };
    
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};
