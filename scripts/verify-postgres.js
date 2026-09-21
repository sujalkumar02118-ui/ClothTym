const { PrismaClient } = require("../generated/postgres");

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.count();
  const categories = await prisma.category.count();
  const products = await prisma.product.count();
  const sellers = await prisma.seller.count();
  const orders = await prisma.order.count();
  const wishlists = await prisma.wishlist.count();

  console.log("\n================================");
  console.log("     NEON POSTGRES DATA CHECK");
  console.log("================================");
  console.log("Users:", users);
  console.log("Categories:", categories);
  console.log("Products:", products);
  console.log("Sellers:", sellers);
  console.log("Orders:", orders);
  console.log("Wishlists:", wishlists);
  console.log("================================\n");
}

main()
  .catch((error) => {
    console.error("\n❌ Verification failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });