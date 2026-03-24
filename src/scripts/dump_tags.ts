import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.etiqueta.findMany().then(d => {
  console.log(JSON.stringify(d, null, 2));
}).catch(e=>console.error(e)).finally(() => prisma.$disconnect());
