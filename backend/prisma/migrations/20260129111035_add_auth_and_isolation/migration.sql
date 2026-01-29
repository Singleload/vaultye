/*
  Warnings:

  - Added the required column `userId` to the `SystemObject` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SystemObject" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AddForeignKey
ALTER TABLE "SystemObject" ADD CONSTRAINT "SystemObject_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
