-- CreateTable
CREATE TABLE "SesionActiva" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "dispositivo" TEXT,
    "ip" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiraEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SesionActiva_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SesionActiva_token_key" ON "SesionActiva"("token");

-- AddForeignKey
ALTER TABLE "SesionActiva" ADD CONSTRAINT "SesionActiva_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
