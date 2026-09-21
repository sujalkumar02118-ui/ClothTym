const { DatabaseSync } = require("node:sqlite");
const path = require("path");

const { PrismaClient: PostgresPrismaClient } = require("../generated/postgres");

const sqlitePath = path.resolve("prisma/dev.db");

const sqlite = new DatabaseSync(sqlitePath);
const postgres = new PostgresPrismaClient();

function rows(table) {
  return sqlite.prepare(`SELECT * FROM "${table}"`).all();
}

function bool(value) {
  if (value === null || value === undefined) return value;
  return Boolean(value);
}

function date(value) {
  if (value === null || value === undefined) return value;
  return new Date(value);
}

function showCounts(counts) {
  console.log("\n========================================");
  console.log("      ORIGINAL SQLITE DATABASE");
  console.log("========================================");

  for (const [key, value] of Object.entries(counts)) {
    console.log(`${key}: ${value}`);
  }

  console.log("========================================\n");
}

async function getLocalData() {
  return {
    users: rows("User"),
    sellers: rows("Seller"),
    sellerRegistrations: rows("SellerRegistration"),
    categories: rows("Category"),
    products: rows("Product"),
    carts: rows("Cart"),
    wishlists: rows("Wishlist"),
    addresses: rows("Address"),
    orders: rows("Order"),
    orderItems: rows("OrderItem"),
    reviews: rows("Review"),
    nearbyShops: rows("NearbyShop"),
    notifications: rows("Notification"),
  };
}

async function clearNeon() {
  console.log("🧹 Clearing Neon database...");

  await postgres.orderItem.deleteMany();
  await postgres.cart.deleteMany();
  await postgres.wishlist.deleteMany();
  await postgres.review.deleteMany();
  await postgres.product.deleteMany();
  await postgres.sellerRegistration.deleteMany();
  await postgres.seller.deleteMany();
  await postgres.address.deleteMany();
  await postgres.notification.deleteMany();
  await postgres.order.deleteMany();
  await postgres.category.deleteMany();
  await postgres.user.deleteMany();
  await postgres.nearbyShop.deleteMany();

  console.log("✅ Neon database cleared.\n");
}

async function migrateUsers(data) {
  for (const r of data) {
    await postgres.user.create({
      data: {
        id: r.id,
        name: r.name,
        email: r.email,
        phone: r.phone,
        password: r.password,
        role: r.role,
        isBlocked: bool(r.isBlocked),
        createdAt: date(r.createdAt),
        notificationsEnabled: bool(r.notificationsEnabled),
        alternatePhone: r.alternatePhone,
        alternatePhoneHint: r.alternatePhoneHint,
      },
    });
  }

  console.log(`✅ Users: ${data.length}`);
}

async function migrateCategories(data) {
  for (const r of data) {
    await postgres.category.create({
      data: {
        id: r.id,
        name: r.name,
      },
    });
  }

  console.log(`✅ Categories: ${data.length}`);
}

async function migrateSellerRegistrations(data) {
  for (const r of data) {
    await postgres.sellerRegistration.create({
      data: {
        id: r.id,
        userId: r.userId,
        mobile: r.mobile,
        mobileVerified: bool(r.mobileVerified),

        businessType: r.businessType,
        businessName: r.businessName,
        ownerName: r.ownerName,

        hasGst:
          r.hasGst === null || r.hasGst === undefined
            ? null
            : bool(r.hasGst),

        gstin: r.gstin,

        panNumber: r.panNumber,
        panName: r.panName,
        panEmail: r.panEmail,

        pickupAddress: r.pickupAddress,
        pickupCity: r.pickupCity,
        pickupState: r.pickupState,
        pickupPincode: r.pickupPincode,
        pickupContactName: r.pickupContactName,
        pickupContactMobile: r.pickupContactMobile,
        pickupLatitude: r.pickupLatitude,
        pickupLongitude: r.pickupLongitude,

        bankAccountName: r.bankAccountName,
        bankAccountNumber: r.bankAccountNumber,
        bankIfsc: r.bankIfsc,
        bankName: r.bankName,

        storeName: r.storeName,
        termsAccepted: bool(r.termsAccepted),
        submittedAt: date(r.submittedAt),
        status: r.status,
        rejectionReason: r.rejectionReason,

        createdAt: date(r.createdAt),
        updatedAt: date(r.updatedAt),
      },
    });
  }

  console.log(`✅ Seller registrations: ${data.length}`);
}

async function migrateSellers(data) {
  for (const r of data) {
    await postgres.seller.create({
      data: {
        id: r.id,
        userId: r.userId,
        shopName: r.shopName,
        ownerName: r.ownerName,
        city: r.city,
        address: r.address,
        approved: bool(r.approved),
      },
    });
  }

  console.log(`✅ Sellers: ${data.length}`);
}

