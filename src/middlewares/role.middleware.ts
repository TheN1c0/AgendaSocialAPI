import { Request, Response, NextFunction } from 'express';
import { Rol } from '@prisma/client';

export const requireRole = (...roles: Rol[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'No autenticado' })
    if (!roles.includes(req.user.rol))
      return res.status(403).json({ error: 'No tienes permiso para esta acción' })
    next()
  };

export const isAdmin = requireRole('admin');
