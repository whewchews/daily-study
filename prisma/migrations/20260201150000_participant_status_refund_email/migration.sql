-- CreateEnum
CREATE TYPE "ParticipantStatus" AS ENUM ('ACTIVE', 'DROPPED', 'COMPLETED');

-- AlterTable
ALTER TABLE "Participant"
  ADD COLUMN "email" TEXT,
  ADD COLUMN "status" "ParticipantStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "refundCompleted" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Participant" ALTER COLUMN "githubUsername" DROP NOT NULL;

UPDATE "Participant" SET "status" = 'DROPPED' WHERE "isDropped" = true;

ALTER TABLE "Participant" DROP COLUMN "isDropped";

-- CreateIndex
CREATE UNIQUE INDEX "Participant_seasonId_email_key" ON "Participant"("seasonId", "email");
