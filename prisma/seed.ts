import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // 1. Crear etiquetas base
  const etiquetasData = [
    { nombre: 'Urgente', color: '#E24B4A' },
    { nombre: 'Familia', color: '#1D9E75' },
    { nombre: 'Vivienda', color: '#378ADD' },
    { nombre: 'Empleo', color: '#BA7517' },
    { nombre: 'Salud', color: '#534AB7' },
  ]

  for (const e of etiquetasData) {
    await prisma.etiqueta.upsert({
      where: { nombre: e.nombre },
      update: {},
      create: e,
    })
  }

  // 2. Crear usuario admin real
  const adminPassword = await bcrypt.hash('cambiar_en_produccion', 10)
  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@tuapp.cl' },
    update: {},
    create: {
      nombre: 'Administrador',
      email: 'admin@tuapp.cl',
      password: adminPassword,
      rol: 'admin',
      tipo: 'real',
    },
  })

  // 3. Crear usuario demo
  const demoPassword = await bcrypt.hash('demo1234', 10)
  const demoUser = await prisma.usuario.upsert({
    where: { email: 'demo@tuapp.cl' },
    update: {},
    create: {
      nombre: 'Marta Gómez',
      email: 'demo@tuapp.cl',
      password: demoPassword,
      rol: 'trabajador_social',
      tipo: 'demo',
    },
  })

  // 4. Crear 2 profesionales reales adicionales
  const prof1Password = await bcrypt.hash('prof1234', 10)
  const prof1 = await prisma.usuario.upsert({
    where: { email: 'diego@tuapp.cl' },
    update: {},
    create: {
      nombre: 'Diego Rivas',
      email: 'diego@tuapp.cl',
      password: prof1Password,
      rol: 'trabajador_social',
      tipo: 'real',
    },
  })

  const prof2Password = await bcrypt.hash('prof1234', 10)
  const prof2 = await prisma.usuario.upsert({
    where: { email: 'ana@tuapp.cl' },
    update: {},
    create: {
      nombre: 'Ana Bravo',
      email: 'ana@tuapp.cl',
      password: prof2Password,
      rol: 'trabajador_social',
      tipo: 'real',
    },
  })

  // 5. Crear 5 beneficiarios con RUTs chilenos válidos
  const beneficiariosData = [
    { nombre: 'Juan Pérez', rut: '11.111.111-1', telefono: '+56911111111', grupoFamiliar: '4', creadoPorDemo: false },
    { nombre: 'María Silva', rut: '22.222.222-2', telefono: '+56922222222', grupoFamiliar: '2', creadoPorDemo: false },
    { nombre: 'Pedro González', rut: '33.333.333-3', telefono: '+56933333333', grupoFamiliar: '3', creadoPorDemo: false },
    { nombre: 'Camila Rojas', rut: '44.444.444-4', telefono: '+56944444444', grupoFamiliar: '5', creadoPorDemo: false },
    { nombre: 'Luis Soto', rut: '55.555.555-5', telefono: '+56955555555', grupoFamiliar: '1', creadoPorDemo: false },
  ]

  const beneficiarios = []
  for (const b of beneficiariosData) {
    const beneficiario = await prisma.beneficiario.upsert({
      where: { rut: b.rut },
      update: {},
      create: b,
    })
    beneficiarios.push(beneficiario)
  }

  // 6. Crear 10 casos distribuidos
  const profesionales = [demoUser, prof1, prof2]
  const estados: ('abierto' | 'en_proceso' | 'cerrado' | 'derivado')[] = [
    'abierto', 'abierto', 'abierto',
    'en_proceso', 'en_proceso', 'en_proceso',
    'cerrado', 'cerrado',
    'derivado', 'derivado'
  ]
  const prioridades: ('alta' | 'alta' | 'alta' | 'media' | 'media' | 'media' | 'media' | 'baja' | 'baja' | 'baja')[] = [
    'alta', 'alta', 'alta',
    'media', 'media', 'media', 'media',
    'baja', 'baja', 'baja'
  ]

  const tsLabels = await prisma.etiqueta.findMany()

  const casos = []
  for (let i = 0; i < 10; i++) {
    const asignadoA = profesionales[i % profesionales.length]
    const beneficiario = beneficiarios[i % beneficiarios.length]
    
    // Check if it exists to avoid running into unique constraints if running repeatedly, though we use upsert usually it's hard for Caso without unique key.
    // For simplicity, we just create. We can use `deleteMany` first.
    
    const caso = await prisma.caso.create({
      data: {
        beneficiarioId: beneficiario.id,
        tipo: 'Social',
        descripcion: `Descripción del caso ${i + 1}`,
        objetivos: `Objetivos del caso ${i + 1}`,
        prioridad: prioridades[i],
        estado: estados[i],
        asignadoAId: asignadoA.id,
        creadoPorDemo: false,
      }
    })
    casos.push(caso)

    // 9. Asignar etiquetas aleatoriamente a los casos
    const label1 = tsLabels[i % tsLabels.length]
    const label2 = tsLabels[(i + 1) % tsLabels.length]
    await prisma.etiquetaCaso.create({ data: { casoId: caso.id, etiquetaId: label1.id } })
    if (i % 2 === 0) {
      await prisma.etiquetaCaso.create({ data: { casoId: caso.id, etiquetaId: label2.id } })
    }

    // 7. Crear 3 intervenciones por caso con fechas progresivas
    for (let j = 0; j < 3; j++) {
      await prisma.intervencion.create({
        data: {
          casoId: caso.id,
          autorId: asignadoA.id,
          descripcion: `Intervención ${j + 1} para el caso ${caso.id}`,
          creadoPorDemo: false,
          createdAt: new Date(Date.now() - (3 - j) * 86400000) // progressive dates
        }
      })
    }

    // 8. Crear 2 documentos por caso (registro sin archivo real)
    for (let k = 0; k < 2; k++) {
      await prisma.documento.create({
        data: {
          casoId: caso.id,
          nombre: `Documento-${k + 1}.pdf`,
          url: `/uploads/fake-url-${k + 1}.pdf`,
          tipo: 'pdf',
          creadoPorDemo: false,
        }
      })
    }
  }

  console.log('Database seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
