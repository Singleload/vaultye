-- DropForeignKey
ALTER TABLE "Action" DROP CONSTRAINT "Action_pointId_fkey";

-- DropForeignKey
ALTER TABLE "Attachment" DROP CONSTRAINT "Attachment_meetingId_fkey";

-- DropForeignKey
ALTER TABLE "Attachment" DROP CONSTRAINT "Attachment_upgradeId_fkey";

-- DropForeignKey
ALTER TABLE "Meeting" DROP CONSTRAINT "Meeting_systemId_fkey";

-- DropForeignKey
ALTER TABLE "Point" DROP CONSTRAINT "Point_systemId_fkey";

-- DropForeignKey
ALTER TABLE "Upgrade" DROP CONSTRAINT "Upgrade_systemId_fkey";

-- AlterTable
ALTER TABLE "SystemObject" ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "SystemObject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Point" ADD CONSTRAINT "Point_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "SystemObject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Upgrade" ADD CONSTRAINT "Upgrade_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "SystemObject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_pointId_fkey" FOREIGN KEY ("pointId") REFERENCES "Point"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_upgradeId_fkey" FOREIGN KEY ("upgradeId") REFERENCES "Upgrade"("id") ON DELETE CASCADE ON UPDATE CASCADE;
