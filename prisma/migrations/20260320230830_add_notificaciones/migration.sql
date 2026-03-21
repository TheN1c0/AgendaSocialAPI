-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('admin', 'trabajador_social');

-- CreateEnum
CREATE TYPE "Tipo" AS ENUM ('real', 'demo');

-- CreateEnum
CREATE TYPE "PrioridadCaso" AS ENUM ('alta', 'media', 'baja');

-- CreateEnum
CREATE TYPE "EstadoCaso" AS ENUM ('abierto', 'en_proceso', 'cerrado', 'derivado');

-- CreateEnum
CREATE TYPE "TipoDocumento" AS ENUM ('pdf', 'imagen', 'otro');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "rol" "Rol" NOT NULL DEFAULT 'trabajador_social',
    "tipo" "Tipo" NOT NULL DEFAULT 'real',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Beneficiario" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "rut" TEXT NOT NULL,
    "telefono" TEXT,
    "email" TEXT,
    "direccion" TEXT,
    "fechaNacimiento" TIMESTAMP(3),
    "grupoFamiliar" TEXT,
    "creadoPorDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Beneficiario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Caso" (
    "id" TEXT NOT NULL,
    "codigoVisible" TEXT,
    "beneficiarioId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "objetivos" TEXT,
    "prioridad" "PrioridadCaso" NOT NULL DEFAULT 'media',
    "estado" "EstadoCaso" NOT NULL DEFAULT 'abierto',
    "asignadoAId" TEXT,
    "derivadoDesde" TEXT,
    "proximaRevision" TIMESTAMP(3),
    "creadoPorDemo" BOOLEAN NOT NULL DEFAULT false,
    "revisionNotificada" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Caso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Intervencion" (
    "id" TEXT NOT NULL,
    "casoId" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "creadoPorDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Intervencion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Documento" (
    "id" TEXT NOT NULL,
    "casoId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "tipo" "TipoDocumento" NOT NULL DEFAULT 'otro',
    "tamanio" TEXT,
    "creadoPorDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Documento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Etiqueta" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "color" TEXT NOT NULL,

    CONSTRAINT "Etiqueta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EtiquetaCaso" (
    "casoId" TEXT NOT NULL,
    "etiquetaId" TEXT NOT NULL,

    CONSTRAINT "EtiquetaCaso_pkey" PRIMARY KEY ("casoId","etiquetaId")
);

-- CreateTable
CREATE TABLE "Notificacion" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "usuarioId" TEXT NOT NULL,
    "casoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notificacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Beneficiario_rut_key" ON "Beneficiario"("rut");

-- CreateIndex
CREATE UNIQUE INDEX "Caso_codigoVisible_key" ON "Caso"("codigoVisible");

-- CreateIndex
CREATE UNIQUE INDEX "Etiqueta_nombre_key" ON "Etiqueta"("nombre");

-- AddForeignKey
ALTER TABLE "Caso" ADD CONSTRAINT "Caso_beneficiarioId_fkey" FOREIGN KEY ("beneficiarioId") REFERENCES "Beneficiario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Caso" ADD CONSTRAINT "Caso_asignadoAId_fkey" FOREIGN KEY ("asignadoAId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Intervencion" ADD CONSTRAINT "Intervencion_casoId_fkey" FOREIGN KEY ("casoId") REFERENCES "Caso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Intervencion" ADD CONSTRAINT "Intervencion_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_casoId_fkey" FOREIGN KEY ("casoId") REFERENCES "Caso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EtiquetaCaso" ADD CONSTRAINT "EtiquetaCaso_casoId_fkey" FOREIGN KEY ("casoId") REFERENCES "Caso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EtiquetaCaso" ADD CONSTRAINT "EtiquetaCaso_etiquetaId_fkey" FOREIGN KEY ("etiquetaId") REFERENCES "Etiqueta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacion" ADD CONSTRAINT "Notificacion_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacion" ADD CONSTRAINT "Notificacion_casoId_fkey" FOREIGN KEY ("casoId") REFERENCES "Caso"("id") ON DELETE SET NULL ON UPDATE CASCADE;
