/*
  Warnings:

  - You are about to drop the column `metadata` on the `ChatMessage` table. All the data in the column will be lost.
  - You are about to drop the column `rfpId` on the `ChatMessage` table. All the data in the column will be lost.
  - Added the required column `chatSessionId` to the `ChatMessage` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ChatMessage" DROP CONSTRAINT "ChatMessage_rfpId_fkey";

-- AlterTable
ALTER TABLE "ChatMessage" DROP COLUMN "metadata",
DROP COLUMN "rfpId",
ADD COLUMN     "chatSessionId" TEXT NOT NULL,
ADD COLUMN     "isRfp" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "ChatSession" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rfpId" TEXT,

    CONSTRAINT "ChatSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChatSession_rfpId_key" ON "ChatSession"("rfpId");

-- AddForeignKey
ALTER TABLE "ChatSession" ADD CONSTRAINT "ChatSession_rfpId_fkey" FOREIGN KEY ("rfpId") REFERENCES "RFP"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_chatSessionId_fkey" FOREIGN KEY ("chatSessionId") REFERENCES "ChatSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
