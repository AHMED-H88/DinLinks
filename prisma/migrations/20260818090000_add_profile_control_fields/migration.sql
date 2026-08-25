-- Profile control fields.
--
-- Strictly additive: no column is dropped, renamed or retyped, and every new
-- column is either nullable or defaulted, so existing rows remain valid and
-- the previous application version keeps running against this schema.
--
-- serviceModes and highlightCodes are deliberately NOT dropped. The editor
-- stops writing them, but keeping the columns means this migration can be
-- rolled back without data loss and no profile loses what it already shows.
--
-- The two business-authored public texts added here — highlights and the
-- primary action label — are bilingual from the start. Neither is backfilled
-- from the legacy highlightCodes: those are language-neutral codes whose
-- display text lives in the message catalogues, and turning them into stored
-- Norwegian strings would bake one language into the data permanently.

-- AlterTable
ALTER TABLE "businesses"
ADD COLUMN     "hiddenFields" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "deliveryMethods" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "serviceArea" TEXT,
ADD COLUMN     "highlights" JSONB,
ADD COLUMN     "primaryActionLabelNo" TEXT,
ADD COLUMN     "primaryActionLabelEn" TEXT,
ADD COLUMN     "exceptionalHours" JSONB;

-- Backfill: split the old serviceModes list into its two real concepts.
-- ON_SITE and REMOTE described how a service is delivered; NATIONWIDE
-- described how far it reaches. Only the delivery half moves into
-- deliveryMethods, and REMOTE becomes DIGITAL under the new vocabulary.
UPDATE "businesses"
SET "deliveryMethods" = ARRAY(
  SELECT DISTINCT
    CASE s.value
      WHEN 'ON_SITE' THEN 'ON_SITE'
      WHEN 'REMOTE'  THEN 'DIGITAL'
    END
  FROM unnest("businesses"."serviceModes") AS s(value)
  WHERE s.value IN ('ON_SITE', 'REMOTE')
  ORDER BY 1
)
WHERE "serviceModes" && ARRAY['ON_SITE', 'REMOTE']::TEXT[];

-- The reach half becomes the new single-valued serviceArea.
UPDATE "businesses"
SET "serviceArea" = 'NATIONWIDE'
WHERE 'NATIONWIDE' = ANY("serviceModes");
