import { getDashboardStats } from './src/controllers/dashboard.controller';
import { prisma } from './src/lib/prisma';

async function test() {
  const req = {} as any;
  const res = {
    json: (data: any) => {
      console.log('--- WIDGETS DATA ---');
      console.log(JSON.stringify(data.widgetsData, null, 2));
      process.exit(0);
    },
    status: (code: number) => ({
      json: (data: any) => {
        console.error('Error', code, data);
        process.exit(1);
      }
    })
  } as any;

  await getDashboardStats(req, res);
}

test().catch(e => {
  console.error(e);
  process.exit(1);
});
