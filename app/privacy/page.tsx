import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white text-[#282c3f]">
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/profile"
          className="mb-6 inline-flex text-sm font-medium hover:underline"
        >
          ← Back to Profile
        </Link>

        <section className="rounded-xl bg-[#fff4f7] px-6 py-8 sm:px-10">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#ff3f6c]">
            ClothTym
          </p>

          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
            Privacy Policy
          </h1>

          <p className="mt-3 text-sm leading-6 text-gray-600">
            Your privacy matters to us. This policy explains how information
            may be handled when you use ClothTym.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">1. Information We Collect</h2>

          <p className="mt-3 text-sm leading-7 text-gray-600 sm:text-base">
            When you use ClothTym, we may collect information that you provide
            while creating an account, placing an order, managing your profile,
            contacting support or using other platform features.
          </p>

          <ul className="mt-3 space-y-2 text-sm leading-7 text-gray-600 sm:text-base">
            <li>• Name and contact information.</li>
            <li>• Email address and mobile number.</li>
            <li>• Delivery and saved address information.</li>
            <li>• Order, payment and transaction-related information.</li>
            <li>• Wishlist and account preferences.</li>
            <li>• Information provided when contacting support.</li>
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">
            2. How We Use Your Information
          </h2>

          <p className="mt-3 text-sm leading-7 text-gray-600 sm:text-base">
            Information may be used to provide and improve ClothTym services,
            including:
          </p>

          <ul className="mt-3 space-y-2 text-sm leading-7 text-gray-600 sm:text-base">
            <li>• Creating and managing your account.</li>
            <li>• Processing and delivering orders.</li>
            <li>• Managing returns, cancellations and refunds.</li>
            <li>• Providing customer support.</li>
            <li>• Maintaining Wishlist and account preferences.</li>
            <li>• Detecting fraud, misuse and security issues.</li>
            <li>• Improving the ClothTym platform and user experience.</li>
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">3. Account Information</h2>

          <p className="mt-3 text-sm leading-7 text-gray-600 sm:text-base">
            Your account information is used to provide the services
            associated with your ClothTym account. You can manage supported
            personal details through the Manage Account section.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">4. Address Information</h2>

          <p className="mt-3 text-sm leading-7 text-gray-600 sm:text-base">
            Saved addresses may be used to help process and deliver orders.
            You can add, edit or remove saved addresses through Profile →
            Manage Account → Addresses.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">5. Payment Information</h2>

          <p className="mt-3 text-sm leading-7 text-gray-600 sm:text-base">
            Payment-related information may be processed as necessary to
            complete transactions and handle applicable refunds. Payment
            processing may involve authorised payment service providers.
          </p>

          <p className="mt-3 text-sm leading-7 text-gray-600 sm:text-base">
            ClothTym does not require users to share payment passwords, PINs or
            OTPs through customer support.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">6. Order Information</h2>

          <p className="mt-3 text-sm leading-7 text-gray-600 sm:text-base">
            We may retain information about orders, products, delivery status,
            cancellations, returns and refunds so that we can provide the
            requested services and maintain accurate transaction records.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">
            7. Cookies and Similar Technologies
          </h2>

          <p className="mt-3 text-sm leading-7 text-gray-600 sm:text-base">
            ClothTym may use cookies or similar technologies where necessary
            for authentication, security, preferences and platform
            functionality.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">8. Information Sharing</h2>

          <p className="mt-3 text-sm leading-7 text-gray-600 sm:text-base">
            Information may be shared with service providers or marketplace
            participants where reasonably necessary to provide requested
            services, such as order fulfilment, delivery, payment processing
            and customer support.
          </p>

          <p className="mt-3 text-sm leading-7 text-gray-600 sm:text-base">
            We do not intend to sell your personal information simply for
            advertising purposes.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">9. Data Security</h2>

          <p className="mt-3 text-sm leading-7 text-gray-600 sm:text-base">
            We take reasonable measures to protect information handled through
            ClothTym. However, no online service can guarantee absolute
            security.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">10. Data Retention</h2>

          <p className="mt-3 text-sm leading-7 text-gray-600 sm:text-base">
            Information may be retained for as long as reasonably necessary
            for providing services, maintaining transaction records,
            resolving disputes, preventing fraud and meeting applicable legal
            or regulatory requirements.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">11. Your Choices</h2>

          <ul className="mt-3 space-y-2 text-sm leading-7 text-gray-600 sm:text-base">
            <li>• Manage supported account information.</li>
            <li>• Manage saved addresses.</li>
            <li>• Manage notification preferences.</li>
            <li>• Manage Wishlist items.</li>
            <li>• Contact ClothTym regarding privacy-related concerns.</li>
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">12. Children's Privacy</h2>

          <p className="mt-3 text-sm leading-7 text-gray-600 sm:text-base">
            ClothTym is not intended to knowingly collect personal information
            from children in violation of applicable law. Where required,
            appropriate measures may be taken to address such information.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">13. Third-Party Services</h2>

          <p className="mt-3 text-sm leading-7 text-gray-600 sm:text-base">
            Certain ClothTym features may depend on third-party services such
            as payment, delivery, communication or infrastructure providers.
            Those services may have their own terms and privacy policies.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">14. Policy Updates</h2>

          <p className="mt-3 text-sm leading-7 text-gray-600 sm:text-base">
            This Privacy Policy may be updated from time to time as ClothTym
            develops its services or as applicable requirements change.
            Updates will be published on this page.
          </p>
        </section>

        <section className="mt-10 rounded-xl bg-gray-50 p-6">
          <h2 className="text-xl font-semibold">15. Contact Us</h2>

          <p className="mt-3 text-sm leading-7 text-gray-600 sm:text-base">
            For privacy questions or concerns, please contact ClothTym
            through the support channels made available on the platform.
          </p>
        </section>

        <section className="mt-10 border-t border-gray-100 pt-6 text-center">
          <p className="text-sm font-semibold">
            ClothTym — Fashion Without Tym Limits
          </p>

          <p className="mt-1 text-xs text-gray-500">
            Privacy Policy
          </p>
        </section>

        <div className="h-8" />
      </div>
    </main>
  );
}