-- CreateEnum
CREATE TYPE "CardTier" AS ENUM ('QUICK', 'PREMIUM');

-- CreateEnum
CREATE TYPE "QuickTheme" AS ENUM ('AURORA_DREAMS', 'DEEP_BIOLUMINESCENCE', 'FIREFLY_MEADOW', 'LANTERN_FESTIVAL', 'MIDNIGHT_RAIN', 'SAKURA_WIND', 'FIRST_DANCE', 'CHAMPAGNE_TOAST', 'RINGS_OF_LIGHT');

-- CreateEnum
CREATE TYPE "PremiumTheme" AS ENUM ('WATERCOLOR', 'CELESTIAL', 'MIDNIGHT_GARDEN', 'BOTANICAL', 'GOLDEN_HOUR', 'MODERN_MINIMAL', 'PASTEL_DREAM', 'ETERNAL_VOW', 'GRAND_CELEBRATION');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.
ALTER TYPE "Occasion" ADD VALUE 'ENGAGEMENT';
ALTER TYPE "Occasion" ADD VALUE 'NEW_YEARS';
ALTER TYPE "Occasion" ADD VALUE 'PROMOTION';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.
ALTER TYPE "MusicStyle" ADD VALUE 'WALTZ_MUSIC_BOX';
ALTER TYPE "MusicStyle" ADD VALUE 'FESTIVE_ORCHESTRAL';
ALTER TYPE "MusicStyle" ADD VALUE 'ROMANTIC_HARP';
ALTER TYPE "MusicStyle" ADD VALUE 'WIND_CHIMES';

-- AlterTable
ALTER TABLE "Card"
ADD COLUMN     "premiumTheme" "PremiumTheme",
ADD COLUMN     "quickTheme" "QuickTheme",
ADD COLUMN     "tier" "CardTier" NOT NULL DEFAULT 'QUICK',
ALTER COLUMN "musicStyle" SET DEFAULT 'NONE';

-- Backfill existing cards created with legacy single-theme model.
UPDATE "Card"
SET
  "tier" = 'PREMIUM',
  "premiumTheme" = CASE "theme"
    WHEN 'WATERCOLOR' THEN 'WATERCOLOR'::"PremiumTheme"
    WHEN 'CELESTIAL' THEN 'CELESTIAL'::"PremiumTheme"
    WHEN 'MODERN_MINIMAL' THEN 'MODERN_MINIMAL'::"PremiumTheme"
    WHEN 'BOTANICAL' THEN 'BOTANICAL'::"PremiumTheme"
    WHEN 'VINTAGE_FILM' THEN 'WATERCOLOR'::"PremiumTheme"
    WHEN 'GOLDEN_HOUR' THEN 'GOLDEN_HOUR'::"PremiumTheme"
    WHEN 'MIDNIGHT_GARDEN' THEN 'MIDNIGHT_GARDEN'::"PremiumTheme"
    WHEN 'PASTEL_DREAM' THEN 'PASTEL_DREAM'::"PremiumTheme"
    ELSE 'WATERCOLOR'::"PremiumTheme"
  END;

ALTER TABLE "Card" DROP COLUMN "theme";

-- DropEnum
DROP TYPE "Theme";
