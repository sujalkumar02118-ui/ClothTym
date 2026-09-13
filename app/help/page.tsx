"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Order = {
  id: string;
  status?: string;
  createdAt?: string;
  items?: {
    product?: {
      name?: string;
      image?: string;
    };
  }[];
};

type FAQ = {
  category: string;
  question: string;
  answer: string;
};

const faqs: FAQ[] = [
  {
    category: "Orders & Tracking",
    question: "How can I track my order?",
    answer:
      "Go to Profile → Orders and open the order you want to track. You can view the latest available order status there.",
  },
  {
    category: "Orders & Tracking",
    question: "Where can I see my previous orders?",
    answer:
      "Open Profile → Orders. Your completed, ongoing and cancelled orders are available there.",
  },
  {
    category: "Orders & Tracking",
    question: "What do the different order statuses mean?",
    answer:
      "Statuses such as Confirmed, Ready for Pickup, Picked Up, Out for Delivery and Delivered show the current stage of your order.",
  },
  {
    category: "Delivery",
    question: "How long does delivery take?",
    answer:
      "Delivery time depends on product availability, seller location and your delivery address. The available delivery information is shown during the order process.",
  },
  {
    category: "Delivery",
    question: "Can I change my delivery address after placing an order?",
    answer:
      "Once an order has been placed, changing its delivery address may not always be possible. Please contact ClothTym support as soon as possible if you need help.",
  },
  {
    category: "Delivery",
    question: "What happens if I am unavailable during delivery?",
    answer:
      "The delivery process may require another attempt or additional coordination depending on the order and delivery status. Check your order status or contact support for assistance.",
  },
  {
    category: "Cancellation",
    question: "Can I cancel my order?",
    answer:
      "Cancellation availability depends on the current order status. If cancellation is available, you can request it through the applicable order option.",
  },
  {
    category: "Cancellation",
    question: "Why can't I cancel my order?",
    answer:
      "Some orders cannot be cancelled after they have progressed to certain fulfilment or delivery stages.",
  },
  {
    category: "Returns",
    question: "Can I return a product?",
    answer:
      "Return eligibility depends on the product, order status and ClothTym's applicable return policy. Open your order to check whether a return option is available.",
  },
  {
    category: "Returns",
    question: "How do I request a return?",
    answer:
      "Open Profile → Orders, select the delivered order and use the available return option if the order is eligible.",
  },
  {
    category: "Returns",
    question: "What happens after I request a return?",
    answer:
      "Your return request is reviewed and processed according to the applicable ClothTym return process. You can check the latest status from your order.",
  },
  {
    category: "Refunds",
    question: "When will I receive my refund?",
    answer:
      "Refund timing depends on the payment method and the stage of the refund process. The refund status will be updated as processing progresses.",
  },
  {
    category: "Refunds",
    question: "How will my refund be processed?",
    answer:
      "The refund method depends on how the order was paid for and the applicable refund process.",
  },
  {
    category: "Payments",
    question: "Which payment methods are available?",
    answer:
      "ClothTym supports the payment methods made available during checkout. Available options can vary depending on the order and service.",
  },
  {
    category: "Payments",
    question: "What happens if my online payment fails?",
    answer:
      "If a payment fails, check your bank or payment app first. If the order was not successfully created or paid, you can try the payment again when the option is available.",
  },
  {
    category: "Payments",
    question: "Is Cash on Delivery available?",
    answer:
      "Cash on Delivery may be available for eligible orders and locations. The available payment options are shown during checkout.",
  },
  {
    category: "Account & Login",
    question: "How can I change my account details?",
    answer:
      "Go to Profile → Manage Account → Account Details. You can update the supported account information there.",
  },
  {
    category: "Account & Login",
    question: "How can I manage my saved addresses?",
    answer:
      "Go to Profile → Manage Account → Addresses. You can add, edit, remove and manage your default address there.",
  },
  {
    category: "Account & Login",
    question: "I forgot my password. What should I do?",
    answer:
      "Use the available login recovery option on the login page. If you still cannot access your account, contact ClothTym support.",
  },
  {
    category: "Wishlist",
    question: "How does Wishlist work?",
    answer:
      "Tap the heart icon on a product to add it to your Wishlist. You can view saved products from Profile → Wishlist.",
  },
  {
    category: "Seller",
    question: "How can I become a ClothTym seller?",
    answer:
      "Use the Become a ClothTym Seller option and complete the seller registration process. Your submitted information will be reviewed before seller access is approved.",
  },
  {
    category: "Seller",
    question: "Can I sell products through ClothTym?",
    answer:
      "Yes. Eligible sellers can register their business and, after approval, manage products and orders through the Seller Panel.",
  },
];

const topics = [
  "Orders & Tracking",
  "Delivery",
  "Returns",
  "Refunds",
  "Payments",
  "Account & Login",
  "Cancellations",
];

