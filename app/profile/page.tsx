import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/authOptions";

function Icon({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f1f5f9] text-xl">
      {children}
    </div>
  );
}

function ProfileLink({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 border-b border-gray-100 px-5 py-4 transition hover:bg-gray-50"
    >
      <Icon>{icon}</Icon>

      <div className="min-w-0 flex-1">
        <p className="font-bold text-gray-900">
          {title}
        </p>

        {description && (
          <p className="mt-0.5 text-sm text-gray-500">
            {description}
          </p>
        )}
      </div>

      <span className="text-xl text-gray-400">
        →
      </span>
    </Link>
  );
}

function QuickCard({
  href,
  icon,
  title,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <Link
      href={href}
      className="flex min-h-[110px] flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-4 text-center transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md"
    >
      <div className="text-2xl">
        {icon}
      </div>

      <p className="mt-2 text-sm font-black text-[#07152f]">
        {title}
      </p>
    </Link>
  );
}

function FooterProfileLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-sm text-gray-500 transition hover:text-[#07152f]"
    >
      {children}
    </Link>
  );
}

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/profile");
  }

  const user = session.user as typeof session.user & {
    phone?: string | null;
  };

  return (
    <main className="min-h-screen bg-[#f8fafc] text-[#111827]">

      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">

          <Link
            href="/"
            className="flex items-center gap-2 font-black text-[#07152f]"
          >
            <span className="text-2xl">
              ←
            </span>

            Home
          </Link>

          <Link
            href="/"
            className="text-xl font-black tracking-[0.12em] text-[#07152f]"
          >
            CLOTHTYM
          </Link>

          <Link
            href="/cart"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f1f5f9] text-lg"
            aria-label="Cart"
          >
            🛒
          </Link>

        </div>
      </header>

      {/* MAIN */}
      <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10">

        {/* PROFILE HEADER */}
        <section className="overflow-hidden rounded-3xl bg-[#07152f] text-white shadow-sm">

          <div className="p-6 sm:p-8">

            <p className="text-xs font-black uppercase tracking-[0.2em] text-white/50">
              CLOTHTYM ACCOUNT
            </p>

            <div className="mt-5 flex items-center gap-4">

              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white text-2xl font-black text-[#07152f]">
                {(user.name || user.email || "U")
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div className="min-w-0">
                <h1 className="truncate text-2xl font-black sm:text-3xl">
                  {user.name || "ClothTym User"}
                </h1>

                <p className="mt-1 truncate text-sm text-white/60">
                  {user.email}
                </p>

                {user.phone && (
                  <p className="mt-1 text-sm text-white/60">
                    {user.phone}
                  </p>
                )}
              </div>

            </div>

          </div>

        </section>

        {/* QUICK ACTIONS */}
        <section className="mt-6">

          <div className="mb-3">
            <h2 className="text-lg font-black text-[#07152f]">
              Your Activity
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">

            <QuickCard
              href="/orders"
              icon="📦"
              title="Orders"
            />

            {/* WISHLIST */}
            <QuickCard
              href="/wishlist"
              icon="♡"
              title="Wishlist"
            />

            <QuickCard
              href="/coupons"
              icon="🎟️"
              title="Coupons"
            />

            <QuickCard
              href="/payments"
              icon="💳"
              title="Payments"
            />

          </div>

        </section>

        {/* ACCOUNT */}
        <section className="mt-6 overflow-hidden rounded-3xl border border-gray-200 bg-white">

          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="font-black text-[#07152f]">
              Account
            </h2>
          </div>

          <ProfileLink
            href="/orders"
            icon="📦"
            title="Orders"
            description="Track and manage your orders"
          />

          <ProfileLink
            href="/wishlist"
            icon="♡"
            title="Wishlist"
            description="View your saved products"
          />

          <ProfileLink
            href="/coupons"
            icon="🎟️"
            title="Coupons"
            description="View available offers and coupons"
          />

          <ProfileLink
            href="/payments"
            icon="💳"
            title="Payments & Currencies"
            description="Manage payment preferences"
          />

          <ProfileLink
            href="/earn-redeem"
            icon="🪙"
            title="Earn & Redeem"
            description="Rewards and redemption"
          />

          <ProfileLink
            href="/manage-account"
            icon="👤"
            title="Manage Account"
            description="Manage your personal account details"
          />

          <ProfileLink
            href="/challenges"
            icon="🏆"
            title="Challenges"
            description="Participate in ClothTym challenges"
          />

          <ProfileLink
            href="/settings"
            icon="⚙️"
            title="Settings"
            description="Manage your preferences"
          />

        </section>

        {/* SUPPORT */}
        <section className="mt-6 overflow-hidden rounded-3xl border border-gray-200 bg-white">

          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="font-black text-[#07152f]">
              Support
            </h2>
          </div>

          <ProfileLink
            href="/help"
            icon="💬"
            title="Help Center"
            description="Get help with your ClothTym account"
          />

          <ProfileLink
            href="/faq"
            icon="❓"
            title="FAQs"
            description="Frequently asked questions"
          />

          <ProfileLink
            href="/about"
            icon="ℹ️"
            title="About Us"
            description="Learn more about ClothTym"
          />

        </section>

        {/* LEGAL */}
        <section className="mt-6 overflow-hidden rounded-3xl border border-gray-200 bg-white">

          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="font-black text-[#07152f]">
              Legal
            </h2>
          </div>

          <ProfileLink
            href="/terms"
            icon="📄"
            title="Terms of Use"
          />

          <ProfileLink
            href="/privacy"
            icon="🔒"
            title="Privacy Policy"
          />

          <ProfileLink
            href="/grievance"
            icon="⚖️"
            title="Grievance Redressal"
          />

          <ProfileLink
            href="/privacy-center"
            icon="🛡️"
            title="Privacy Center"
          />

        </section>

        {/* LOGOUT */}
        <section className="mt-6">

          <form
            action="/api/auth/signout"
            method="POST"
          >
            <button
              type="submit"
              className="flex w-full items-center justify-center rounded-2xl border border-red-200 bg-white px-5 py-4 font-black text-red-600 transition hover:bg-red-50"
            >
              Logout
            </button>
          </form>

        </section>

        {/* FOOTER LINKS */}
        <footer className="mt-10 border-t border-gray-200 pt-6">

          <div className="flex flex-wrap justify-center gap-x-5 gap-y-3">

            <FooterProfileLink href="/about">
              About Us
            </FooterProfileLink>

            <FooterProfileLink href="/terms">
              Terms of Use
            </FooterProfileLink>

            <FooterProfileLink href="/privacy">
              Privacy Policy
            </FooterProfileLink>

            <FooterProfileLink href="/grievance">
              Grievance Redressal
            </FooterProfileLink>

            <FooterProfileLink href="/privacy-center">
              Privacy Center
            </FooterProfileLink>

          </div>

          <p className="mt-5 text-center text-xs font-medium text-gray-400">
            ClothTym • Fashion Without Tym Limits
          </p>

          <p className="mt-2 text-center text-xs text-gray-400">
            App Version 1.0.0
          </p>

        </footer>

      </div>

    </main>
  );
}