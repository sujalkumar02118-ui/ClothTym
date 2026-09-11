-- CreateTable
CREATE TABLE "SellerRegistration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "mobileVerified" BOOLEAN NOT NULL DEFAULT false,
    "businessType" TEXT,
    "businessName" TEXT,
    "ownerName" TEXT,
    "hasGst" BOOLEAN,
    "gstin" TEXT,
    "panNumber" TEXT,
    "panName" TEXT,
    "panEmail" TEXT,
    "pickupAddress" TEXT,
    "pickupCity" TEXT,
    "pickupState" TEXT,
    "pickupPincode" TEXT,
    "bankAccountName" TEXT,
    "bankAccountNumber" TEXT,
    "bankIfsc" TEXT,
    "bankName" TEXT,
    "storeName" TEXT,
    "termsAccepted" BOOLEAN NOT NULL DEFAULT false,
    "submittedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "rejectionReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SellerRegistration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "SellerRegistration_userId_key" ON "SellerRegistration"("userId");
