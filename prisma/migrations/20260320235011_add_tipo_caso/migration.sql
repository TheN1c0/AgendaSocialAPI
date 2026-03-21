-- CreateTable
CREATE TABLE "TipoCaso" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "creadoPorDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TipoCaso_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TipoCaso" ADD CONSTRAINT "TipoCaso_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
