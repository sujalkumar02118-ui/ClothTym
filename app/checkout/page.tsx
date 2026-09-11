"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSession } from "next-auth/react";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    Razorpay: any;
  }
}

type CartItem = {
  productId: string;
  name: string;
  price: number;
  image?: string;
  quantity: number;
  size?: string;
  color?: string;
};

type PaymentMethod = "COD" | "ONLINE";

export default function CheckoutPage() {
  const router = useRouter();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("COD");

  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("clothtym_cart");

    try {
      const data = saved ? JSON.parse(saved) : [];

      if (!Array.isArray(data) || data.length === 0) {
        router.push("/cart");
        return;
      }

      setCart(data);
    } catch {
      router.push("/cart");
      return;
    }

    setLoading(false);
  }, [router]);

  // Load Razorpay checkout script
  useEffect(() => {
    if (document.getElementById("razorpay-checkout-script")) {
      setRazorpayLoaded(true);
      return;
    }

    const script = document.createElement("script");

    script.id = "razorpay-checkout-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;

    script.onload = () => {
      setRazorpayLoaded(true);
    };

    script.onerror = () => {
      setRazorpayLoaded(false);
      console.error("Failed to load Razorpay checkout script.");
    };

    document.body.appendChild(script);
  }, []);

  const subtotal = cart.reduce(
    (total, item) =>
      total + Number(item.price) * Number(item.quantity),
    0
  );

  const deliveryCharge =
    subtotal >= 1000 ? 0 : 50;

  const total = subtotal + deliveryCharge;

  async function placeOrder() {
    if (!address.trim()) {
      alert("Please enter your delivery address.");
      return;
    }

    if (cart.length === 0) {
      alert("Your cart is empty.");
      router.push("/cart");
      return;
    }

    try {
      setPlacingOrder(true);

      const session = await getSession();

      if (!session?.user?.id) {
        alert("Please login before placing the order.");
        router.push("/login");
        return;
      }

      // =====================================================
      // STEP 1 — CREATE OUR CLOTH TYM ORDER
      // =====================================================

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address: address.trim(),

          // Prisma PaymentMethod supports:
          // COD / ONLINE
          paymentMethod,

          items: cart.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            size: item.size || "",
            color: item.color || "",
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            "Order could not be placed."
        );
      }

      const createdOrder = data?.order || data;

      if (!createdOrder?.id) {
        throw new Error(
          "Order was created but order ID was not returned."
        );
      }

      // =====================================================
      // COD
      // =====================================================

      if (paymentMethod === "COD") {
        localStorage.removeItem("clothtym_cart");
        localStorage.removeItem("clothtym_buy_now");

        alert("Order placed successfully! 🎉");

        router.push("/orders");
        return;
      }

      // =====================================================
      // ONLINE PAYMENT
      // =====================================================

      if (!razorpayLoaded || !window.Razorpay) {
        throw new Error(
          "Razorpay checkout is not loaded. Please refresh and try again."
        );
      }

      // =====================================================
      // STEP 2 — CREATE RAZORPAY ORDER
      // =====================================================

      const razorpayResponse = await fetch(
        "/api/payment/create-order",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId: createdOrder.id,
          }),
        }
      );

      const razorpayData =
        await razorpayResponse.json();

      if (!razorpayResponse.ok) {
        throw new Error(
          razorpayData?.message ||
            "Unable to start online payment."
        );
      }

      if (
        !razorpayData?.razorpayOrderId ||
        !razorpayData?.keyId
      ) {
        throw new Error(
          "Razorpay order details are incomplete."
        );
      }

      // =====================================================
      // STEP 3 — OPEN RAZORPAY
      // =====================================================

      const options = {
        key: razorpayData.keyId,

        amount: razorpayData.amount,

        currency: razorpayData.currency || "INR",

        name: "CLOTHTYM",

        description: `Payment for Order #${createdOrder.id}`,

        order: razorpayData.razorpayOrderId,

        handler: async function (paymentResponse: any) {
          try {
            setPlacingOrder(true);

            // =================================================
            // STEP 4 — VERIFY PAYMENT ON OUR SERVER
            // =================================================

            const verifyResponse = await fetch(
              "/api/payment/verify",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  orderId: createdOrder.id,

                  razorpayOrderId:
                    paymentResponse.razorpay_order_id,

                  razorpayPaymentId:
                    paymentResponse.razorpay_payment_id,

                  razorpaySignature:
                    paymentResponse.razorpay_signature,
                }),
              }
            );

            const verifyData =
              await verifyResponse.json();

            if (!verifyResponse.ok) {
              throw new Error(
                verifyData?.message ||
                  "Payment verification failed."
              );
            }

            // Payment successfully verified
            localStorage.removeItem(
              "clothtym_cart"
            );

            localStorage.removeItem(
              "clothtym_buy_now"
            );

            alert(
              "Payment successful! Order placed successfully. 🎉"
            );

            router.push("/orders");
          } catch (error) {
            console.error(
              "PAYMENT VERIFICATION ERROR:",
              error
            );

            alert(
              error instanceof Error
                ? error.message
                : "Payment verification failed."
            );
          } finally {
            setPlacingOrder(false);
          }
        },

        prefill: {
          name: session.user.name || "",
          email: session.user.email || "",
        },

        theme: {
          color: "#07152f",
        },

        modal: {
          ondismiss: function () {
            setPlacingOrder(false);

            alert(
              "Payment was cancelled. Your order is still pending payment."
            );
          },
        },
      };

      const razorpay =
        new window.Razorpay(options);

      razorpay.on(
        "payment.failed",
        function (response: any) {
          console.error(
            "RAZORPAY PAYMENT FAILED:",
            response
          );

          setPlacingOrder(false);

          alert(
            response?.error?.description ||
              "Payment failed. Please try again."
          );
        }
      );

      razorpay.open();
    } catch (error) {
      console.error("PLACE ORDER ERROR:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Order could not be placed."
      );

      setPlacingOrder(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8fafc]">
        <div className="text-center">
          <div className="text-5xl">📦</div>

          <h2 className="mt-4 text-2xl font-black">
            Loading checkout...
          </h2>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] text-gray-900">

      {/* HEADER */}

      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">

          <Link
            href="/cart"
            className="font-black text-gray-900"
          >
            ← Cart
          </Link>

          <Link
            href="/"
            className="text-xl font-black tracking-wide text-[#07152f]"
          >
            CLOTHTYM
          </Link>

          <div className="text-sm font-bold text-gray-500">
            Secure Checkout
          </div>

        </div>
      </header>

      {/* MAIN */}

      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">

        <div className="mb-8">

          <p className="text-sm font-black uppercase tracking-wider text-gray-500">
            CLOTHTYM
          </p>

          <h1 className="mt-1 text-3xl font-black text-[#07152f] sm:text-4xl">
            Checkout
          </h1>

          <p className="mt-2 text-gray-500">
            Enter your address and choose your payment method.
          </p>

        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">

          {/* LEFT */}

          <section className="space-y-6">

            {/* ADDRESS */}

            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">

              <h2 className="text-xl font-black text-[#07152f]">
                Delivery Address
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Where should we deliver your order?
              </p>

              <textarea
                value={address}
                onChange={(e) =>
                  setAddress(e.target.value)
                }
                placeholder="Enter full delivery address..."
                rows={5}
                className="mt-5 w-full rounded-2xl border-2 border-gray-200 p-4 outline-none transition focus:border-[#07152f]"
              />

            </div>

            {/* PAYMENT */}

            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">

              <h2 className="text-xl font-black text-[#07152f]">
                Payment Method
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Choose how you want to pay.
              </p>

              <div className="mt-5 space-y-3">

                {/* COD */}

                <button
                  type="button"
                  onClick={() =>
                    setPaymentMethod("COD")
                  }
                  className={`w-full rounded-2xl border-2 p-4 text-left ${
                    paymentMethod === "COD"
                      ? "border-[#07152f] bg-blue-50"
                      : "border-gray-200 bg-white"
                  }`}
                >

                  <div className="flex items-center justify-between">

                    <div>
                      <p className="font-black">
                        💵 Cash on Delivery
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        Pay when your order is delivered.
                      </p>
                    </div>

                    <div
                      className={`h-5 w-5 rounded-full border-2 ${
                        paymentMethod === "COD"
                          ? "border-[#07152f] bg-[#07152f]"
                          : "border-gray-300"
                      }`}
                    />

                  </div>

                </button>

                {/* ONLINE */}

                <button
                  type="button"
                  onClick={() =>
                    setPaymentMethod("ONLINE")
                  }
                  className={`w-full rounded-2xl border-2 p-4 text-left ${
                    paymentMethod === "ONLINE"
                      ? "border-[#07152f] bg-blue-50"
                      : "border-gray-200 bg-white"
                  }`}
                >

                  <div className="flex items-center justify-between">

                    <div>
                      <p className="font-black">
                        💳 Online Payment
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        UPI, Credit / Debit Card and Wallets.
                      </p>
                    </div>

                    <div
                      className={`h-5 w-5 rounded-full border-2 ${
                        paymentMethod === "ONLINE"
                          ? "border-[#07152f] bg-[#07152f]"
                          : "border-gray-300"
                      }`}
                    />

                  </div>

                </button>

              </div>

              {paymentMethod === "ONLINE" && (
                <div className="mt-5 rounded-2xl bg-blue-50 p-4 text-sm font-bold text-blue-800">
                  🔐 You will be redirected to the
                  secure Razorpay checkout after placing
                  the order.
                </div>
              )}

            </div>

          </section>

          {/* SUMMARY */}

          <aside className="h-fit rounded-3xl border border-gray-200 bg-white p-6 shadow-sm lg:sticky lg:top-24">

            <h2 className="text-2xl font-black text-[#07152f]">
              Price Details
            </h2>

            <div className="mt-6 space-y-4">

              <div className="flex justify-between text-gray-600">
                <span>Items</span>

                <span className="font-bold text-gray-900">
                  {cart.length}
                </span>
              </div>

              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>

                <span className="font-bold text-gray-900">
                  ₹{subtotal.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="flex justify-between text-gray-600">
                <span>Delivery</span>

                <span className="font-bold text-gray-900">
                  {deliveryCharge === 0
                    ? "FREE"
                    : `₹${deliveryCharge}`}
                </span>
              </div>

              <div className="border-t border-gray-200 pt-4">

                <div className="flex justify-between">

                  <span className="text-lg font-black">
                    Total
                  </span>

                  <span className="text-2xl font-black text-[#07152f]">
                    ₹{total.toLocaleString("en-IN")}
                  </span>

                </div>

              </div>

            </div>

            {subtotal >= 1000 && (
              <div className="mt-5 rounded-2xl bg-green-50 p-4 text-sm font-black text-green-700">
                🎉 FREE delivery unlocked!
              </div>
            )}

            <button
              type="button"
              onClick={placeOrder}
              disabled={
                placingOrder ||
                (paymentMethod === "ONLINE" &&
                  !razorpayLoaded)
              }
              className="mt-6 w-full rounded-xl bg-[#07152f] px-6 py-4 font-black text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {placingOrder
                ? paymentMethod === "ONLINE"
                  ? "Opening Payment..."
                  : "Placing Order..."
                : paymentMethod === "ONLINE"
                ? "Pay Online →"
                : "Place Order →"}
            </button>

            {paymentMethod === "ONLINE" &&
              !razorpayLoaded && (
                <p className="mt-3 text-center text-xs font-bold text-orange-600">
                  Loading secure payment gateway...
                </p>
              )}

            <p className="mt-4 text-center text-xs font-semibold text-gray-400">
              🔒 Your order information is secure.
            </p>

          </aside>

        </div>

      </div>

    </main>
  );
}