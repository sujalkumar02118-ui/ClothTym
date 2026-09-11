"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type CartItem = {
  id?: string;
  productId: string;
  name: string;
  price: number;
  image?: string;
  quantity: number;
  size?: string | null;
  color?: string | null;
  stock?: number;
  itemTotal?: number;
};

type CartSummary = {
  subtotal: number;
  deliveryCharge: number;
  total: number;
};

export default function CartPage() {
  const router = useRouter();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [summary, setSummary] = useState<CartSummary>({
    subtotal: 0,
    deliveryCharge: 0,
    total: 0,
  });

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const [showCheckout, setShowCheckout] = useState(false);
  const [address, setAddress] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState("");
  const [cartMessage, setCartMessage] = useState("");

  /* =========================================================
     LOAD CART FROM DATABASE
  ========================================================= */

  useEffect(() => {
    loadCart();
  }, []);

  async function loadCart() {
    try {
      setLoading(true);
      setCartMessage("");

      /*
       * -------------------------------------------------------
       * ONE-TIME LOCAL CART MIGRATION
       *
       * Old cart data may still exist in:
       * clothtym_cart
       *
       * We try to move it to the database.
       * Product price is NOT taken from localStorage.
       * The API gets the real price from Product table.
       * -------------------------------------------------------
       */

      const migrationDone =
        localStorage.getItem(
          "clothtym_cart_migration_v1"
        );

      if (!migrationDone) {
        const saved =
          localStorage.getItem("clothtym_cart");

        if (saved) {
          try {
            const oldCart: unknown =
              JSON.parse(saved);

            if (Array.isArray(oldCart)) {
              let migrationSuccessful = true;

              for (const item of oldCart) {
                if (
                  typeof item !== "object" ||
                  item === null ||
                  Array.isArray(item)
                ) {
                  migrationSuccessful = false;
                  continue;
                }

                const oldItem = item as {
                  productId?: unknown;
                  quantity?: unknown;
                  size?: unknown;
                  color?: unknown;
                };

                if (
                  typeof oldItem.productId !== "string" ||
                  oldItem.productId.trim() === ""
                ) {
                  migrationSuccessful = false;
                  continue;
                }

                const quantity =
                  typeof oldItem.quantity === "number" &&
                  Number.isInteger(oldItem.quantity) &&
                  oldItem.quantity > 0
                    ? oldItem.quantity
                    : 1;

                const response =
                  await fetch("/api/cart", {
                    method: "POST",
                    headers: {
                      "Content-Type":
                        "application/json",
                    },
                    body: JSON.stringify({
                      productId:
                        oldItem.productId.trim(),
                      quantity,
                      size:
                        typeof oldItem.size ===
                        "string"
                          ? oldItem.size
                          : null,
                      color:
                        typeof oldItem.color ===
                        "string"
                          ? oldItem.color
                          : null,
                    }),
                  });

                /*
                 * 401 means user is not logged in.
                 * In that case don't mark migration complete.
                 */
                if (response.status === 401) {
                  migrationSuccessful = false;
                  break;
                }

                if (!response.ok) {
                  migrationSuccessful = false;
                }
              }

              if (migrationSuccessful) {
                localStorage.removeItem(
                  "clothtym_cart"
                );

                localStorage.setItem(
                  "clothtym_cart_migration_v1",
                  "true"
                );
              }
            }
          } catch (migrationError) {
            console.error(
              "CART MIGRATION ERROR:",
              migrationError
            );
          }
        } else {
          localStorage.setItem(
            "clothtym_cart_migration_v1",
            "true"
          );
        }
      }

      /* -------------------------------------------------------
         LOAD REAL DATABASE CART
      ------------------------------------------------------- */

      const response = await fetch(
        "/api/cart",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setCart([]);
          setSummary({
            subtotal: 0,
            deliveryCharge: 0,
            total: 0,
          });

          setCartMessage(
            "Please login to view your cart."
          );

          return;
        }

        throw new Error(
          data?.message ||
            "Cart could not be loaded."
        );
      }

      setCart(
        Array.isArray(data?.cart)
          ? data.cart
          : []
      );

      setSummary({
        subtotal:
          Number(data?.summary?.subtotal) || 0,
        deliveryCharge:
          Number(
            data?.summary?.deliveryCharge
          ) || 0,
        total:
          Number(data?.summary?.total) || 0,
      });
    } catch (error) {
      console.error(
        "CART LOAD ERROR:",
        error
      );

      setCart([]);

      setSummary({
        subtotal: 0,
        deliveryCharge: 0,
        total: 0,
      });

      setCartMessage(
        error instanceof Error
          ? error.message
          : "Cart could not be loaded."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
     REFRESH CART AFTER API CHANGE
  ========================================================= */

  async function refreshCart() {
    try {
      const response = await fetch(
        "/api/cart",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Cart could not be refreshed."
        );
      }

      setCart(
        Array.isArray(data?.cart)
          ? data.cart
          : []
      );

      setSummary({
        subtotal:
          Number(data?.summary?.subtotal) || 0,
        deliveryCharge:
          Number(
            data?.summary?.deliveryCharge
          ) || 0,
        total:
          Number(data?.summary?.total) || 0,
      });
    } catch (error) {
      console.error(
        "CART REFRESH ERROR:",
        error
      );
    }
  }

  /* =========================================================
     UPDATE QUANTITY
  ========================================================= */

  async function updateQuantity(
    item: CartItem,
    newQuantity: number
  ) {
    if (newQuantity < 1) {
      await removeItem(item);
      return;
    }

    if (newQuantity > 100) {
      setCartMessage(
        "Maximum quantity is 100."
      );
      return;
    }

    if (
      typeof item.stock === "number" &&
      item.stock >= 0 &&
      newQuantity > item.stock
    ) {
      setCartMessage(
        `Only ${item.stock} item(s) are available in stock.`
      );
      return;
    }

    try {
      setUpdating(true);
      setCartMessage("");

      const response = await fetch(
        "/api/cart",
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            productId: item.productId,
            quantity: newQuantity,
            size: item.size ?? null,
            color: item.color ?? null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Cart could not be updated."
        );
      }

      await refreshCart();
    } catch (error) {
      console.error(
        "CART QUANTITY ERROR:",
        error
      );

      setCartMessage(
        error instanceof Error
          ? error.message
          : "Cart could not be updated."
      );
    } finally {
      setUpdating(false);
    }
  }

  /* =========================================================
     INCREASE
  ========================================================= */

  async function increaseQuantity(
    item: CartItem
  ) {
    await updateQuantity(
      item,
      item.quantity + 1
    );
  }

  /* =========================================================
     DECREASE
  ========================================================= */

  async function decreaseQuantity(
    item: CartItem
  ) {
    if (item.quantity <= 1) {
      await removeItem(item);
      return;
    }

    await updateQuantity(
      item,
      item.quantity - 1
    );
  }

  /* =========================================================
     REMOVE ITEM
  ========================================================= */

  async function removeItem(
    item: CartItem
  ) {
    try {
      setUpdating(true);
      setCartMessage("");

      const response = await fetch(
        "/api/cart",
        {
          method: "DELETE",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            productId: item.productId,
            size: item.size ?? null,
            color: item.color ?? null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Product could not be removed."
        );
      }

      await refreshCart();
    } catch (error) {
      console.error(
        "REMOVE CART ITEM ERROR:",
        error
      );

      setCartMessage(
        error instanceof Error
          ? error.message
          : "Product could not be removed."
      );
    } finally {
      setUpdating(false);
    }
  }

  /* =========================================================
     CLEAR CART
  ========================================================= */

  async function clearCart() {
    try {
      setUpdating(true);
      setCartMessage("");

      const response = await fetch(
        "/api/cart",
        {
          method: "DELETE",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            clearAll: true,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Cart could not be cleared."
        );
      }

      setCart([]);
      setSummary({
        subtotal: 0,
        deliveryCharge: 0,
        total: 0,
      });

      localStorage.removeItem(
        "clothtym_cart"
      );
    } catch (error) {
      console.error(
        "CLEAR CART ERROR:",
        error
      );

      setCartMessage(
        error instanceof Error
          ? error.message
          : "Cart could not be cleared."
      );
    } finally {
      setUpdating(false);
    }
  }

  /* =========================================================
     CHECKOUT
  ========================================================= */

  async function placeOrder() {
    if (cart.length === 0) {
      setCheckoutMessage(
        "Your cart is empty."
      );
      return;
    }

    if (!address.trim()) {
      setCheckoutMessage(
        "Please enter your delivery address."
      );
      return;
    }

    try {
      setPlacingOrder(true);
      setCheckoutMessage("");

      const response = await fetch(
        "/api/orders",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            address: address.trim(),
            paymentMethod: "COD",

            items: cart.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,

              /*
               * This is only sent because the existing
               * orders API currently expects price.
               * The Cart API itself always gets price
               * from the Product database.
               */
              price: Number(item.price),

              size: item.size || null,
              color: item.color || null,
            })),

            totalAmount: summary.total,
            deliveryCharge:
              summary.deliveryCharge,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Order could not be placed."
        );
      }

      setCart([]);
      setSummary({
        subtotal: 0,
        deliveryCharge: 0,
        total: 0,
      });

      localStorage.removeItem(
        "clothtym_cart"
      );

      localStorage.setItem(
        "clothtym_cart_migration_v1",
        "true"
      );

      alert(
        "🎉 Order placed successfully!"
      );

      router.push("/orders");
    } catch (error) {
      console.error(
        "PLACE ORDER ERROR:",
        error
      );

      setCheckoutMessage(
        error instanceof Error
          ? error.message
          : "Order could not be placed."
      );
    } finally {
      setPlacingOrder(false);
    }
  }

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8fafc]">
        <div className="text-center">
          <div className="text-5xl">
            🛒
          </div>

          <h2 className="mt-4 text-2xl font-black">
            Loading cart...
          </h2>
        </div>
      </main>
    );
  }

  /* =========================================================
     NOT LOGGED IN / CART API ERROR
  ========================================================= */

  if (
    cartMessage ===
      "Please login to view your cart."
  ) {
    return (
      <main className="min-h-screen bg-[#f8fafc] text-gray-900">

        <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">

            <Link
              href="/"
              className="text-xl font-black tracking-wide text-[#07152f]"
            >
              CLOTHTYM
            </Link>

            <Link
              href="/login?callbackUrl=/cart"
              className="rounded-xl bg-[#07152f] px-5 py-2.5 text-sm font-black text-white"
            >
              Login
            </Link>

          </div>
        </header>

        <div className="mx-auto max-w-7xl px-4 py-12">

          <div className="rounded-3xl border border-gray-200 bg-white p-10 text-center shadow-sm">

            <div className="text-7xl">
              🔐
            </div>

            <h1 className="mt-5 text-3xl font-black text-[#07152f]">
              Please Login
            </h1>

            <p className="mt-2 text-gray-500">
              Please login to view and manage your cart.
            </p>

            <Link
              href="/login?callbackUrl=/cart"
              className="mt-7 inline-block rounded-xl bg-[#07152f] px-7 py-3.5 font-black text-white"
            >
              Login to Continue →
            </Link>

          </div>

        </div>

      </main>
    );
  }

  /* =========================================================
     MAIN CART PAGE
  ========================================================= */

  return (
    <main className="min-h-screen bg-[#f8fafc] text-gray-900">

      {/* HEADER */}

      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">

          <Link
            href="/"
            className="text-xl font-black tracking-wide text-[#07152f]"
          >
            CLOTHTYM
          </Link>

          <Link
            href="/"
            className="rounded-xl bg-[#07152f] px-5 py-2.5 text-sm font-black text-white"
          >
            Continue Shopping
          </Link>

        </div>
      </header>

      {/* MAIN */}

      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">

        <div className="mb-8">

          <p className="text-sm font-black uppercase tracking-wider text-gray-500">
            CLOTHTYM
          </p>

          <h1 className="mt-1 text-3xl font-black text-[#07152f] sm:text-4xl">
            Shopping Cart
          </h1>

          <p className="mt-2 text-gray-500">
            Review your products before checkout.
          </p>

        </div>

        {/* CART MESSAGE */}

        {cartMessage &&
          cartMessage !==
            "Please login to view your cart." && (
            <div className="mb-5 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-700">
              {cartMessage}
            </div>
          )}

        {/* EMPTY CART */}

        {cart.length === 0 ? (

          <div className="rounded-3xl border border-gray-200 bg-white p-10 text-center shadow-sm">

            <div className="text-7xl">
              🛒
            </div>

            <h2 className="mt-5 text-2xl font-black">
              Your cart is empty
            </h2>

            <p className="mt-2 text-gray-500">
              Add some products to your cart and they will appear here.
            </p>

            <Link
              href="/"
              className="mt-7 inline-block rounded-xl bg-[#07152f] px-7 py-3.5 font-black text-white"
            >
              Start Shopping →
            </Link>

          </div>

        ) : (

          <div className="grid gap-8 lg:grid-cols-[1fr_380px]">

            {/* CART ITEMS */}

            <section className="space-y-4">

              {cart.map((item, index) => (

                <div
                  key={
                    item.id ||
                    `${item.productId}-${item.size || ""}-${item.color || ""}-${index}`
                  }
                  className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5"
                >

                  <div className="flex gap-4">

                    {/* IMAGE */}

                    <div className="h-28 w-24 shrink-0 overflow-hidden rounded-2xl bg-gray-100 sm:h-36 sm:w-32">

                      {item.image ? (

                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />

                      ) : (

                        <div className="flex h-full items-center justify-center text-4xl">
                          👕
                        </div>

                      )}

                    </div>

                    {/* DETAILS */}

                    <div className="min-w-0 flex-1">

                      <div className="flex items-start justify-between gap-3">

                        <div>

                          <Link
                            href={`/product/${item.productId}`}
                            className="line-clamp-2 text-lg font-black text-[#07152f] hover:underline"
                          >
                            {item.name}
                          </Link>

                          {item.size && (
                            <p className="mt-2 text-sm font-semibold text-gray-500">
                              Size:

                              <span className="ml-1 font-black text-gray-800">
                                {item.size}
                              </span>
                            </p>
                          )}

                          {item.color && (
                            <p className="mt-1 text-sm font-semibold text-gray-500">
                              Colour:

                              <span className="ml-1 font-black text-gray-800">
                                {item.color}
                              </span>
                            </p>
                          )}

                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            removeItem(item)
                          }
                          disabled={updating}
                          className="rounded-lg px-2 py-1 text-xl font-black text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          ×
                        </button>

                      </div>

                      {/* DATABASE PRICE */}

                      <div className="mt-3 text-xl font-black text-[#07152f]">
                        ₹
                        {Number(
                          item.price
                        ).toLocaleString(
                          "en-IN"
                        )}
                      </div>

                      {/* QUANTITY */}

                      <div className="mt-4 flex items-center justify-between">

                        <div className="flex items-center overflow-hidden rounded-xl border-2 border-gray-200">

                          <button
                            type="button"
                            onClick={() =>
                              decreaseQuantity(
                                item
                              )
                            }
                            disabled={updating}
                            className="h-10 w-10 font-black hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            −
                          </button>

                          <span className="flex h-10 w-12 items-center justify-center border-x-2 border-gray-200 font-black">
                            {item.quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              increaseQuantity(
                                item
                              )
                            }
                            disabled={updating}
                            className="h-10 w-10 font-black hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            +
                          </button>

                        </div>

                        <div className="text-right">

                          <p className="text-xs font-bold text-gray-400">
                            ITEM TOTAL
                          </p>

                          <p className="text-lg font-black">
                            ₹
                            {(
                              Number(
                                item.itemTotal ??
                                  Number(
                                    item.price
                                  ) *
                                    item.quantity
                              )
                            ).toLocaleString(
                              "en-IN"
                            )}
                          </p>

                        </div>

                      </div>

                    </div>

                  </div>

                </div>

              ))}

              {/* CLEAR CART */}

              <button
                type="button"
                onClick={clearCart}
                disabled={updating}
                className="pt-2 font-bold text-red-600 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
              >
                Clear Cart
              </button>

            </section>

            {/* SUMMARY */}

            <aside className="h-fit rounded-3xl border border-gray-200 bg-white p-6 shadow-sm lg:sticky lg:top-24">

              <h2 className="text-2xl font-black text-[#07152f]">
                Order Summary
              </h2>

              <div className="mt-6 space-y-4">

                {/* SUBTOTAL */}

                <div className="flex justify-between text-gray-600">

                  <span>
                    Subtotal
                  </span>

                  <span className="font-bold text-gray-900">
                    ₹
                    {summary.subtotal.toLocaleString(
                      "en-IN"
                    )}
                  </span>

                </div>

                {/* DELIVERY */}

                <div className="flex justify-between text-gray-600">

                  <span>
                    Delivery
                  </span>

                  <span className="font-bold text-gray-900">

                    {summary.deliveryCharge ===
                    0
                      ? "FREE"
                      : `₹${summary.deliveryCharge}`}

                  </span>

                </div>

                {/* TOTAL */}

                <div className="border-t border-gray-200 pt-4">

                  <div className="flex justify-between">

                    <span className="text-lg font-black">
                      Total
                    </span>

                    <span className="text-2xl font-black text-[#07152f]">
                      ₹
                      {summary.total.toLocaleString(
                        "en-IN"
                      )}
                    </span>

                  </div>

                </div>

              </div>

              {/* FREE DELIVERY MESSAGE */}

              {summary.subtotal > 0 &&
                summary.subtotal <
                  1000 && (

                  <div className="mt-5 rounded-2xl bg-blue-50 p-4 text-sm font-semibold text-blue-800">

                    Add ₹
                    {(
                      1000 -
                      summary.subtotal
                    ).toLocaleString(
                      "en-IN"
                    )}{" "}
                    more to get FREE delivery.

                  </div>

                )}

              {summary.subtotal >=
                1000 && (

                <div className="mt-5 rounded-2xl bg-green-50 p-4 text-sm font-black text-green-700">
                  🎉 You unlocked FREE delivery!
                </div>

              )}

              {/* CHECKOUT BUTTON */}

              {!showCheckout && (

                <button
                  type="button"
                  onClick={() => {
                    setCheckoutMessage("");
                    setShowCheckout(
                      true
                    );
                  }}
                  className="mt-6 w-full rounded-xl bg-[#07152f] px-6 py-4 font-black text-white transition hover:opacity-90"
                >
                  Proceed to Checkout →
                </button>

              )}

              {/* CHECKOUT */}

              {showCheckout && (

                <div className="mt-6 border-t border-gray-200 pt-6">

                  <h3 className="text-xl font-black text-[#07152f]">
                    Checkout
                  </h3>

                  {/* ADDRESS */}

                  <label className="mt-5 block text-sm font-black">
                    Delivery Address
                  </label>

                  <textarea
                    value={address}
                    onChange={(event) =>
                      setAddress(
                        event.target.value
                      )
                    }
                    placeholder="Enter your complete delivery address"
                    rows={5}
                    className="mt-2 w-full rounded-xl border-2 border-gray-200 p-4 outline-none focus:border-[#07152f]"
                  />

                  {/* PAYMENT */}

                  <div className="mt-5 rounded-2xl border-2 border-[#07152f] bg-gray-50 p-4">

                    <p className="font-black">
                      💵 Cash on Delivery
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      Pay when your order is delivered.
                    </p>

                  </div>

                  {/* MESSAGE */}

                  {checkoutMessage && (

                    <div className="mt-4 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-700">
                      {checkoutMessage}
                    </div>

                  )}

                  {/* PLACE ORDER */}

                  <button
                    type="button"
                    onClick={placeOrder}
                    disabled={placingOrder}
                    className="mt-5 w-full rounded-xl bg-[#07152f] px-6 py-4 font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {placingOrder
                      ? "Placing Order..."
                      : `Place Order • ₹${summary.total.toLocaleString(
                          "en-IN"
                        )}`}
                  </button>

                  {/* BACK */}

                  <button
                    type="button"
                    onClick={() =>
                      setShowCheckout(
                        false
                      )
                    }
                    className="mt-3 w-full rounded-xl border-2 border-gray-300 px-6 py-3.5 font-black text-gray-700"
                  >
                    Back to Cart
                  </button>

                </div>

              )}

              {/* CONTINUE SHOPPING */}

              {!showCheckout && (
                <Link
                  href="/"
                  className="mt-3 block w-full rounded-xl border-2 border-[#07152f] px-6 py-3.5 text-center font-black text-[#07152f]"
                >
                  Continue Shopping
                </Link>
              )}

              {/* COD */}

              {!showCheckout && (

                <div className="mt-6 border-t border-gray-200 pt-5">

                  <p className="font-black">
                    💵 Cash on Delivery
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Pay when your order is delivered.
                  </p>

                </div>

              )}

            </aside>

          </div>

        )}

      </div>

    </main>
  );
}