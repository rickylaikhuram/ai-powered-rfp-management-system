/*
  Warnings:

  - You are about to drop the column `fileSize` on the `ProposalAttachment` table. All the data in the column will be lost.
  - You are about to drop the column `fileUrl` on the `ProposalAttachment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ProposalAttachment" DROP COLUMN "fileSize",
DROP COLUMN "fileUrl";
