-- CreateEnum
CREATE TYPE "CompanySize" AS ENUM ('SELF_EMPLOYED', 'MICRO', 'SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE');

-- AlterTable
ALTER TABLE "businesses" ADD COLUMN     "companySize" "CompanySize",
ADD COLUMN     "companyStory" TEXT,
ADD COLUMN     "employeeCount" INTEGER,
ADD COLUMN     "foundedYear" INTEGER,
ADD COLUMN     "highlightCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "legalName" TEXT,
ADD COLUMN     "organizationNumber" TEXT,
ADD COLUMN     "organizationType" TEXT,
ADD COLUMN     "serviceModes" TEXT[] DEFAULT ARRAY[]::TEXT[];

