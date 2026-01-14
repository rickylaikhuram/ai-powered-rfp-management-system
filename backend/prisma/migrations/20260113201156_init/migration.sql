/*
  Warnings:

  - You are about to drop the column `budget` on the `RFP` table. All the data in the column will be lost.
  - You are about to drop the column `deliveryDays` on the `RFP` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `RFP` table. All the data in the column will be lost.
  - You are about to drop the column `requirements` on the `RFP` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "RFP" DROP COLUMN "budget",
DROP COLUMN "deliveryDays",
DROP COLUMN "quantity",
DROP COLUMN "requirements";
