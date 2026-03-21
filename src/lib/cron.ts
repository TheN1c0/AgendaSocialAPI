import cron from 'node-cron';
import { prisma } from './prisma';
import { execSync } from 'child_process';

export const startCronJobs = () => {
  // Cada domingo a las 3:00 AM
  cron.schedule('0 3 * * 0', async () => {
    console.log('[CRON] Iniciando reset semanal del usuario demo...');
    try {
      // 1. Eliminar en orden para respetar las FK
      await prisma.etiquetaCaso.deleteMany({
        where: { caso: { creadoPorDemo: true } }
      });
      await prisma.documento.deleteMany({ where: { creadoPorDemo: true } });
      await prisma.intervencion.deleteMany({ where: { creadoPorDemo: true } });
      await prisma.caso.deleteMany({ where: { creadoPorDemo: true } });
      await prisma.beneficiario.deleteMany({ where: { creadoPorDemo: true } });

      // 2. Restaurar datos del seed
      execSync('npx prisma db seed', { stdio: 'inherit' });

      console.log('[CRON] Reset demo completado correctamente');
    } catch (error) {
      console.error('[CRON] Error en reset demo:', error);
    }
  });

  // Revisión de notificaciones cada hora
  cron.schedule('0 * * * *', async () => {
    console.log('[CRON] Verificando revisiones pendientes...');
    try {
      const ahora = new Date();
      
      const casosParaAlertar = await prisma.caso.findMany({
        where: {
          proximaRevision: { lte: ahora },
          revisionNotificada: false,
          estado: { not: 'cerrado' },
          asignadoAId: { not: null }
        }
      });

      for (const caso of casosParaAlertar) {
        await prisma.notificacion.create({
          data: {
            tipo: 'revision_vencida',
            mensaje: `La revisión del caso programada se encuentra vencida.`,
            usuarioId: caso.asignadoAId!,
            casoId: caso.id
          }
        });

        await prisma.caso.update({
          where: { id: caso.id },
          data: { revisionNotificada: true }
        });
      }

      if (casosParaAlertar.length > 0) {
        console.log(`[CRON] Se generaron ${casosParaAlertar.length} notificaciones de revisión.`);
      }
    } catch (error) {
      console.error('[CRON] Error verificando revisiones:', error);
    }
  });

  // Limpieza de sesiones — solo en producción, cada día a las 2:00 AM
  if (process.env.NODE_ENV === 'production') {
    cron.schedule('0 2 * * *', async () => {
      await prisma.sesionActiva.deleteMany({
        where: {
          OR: [
            { expiraEn: { lt: new Date() } },
            { activo: false }
          ]
        }
      });
      console.log('[CRON] Sesiones expiradas eliminadas');
    });
  }

  console.log('Cron jobs programados.');
};
