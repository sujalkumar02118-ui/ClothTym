"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import "leaflet/dist/leaflet.css";

type CartItem = {
  id?: string;
  productId: string;
  quantity: number;
  price: number;
  size?: string | null;
  color?: string | null;
  product: {
    id: string;
    name: string;
    image?: string | null;
    images?: string[] | null;
    stock?: number;
  };
};

type Summary = {
  subtotal: number;
  deliveryCharge: number;
  total: number;
};

type AddressForm = {
  house: string;
  area: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
};

type Coordinates = {
  lat: number;
  lng: number;
};

const emptySummary: Summary = {
  subtotal: 0,
  deliveryCharge: 0,
  total: 0,
};

function normalizeImageUrl(value?: string | null) {
  if (!value) return "";

  const raw = value.trim().replace(/\\/g, "/");

  if (!raw) return "";

  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }

  if (
    raw.startsWith("data:") ||
    raw.startsWith("blob:")
  ) {
    return raw;
  }

  if (raw.startsWith("//")) {
    return `https:${raw}`;
  }

  return raw.startsWith("/")
    ? raw
    : `/${raw}`;
}

function getImageCandidates(item: CartItem) {
  return Array.from(
    new Set(
      [
        ...(Array.isArray(item.product.images)
          ? item.product.images
          : []),
        item.product.image,
      ]
        .map(normalizeImageUrl)
        .filter(Boolean)
    )
  );
}

function CartProductImage({
  item,
}: {
  item: CartItem;
}) {
  const [candidates, setCandidates] =
    useState<string[]>(() =>
      getImageCandidates(item)
    );

  const [index, setIndex] = useState(0);

  const refreshAttemptedRef =
    useRef(false);

  useEffect(() => {
    setCandidates(
      getImageCandidates(item)
    );

    setIndex(0);

    refreshAttemptedRef.current = false;
  }, [
    item.product.image,
    item.product.images?.join("|"),
  ]);

  const current = candidates[index];

  async function handleError() {
    if (index < candidates.length - 1) {
      setIndex((value) => value + 1);
      return;
    }

    if (refreshAttemptedRef.current) {
      setCandidates([]);
      return;
    }

    refreshAttemptedRef.current = true;

    try {
      const res = await fetch(
        `/api/products/${encodeURIComponent(
          item.productId
        )}`,
        {
          cache: "no-store",
        }
      );

      if (res.ok) {
        const data = await res.json();

        const product =
          data?.product ??
          data?.data ??
          data;

        const fresh = [
          ...(Array.isArray(product?.images)
            ? product.images
            : []),
          product?.image,
        ]
          .map(normalizeImageUrl)
          .filter(Boolean);

        const merged = Array.from(
          new Set([
            ...candidates,
            ...fresh,
          ])
        );

        if (
          merged.length >
          candidates.length
        ) {
          setCandidates(merged);

          setIndex(
            candidates.length
          );

          return;
        }
      }
    } catch {
      // Use fallback when refresh fails.
    }

    setCandidates([]);
  }

  if (!current) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-slate-100 text-4xl">
        👕
      </div>
    );
  }

  return (
    <img
      src={current}
      alt={
        item.product.name ||
        "Product"
      }
      className="w-full h-full rounded-xl object-cover bg-slate-100"
      loading="lazy"
      onError={() =>
        void handleError()
      }
    />
  );
}

