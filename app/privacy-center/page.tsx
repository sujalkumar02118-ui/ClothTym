import Link from "next/link";

export default function PrivacyCenterPage() {
  return (
    <main className="min-h-screen bg-white text-[#282c3f]">
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/profile"
          className="mb-6 inline-flex text-sm font-medium hover:underline"
        >
          ← Back to Profile
        </Link>

        {/* Header */}
        <section className="rounded-xl bg-[#fff4f7] px-6 py-8 sm:px-10">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#ff3f6c]">
            ClothTym
          </p>

          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
            Privacy Center
          </h1>

          <p className="mt-3 text-sm leading-6 text-gray-600">
            Manage your privacy choices and learn how ClothTym handles your
            information.
          </p>
        </section>

        {/* Your Privacy */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold">Your Privacy</h2>

          <p className="mt-3 text-sm leading-7 text-gray-600 sm:text-base">
            ClothTym aims to handle your information responsibly and only use
            it where it is reasonably necessary to provide and improve the
            services available through the platform.
          </p>
        </section>

        {/* Account information */}
        <section className="mt-8 rounded-xl border border-gray-100 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-semibold">Account Information</h2>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Review and manage supported personal information associated
                with your ClothTym account.
              </p>
            </div>

            <span className="text-xl">👤</span>
          </div>

          <Link
            href="/manage-account"
            className="mt-4 inline-flex text-sm font-semibold text-[#ff3f6c]"
          >
            Manage Account →
          </Link>
        </section>

        {/* Saved addresses */}
        <section className="mt-4 rounded-xl border border-gray-100 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-semibold">Saved Addresses</h2>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Manage the addresses saved to your account.
              </p>
            </div>

            <span className="text-xl">📍</span>
          </div>

          <Link
            href="/manage-account/addresses"
            className="mt-4 inline-flex text-sm font-semibold text-[#ff3f6c]"
          >
            Manage Addresses →
          </Link>
        </section>

        {/* Notifications */}
        <section className="mt-4 rounded-xl border border-gray-100 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-semibold">Notifications</h2>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Manage your ClothTym notification preference.
              </p>
            </div>

            <span className="text-xl">🔔</span>
          </div>

          <Link
            href="/settings"
            className="mt-4 inline-flex text-sm font-semibold text-[#ff3f6c]"
          >
            Notification Settings →
          </Link>
        </section>

        {/* Wishlist */}
        <section className="mt-4 rounded-xl border border-gray-100 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-semibold">Wishlist</h2>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                View and manage products saved to your Wishlist.
              </p>
            </div>

            <span className="text-xl">♡</span>
          </div>

          <Link
            href="/wishlist"
            className="mt-4 inline-flex text-sm font-semibold text-[#ff3f6c]"
          >
            Open Wishlist →
          </Link>
        </section>

        {/* Privacy policy */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold">Privacy Information</h2>

          <p className="mt-3 text-sm leading-7 text-gray-600 sm:text-base">
            For complete information about the types of information ClothTym
            may collect, how it may be used, information sharing and data
            security, please read our Privacy Policy.
          </p>

          <Link
            href="/privacy"
            className="mt-4 inline-flex rounded-md border border-gray-200 px-5 py-3 text-sm font-semibold transition hover:border-gray-300"
          >
            Read Privacy Policy
          </Link>
        </section>

        {/* Security */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold">Keep Your Account Secure</h2>

          <div className="mt-4 rounded-xl bg-gray-50 p-5">
            <ul className="space-y-3 text-sm leading-6 text-gray-600">
              <li>• Never share your password with anyone.</li>
              <li>• Never share your UPI PIN or card PIN.</li>
              <li>• Never share payment authentication credentials.</li>
              <li>• Be careful with links or messages claiming to be from ClothTym.</li>
              <li>• Contact support if you notice suspicious account activity.</li>
            </ul>
          </div>
        </section>

        {/* Data requests */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold">Privacy Requests</h2>

          <p className="mt-3 text-sm leading-7 text-gray-600 sm:text-base">
            If you have a question or concern about your personal information,
            you can contact ClothTym through the official support channels
            made available on the platform.
          </p>

          <Link
            href="/help"
            className="mt-4 inline-flex text-sm font-semibold text-[#ff3f6c]"
          >
            Visit Help Center →
          </Link>
        </section>

        {/* Important */}
        <section className="mt-10 rounded-xl border border-gray-100 p-5">
          <h2 className="font-semibold">Important</h2>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            Privacy controls and available requests may change as ClothTym
            develops additional features and services.
          </p>
        </section>

        {/* Footer */}
        <section className="mt-10 border-t border-gray-100 pt-6 text-center">
          <p className="text-sm font-semibold">
            ClothTym — Fashion Without Tym Limits
          </p>

          <p className="mt-1 text-xs text-gray-500">
            Privacy Center
          </p>
        </section>

        <div className="h-8" />
      </div>
    </main>
  );
}