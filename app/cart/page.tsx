"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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

type AddressForm = {
  house: string;
  area: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
};

type Coordinates = {
  latitude: number;
  longitude: number;
};

type ReverseAddress = {
  area: string;
  city: string;
  state: string;
  pincode: string;
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

  /*
   * ---------------------------------------------------------
   * DELIVERY ADDRESS
   * ---------------------------------------------------------
   */

  const [addressForm, setAddressForm] =
    useState<AddressForm>({
      house: "",
      area: "",
      landmark: "",
      city: "",
      state: "",
      pincode: "",
    });

  const [coordinates, setCoordinates] =
    useState<Coordinates | null>(null);

  const [locating, setLocating] =
    useState(false);

  const [locationMessage, setLocationMessage] =
    useState("");

  const [locationError, setLocationError] =
    useState("");

  const [addressType, setAddressType] =
    useState<"HOME" | "OFFICE">("HOME");

  const [address, setAddress] =
    useState("");

  const [placingOrder, setPlacingOrder] =
    useState(false);

  const [checkoutMessage, setCheckoutMessage] =
    useState("");

  const [cartMessage, setCartMessage] =
    useState("");

  /*
   * ---------------------------------------------------------
   * LEAFLET MAP REFS
   * ---------------------------------------------------------
   */

  const mapContainerRef =
    useRef<HTMLDivElement | null>(null);

  const mapRef =
    useRef<L.Map | null>(null);

  const markerRef =
    useRef<L.Marker | null>(null);

  /*
   * Prevent automatic GPS from running more than
   * once for the current checkout opening.
   */
  const locationAttemptedRef =
    useRef(false);

  /* =========================================================
     KEEP FINAL ADDRESS STRING UPDATED
  ========================================================= */

  useEffect(() => {
    const parts = [
      addressForm.house,
      addressForm.area,
      addressForm.landmark,
      addressForm.city,
      addressForm.state,
      addressForm.pincode,
    ].filter(
      (value) => value.trim() !== ""
    );

    setAddress(parts.join(", "));
  }, [addressForm]);

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
                  typeof oldItem.productId !==
                    "string" ||
                  oldItem.productId.trim() === ""
                ) {
                  migrationSuccessful = false;
                  continue;
                }

                const quantity =
                  typeof oldItem.quantity ===
                    "number" &&
                  Number.isInteger(
                    oldItem.quantity
                  ) &&
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
          Number(data?.summary?.subtotal) ||
          0,
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
     REFRESH CART
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
          Number(data?.summary?.subtotal) ||
          0,
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

  async function increaseQuantity(
    item: CartItem
  ) {
    await updateQuantity(
      item,
      item.quantity + 1
    );
  }

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
     ADDRESS FIELD UPDATE
  ========================================================= */

  function updateAddressField(
    field: keyof AddressForm,
    value: string
  ) {
    setAddressForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  /* =========================================================
     REVERSE GEOCODING
  ========================================================= */

  async function reverseGeocode(
    latitude: number,
    longitude: number
  ): Promise<ReverseAddress> {
    const url = new URL(
      "https://api.bigdatacloud.net/data/reverse-geocode-client"
    );

    url.searchParams.set(
      "latitude",
      String(latitude)
    );

    url.searchParams.set(
      "longitude",
      String(longitude)
    );

    url.searchParams.set(
      "localityLanguage",
      "en"
    );

    const response = await fetch(
      url.toString(),
      {
        method: "GET",
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error(
        "Address could not be detected."
      );
    }

    const data = await response.json();

    const detectedArea =
      data?.locality ||
      data?.localityInfo?.administrative?.[
        3
      ]?.name ||
      data?.city ||
      data?.principalSubdivision ||
      "";

    const detectedCity =
      data?.city ||
      data?.locality ||
      data?.localityInfo?.administrative?.[
        2
      ]?.name ||
      "";

    const detectedState =
      data?.principalSubdivision ||
      data?.localityInfo?.administrative?.[
        1
      ]?.name ||
      "";

    const detectedPincode =
      data?.postcode ||
      data?.postalCode ||
      "";

    return {
      area: String(
        detectedArea || ""
      ),
      city: String(
        detectedCity || ""
      ),
      state: String(
        detectedState || ""
      ),
      pincode: String(
        detectedPincode || ""
      ),
    };
  }

  /* =========================================================
     UPDATE ADDRESS FROM COORDINATES
  ========================================================= */

  async function updateAddressFromCoordinates(
    latitude: number,
    longitude: number,
    showMessage = true
  ) {
    try {
      if (showMessage) {
        setLocationMessage(
          "Finding address for this location..."
        );
        setLocationError("");
      }

      const detected =
        await reverseGeocode(
          latitude,
          longitude
        );

      setAddressForm((previous) => ({
        ...previous,

        /*
         * House and landmark are always manual.
         *
         * Area/City/State/Pincode are updated from
         * the selected GPS location.
         */
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
      }));

      if (showMessage) {
        if (detected.pincode) {
          setLocationMessage(
            "✓ Location detected. Address and pincode updated."
          );
        } else {
          setLocationMessage(
            "✓ Location detected. Please enter your pincode if it is not shown."
          );
        }
      }

      return detected;
    } catch (error) {
      console.error(
        "REVERSE GEOCODE ERROR:",
        error
      );

      if (showMessage) {
        setLocationError(
          "Location detected, but address details could not be fetched. Please enter them manually."
        );

        setLocationMessage("");
      }

      return null;
    }
  }

  /* =========================================================
     CURRENT LOCATION
  ========================================================= */

  async function useCurrentLocation() {
    setLocationError("");
    setLocationMessage("");

    if (
      typeof window === "undefined" ||
      !navigator.geolocation
    ) {
      setLocationError(
        "Location is not supported by this browser."
      );
      return;
    }

    try {
      setLocating(true);

      setLocationMessage(
        "Requesting your current location..."
      );

      const position =
        await new Promise<GeolocationPosition>(
          (resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
              resolve,
              reject,
              {
                enableHighAccuracy: true,
                timeout: 20000,
                maximumAge: 0,
              }
            );
          }
        );

      const latitude =
        position.coords.latitude;

      const longitude =
        position.coords.longitude;

      setCoordinates({
        latitude,
        longitude,
      });

      setLocationMessage(
        "Location detected. Finding your address..."
      );

      await updateAddressFromCoordinates(
        latitude,
        longitude,
        true
      );
    } catch (error) {
      console.error(
        "CURRENT LOCATION ERROR:",
        error
      );

      let message =
        "Unable to detect your location.";

      if (
        error &&
        typeof error === "object" &&
        "code" in error
      ) {
        const locationErrorObject =
          error as GeolocationPositionError;

        if (
          locationErrorObject.code ===
          1
        ) {
          message =
            "Location permission was denied. Please allow location access and try again.";
        } else if (
          locationErrorObject.code ===
          2
        ) {
          message =
            "Your current location is unavailable. Please try again.";
        } else if (
          locationErrorObject.code ===
          3
        ) {
          message =
            "Location request timed out. Please try again.";
        }
      } else if (
        error instanceof Error
      ) {
        message = error.message;
      }

      setLocationError(message);
      setLocationMessage("");
    } finally {
      setLocating(false);
    }
  }

  /* =========================================================
     AUTOMATIC GPS WHEN CHECKOUT OPENS
  ========================================================= */

  async function openCheckout() {
    setCheckoutMessage("");
    setShowCheckout(true);

    /*
     * Browser permission request must originate from
     * a user interaction. Because this function runs
     * directly from the Proceed to Checkout button,
     * the browser can show the location permission prompt.
     */
    if (!locationAttemptedRef.current) {
      locationAttemptedRef.current = true;
      await useCurrentLocation();
    }
  }

  /* =========================================================
     LEAFLET MAP
  ========================================================= */

  useEffect(() => {
    if (
      !showCheckout ||
      !coordinates ||
      !mapContainerRef.current
    ) {
      return;
    }

    /*
     * Initialize map only once.
     */
    if (!mapRef.current) {
      const map = L.map(
        mapContainerRef.current,
        {
          center: [
            coordinates.latitude,
            coordinates.longitude,
          ],
          zoom: 16,
          zoomControl: false,
          attributionControl: true,
        }
      );

      /*
       * Premium-looking standard OSM map layer.
       */
      L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          maxZoom: 20,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>',
        }
      ).addTo(map);

      /*
       * Put zoom controls in bottom-right.
       */
      L.control
        .zoom({
          position: "bottomright",
        })
        .addTo(map);

      /*
       * Custom premium marker.
       * This avoids Leaflet's default icon-path issue
       * in Next.js builds.
       */
      const markerIcon =
        L.divIcon({
          className:
            "clothtym-map-marker-wrapper",
          html: `
            <div style="
              width:42px;
              height:42px;
              border-radius:50% 50% 50% 0;
              background:#07152f;
              border:4px solid white;
              box-shadow:0 5px 18px rgba(0,0,0,.30);
              transform:rotate(-45deg);
              display:flex;
              align-items:center;
              justify-content:center;
            ">
              <div style="
                width:12px;
                height:12px;
                border-radius:50%;
                background:white;
                transform:rotate(45deg);
              "></div>
            </div>
          `,
          iconSize: [
            42,
            42,
          ],
          iconAnchor: [
            21,
            42,
          ],
        });

      const marker =
        L.marker(
          [
            coordinates.latitude,
            coordinates.longitude,
          ],
          {
            draggable: true,
            icon: markerIcon,
          }
        ).addTo(map);

      marker.bindPopup(
        `
          <div style="
            min-width:180px;
            font-family:Arial,sans-serif;
          ">
            <strong style="
              color:#07152f;
              font-size:14px;
            ">
              Delivery Location
            </strong>
            <div style="
              margin-top:5px;
              color:#666;
              font-size:12px;
            ">
              Drag the pin to adjust your location.
            </div>
          </div>
        `
      );

      /*
       * Dragging marker changes the delivery location.
       */
      marker.on(
        "dragend",
        async () => {
          const position =
            marker.getLatLng();

          const nextCoordinates = {
            latitude:
              position.lat,
            longitude:
              position.lng,
          };

          setCoordinates(
            nextCoordinates
          );

          setLocating(true);
          setLocationError("");
          setLocationMessage(
            "Pin moved. Updating address..."
          );

          await updateAddressFromCoordinates(
            position.lat,
            position.lng,
            true
          );

          setLocating(false);
        }
      );

      /*
       * Clicking anywhere on the map moves the
       * draggable marker to that point.
       */
      map.on(
        "click",
        async (event) => {
          marker.setLatLng(
            event.latlng
          );

          const nextCoordinates = {
            latitude:
              event.latlng.lat,
            longitude:
              event.latlng.lng,
          };

          setCoordinates(
            nextCoordinates
          );

          setLocating(true);
          setLocationError("");
          setLocationMessage(
            "Location changed. Updating address..."
          );

          await updateAddressFromCoordinates(
            event.latlng.lat,
            event.latlng.lng,
            true
          );

          setLocating(false);
        }
      );

      mapRef.current = map;
      markerRef.current =
        marker;
    } else {
      /*
       * If coordinates changed because of GPS or
       * another update, move the existing map.
       */
      const map = mapRef.current;
      const marker =
        markerRef.current;

      map.setView(
        [
          coordinates.latitude,
          coordinates.longitude,
        ],
        Math.max(
          map.getZoom(),
          16
        ),
        {
          animate: true,
        }
      );

      if (marker) {
        marker.setLatLng([
          coordinates.latitude,
          coordinates.longitude,
        ]);
      }
    }

    /*
     * Leaflet needs a resize refresh after the
     * container becomes visible.
     */
    const resizeTimer =
      window.setTimeout(() => {
        mapRef.current?.invalidateSize();
      }, 150);

    return () => {
      window.clearTimeout(
        resizeTimer
      );
    };
  }, [showCheckout, coordinates]);

  /*
   * Destroy Leaflet map when component unmounts.
   */
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  /* =========================================================
     PLACE ORDER
  ========================================================= */

  async function placeOrder() {
    if (cart.length === 0) {
      setCheckoutMessage(
        "Your cart is empty."
      );
      return;
    }

    const finalAddress = [
      addressForm.house,
      addressForm.area,
      addressForm.landmark,
      addressForm.city,
      addressForm.state,
      addressForm.pincode,
    ]
      .map((value) => value.trim())
      .filter(Boolean)
      .join(", ");

    if (
      !addressForm.house.trim() ||
      !addressForm.area.trim() ||
      !addressForm.city.trim() ||
      !addressForm.state.trim() ||
      !addressForm.pincode.trim()
    ) {
      setCheckoutMessage(
        "Please complete your delivery address."
      );
      return;
    }

    if (
      addressForm.pincode.trim().length !==
      6
    ) {
      setCheckoutMessage(
        "Please enter a valid 6-digit pincode."
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
            /*
             * Existing orders API remains unchanged.
             */
            address: finalAddress,
            paymentMethod: "COD",

            items: cart.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
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
     NOT LOGGED IN
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

                      <div className="mt-3 text-xl font-black text-[#07152f]">
                        ₹
                        {Number(
                          item.price
                        ).toLocaleString(
                          "en-IN"
                        )}
                      </div>

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
                            {Number(
                              item.itemTotal ??
                                Number(
                                  item.price
                                ) *
                                  item.quantity
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
                  onClick={openCheckout}
                  className="mt-6 w-full rounded-xl bg-[#07152f] px-6 py-4 font-black text-white transition hover:opacity-90"
                >
                  Proceed to Checkout →
                </button>

              )}

              {/* =================================================
                  CHECKOUT
              ================================================= */}

              {showCheckout && (

                <div className="mt-6 border-t border-gray-200 pt-6">

                  {/* CHECKOUT HEADER */}

                  <div className="flex items-start justify-between gap-3">

                    <div>

                      <p className="text-xs font-black uppercase tracking-widest text-gray-400">
                        Secure Checkout
                      </p>

                      <h3 className="mt-1 text-xl font-black text-[#07152f]">
                        Delivery Details
                      </h3>

                    </div>

                    <div className="rounded-full bg-green-50 px-3 py-1.5 text-[10px] font-black text-green-700">
                      🔒 SECURE
                    </div>

                  </div>

                  {/* ADDRESS HEADER */}

                  <div className="mt-6">

                    <div className="flex items-start justify-between gap-3">

                      <div>

                        <p className="text-base font-black text-[#07152f]">
                          Delivery Address
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          Pin your exact delivery location
                        </p>

                      </div>

                      <button
                        type="button"
                        onClick={
                          useCurrentLocation
                        }
                        disabled={locating}
                        className="shrink-0 rounded-xl border-2 border-[#07152f] bg-white px-3 py-2 text-xs font-black text-[#07152f] transition hover:bg-[#07152f] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {locating
                          ? "Locating..."
                          : "📍 Use Current Location"}
                      </button>

                    </div>

                  </div>

                  {/* LOCATION SUCCESS */}

                  {locationMessage && (
                    <div className="mt-3 rounded-xl border border-green-200 bg-green-50 p-3 text-xs font-bold text-green-700">
                      {locationMessage}
                    </div>
                  )}

                  {/* LOCATION ERROR */}

                  {locationError && (
                    <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700">
                      {locationError}
                    </div>
                  )}

                  {/* MAP */}

                  {coordinates ? (

                    <div className="relative mt-4 overflow-hidden rounded-3xl border border-gray-200 bg-gray-100 shadow-sm">

                      <div
                        ref={
                          mapContainerRef
                        }
                        className="h-[300px] w-full sm:h-[340px]"
                      />

                      {/* MAP TOP BADGE */}

                      <div className="pointer-events-none absolute left-3 top-3 z-[500]">

                        <div className="rounded-xl border border-white/80 bg-white/95 px-3 py-2 shadow-lg backdrop-blur">

                          <div className="flex items-center gap-2">

                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#07152f] text-sm text-white">
                              📍
                            </span>

                            <div>

                              <p className="text-[10px] font-black uppercase tracking-wide text-gray-400">
                                Delivery location
                              </p>

                              <p className="text-xs font-black text-[#07152f]">
                                Drag pin to adjust
                              </p>

                            </div>

                          </div>

                        </div>

                      </div>

                      {/* MAP BOTTOM INFO */}

                      <div className="absolute bottom-3 left-3 right-3 z-[500]">

                        <div className="rounded-xl border border-white/80 bg-white/95 px-3 py-2 text-center text-[10px] font-bold text-gray-600 shadow-lg backdrop-blur">

                          Move the pin to your exact doorstep location

                        </div>

                      </div>

                    </div>

                  ) : (

                    <div className="mt-4 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">

                      <div className="flex h-48 items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-6 text-center">

                        <div>

                          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#07152f] text-2xl text-white shadow-lg">
                            📍
                          </div>

                          <p className="mt-4 text-sm font-black text-[#07152f]">
                            Detecting your location
                          </p>

                          <p className="mt-1 text-xs leading-5 text-gray-500">
                            Allow location access to place your delivery pin on the map.
                          </p>

                        </div>

                      </div>

                    </div>

                  )}

                  {/* ADDRESS TYPE */}

                  <div className="mt-6">

                    <div className="flex items-center justify-between">

                      <p className="text-xs font-black uppercase tracking-wide text-gray-500">
                        Save address as
                      </p>

                      <span className="text-[10px] font-bold text-gray-400">
                        Required
                      </span>

                    </div>

                    <div className="mt-2 grid grid-cols-2 gap-3">

                      <button
                        type="button"
                        onClick={() =>
                          setAddressType(
                            "HOME"
                          )
                        }
                        className={`rounded-2xl border-2 px-4 py-3.5 text-sm font-black transition ${
                          addressType ===
                          "HOME"
                            ? "border-[#07152f] bg-[#07152f] text-white shadow-md"
                            : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                        }`}
                      >
                        🏠 HOME
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setAddressType(
                            "OFFICE"
                          )
                        }
                        className={`rounded-2xl border-2 px-4 py-3.5 text-sm font-black transition ${
                          addressType ===
                          "OFFICE"
                            ? "border-[#07152f] bg-[#07152f] text-white shadow-md"
                            : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                        }`}
                      >
                        🏢 OFFICE
                      </button>

                    </div>

                  </div>

                  {/* HOUSE */}

                  <div className="mt-5">

                    <label className="text-xs font-black uppercase tracking-wide text-gray-500">
                      House / Flat / Building *
                    </label>

                    <input
                      type="text"
                      value={
                        addressForm.house
                      }
                      onChange={(event) =>
                        updateAddressField(
                          "house",
                          event.target.value
                        )
                      }
                      placeholder="Flat / House No. / Building Name"
                      autoComplete="street-address"
                      className="mt-2 w-full rounded-2xl border-2 border-gray-200 bg-white px-4 py-3.5 text-sm font-semibold outline-none transition focus:border-[#07152f] focus:ring-4 focus:ring-[#07152f]/5"
                    />

                  </div>

                  {/* AREA */}

                  <div className="mt-4">

                    <label className="text-xs font-black uppercase tracking-wide text-gray-500">
                      Area / Locality *
                    </label>

                    <input
                      type="text"
                      value={
                        addressForm.area
                      }
                      onChange={(event) =>
                        updateAddressField(
                          "area",
                          event.target.value
                        )
                      }
                      placeholder="Area / Locality"
                      autoComplete="address-line2"
                      className="mt-2 w-full rounded-2xl border-2 border-gray-200 bg-white px-4 py-3.5 text-sm font-semibold outline-none transition focus:border-[#07152f] focus:ring-4 focus:ring-[#07152f]/5"
                    />

                  </div>

                  {/* LANDMARK */}

                  <div className="mt-4">

                    <label className="text-xs font-black uppercase tracking-wide text-gray-500">

                      Landmark

                      <span className="ml-1 normal-case font-semibold text-gray-400">
                        (optional)
                      </span>

                    </label>

                    <input
                      type="text"
                      value={
                        addressForm.landmark
                      }
                      onChange={(event) =>
                        updateAddressField(
                          "landmark",
                          event.target.value
                        )
                      }
                      placeholder="Nearby landmark"
                      className="mt-2 w-full rounded-2xl border-2 border-gray-200 bg-white px-4 py-3.5 text-sm font-semibold outline-none transition focus:border-[#07152f] focus:ring-4 focus:ring-[#07152f]/5"
                    />

                  </div>

                  {/* CITY + STATE */}

                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">

                    <div>

                      <label className="text-xs font-black uppercase tracking-wide text-gray-500">
                        City *
                      </label>

                      <input
                        type="text"
                        value={
                          addressForm.city
                        }
                        onChange={(event) =>
                          updateAddressField(
                            "city",
                            event.target.value
                          )
                        }
                        placeholder="City"
                        autoComplete="address-level2"
                        className="mt-2 w-full rounded-2xl border-2 border-gray-200 bg-white px-4 py-3.5 text-sm font-semibold outline-none transition focus:border-[#07152f] focus:ring-4 focus:ring-[#07152f]/5"
                      />

                    </div>

                    <div>

                      <label className="text-xs font-black uppercase tracking-wide text-gray-500">
                        State *
                      </label>

                      <input
                        type="text"
                        value={
                          addressForm.state
                        }
                        onChange={(event) =>
                          updateAddressField(
                            "state",
                            event.target.value
                          )
                        }
                        placeholder="State"
                        autoComplete="address-level1"
                        className="mt-2 w-full rounded-2xl border-2 border-gray-200 bg-white px-4 py-3.5 text-sm font-semibold outline-none transition focus:border-[#07152f] focus:ring-4 focus:ring-[#07152f]/5"
                      />

                    </div>

                  </div>

                  {/* PINCODE */}

                  <div className="mt-4">

                    <label className="text-xs font-black uppercase tracking-wide text-gray-500">
                      Pincode *
                    </label>

                    <div className="relative">

                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={
                          addressForm.pincode
                        }
                        onChange={(event) => {
                          const value =
                            event.target.value
                              .replace(
                                /\D/g,
                                ""
                              )
                              .slice(
                                0,
                                6
                              );

                          updateAddressField(
                            "pincode",
                            value
                          );
                        }}
                        placeholder="6-digit pincode"
                        autoComplete="postal-code"
                        className="mt-2 w-full rounded-2xl border-2 border-gray-200 bg-white px-4 py-3.5 text-sm font-semibold outline-none transition focus:border-[#07152f] focus:ring-4 focus:ring-[#07152f]/5"
                      />

                      {addressForm.pincode.length ===
                        6 && (
                        <span className="absolute right-4 top-1/2 mt-1 -translate-y-1/2 text-sm font-black text-green-600">
                          ✓
                        </span>
                      )}

                    </div>

                  </div>

                  {/* GPS STATUS */}

                  {coordinates && (

                    <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-4">

                      <div className="flex items-start gap-3">

                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                          📍
                        </div>

                        <div className="min-w-0">

                          <p className="text-xs font-black text-[#07152f]">
                            Location pinned
                          </p>

                          <p className="mt-1 text-[10px] leading-5 text-gray-500">
                            Your delivery pin can be moved anytime on the map. Address fields remain editable.
                          </p>

                          <p className="mt-1 break-all text-[9px] font-semibold text-gray-400">
                            {coordinates.latitude.toFixed(
                              6
                            )}
                            ,{" "}
                            {coordinates.longitude.toFixed(
                              6
                            )}
                          </p>

                        </div>

                      </div>

                    </div>

                  )}

                  {/* ADDRESS PREVIEW */}

                  {address.trim() && (

                    <div className="mt-5 rounded-2xl border border-[#07152f]/10 bg-[#07152f]/[0.03] p-4">

                      <div className="flex items-center justify-between gap-3">

                        <p className="text-xs font-black uppercase tracking-wide text-gray-400">
                          Delivery address
                        </p>

                        <span className="rounded-full bg-white px-2.5 py-1 text-[9px] font-black text-[#07152f] shadow-sm">
                          {addressType}
                        </span>

                      </div>

                      <p className="mt-2 text-sm font-semibold leading-6 text-gray-700">
                        {address}
                      </p>

                    </div>

                  )}

                  {/* PAYMENT */}

                  <div className="mt-5 rounded-2xl border-2 border-[#07152f] bg-gray-50 p-4">

                    <div className="flex items-start gap-3">

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-lg shadow-sm">
                        💵
                      </div>

                      <div>

                        <p className="font-black text-[#07152f]">
                          Cash on Delivery
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                          Pay when your order is delivered.
                        </p>

                      </div>

                    </div>

                  </div>

                  {/* MESSAGE */}

                  {checkoutMessage && (

                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
                      {checkoutMessage}
                    </div>

                  )}

                  {/* PLACE ORDER */}

                  <button
                    type="button"
                    onClick={placeOrder}
                    disabled={placingOrder}
                    className="mt-5 w-full rounded-2xl bg-[#07152f] px-6 py-4 font-black text-white shadow-lg transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
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
                    onClick={() => {
                      setShowCheckout(
                        false
                      );

                      /*
                       * Do not reset locationAttemptedRef.
                       * If customer reopens checkout, they can
                       * still use the manual location button.
                       */
                    }}
                    className="mt-3 w-full rounded-2xl border-2 border-gray-300 px-6 py-3.5 font-black text-gray-700 transition hover:bg-gray-50"
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