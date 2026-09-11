-- AlterTable
ALTER TABLE "Order" ADD COLUMN "customerDeliveryOtpExpiresAt" DATETIME;
ALTER TABLE "Order" ADD COLUMN "returnPickupOtpExpiresAt" DATETIME;
ALTER TABLE "Order" ADD COLUMN "sellerPickupOtpExpiresAt" DATETIME;
