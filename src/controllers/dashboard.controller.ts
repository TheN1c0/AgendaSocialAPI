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

    // --- WIDGETS DATA ---
    // 1. Casos por estado (Donut)
    const casosPorEstadoRaw = await prisma.caso.groupBy({
      by: ['estado'],
      _count: { id: true },
    });
    
    const estadosMap: Record<string, string> = {
      abierto: 'Abierto',
      en_proceso: 'En proceso',
      cerrado: 'Cerrado',
      derivado: 'Derivado'
    };
    const estadoLabels = ['Abierto', 'En proceso', 'Cerrado', 'Derivado'];
    const estadoData = estadoLabels.map(label => {
      const dbEstado = Object.keys(estadosMap).find(k => estadosMap[k] === label);
      const match = casosPorEstadoRaw.find(c => c.estado === dbEstado);
      return match ? match._count.id : 0;
    });

    // 2. Carga por profesional (Horizontal Bar)
    const cargaProfesionalRaw = await prisma.caso.groupBy({
      by: ['asignadoAId'],
      where: { estado: { notIn: ['cerrado', 'derivado'] }, asignadoAId: { not: null } },
      _count: { id: true },
    });
    
    const userIds = cargaProfesionalRaw.map(c => c.asignadoAId).filter(Boolean) as string[];
    const users = await prisma.usuario.findMany({
      where: { id: { in: userIds } },
      select: { id: true, nombre: true }
    });
    
    const cargaOrdenada = cargaProfesionalRaw
      .map(c => ({
        count: c._count.id,
        nombre: users.find(u => u.id === c.asignadoAId)?.nombre?.split(' ')[0] || 'Desconocido'
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // top 5
      
    const cargaLabels = cargaOrdenada.map(c => c.nombre);
    const cargaData = cargaOrdenada.map(c => c.count);

    // 3. Nuevos vs Cerrados (Últimos 6 meses)
    const mesesLabels: string[] = [];
    const nuevosData: number[] = [];
    const cerradosData: number[] = [];
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextD = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      
      const mesNombre = d.toLocaleString('es-CL', { month: 'short' }).replace('.', '');
      mesesLabels.push(mesNombre.charAt(0).toUpperCase() + mesNombre.slice(1));
      
      const creados = await prisma.caso.count({
        where: { createdAt: { gte: d, lt: nextD } }
      });
      nuevosData.push(creados);
      
      const cerradosMes = await prisma.caso.count({
        where: { estado: 'cerrado', updatedAt: { gte: d, lt: nextD } }
      });
      cerradosData.push(cerradosMes);
    }

    // 4. Evolución de casos activos (Últimas 6 semanas aproximadas)
    let runningActivos = totalCasosActivos;
    const activosHistory = [runningActivos];
    
    // Semana actual (últimos 7 días)
    const creadosThisWeek = await prisma.caso.count({ where: { createdAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } }});
    const cerradosThisWeek = await prisma.caso.count({ where: { estado: 'cerrado', updatedAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } }});
    runningActivos = Math.max(0, runningActivos - creadosThisWeek + cerradosThisWeek);
    activosHistory.push(runningActivos);

    for (let i = 1; i < 6; i++) {
        const startWeek = new Date(now.getTime() - (i+1) * 7 * 24 * 60 * 60 * 1000);
        const endWeek = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
        const creadosW = await prisma.caso.count({ where: { createdAt: { gte: startWeek, lt: endWeek } } });
        const cerradosW = await prisma.caso.count({ where: { estado: 'cerrado', updatedAt: { gte: startWeek, lt: endWeek } } });
        runningActivos = Math.max(0, runningActivos - creadosW + cerradosW);
        activosHistory.push(runningActivos);
    }
    activosHistory.reverse();
    const evolucionLabels = ['Sem -6', 'Sem -5', 'Sem -4', 'Sem -3', 'Sem -2', 'Sem -1', 'Actual'];

    const widgetsData = {
      casosPorEstado: { labels: estadoLabels, data: estadoData },
      cargaProfesional: { labels: cargaLabels, data: cargaData },
      nuevosVsCerrados: { labels: mesesLabels, nuevos: nuevosData, cerrados: cerradosData },
      evolucionActivos: { labels: evolucionLabels, data: activosHistory }
    };

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
      widgetsData
    });
  } catch (error) {
    console.error('Error in getDashboardStats:', error);
    res.status(500).json({ error: 'Error interno al obtener estadísticas' });
  }
};
