-- CreateEnum
CREATE TYPE "ProblemType" AS ENUM ('REGULAR', 'FREE', 'REST');

-- AlterTable
ALTER TABLE "Problem" ADD COLUMN     "problemType" "ProblemType" NOT NULL DEFAULT 'REGULAR';
