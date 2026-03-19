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

  console.log('Cron jobs programados.');
};
