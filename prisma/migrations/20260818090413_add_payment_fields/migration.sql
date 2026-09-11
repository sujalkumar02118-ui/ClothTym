-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "totalAmount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "address" TEXT NOT NULL,
    "sellerPickupOtp" TEXT,
    "customerDeliveryOtp" TEXT,
    "sellerOtpVerifiedAt" DATETIME,
    "customerOtpVerifiedAt" DATETIME,
    "pickedUpAt" DATETIME,
    "deliveredAt" DATETIME,
    "returnDeadline" DATETIME,
    "returnStatus" TEXT NOT NULL DEFAULT 'NOT_ELIGIBLE',
    "returnRequestedAt" DATETIME,
    "returnReason" TEXT,
    "returnRejectedReason" TEXT,
    "returnCompletedAt" DATETIME,
    "returnPickupStatus" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "returnPickupOtp" TEXT,
    "returnPickupOtpVerifiedAt" DATETIME,
    "returnPickedUpAt" DATETIME,
    "refundStatus" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "refundAmount" REAL,
    "refundRequestedAt" DATETIME,
    "refundCompletedAt" DATETIME,
    "refundFailureReason" TEXT,
    "paymentMethod" TEXT NOT NULL DEFAULT 'COD',
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "razorpayOrderId" TEXT,
    "razorpayPaymentId" TEXT,
    "razorpaySignature" TEXT,
    "paidAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("address", "createdAt", "customerDeliveryOtp", "customerOtpVerifiedAt", "deliveredAt", "id", "pickedUpAt", "refundAmount", "refundCompletedAt", "refundFailureReason", "refundRequestedAt", "refundStatus", "returnCompletedAt", "returnDeadline", "returnPickedUpAt", "returnPickupOtp", "returnPickupOtpVerifiedAt", "returnPickupStatus", "returnReason", "returnRejectedReason", "returnRequestedAt", "returnStatus", "sellerOtpVerifiedAt", "sellerPickupOtp", "status", "totalAmount", "updatedAt", "userId") SELECT "address", "createdAt", "customerDeliveryOtp", "customerOtpVerifiedAt", "deliveredAt", "id", "pickedUpAt", "refundAmount", "refundCompletedAt", "refundFailureReason", "refundRequestedAt", "refundStatus", "returnCompletedAt", "returnDeadline", "returnPickedUpAt", "returnPickupOtp", "returnPickupOtpVerifiedAt", "returnPickupStatus", "returnReason", "returnRejectedReason", "returnRequestedAt", "returnStatus", "sellerOtpVerifiedAt", "sellerPickupOtp", "status", "totalAmount", "updatedAt", "userId" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
