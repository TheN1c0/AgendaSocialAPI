import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const LIMITS = {
  beneficiarios: parseInt(process.env.DEMO_MAX_BENEFICIARIOS || '3'),
  casos: parseInt(process.env.DEMO_MAX_CASOS || '5'),
  intervencionesPorCaso: parseInt(process.env.DEMO_MAX_INTERVENCIONES_POR_CASO || '3'),
  documentosPorCaso: parseInt(process.env.DEMO_MAX_DOCUMENTOS_POR_CASO || '2'),
};

async function cleanup() {
  console.log('Iniciando limpieza de datos demo excedentes...', LIMITS);

  // 1. Limpiar Beneficiarios
  const demoBeneficiarios = await prisma.beneficiario.findMany({
    where: { creadoPorDemo: true },
    orderBy: { createdAt: 'desc' }
  });

  if (demoBeneficiarios.length > LIMITS.beneficiarios) {
    const toDelete = demoBeneficiarios.slice(LIMITS.beneficiarios);
    const toDeleteIds = toDelete.map(b => b.id);
    console.log(`Borrando ${toDeleteIds.length} beneficiarios excedentes...`);

    // Cascade delete cases for these beneficiaries
    const casosToDelete = await prisma.caso.findMany({ where: { beneficiarioId: { in: toDeleteIds } }, select: { id: true } });
    const casosIds = casosToDelete.map(c => c.id);
    
    if (casosIds.length > 0) {
      await prisma.intervencion.deleteMany({ where: { casoId: { in: casosIds } } });
      await prisma.documento.deleteMany({ where: { casoId: { in: casosIds } } });
      await prisma.etiquetaCaso.deleteMany({ where: { casoId: { in: casosIds } } });
      await prisma.notificacion.deleteMany({ where: { casoId: { in: casosIds } } });
      await prisma.caso.deleteMany({ where: { id: { in: casosIds } } });
    }

    await prisma.beneficiario.deleteMany({ where: { id: { in: toDeleteIds } } });
  }

  // 2. Limpiar Casos (en total de la demo max limite)
  const demoCasos = await prisma.caso.findMany({
    where: { creadoPorDemo: true },
    orderBy: { createdAt: 'desc' }
  });

  if (demoCasos.length > LIMITS.casos) {
    const toDelete = demoCasos.slice(LIMITS.casos);
    const toDeleteIds = toDelete.map(c => c.id);
    console.log(`Borrando ${toDeleteIds.length} casos excedentes...`);

    await prisma.intervencion.deleteMany({ where: { casoId: { in: toDeleteIds } } });
    await prisma.documento.deleteMany({ where: { casoId: { in: toDeleteIds } } });
    await prisma.etiquetaCaso.deleteMany({ where: { casoId: { in: toDeleteIds } } });
    await prisma.notificacion.deleteMany({ where: { casoId: { in: toDeleteIds } } });
    await prisma.caso.deleteMany({ where: { id: { in: toDeleteIds } } });
  }

  // 3 & 4. Limpiar intervenciones y documentos por caso
  const remainingCasos = await prisma.caso.findMany({
    where: { creadoPorDemo: true },
    select: { id: true }
  });

  for (const caso of remainingCasos) {
    // Intervenciones
    const intervenciones = await prisma.intervencion.findMany({
      where: { casoId: caso.id, creadoPorDemo: true },
      orderBy: { createdAt: 'desc' }
    });
    if (intervenciones.length > LIMITS.intervencionesPorCaso) {
      const toDelete = intervenciones.slice(LIMITS.intervencionesPorCaso).map(i => i.id);
      await prisma.intervencion.deleteMany({ where: { id: { in: toDelete } } });
      console.log(`Borradas ${toDelete.length} intervenciones excedentes del caso ${caso.id}`);
    }

    // Documentos
    const documentos = await prisma.documento.findMany({
      where: { casoId: caso.id, creadoPorDemo: true },
      orderBy: { createdAt: 'desc' }
    });
    if (documentos.length > LIMITS.documentosPorCaso) {
      const toDelete = documentos.slice(LIMITS.documentosPorCaso).map(d => d.id);
      await prisma.documento.deleteMany({ where: { id: { in: toDelete } } });
      console.log(`Borrados ${toDelete.length} documentos excedentes del caso ${caso.id}`);
    }
  }

  console.log('Limpieza completada.');
}

cleanup()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