export default function CartPage() {
  const router = useRouter();

  const [cart, setCart] =
    useState<CartItem[]>([]);

  const [summary, setSummary] =
    useState<Summary>(emptySummary);

  const [loading, setLoading] =
    useState(true);

  const [updating, setUpdating] =
    useState<string | null>(null);

  const [checkout, setCheckout] =
    useState(false);

  const [placing, setPlacing] =
    useState(false);

  const [checkoutMessage, setCheckoutMessage] =
    useState("");

  const [addressForm, setAddressForm] =
    useState<AddressForm>({
      house: "",
      area: "",
      landmark: "",
      city: "",
      state: "",
      pincode: "",
    });

  const [addressType, setAddressType] =
    useState<"HOME" | "OFFICE">("HOME");

  const [address, setAddress] =
    useState("");

  const [coordinates, setCoordinates] =
    useState<Coordinates | null>(null);

  const [locating, setLocating] =
    useState(false);

  const [locationMessage, setLocationMessage] =
    useState("");

  const [locationError, setLocationError] =
    useState("");

  const mapContainerRef =
    useRef<HTMLDivElement | null>(null);

  const mapInstanceRef =
    useRef<any>(null);

  const markerInstanceRef =
    useRef<any>(null);

  const leafletLoadedRef =
    useRef(false);

  useEffect(() => {
    const parts = [
      addressForm.house,
      addressForm.area,
      addressForm.landmark,
      addressForm.city,
      addressForm.state,
      addressForm.pincode,
    ].filter(Boolean);

    setAddress(
      parts.join(", ")
    );
  }, [addressForm]);

  const updateAddressField = (
    field: keyof AddressForm,
    value: string
  ) =>
    setAddressForm((previous) => ({
      ...previous,
      [field]: value,
    }));

  async function loadCart() {
    try {
      const migrationKey =
        "clothtym_cart_migration_v1";

      const oldKey =
        "clothtym_cart";

      if (
        !localStorage.getItem(
          migrationKey
        )
      ) {
        const old = JSON.parse(
          localStorage.getItem(
            oldKey
          ) || "[]"
        );

        if (
          Array.isArray(old) &&
          old.length
        ) {
          for (const item of old) {
            if (!item?.productId)
              continue;

            await fetch(
              "/api/cart",
              {
                method: "POST",
                headers: {
                  "Content-Type":
                    "application/json",
                },
                body: JSON.stringify({
                  productId:
                    item.productId,
                  quantity: Math.min(
                    100,
                    Math.max(
                      1,
                      Number(
                        item.quantity
                      ) || 1
                    )
                  ),
                  size:
                    item.size || null,
                  color:
                    item.color || null,
                }),
              }
            );
          }
        }

        localStorage.setItem(
          migrationKey,
          "1"
        );
      }

      const res = await fetch(
        "/api/cart",
        {
          cache: "no-store",
        }
      );

      const data =
        await res.json();

      if (res.status === 401) {
        setCart([]);
        setSummary(
          emptySummary
        );
        return;
      }

      if (!res.ok) {
        throw new Error(
          data?.error ||
            "Failed to load cart"
        );
      }

      setCart(
        data.cart || []
      );

      setSummary(
        data.summary ||
          emptySummary
      );
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCart();
  }, []);

  async function refreshCart() {
    const res = await fetch(
      "/api/cart",
      {
        cache: "no-store",
      }
    );

    const data =
      await res.json();

    if (res.ok) {
      setCart(
        data.cart || []
      );

      setSummary(
        data.summary ||
          emptySummary
      );
    }
  }

  async function updateQuantity(
    item: CartItem,
    quantity: number
  ) {
    if (
      quantity < 1 ||
      quantity > 100
    ) {
      return;
    }

    if (
      typeof item.product.stock ===
        "number" &&
      quantity >
        item.product.stock
    ) {
      return;
    }

    const key = `${item.productId}-${
      item.size || ""
    }-${item.color || ""}`;

    setUpdating(key);

    try {
      const res = await fetch(
        "/api/cart",
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            productId:
              item.productId,
            quantity,
            size:
              item.size || null,
            color:
              item.color || null,
          }),
        }
      );

      if (!res.ok) {
        const data =
          await res
            .json()
            .catch(() => ({}));

        throw new Error(
          data?.error ||
            "Unable to update"
        );
      }

      await refreshCart();
    } catch (error: any) {
      alert(
        error?.message ||
          "Unable to update cart"
      );
    } finally {
      setUpdating(null);
    }
  }

  async function removeItem(
    item: CartItem
  ) {
    try {
      const res = await fetch(
        "/api/cart",
        {
          method: "DELETE",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            productId:
              item.productId,
            size:
              item.size || null,
            color:
              item.color || null,
          }),
        }
      );

      if (!res.ok) {
        throw new Error(
          "Unable to remove item"
        );
      }

      await refreshCart();
    } catch (error: any) {
      alert(
        error?.message ||
          "Unable to remove item"
      );
    }
  }

  async function clearCart() {
    if (
      !confirm(
        "Clear your entire cart?"
      )
    ) {
      return;
    }

    try {
      const res = await fetch(
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

      if (!res.ok) {
        throw new Error(
          "Unable to clear cart"
        );
      }

      setCart([]);
      setSummary(emptySummary);

      localStorage.removeItem(
        "clothtym_cart"
      );
    } catch (error: any) {
      alert(
        error?.message ||
          "Unable to clear cart"
      );
    }
  }

  function findPincode(
    data: any
  ): string {
    const wanted =
      /^(postcode|postCode|postalCode|postalcode|zip|zipCode|zipcode|pincode|pin)$/i;

    const walk = (
      value: any,
      depth = 0
    ): string => {
      if (
        !value ||
        depth > 6 ||
        typeof value !==
          "object"
      ) {
        return "";
      }

      for (const [
        key,
        val,
      ] of Object.entries(value)) {
        if (
          wanted.test(key) &&
          typeof val ===
            "string" &&
          /^\d{6}$/.test(
            val.trim()
          )
        ) {
          return val.trim();
        }
      }

      for (const val of Object.values(
        value
      )) {
        const result = walk(
          val,
          depth + 1
        );

        if (result) {
          return result;
        }
      }

      return "";
    };

    return walk(data);
  }

  async function reverseGeocode(
    coords: Coordinates
  ) {
    let detected = {
      area: "",
      city: "",
      state: "",
      pincode: "",
    };

    try {
      const url =
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.lat}&lon=${coords.lng}&zoom=18&addressdetails=1&accept-language=en`;

      const response =
        await fetch(url, {
          headers: {
            Accept:
              "application/json",
          },
        });

      if (response.ok) {
        const data =
          await response.json();

        const a =
          data?.address || {};

        detected.area =
          a.suburb ||
          a.neighbourhood ||
          a.quarter ||
          a.residential ||
          a.hamlet ||
          a.village ||
          a.town ||
          "";

        detected.city =
          a.city ||
          a.town ||
          a.village ||
          a.municipality ||
          a.city_district ||
          a.district ||
          "";

        detected.state =
          a.state ||
          a.state_district ||
          "";

        detected.pincode =
          findPincode(data);
      }
    } catch {}

    if (
      !detected.area ||
      !detected.city ||
      !detected.state ||
      !detected.pincode
    ) {
      try {
        const response =
          await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${coords.lat}&longitude=${coords.lng}&localityLanguage=en`
          );

        if (response.ok) {
          const data =
            await response.json();

          detected.area ||=
            data?.locality ||
            data?.localityInfo
              ?.administrative?.[3]
              ?.name ||
            data?.city ||
            "";

          detected.city ||=
            data?.city ||
            data?.principalSubdivision ||
            "";

          detected.state ||=
            data?.principalSubdivision ||
            "";

          detected.pincode ||=
            findPincode(data);
        }
      } catch {}
    }

    setAddressForm(
      (previous) => ({
        ...previous,
        area:
          detected.area ||
          previous.area,
        city:
          detected.city ||
          previous.city,
        state:
          detected.state ||
          previous.state,
        pincode:
          detected.pincode ||
          previous.pincode,
      })
    );

    if (detected.pincode) {
      setLocationMessage(
        "Location detected. Address details and pincode were filled automatically."
      );
    } else {
      setLocationMessage(
        "Location detected. Please check or enter the pincode manually."
      );
    }
  }
  async function getCurrentLocation() {
    if (!navigator.geolocation) {
      setLocationError(
        "Your browser does not support location."
      );
      return;
    }

    setLocating(true);
    setLocationError("");
    setLocationMessage("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        setCoordinates(coords);

        await reverseGeocode(coords);

        setLocating(false);
      },
      (error) => {
        console.error(
          "Location error:",
          error
        );

        setLocating(false);

        if (
          error.code ===
          error.PERMISSION_DENIED
        ) {
          setLocationError(
            "Location permission was denied. Please allow location access or enter the address manually."
          );
        } else if (
          error.code ===
          error.TIMEOUT
        ) {
          setLocationError(
            "Location request timed out. Please try again."
          );
        } else {
          setLocationError(
            "Unable to detect your location."
          );
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000,
      }
    );
  }

  useEffect(() => {
    if (!checkout) return;
    if (!mapContainerRef.current) return;

    let cancelled = false;

    async function initializeMap() {
      try {
        const leaflet =
          await import("leaflet");

        if (cancelled) return;
        if (!mapContainerRef.current)
          return;

        if (!mapInstanceRef.current) {
          mapInstanceRef.current =
            leaflet
              .map(
                mapContainerRef.current
              )
              .setView(
                coordinates
                  ? [
                      coordinates.lat,
                      coordinates.lng,
                    ]
                  : [25.5941, 85.1376],
                coordinates ? 16 : 12
              );

          leaflet
            .tileLayer(
              "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
              {
                attribution:
                  "&copy; OpenStreetMap contributors",
              }
            )
            .addTo(
              mapInstanceRef.current
            );

          leafletLoadedRef.current =
            true;
        }

        if (coordinates) {
          mapInstanceRef.current.setView(
            [
              coordinates.lat,
              coordinates.lng,
            ],
            16
          );

          if (
            markerInstanceRef.current
          ) {
            markerInstanceRef.current.setLatLng(
              [
                coordinates.lat,
                coordinates.lng,
              ]
            );
          } else {
            markerInstanceRef.current =
              leaflet
                .marker([
                  coordinates.lat,
                  coordinates.lng,
                ])
                .addTo(
                  mapInstanceRef.current
                );

            markerInstanceRef.current.bindPopup(
              "Your delivery location"
            );
          }
        }

        setTimeout(() => {
          mapInstanceRef.current?.invalidateSize();
        }, 200);
      } catch (error) {
        console.error(
          "Map error:",
          error
        );
      }
    }

    void initializeMap();

    return () => {
      cancelled = true;
    };
  }, [checkout, coordinates]);

  useEffect(() => {
    if (!checkout) return;

    if (!coordinates) {
      void getCurrentLocation();
    }
  }, [checkout]);

  function validateCheckout() {
    if (!addressForm.house.trim()) {
      setCheckoutMessage(
        "Please enter your house/flat details."
      );
      return false;
    }

    if (!addressForm.area.trim()) {
      setCheckoutMessage(
        "Please enter your area."
      );
      return false;
    }

    if (!addressForm.city.trim()) {
      setCheckoutMessage(
        "Please enter your city."
      );
      return false;
    }

    if (!addressForm.state.trim()) {
      setCheckoutMessage(
        "Please enter your state."
      );
      return false;
    }

    if (
      !/^\d{6}$/.test(
        addressForm.pincode.trim()
      )
    ) {
      setCheckoutMessage(
        "Please enter a valid 6-digit pincode."
      );
      return false;
    }

    return true;
  }

  async function placeOrder() {
    setCheckoutMessage("");

    if (!cart.length) {
      setCheckoutMessage(
        "Your cart is empty."
      );
      return;
    }

    if (!validateCheckout()) {
      return;
    }

    setPlacing(true);

    try {
      const finalAddress =
        [
          addressForm.house,
          addressForm.area,
          addressForm.landmark,
          addressForm.city,
          addressForm.state,
          addressForm.pincode,
        ]
          .filter(Boolean)
          .join(", ");

      const response =
        await fetch(
          "/api/orders",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              items: cart.map(
                (item) => ({
                  productId:
                    item.productId,
                  quantity:
                    item.quantity,
                  size:
                    item.size ||
                    null,
                  color:
                    item.color ||
                    null,
                })
              ),
              address: finalAddress,
              pincode:
                addressForm.pincode,
              city:
                addressForm.city,
              state:
                addressForm.state,
              coordinates,
              paymentMethod:
                "COD",
            }),
          }
        );

      const data =
        await response
          .json()
          .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to place order."
        );
      }

      setCheckout(false);
      setCheckoutMessage("");

      setCart([]);
      setSummary(emptySummary);

      localStorage.removeItem(
        "clothtym_cart"
      );

      const orderId =
        data?.order?.id ||
        data?.orderId ||
        data?.id;

      if (orderId) {
        router.push(
          `/orders/${orderId}`
        );
      } else {
        router.push(
          "/orders"
        );
      }
    } catch (error: any) {
      console.error(
        "Order error:",
        error
      );

      setCheckoutMessage(
        error?.message ||
          "Unable to place order. Please try again."
      );
    } finally {
      setPlacing(false);
    }
  }

  const totalItems =
    cart.reduce(
      (total, item) =>
        total +
        Number(item.quantity || 0),
      0
    );

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="text-2xl font-extrabold tracking-tight text-gray-900"
          >
            Cloth
            <span className="text-pink-600">
              Tym
            </span>
          </Link>

          <Link
            href="/"
            className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
          >
            Continue Shopping
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {checkoutMessage && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {checkoutMessage}
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">
            My Cart
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            {totalItems}{" "}
            {totalItems === 1
              ? "item"
              : "items"}{" "}
            in your cart
          </p>
        </div>

        {loading ? (
          <div className="rounded-2xl border bg-white p-12 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-pink-600" />

            <p className="mt-4 text-sm font-medium text-gray-500">
              Loading cart...
            </p>
          </div>
        ) : cart.length === 0 ? (
          <div className="rounded-2xl border bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 text-4xl">
              🛒
            </div>

            <h2 className="mt-5 text-2xl font-bold text-gray-900">
              Your cart is empty
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
              Add some products to your cart and they will appear here.
            </p>

            <Link
              href="/"
              className="mt-7 inline-flex rounded-xl bg-black px-7 py-3 text-sm font-bold text-white transition hover:bg-gray-800"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">
                  Cart Items
                </h2>

                <button
                  type="button"
                  onClick={() =>
                    void clearCart()
                  }
                  className="text-sm font-semibold text-red-500 hover:text-red-600"
                >
                  Clear Cart
                </button>
              </div>

              {cart.map(
                (item, index) => {
                  const key = `${item.productId}-${item.size || ""}-${item.color || ""}-${index}`;

                  const updateKey = `${item.productId}-${item.size || ""}-${item.color || ""}`;

                  const itemTotal =
                    Number(
                      item.price || 0
                    ) *
                    Number(
                      item.quantity || 0
                    );

                  return (
                    <article
                      key={key}
                      className="rounded-2xl border bg-white p-4 shadow-sm"
                    >
                      <div className="flex gap-4">
                        <Link
                          href={`/product/${item.productId}`}
                          className="h-28 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100 sm:h-32 sm:w-28"
                        >
                          <CartProductImage
                            item={item}
                          />
                        </Link>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <Link
                              href={`/product/${item.productId}`}
                              className="line-clamp-2 text-base font-bold text-gray-900 hover:text-pink-600 sm:text-lg"
                            >
                              {
                                item
                                  .product
                                  .name
                              }
                            </Link>

                            <button
                              type="button"
                              onClick={() =>
                                void removeItem(
                                  item
                                )
                              }
                              className="flex-shrink-0 text-sm font-semibold text-red-500 hover:text-red-600"
                            >
                              Remove
                            </button>
                          </div>

                          {item.size && (
                            <p className="mt-2 text-sm text-gray-500">
                              Size:{" "}
                              <span className="font-semibold text-gray-700">
                                {item.size}
                              </span>
                            </p>
                          )}

                          {item.color && (
                            <p className="text-sm text-gray-500">
                              Colour:{" "}
                              <span className="font-semibold text-gray-700">
                                {item.color}
                              </span>
                            </p>
                          )}

                          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-lg font-extrabold text-gray-900">
                                ₹
                                {Number(
                                  item.price
                                ).toLocaleString(
                                  "en-IN"
                                )}
                              </p>
                            </div>

                            <div className="flex items-center overflow-hidden rounded-xl border border-gray-300">
                              <button
                                type="button"
                                disabled={
                                  updating ===
                                    updateKey ||
                                  item.quantity <=
                                    1
                                }
                                onClick={() =>
                                  void updateQuantity(
                                    item,
                                    item.quantity -
                                      1
                                  )
                                }
                                className="h-10 w-10 text-lg font-bold hover:bg-gray-100 disabled:opacity-40"
                              >
                                −
                              </button>

                              <span className="flex h-10 min-w-10 items-center justify-center border-x border-gray-300 px-2 text-sm font-bold">
                                {updating ===
                                updateKey
                                  ? "..."
                                  : item.quantity}
                              </span>

                              <button
                                type="button"
                                disabled={
                                  updating ===
                                    updateKey ||
                                  (typeof item
                                    .product
                                    .stock ===
                                    "number" &&
                                    item.quantity >=
                                      item
                                        .product
                                        .stock)
                                }
                                onClick={() =>
                                  void updateQuantity(
                                    item,
                                    item.quantity +
                                      1
                                  )
                                }
                                className="h-10 w-10 text-lg font-bold hover:bg-gray-100 disabled:opacity-40"
                              >
                                +
                              </button>
                            </div>

                            <p className="text-base font-extrabold text-gray-900">
                              ₹
                              {itemTotal.toLocaleString(
                                "en-IN"
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                }
              )}
            </section>

            <aside className="h-fit rounded-2xl border bg-white p-5 shadow-sm lg:sticky lg:top-5">
              <h2 className="text-xl font-extrabold text-gray-900">
                Price Details
              </h2>

              <div className="mt-5 space-y-4 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>
                    Price (
                    {totalItems}{" "}
                    items)
                  </span>

                  <span className="font-semibold text-gray-900">
                    ₹
                    {summary.subtotal.toLocaleString(
                      "en-IN"
                    )}
                  </span>
                </div>

                <div className="flex justify-between text-gray-600">
                  <span>
                    Delivery Charges
                  </span>

                  <span
                    className={
                      summary.deliveryCharge ===
                      0
                        ? "font-bold text-green-600"
                        : "font-semibold text-gray-900"
                    }
                  >
                    {summary.deliveryCharge ===
                    0
                      ? "FREE"
                      : `₹${summary.deliveryCharge.toLocaleString(
                          "en-IN"
                        )}`}
                  </span>
                </div>

                {summary.subtotal >
                  0 &&
                  summary.subtotal <
                    1000 && (
                    <div className="rounded-xl bg-pink-50 px-3 py-3 text-xs font-semibold text-pink-700">
                      Add ₹
                      {(
                        1000 -
                        summary.subtotal
                      ).toLocaleString(
                        "en-IN"
                      )}{" "}
                      more to get free delivery.
                    </div>
                  )}

                <div className="border-t pt-4">
                  <div className="flex justify-between">
                    <span className="text-base font-bold text-gray-900">
                      Total Amount
                    </span>

                    <span className="text-xl font-extrabold text-gray-900">
                      ₹
                      {summary.total.toLocaleString(
                        "en-IN"
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setCheckoutMessage("");
                  setCheckout(true);
                }}
                className="mt-6 w-full rounded-xl bg-black px-5 py-3.5 text-sm font-extrabold text-white transition hover:bg-gray-800"
              >
                Proceed to Checkout
              </button>

              <div className="mt-5 space-y-2 text-xs text-gray-500">
                <p>✓ Secure checkout</p>
                <p>✓ Cash on Delivery available</p>
                <p>✓ Fast local delivery</p>
              </div>
            </aside>
          </div>
        )}
      </div>

      {checkout && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 px-4 py-6">
          <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h2 className="text-xl font-extrabold text-gray-900">
                  Delivery Details
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  Enter your delivery address.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setCheckout(false)
                }
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-xl hover:bg-gray-200"
              >
                ×
              </button>
            </div>

            <div className="space-y-6 p-5 sm:p-6">
              <section>
                <h3 className="mb-4 text-base font-bold text-gray-900">
                  Address
                </h3>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                      House / Flat / Building
                    </label>

                    <input
                      value={
                        addressForm.house
                      }
                      onChange={(e) =>
                        updateAddressField(
                          "house",
                          e.target.value
                        )
                      }
                      placeholder="House no., flat no., building"
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                      Area
                    </label>

                    <input
                      value={
                        addressForm.area
                      }
                      onChange={(e) =>
                        updateAddressField(
                          "area",
                          e.target.value
                        )
                      }
                      placeholder="Area / locality"
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                      Landmark
                    </label>

                    <input
                      value={
                        addressForm.landmark
                      }
                      onChange={(e) =>
                        updateAddressField(
                          "landmark",
                          e.target.value
                        )
                      }
                      placeholder="Nearby landmark"
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                      City
                    </label>

                    <input
                      value={
                        addressForm.city
                      }
                      onChange={(e) =>
                        updateAddressField(
                          "city",
                          e.target.value
                        )
                      }
                      placeholder="City"
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                      State
                    </label>

                    <input
                      value={
                        addressForm.state
                      }
                      onChange={(e) =>
                        updateAddressField(
                          "state",
                          e.target.value
                        )
                      }
                      placeholder="State"
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                      Pincode
                    </label>

                    <input
                      value={
                        addressForm.pincode
                      }
                      onChange={(e) =>
                        updateAddressField(
                          "pincode",
                          e.target.value.replace(
                            /\D/g,
                            ""
                          )
                        )
                      }
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="6-digit pincode"
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black"
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border bg-gray-50 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">
                      Use Current Location
                    </h3>

                    <p className="mt-1 text-xs text-gray-500">
                      Automatically detect your delivery area.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      void getCurrentLocation()
                    }
                    disabled={locating}
                    className="rounded-xl bg-black px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                  >
                    {locating
                      ? "Detecting..."
                      : "Use Current Location"}
                  </button>
                </div>

                {locationMessage && (
                  <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-xs font-semibold text-green-700">
                    ✓ {locationMessage}
                  </p>
                )}

                {locationError && (
                  <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                    {locationError}
                  </p>
                )}

                <div
                  ref={mapContainerRef}
                  className="mt-4 h-64 overflow-hidden rounded-xl border bg-gray-200"
                />
              </section>

              <section>
                <h3 className="mb-3 text-base font-bold text-gray-900">
                  Address Type
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setAddressType(
                        "HOME"
                      )
                    }
                    className={`rounded-xl border px-4 py-3 text-sm font-bold ${
                      addressType ===
                      "HOME"
                        ? "border-black bg-black text-white"
                        : "border-gray-300 bg-white text-gray-700"
                    }`}
                  >
                    🏠 Home
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setAddressType(
                        "OFFICE"
                      )
                    }
                    className={`rounded-xl border px-4 py-3 text-sm font-bold ${
                      addressType ===
                      "OFFICE"
                        ? "border-black bg-black text-white"
                        : "border-gray-300 bg-white text-gray-700"
                    }`}
                  >
                    🏢 Office
                  </button>
                </div>
              </section>

              <section className="rounded-2xl border p-4">
                <h3 className="text-sm font-bold text-gray-900">
                  Payment Method
                </h3>

                <div className="mt-3 flex items-center justify-between rounded-xl border-2 border-black bg-gray-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      Cash on Delivery
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Pay when your order is delivered.
                    </p>
                  </div>

                  <span className="rounded-full bg-black px-3 py-1 text-xs font-bold text-white">
                    COD
                  </span>
                </div>
              </section>

              <section className="rounded-2xl bg-gray-50 p-4">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>
                    Items
                  </span>

                  <span>
                    {totalItems}
                  </span>
                </div>

                <div className="mt-2 flex justify-between text-sm text-gray-600">
                  <span>
                    Delivery
                  </span>

                  <span>
                    {summary.deliveryCharge ===
                    0
                      ? "FREE"
                      : `₹${summary.deliveryCharge}`}
                  </span>
                </div>

                <div className="mt-4 flex justify-between border-t pt-4">
                  <span className="font-bold text-gray-900">
                    Total Amount
                  </span>

                  <span className="text-xl font-extrabold text-gray-900">
                    ₹
                    {summary.total.toLocaleString(
                      "en-IN"
                    )}
                  </span>
                </div>
              </section>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() =>
                    setCheckout(false)
                  }
                  disabled={placing}
                  className="rounded-xl border border-gray-300 px-6 py-3 text-sm font-bold text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() =>
                    void placeOrder()
                  }
                  disabled={placing}
                  className="rounded-xl bg-black px-7 py-3 text-sm font-extrabold text-white hover:bg-gray-800 disabled:bg-gray-400"
                >
                  {placing
                    ? "Placing Order..."
                    : `Place Order • ₹${summary.total.toLocaleString(
                        "en-IN"
                      )}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}