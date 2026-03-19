import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

const LIMITES = {
  beneficiarios: parseInt(process.env.DEMO_MAX_BENEFICIARIOS || '3'),
  casos: parseInt(process.env.DEMO_MAX_CASOS || '5'),
  intervencionesPorCaso: parseInt(process.env.DEMO_MAX_INTERVENCIONES_POR_CASO || '3'),
  documentosPorCaso: parseInt(process.env.DEMO_MAX_DOCUMENTOS_POR_CASO || '2'),
  tamanioArchivoMB: parseInt(process.env.DEMO_MAX_TAMANIO_ARCHIVO_MB || '2'),
};

export const checkLimiteDemo = (resource: 'beneficiarios' | 'casos' | 'intervenciones' | 'documentos') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'No autenticado' });
    
    if (req.user.tipo !== 'demo') {
      return next();
    }

    try {
      const responseForbidden = (limite: number) => res.status(403).json({
        error: `Has alcanzado el límite de ${limite} para la cuenta demo.`,
        detalle: "Esta cuenta se resetea automáticamente cada domingo.",
        limite
      });

      if (resource === 'beneficiarios') {
        const count = await prisma.beneficiario.count({ where: { creadoPorDemo: true } });
        if (count >= LIMITES.beneficiarios) return responseForbidden(LIMITES.beneficiarios);
      } else if (resource === 'casos') {
        const count = await prisma.caso.count({ where: { creadoPorDemo: true } });
        if (count >= LIMITES.casos) return responseForbidden(LIMITES.casos);
      } else if (resource === 'intervenciones') {
        const casoId = req.params.id || req.params.casoId || req.body.casoId;
        if (casoId) {
          const count = await prisma.intervencion.count({ where: { casoId, creadoPorDemo: true } });
          if (count >= LIMITES.intervencionesPorCaso) return responseForbidden(LIMITES.intervencionesPorCaso);
        }
      } else if (resource === 'documentos') {
        const casoId = req.params.id || req.params.casoId || req.body.casoId;
        if (casoId) {
          const count = await prisma.documento.count({ where: { casoId, creadoPorDemo: true } });
          if (count >= LIMITES.documentosPorCaso) return responseForbidden(LIMITES.documentosPorCaso);
        }
      }
      
      req.body.creadoPorDemo = true;
      next();
    } catch (error) {
      return res.status(500).json({ error: 'Error verificando límites demo' });
    }
  };
};