async function migrateProducts(data) {
  for (const r of data) {
    await postgres.product.create({
      data: {
        id: r.id,
        name: r.name,
        description: r.description,
        price: r.price,
        stock: r.stock,
        image: r.image,
        images: r.images,
        sizes: r.sizes,
        colors: r.colors,
        sizeChart: r.sizeChart,
        sellerId: r.sellerId,
        categoryId: r.categoryId,
        createdAt: date(r.createdAt),
      },
    });
  }

  console.log(`✅ Products: ${data.length}`);
}

async function migrateCarts(data) {
  for (const r of data) {
    await postgres.cart.create({
      data: {
        id: r.id,
        userId: r.userId,
        productId: r.productId,
        quantity: r.quantity,
        size: r.size,
        color: r.color,
      },
    });
  }

  console.log(`✅ Cart items: ${data.length}`);
}

async function migrateWishlists(data) {
  for (const r of data) {
    await postgres.wishlist.create({
      data: {
        id: r.id,
        userId: r.userId,
        productId: r.productId,
        createdAt: date(r.createdAt),
      },
    });
  }

  console.log(`✅ Wishlists: ${data.length}`);
}

async function migrateAddresses(data) {
  for (const r of data) {
    await postgres.address.create({
      data: {
        id: r.id,
        userId: r.userId,
        name: r.name,
        mobile: r.mobile,
        addressLine1: r.addressLine1,
        addressLine2: r.addressLine2,
        landmark: r.landmark,
        city: r.city,
        state: r.state,
        pincode: r.pincode,
        type: r.type,
        isDefault: bool(r.isDefault),
        createdAt: date(r.createdAt),
        updatedAt: date(r.updatedAt),
      },
    });
  }

  console.log(`✅ Addresses: ${data.length}`);
}

async function migrateOrders(data) {
  for (const r of data) {
    await postgres.order.create({
      data: {
        id: r.id,
        userId: r.userId,
        totalAmount: r.totalAmount,
        status: r.status,
        address: r.address,

        sellerPickupOtp: r.sellerPickupOtp,
        sellerPickupOtpExpiresAt: date(r.sellerPickupOtpExpiresAt),
        sellerPickupOtpAttempts: r.sellerPickupOtpAttempts,
        sellerPickupOtpLockedUntil: date(r.sellerPickupOtpLockedUntil),
        sellerOtpVerifiedAt: date(r.sellerOtpVerifiedAt),

        customerDeliveryOtp: r.customerDeliveryOtp,
        customerDeliveryOtpExpiresAt: date(r.customerDeliveryOtpExpiresAt),
        customerDeliveryOtpAttempts: r.customerDeliveryOtpAttempts,
        customerDeliveryOtpLockedUntil: date(r.customerDeliveryOtpLockedUntil),
        customerOtpVerifiedAt: date(r.customerOtpVerifiedAt),

        pickedUpAt: date(r.pickedUpAt),
        deliveredAt: date(r.deliveredAt),

        returnDeadline: date(r.returnDeadline),
        returnStatus: r.returnStatus,
        returnRequestedAt: date(r.returnRequestedAt),
        returnReason: r.returnReason,
        returnRejectedReason: r.returnRejectedReason,
        returnCompletedAt: date(r.returnCompletedAt),

        returnPickupStatus: r.returnPickupStatus,
        returnPickupOtp: r.returnPickupOtp,
        returnPickupOtpExpiresAt: date(r.returnPickupOtpExpiresAt),
        returnPickupOtpVerifiedAt: date(r.returnPickupOtpVerifiedAt),
        returnPickupOtpAttempts: r.returnPickupOtpAttempts,
        returnPickupOtpLockedUntil: date(r.returnPickupOtpLockedUntil),
        returnPickedUpAt: date(r.returnPickedUpAt),

        refundStatus: r.refundStatus,
        refundAmount: r.refundAmount,
        refundRequestedAt: date(r.refundRequestedAt),
        refundCompletedAt: date(r.refundCompletedAt),
        refundFailureReason: r.refundFailureReason,

        paymentMethod: r.paymentMethod,
        paymentStatus: r.paymentStatus,

        razorpayOrderId: r.razorpayOrderId,
        razorpayPaymentId: r.razorpayPaymentId,
        razorpaySignature: r.razorpaySignature,
        paidAt: date(r.paidAt),

        createdAt: date(r.createdAt),
        updatedAt: date(r.updatedAt),
      },
    });
  }

  console.log(`✅ Orders: ${data.length}`);
}

