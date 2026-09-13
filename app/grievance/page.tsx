import Link from "next/link";

export default function GrievancePage() {
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
            Grievance Redressal
          </h1>

          <p className="mt-3 text-sm leading-6 text-gray-600">
            We are committed to addressing customer concerns fairly and
            efficiently.
          </p>
        </section>

        {/* Introduction */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold">1. What is a Grievance?</h2>

          <p className="mt-3 text-sm leading-7 text-gray-600 sm:text-base">
            A grievance is a complaint or concern relating to the use of
            ClothTym, an order, product, delivery, payment, return, refund,
            account or another service provided through the platform.
          </p>
        </section>

        {/* Issues */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold">
            2. Issues You Can Report
          </h2>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              "Order-related issues",
              "Product-related concerns",
              "Delivery issues",
              "Payment problems",
              "Cancellation concerns",
              "Return or refund issues",
              "Account and login problems",
              "Privacy-related concerns",
            ].map((item) => (
              <div
                key={item}
                className="rounded-lg border border-gray-100 p-4 text-sm text-gray-600"
              >
                {item}
              </div>
            ))}
          </div>
        </section>

        {/* Before complaint */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold">
            3. Before Raising a Grievance
          </h2>

          <p className="mt-3 text-sm leading-7 text-gray-600 sm:text-base">
            For order-related concerns, please first check your order details,
            current order status and any available Help Center information.
            Many common issues can be resolved directly through the relevant
            order option.
          </p>
        </section>

        {/* How to complain */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold">
            4. How to Raise a Grievance
          </h2>

          <p className="mt-3 text-sm leading-7 text-gray-600 sm:text-base">
            You can contact ClothTym through the support channels made
            available on the platform.
          </p>

          <div className="mt-5 space-y-3">
            {[
              {
                number: "01",
                title: "Identify the issue",
                text: "Clearly explain the problem you are facing.",
              },
              {
                number: "02",
                title: "Provide relevant details",
                text: "Include your order ID or account details where relevant.",
              },
              {
                number: "03",
                title: "Attach supporting information",
                text: "Where appropriate, provide screenshots, payment references or other useful evidence.",
              },
              {
                number: "04",
                title: "Wait for review",
                text: "ClothTym will review the concern and respond through the available support channel.",
              },
            ].map((step) => (
              <div
                key={step.number}
                className="flex gap-4 rounded-lg border border-gray-100 p-4"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fff0f4] text-xs font-bold text-[#ff3f6c]">
                  {step.number}
                </div>

                <div>
                  <h3 className="text-sm font-semibold">{step.title}</h3>

                  <p className="mt-1 text-sm leading-6 text-gray-500">
                    {step.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Required details */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold">
            5. Information to Include
          </h2>

          <ul className="mt-3 space-y-2 text-sm leading-7 text-gray-600 sm:text-base">
            <li>• Your name and registered contact information.</li>
            <li>• Order ID, where the grievance relates to an order.</li>
            <li>• A clear description of the issue.</li>
            <li>• Relevant dates and transaction details.</li>
            <li>• Supporting screenshots or documents, where applicable.</li>
          </ul>
        </section>

        {/* Review */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold">6. Review Process</h2>

          <p className="mt-3 text-sm leading-7 text-gray-600 sm:text-base">
            After receiving a grievance, ClothTym may review the information
            provided, check relevant account or order records and coordinate
            with the appropriate team, seller or service provider where
            necessary.
          </p>

          <p className="mt-3 text-sm leading-7 text-gray-600 sm:text-base">
            Additional information may be requested if it is necessary to
            properly investigate the concern.
          </p>
        </section>

        {/* Resolution */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold">7. Resolution</h2>

          <p className="mt-3 text-sm leading-7 text-gray-600 sm:text-base">
            ClothTym will take reasonable steps to address valid grievances
            according to the applicable platform policies, transaction
            details and applicable requirements.
          </p>

          <p className="mt-3 text-sm leading-7 text-gray-600 sm:text-base">
            Resolution may include clarification, correction, cancellation,
            return, refund or another appropriate action depending on the
            nature of the issue.
          </p>
        </section>

        {/* Privacy */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold">
            8. Privacy & Personal Information
          </h2>

          <p className="mt-3 text-sm leading-7 text-gray-600 sm:text-base">
            Please do not share sensitive information such as passwords, UPI
            PINs, card PINs or other authentication credentials while raising a
            grievance.
          </p>

          <p className="mt-3 text-sm leading-7 text-gray-600 sm:text-base">
            ClothTym may request information that is reasonably necessary to
            verify an account or investigate a complaint.
          </p>
        </section>

        {/* Grievance Officer */}
        <section className="mt-10 rounded-xl bg-gray-50 p-6">
          <h2 className="text-xl font-semibold">
            9. Grievance Officer
          </h2>

          <p className="mt-3 text-sm leading-7 text-gray-600 sm:text-base">
            Details of the designated Grievance Officer and official grievance
            contact channel will be published here once formally designated by
            ClothTym.
          </p>

          <div className="mt-5 rounded-lg border border-dashed border-gray-200 bg-white p-4">
            <p className="text-sm font-medium">Grievance Officer</p>

            <p className="mt-1 text-sm text-gray-500">
              Details to be updated by ClothTym.
            </p>
          </div>
        </section>

        {/* No false contact */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold">10. Important Notice</h2>

          <p className="mt-3 text-sm leading-7 text-gray-600 sm:text-base">
            Please use only the official support channels provided through
            ClothTym. Do not send passwords, payment PINs or other confidential
            authentication information to anyone claiming to represent
            ClothTym.
          </p>
        </section>

        {/* Contact */}
        <section className="mt-10 rounded-xl border border-gray-100 p-6">
          <h2 className="text-xl font-semibold">11. Need Help?</h2>

          <p className="mt-3 text-sm leading-7 text-gray-600 sm:text-base">
            For general questions, visit the ClothTym Help Center before
            raising a formal grievance.
          </p>

          <Link
            href="/help"
            className="mt-5 inline-flex rounded-md bg-[#ff3f6c] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Visit Help Center
          </Link>
        </section>

        {/* Footer */}
        <section className="mt-10 border-t border-gray-100 pt-6 text-center">
          <p className="text-sm font-semibold">
            ClothTym — Fashion Without Tym Limits
          </p>

          <p className="mt-1 text-xs text-gray-500">
            Grievance Redressal
          </p>
        </section>

        <div className="h-8" />
      </div>
    </main>
  );
}