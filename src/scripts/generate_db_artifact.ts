import fs from 'fs';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.etiqueta.findMany().then(d => {
  const table = '# Estado Actual de la Tabla Etiquetas\n\nAquí tienes el volcado actualizado tras la sincronización estructural de la base de datos (npx prisma db push) y la inicialización de registros base (seed). Puedes ver que la columna `usuarioId` ya está operando.\n\n| Nombre | Color | Creado Por Demo | Usuario ID (Extracto) |\n|---|---|---|---|\n' + d.map(e => `| ${e.nombre} | ${e.color} | ${e.creadoPorDemo ? 'Sí' : 'No'} | ${e.usuarioId.slice(0,8)}... |`).join('\n');
  fs.writeFileSync('C:/Users/nico_/.gemini/antigravity/brain/e30e8d63-ed06-45e7-9a0f-4af4f7f628a1/etiquetas_db.md', table, 'utf8');
}).catch(e=>console.error(e)).finally(() => prisma.$disconnect());
