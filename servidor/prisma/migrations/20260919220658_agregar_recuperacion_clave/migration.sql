-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "codigo_reset" TEXT,
ADD COLUMN     "codigo_reset_expira" TIMESTAMP(3);
