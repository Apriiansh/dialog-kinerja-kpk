-- AlterTable
ALTER TABLE "users" ADD COLUMN     "unit_kerja_id" INTEGER,
ALTER COLUMN "password" SET DEFAULT '';

-- CreateTable
CREATE TABLE "unit_kerja" (
    "id" SERIAL NOT NULL,
    "nama_unit" VARCHAR(255) NOT NULL,
    "jenis" VARCHAR(100),
    "kepala_jabatan" VARCHAR(150),
    "level" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "parent_id" INTEGER,

    CONSTRAINT "unit_kerja_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "unit_kerja_parent_id_idx" ON "unit_kerja"("parent_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_unit_kerja_id_fkey" FOREIGN KEY ("unit_kerja_id") REFERENCES "unit_kerja"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unit_kerja" ADD CONSTRAINT "unit_kerja_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "unit_kerja"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
