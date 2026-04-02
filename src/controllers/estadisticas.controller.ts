import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const getCasosPorEstado = async (req: Request, res: Response) => {
  try {
    const agrupado = await prisma.caso.groupBy({
      by: ['estado'],
      _count: { id: true },
    });

    const resultado = agrupado.map(item => ({
      estado: item.estado,
      cantidad: item._count.id
    }));

    res.json(resultado);
  } catch (error) {
    console.error('Error en getCasosPorEstado:', error);
    res.status(500).json({ error: 'Error al obtener casos por estado' });
  }
};

export const getCasosPorMes = async (req: Request, res: Response) => {
  try {
    const result: any[] = await prisma.$queryRaw`
      SELECT
        TO_CHAR(DATE_TRUNC('month', "createdAt"), 'Mon YYYY') AS mes,
        COUNT(*) AS casos
      FROM "Caso"
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY DATE_TRUNC('month', "createdAt") ASC
      LIMIT 12;
    `;

    const formateado = result.map(row => ({
      mes: row.mes,
      casos: Number(row.casos)
    }));

    res.json(formateado);
  } catch (error) {
    console.error('Error en getCasosPorMes:', error);
    res.status(500).json({ error: 'Error al obtener casos por mes' });
  }
};

export const getCasosPorTipo = async (req: Request, res: Response) => {
  try {
    const agrupado = await prisma.caso.groupBy({
      by: ['tipo'],
      _count: { id: true }
    });

    const tiposUsuario = await prisma.tipoCaso.findMany({
      where: req.user?.id ? { usuarioId: req.user.id } : undefined
    });

    const resultadoMap = new Map<string, number>();
    
    // Inicializar tipos registrados en configuración con 0
    tiposUsuario.forEach(t => resultadoMap.set(t.nombre, 0));

    // Agregar las cantidades reales detectadas en los casos
    agrupado.forEach(item => {
      resultadoMap.set(item.tipo, item._count.id);
    });

    // Retornar arreglo ordenado de mayor a menor cantidad
    const resultado = Array.from(resultadoMap.entries())
      .map(([tipo, cantidad]) => ({ tipo, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad);

    res.json(resultado);
  } catch (error) {
    console.error('Error en getCasosPorTipo:', error);
    res.status(500).json({ error: 'Error al obtener casos por tipo' });
  }
};
