import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // 1. KPIs
    const totalCasosActivos = await prisma.caso.count({
      where: { estado: { notIn: ['cerrado', 'derivado'] } },
    });

    const nuevosEsteMes = await prisma.caso.count({
      where: { createdAt: { gte: firstDayOfMonth } },
    });

    const nuevosMesAnterior = await prisma.caso.count({
      where: { createdAt: { gte: firstDayOfLastMonth, lt: firstDayOfMonth } },
    });

    const casosCerradosMes = await prisma.caso.count({
      where: {
        estado: 'cerrado',
        updatedAt: { gte: firstDayOfMonth }, // Roughly closed this month
      },
    });

    const trabajadoresActivosResult = await prisma.caso.groupBy({
      by: ['asignadoAId'],
      where: { estado: { notIn: ['cerrado', 'derivado'] }, asignadoAId: { not: null } },
    });
    const trabajadoresActivos = trabajadoresActivosResult.length;

    // 2. Últimos Casos
    const ultimosCasosData = await prisma.caso.findMany({
      take: 5,
      orderBy: { updatedAt: 'desc' },
      include: {
        beneficiario: { select: { nombre: true, rut: true } },
        asignadoA: { select: { nombre: true } },
      },
    });

    const ultimosCasos = ultimosCasosData.map((c) => ({
      id: c.id,
      idLabel: c.codigoVisible || `#${c.id.substring(0, 5).toUpperCase()}`,
      cliente: c.beneficiario?.nombre || 'Desconocido',
      estado: c.estado,
      prioridad: c.prioridad,
      ts: c.asignadoA?.nombre || 'Sin asignar',
      fecha: new Date(c.createdAt).toLocaleDateString('es-CL'),
      ultima: new Date(c.updatedAt).toLocaleDateString('es-CL'),
    }));

    // 3. Actividad Reciente (Basada en intervenciones y casos nuevos)
    // Para simplificar, obtenemos las ultimas intervenciones
    const intervenciones = await prisma.intervencion.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        caso: { select: { id: true, estado: true, codigoVisible: true } },
        autor: { select: { nombre: true } },
      },
    });

    const actividad = intervenciones.map((i) => {
      // Calcular tiempo transcurrido básico
      const minsDiff = Math.floor((now.getTime() - i.createdAt.getTime()) / 60000);
      let tiempoStr = '';
      if (minsDiff < 60) tiempoStr = `Hace ${minsDiff} min`;
      else if (minsDiff < 1440) tiempoStr = `Hace ${Math.floor(minsDiff / 60)} h`;
      else tiempoStr = `Hace ${Math.floor(minsDiff / 1440)} d`;

      let accion = 'añadió una intervención';
      if (i.descripcion.includes('Cambio de estado')) {
        accion = 'actualizó el estado del caso';
      }

      return {
        usuario: i.autor?.nombre || 'Sistema',
        accion,
        caso: i.caso?.codigoVisible || `#${i.casoId.substring(0, 5).toUpperCase()}`,
        tiempo: tiempoStr,
      };
    });

    res.json({
      kpis: [
        { label: 'Casos activos', value: totalCasosActivos, sub: 'En seguimiento' },
        { 
          label: 'Nuevos este mes', 
          value: nuevosEsteMes, 
          sub: nuevosEsteMes - nuevosMesAnterior >= 0 
               ? `+${nuevosEsteMes - nuevosMesAnterior} vs mes anterior` 
               : `${nuevosEsteMes - nuevosMesAnterior} vs mes anterior`, 
          accent: nuevosEsteMes >= nuevosMesAnterior 
        },
        { label: 'Casos cerrados', value: casosCerradosMes, sub: 'Este mes' },
        { label: 'Trabajadores activos', value: trabajadoresActivos, sub: 'Con casos activos' },
      ],
      ultimosCasos,
      actividad,
    });
  } catch (error) {
    console.error('Error in getDashboardStats:', error);
    res.status(500).json({ error: 'Error interno al obtener estadísticas' });
  }
};
