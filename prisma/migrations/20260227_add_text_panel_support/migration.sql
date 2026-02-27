-- CreateEnum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PhotoSlotType') THEN
    CREATE TYPE "PhotoSlotType" AS ENUM ('PHOTO', 'TEXT_PANEL');
  END IF;
END $$;

-- AlterTable
ALTER TABLE "Photo"
  ADD COLUMN IF NOT EXISTS "slotType" "PhotoSlotType" NOT NULL DEFAULT 'PHOTO',
  ADD COLUMN IF NOT EXISTS "textContent" TEXT;
