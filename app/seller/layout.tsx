import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export default async function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/seller");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: String(session.user.id),
    },
    select: {
      role: true,
      isBlocked: true,
      seller: {
        select: {
          approved: true,
        },
      },
    },
  });

  /*
   * User no longer exists.
   */
  if (!user) {
    redirect("/");
  }

  /*
   * Blocked users cannot access Seller Dashboard.
   */
  if (user.isBlocked) {
    redirect("/");
  }

  /*
   * Only SELLER role can access this area.
   */
  if (user.role !== "SELLER") {
    redirect("/");
  }

  /*
   * SELLER must also have an approved Seller record.
   */
  if (!user.seller || user.seller.approved !== true) {
    redirect("/seller-register/status");
  }

  return <>{children}</>;
}