async function migrateOrderItems(data) {
  for (const r of data) {
    await postgres.orderItem.create({
      data: {
        id: r.id,
        orderId: r.orderId,
        productId: r.productId,
        quantity: r.quantity,
        price: r.price,
        returnStatus: r.returnStatus,
      },
    });
  }

  console.log(`✅ Order items: ${data.length}`);
}

async function migrateReviews(data) {
  for (const r of data) {
    await postgres.review.create({
      data: {
        id: r.id,
        userId: r.userId,
        productId: r.productId,
        rating: r.rating,
        comment: r.comment,
      },
    });
  }

  console.log(`✅ Reviews: ${data.length}`);
}

async function migrateNearbyShops(data) {
  for (const r of data) {
    await postgres.nearbyShop.create({
      data: {
        id: r.id,
        name: r.name,
        city: r.city,
        area: r.area,
      },
    });
  }

  console.log(`✅ Nearby shops: ${data.length}`);
}

async function migrateNotifications(data) {
  for (const r of data) {
    await postgres.notification.create({
      data: {
        id: r.id,
        title: r.title,
        message: r.message,
        type: r.type,
        isRead: bool(r.isRead),
        userId: r.userId,
        createdAt: date(r.createdAt),
      },
    });
  }

  console.log(`✅ Notifications: ${data.length}`);
}

async function getNeonCounts() {
  return {
    users: await postgres.user.count(),
    sellers: await postgres.seller.count(),
    sellerRegistrations: await postgres.sellerRegistration.count(),
    categories: await postgres.category.count(),
    products: await postgres.product.count(),
    carts: await postgres.cart.count(),
    wishlists: await postgres.wishlist.count(),
    addresses: await postgres.address.count(),
    orders: await postgres.order.count(),
    orderItems: await postgres.orderItem.count(),
    reviews: await postgres.review.count(),
    nearbyShops: await postgres.nearbyShop.count(),
    notifications: await postgres.notification.count(),
  };
}

async function main() {
  console.log("\n========================================");
  console.log("   CLOTHTYM FINAL DATABASE MIGRATION");
  console.log("   SQLite → Neon PostgreSQL");
  console.log("========================================\n");

  console.log("📂 Reading:", sqlitePath);

  const local = await getLocalData();

  const localCounts = {
    users: local.users.length,
    sellers: local.sellers.length,
    sellerRegistrations: local.sellerRegistrations.length,
    categories: local.categories.length,
    products: local.products.length,
    carts: local.carts.length,
    wishlists: local.wishlists.length,
    addresses: local.addresses.length,
    orders: local.orders.length,
    orderItems: local.orderItems.length,
    reviews: local.reviews.length,
    nearbyShops: local.nearbyShops.length,
    notifications: local.notifications.length,
  };

  showCounts(localCounts);

  const total = Object.values(localCounts).reduce(
    (sum, value) => sum + value,
    0
  );

  if (total === 0) {
    throw new Error(
      "\n❌ STOPPED: prisma/dev.db contains 0 readable records.\n" +
      "Neon was NOT modified."
    );
  }

  console.log("🚀 Local data found. Starting migration...\n");

  await clearNeon();

  await migrateUsers(local.users);
  await migrateCategories(local.categories);
  await migrateSellerRegistrations(local.sellerRegistrations);
  await migrateSellers(local.sellers);
  await migrateProducts(local.products);
  await migrateCarts(local.carts);
  await migrateWishlists(local.wishlists);
  await migrateAddresses(local.addresses);
  await migrateOrders(local.orders);
  await migrateOrderItems(local.orderItems);
  await migrateReviews(local.reviews);
  await migrateNearbyShops(local.nearbyShops);
  await migrateNotifications(local.notifications);

  const neonCounts = await getNeonCounts();

  console.log("\n========================================");
  console.log("       FINAL VERIFICATION");
  console.log("========================================");

  let success = true;

  for (const key of Object.keys(localCounts)) {
    const a = localCounts[key];
    const b = neonCounts[key];
    const ok = a === b;

    console.log(
      `${ok ? "✅" : "❌"} ${key}: SQLite=${a} | Neon=${b}`
    );

    if (!ok) success = false;
  }

  console.log("========================================");

  if (!success) {
    throw new Error(
      "\n❌ Migration verification failed.\n" +
      "Some SQLite and Neon counts do not match."
    );
  }

  console.log("\n🎉 MIGRATION SUCCESSFUL!");
  console.log("🎉 SQLite data is now present in Neon PostgreSQL.");
  console.log("========================================\n");
}

main()
  .catch((error) => {
    console.error("\n❌ MIGRATION FAILED");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    sqlite.close();
    await postgres.$disconnect();
  });