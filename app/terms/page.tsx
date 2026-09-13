import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white text-[#282c3f]">
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back */}
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
            Terms of Use
          </h1>

          <p className="mt-3 text-sm leading-6 text-gray-600">
            Please read these terms carefully before using ClothTym.
          </p>
        </section>

        {/* Introduction */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold">1. Introduction</h2>

          <p className="mt-3 text-sm leading-7 text-gray-600 sm:text-base">
            Welcome to ClothTym. ClothTym is a fashion marketplace that
            connects customers with sellers through an online platform.
          </p>

          <p className="mt-3 text-sm leading-7 text-gray-600 sm:text-base">
            By accessing or using ClothTym, you agree to follow these Terms of
            Use and any applicable policies displayed on the platform.
          </p>
        </section>

        {/* Account */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold">2. User Account</h2>

          <ul className="mt-3 space-y-2 text-sm leading-7 text-gray-600 sm:text-base">
            <li>• You must provide accurate information when creating an account.</li>
            <li>• You are responsible for maintaining the security of your account.</li>
            <li>• You should not share your account credentials with others.</li>
            <li>• You must notify ClothTym if you believe your account has been misused.</li>
          </ul>
        </section>

        {/* Marketplace */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold">3. Marketplace</h2>

          <p className="mt-3 text-sm leading-7 text-gray-600 sm:text-base">
            ClothTym provides a platform through which sellers can list
            products and customers can discover and purchase eligible products.
          </p>

          <p className="mt-3 text-sm leading-7 text-gray-600 sm:text-base">
            Product availability, pricing, images, descriptions, sizes,
            colours and other product information may be provided by the
            respective seller.
          </p>
        </section>

        {/* Products */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold">4. Product Information</h2>

          <p className="mt-3 text-sm leading-7 text-gray-600 sm:text-base">
            Sellers are responsible for ensuring that the information
            submitted for their products is accurate and does not violate
            applicable laws or ClothTym policies.
          </p>

          <p className="mt-3 text-sm leading-7 text-gray-600 sm:text-base">
            ClothTym may review, restrict or remove product listings that do
            not meet applicable requirements.
          </p>
        </section>

        {/* Orders */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold">5. Orders</h2>

          <ul className="mt-3 space-y-2 text-sm leading-7 text-gray-600 sm:text-base">
            <li>• An order is subject to product availability.</li>
            <li>• Order status may change as the order moves through fulfilment and delivery.</li>
            <li>• Orders may be cancelled where cancellation is available under the applicable process.</li>
            <li>• ClothTym may take appropriate action where an order appears fraudulent or abusive.</li>
          </ul>
        </section>

        {/* Payments */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold">6. Payments</h2>

          <p className="mt-3 text-sm leading-7 text-gray-600 sm:text-base">
            Available payment methods are displayed during checkout. Payment
            processing may be handled through the applicable payment service
            used by ClothTym.
          </p>

          <p className="mt-3 text-sm leading-7 text-gray-600 sm:text-base">
            Customers should provide accurate payment information and should
            not attempt to use unauthorised payment methods.
          </p>
        </section>

        {/* Delivery */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold">7. Delivery</h2>

          <p className="mt-3 text-sm leading-7 text-gray-600 sm:text-base">
            Delivery timelines may vary depending on seller location, product
            availability, delivery address and other operational factors.
          </p>

          <p className="mt-3 text-sm leading-7 text-gray-600 sm:text-base">
            Customers should provide a valid delivery address and contact
            information required for successful delivery.
          </p>
        </section>

        {/* Returns */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold">8. Returns & Refunds</h2>

          <p className="mt-3 text-sm leading-7 text-gray-600 sm:text-base">
            Return eligibility depends on the product, order status and the
            applicable ClothTym return policy.
          </p>

          <p className="mt-3 text-sm leading-7 text-gray-600 sm:text-base">
            Where a return is eligible, the customer must follow the return
            process available through the platform.
          </p>

          <p className="mt-3 text-sm leading-7 text-gray-600 sm:text-base">
            Refunds are processed according to the applicable payment and
            refund process.
          </p>
        </section>

        {/* Wishlist */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold">9. Wishlist</h2>

          <p className="mt-3 text-sm leading-7 text-gray-600 sm:text-base">
            Customers may save eligible products to their Wishlist for
            convenience. Wishlist availability does not guarantee that a
            product will remain available or at the same price.
          </p>
        </section>

        {/* Prohibited */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold">10. Prohibited Activities</h2>

          <p className="mt-3 text-sm leading-7 text-gray-600 sm:text-base">
            Users must not misuse ClothTym or use the platform for unlawful,
            fraudulent or abusive activities.
          </p>

          <ul className="mt-3 space-y-2 text-sm leading-7 text-gray-600 sm:text-base">
            <li>• Creating accounts using false information.</li>
            <li>• Attempting to gain unauthorised access to another account.</li>
            <li>• Using the platform for fraudulent transactions.</li>
            <li>• Uploading unlawful, misleading or infringing content.</li>
            <li>• Attempting to interfere with the security or operation of the platform.</li>
          </ul>
        </section>

        {/* Seller */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold">11. Seller Responsibilities</h2>

          <p className="mt-3 text-sm leading-7 text-gray-600 sm:text-base">
            Sellers using ClothTym are responsible for providing accurate
            business, product and fulfilment information and for complying with
            applicable laws and platform requirements.
          </p>
        </section>

        {/* Account restriction */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold">
            12. Account Restriction or Suspension
          </h2>

          <p className="mt-3 text-sm leading-7 text-gray-600 sm:text-base">
            ClothTym may restrict or suspend an account where there is a
            reasonable basis to believe that the account has violated these
            Terms, applicable policies or applicable law.
          </p>
        </section>

        {/* Intellectual property */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold">
            13. Intellectual Property
          </h2>

          <p className="mt-3 text-sm leading-7 text-gray-600 sm:text-base">
            ClothTym branding, logos, platform design and other original
            platform content may be protected by applicable intellectual
            property laws. Users must not copy, reproduce or commercially
            exploit such content without appropriate permission.
          </p>
        </section>

        {/* Changes */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold">14. Changes to These Terms</h2>

          <p className="mt-3 text-sm leading-7 text-gray-600 sm:text-base">
            ClothTym may update these Terms of Use from time to time. Updated
            terms may be published on this page, and continued use of the
            platform after an update may be subject to the revised terms.
          </p>
        </section>

        {/* Contact */}
        <section className="mt-10 rounded-xl bg-gray-50 p-6">
          <h2 className="text-xl font-semibold">15. Contact Us</h2>

          <p className="mt-3 text-sm leading-7 text-gray-600 sm:text-base">
            If you have questions about these Terms of Use, please contact
            ClothTym through the support channels made available on the
            platform.
          </p>
        </section>

        {/* Footer */}
        <section className="mt-10 border-t border-gray-100 pt-6 text-center">
          <p className="text-sm font-semibold">
            ClothTym — Fashion Without Tym Limits
          </p>

          <p className="mt-1 text-xs text-gray-500">
            Terms of Use
          </p>
        </section>

        <div className="h-8" />
      </div>
    </main>
  );
}