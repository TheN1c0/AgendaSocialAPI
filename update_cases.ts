import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const demoUser = await prisma.usuario.findUnique({ where: { email: 'demo@tuapp.cl' } });
  if (demoUser) {
    await prisma.caso.updateMany({ data: { asignadoAId: demoUser.id } });
    console.log('Todos los casos reasignados a demo User!');
  }
}
main().finally(() => prisma.$disconnect());