function formatDate(value?: string) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getStatusLabel(status?: string) {
  if (!status) return "Order";

  return status
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function HelpPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadOrders() {
      try {
        const response = await fetch("/api/orders", {
          cache: "no-store",
        });

        if (!response.ok) {
          if (active) setOrders([]);
          return;
        }

        const data = await response.json();

        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.orders)
            ? data.orders
            : Array.isArray(data?.data)
              ? data.data
              : [];

        if (active) {
          setOrders(list.slice(0, 3));
        }
      } catch {
        if (active) setOrders([]);
      } finally {
        if (active) setLoadingOrders(false);
      }
    }

    loadOrders();

    return () => {
      active = false;
    };
  }, []);

  const filteredFaqs = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return faqs;

    return faqs.filter(
      (faq) =>
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query) ||
        faq.category.toLowerCase().includes(query)
    );
  }, [search]);

  const groupedFaqs = useMemo(() => {
    const groups: Record<string, { faq: FAQ; index: number }[]> = {};

    filteredFaqs.forEach((faq) => {
      const index = faqs.indexOf(faq);

      if (!groups[faq.category]) {
        groups[faq.category] = [];
      }

      groups[faq.category].push({
        faq,
        index,
      });
    });

    return groups;
  }, [filteredFaqs]);

  function scrollToTopic(topic: string) {
    const element = document.getElementById(
      `topic-${topic.toLowerCase().replaceAll(" ", "-").replaceAll("&", "and")}`
    );

    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }

  return (
    <main className="min-h-screen bg-white text-[#282c3f]">
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/profile"
            className="mb-5 inline-flex items-center text-sm font-medium text-[#282c3f] hover:underline"
          >
            ← Back to Profile
          </Link>

          <h1 className="text-2xl font-semibold sm:text-3xl">
            Help Center
          </h1>

          <p className="mt-2 text-sm text-gray-500 sm:text-base">
            How can we help you today?
          </p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              🔍
            </span>

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search your question"
              className="h-12 w-full rounded-md border border-gray-200 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-[#ff3f6c]"
            />
          </div>
        </div>

        {/* Recent Orders */}
        <section className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Orders</h2>

            <Link
              href="/orders"
              className="text-sm font-semibold text-[#ff3f6c]"
            >
              View All
            </Link>
          </div>

          {loadingOrders ? (
            <div className="rounded-md border border-gray-100 p-5 text-sm text-gray-500">
              Loading your recent orders...
            </div>
          ) : orders.length === 0 ? (
            <div className="rounded-md border border-gray-100 p-6 text-center text-sm text-gray-500">
              No recent orders found.
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => {
                const firstItem = order.items?.[0];
                const product = firstItem?.product;

                return (
                  <Link
                    key={order.id}
                    href={`/orders/${order.id}`}
                    className="flex items-center gap-4 rounded-md border border-gray-100 p-4 transition hover:border-gray-200 hover:shadow-sm"
                  >
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded bg-gray-50">
                      {product?.image ? (
                        <img
                          src={product.image}
                          alt={product.name || "Product"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                          Product
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {product?.name || "Order"}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        {formatDate(order.createdAt)}
                      </p>

                      <p className="mt-1 text-xs font-medium text-green-600">
                        {getStatusLabel(order.status)}
                      </p>
                    </div>

                    <span className="text-lg text-gray-400">›</span>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Browse Topics */}
        <section className="mb-10">
          <h2 className="mb-4 text-lg font-semibold">Browse Topics</h2>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {topics.map((topic) => (
              <button
                key={topic}
                type="button"
                onClick={() => scrollToTopic(topic)}
                className="rounded-md border border-gray-100 bg-white px-3 py-4 text-left text-sm font-medium transition hover:border-gray-200 hover:shadow-sm"
              >
                {topic}
              </button>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section>
          <div className="mb-5">
            <h2 className="text-lg font-semibold">
              Frequently Asked Questions
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Find quick answers about your ClothTym account and orders.
            </p>
          </div>

          {filteredFaqs.length === 0 ? (
            <div className="rounded-md border border-gray-100 p-8 text-center">
              <p className="text-sm font-medium">
                No matching questions found.
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Try searching with different words.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedFaqs).map(([category, items]) => {
                const sectionId = `topic-${category
                  .toLowerCase()
                  .replaceAll(" ", "-")
                  .replaceAll("&", "and")}`;

                return (
                  <div
                    key={category}
                    id={sectionId}
                    className="scroll-mt-6"
                  >
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
                      {category}
                    </h3>

                    <div className="overflow-hidden rounded-md border border-gray-100">
                      {items.map(({ faq, index }) => {
                        const isOpen = openFaq === index;

                        return (
                          <div
                            key={`${faq.question}-${index}`}
                            className="border-b border-gray-100 last:border-b-0"
                          >
                            <button
                              type="button"
                              onClick={() =>
                                setOpenFaq(isOpen ? null : index)
                              }
                              className="flex min-h-14 w-full items-center justify-between gap-4 px-4 py-4 text-left"
                              aria-expanded={isOpen}
                            >
                              <span className="text-sm font-medium">
                                {faq.question}
                              </span>

                              <span className="shrink-0 text-xl text-gray-400">
                                {isOpen ? "−" : "+"}
                              </span>
                            </button>

                            {isOpen && (
                              <div className="px-4 pb-5 pr-10 text-sm leading-6 text-gray-600">
                                {faq.answer}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Quick Actions */}
        <section className="mt-12 border-t border-gray-100 pt-8">
          <h2 className="mb-4 text-lg font-semibold">Quick Actions</h2>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/orders"
              className="rounded-md border border-gray-200 px-5 py-3 text-center text-sm font-semibold transition hover:border-gray-300"
            >
              View My Orders
            </Link>

            <Link
              href="/profile"
              className="rounded-md bg-[#ff3f6c] px-5 py-3 text-center text-sm font-semibold text-white transition hover:opacity-90"
            >
              Go to Profile
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}