-- Drop language column from Submission as code is now stored as markdown.
ALTER TABLE "Submission" DROP COLUMN "language";
