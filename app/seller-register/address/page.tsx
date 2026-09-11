"use client";

import dynamic from "next/dynamic";
import {
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import "leaflet/dist/leaflet.css";

type AddressData = {
  houseNumber: string;
  street: string;
  area: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
};

type SavedRegistration = {
  pickupAddress?: string | null;
  pickupCity?: string | null;
  pickupState?: string | null;
  pickupPincode?: string | null;
  pickupContactName?: string | null;
  pickupContactMobile?: string | null;
  pickupLatitude?: number | null;
  pickupLongitude?: number | null;
};

const DEFAULT_LOCATION: [number, number] = [
  25.5941,
  85.1376,
];

const MapPicker = dynamic(
  () => import("./MapPicker"),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center bg-gray-100">
        <div className="text-gray-700 font-semibold">
          🗺️ Loading map...
        </div>
      </div>
    ),
  }
);

export default function SellerAddressPage() {
  const router = useRouter();

  const [address, setAddress] =
    useState<AddressData>({
      houseNumber: "",
      street: "",
      area: "",
      city: "",
      district: "",
      state: "",
      pincode: "",
      latitude: null,
      longitude: null,
    });

  const [contactName, setContactName] =
    useState("");

  const [contactMobile, setContactMobile] =
    useState("");

  const [mapPosition, setMapPosition] =
    useState<[number, number]>(
      DEFAULT_LOCATION
    );

  const [locationLoading, setLocationLoading] =
    useState(false);

  const [addressLoading, setAddressLoading] =
    useState(false);

  const [locationAccuracy, setLocationAccuracy] =
    useState<number | null>(null);

  const [locationMessage, setLocationMessage] =
    useState("");

  const [locationError, setLocationError] =
    useState("");

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [initialLoading, setInitialLoading] =
    useState(true);

  const watchIdRef =
    useRef<number | null>(null);

  const bestAccuracyRef =
    useRef<number | null>(null);

  const bestPositionRef =
    useRef<GeolocationPosition | null>(null);

  const finishedLocationRef =
    useRef(false);

  const locationStartedAtRef =
    useRef<number | null>(null);

  /*
   * ---------------------------------------------------------
   * LOAD SAVED SELLER REGISTRATION
   * ---------------------------------------------------------
   */

  useEffect(() => {
    let cancelled = false;

    async function loadRegistration() {
      try {
        setInitialLoading(true);

        const response = await fetch(
          "/api/seller-registration",
          {
            method: "GET",
            cache: "no-store",
          }
        );

        if (!response.ok) {
          if (response.status === 401) {
            router.replace(
              "/login?callbackUrl=/seller-register/address"
            );
            return;
          }

          throw new Error(
            "Unable to load seller registration."
          );
        }

        const data =
          await response.json();

        if (cancelled) {
          return;
        }

        const registration =
          data?.registration as
            | SavedRegistration
            | null
            | undefined;

        if (!registration) {
          return;
        }

        /*
         * pickupAddress may contain structured JSON
         * created by this page.
         *
         * We also support old/plain text addresses
         * so previously saved data does not break.
         */
        let parsedAddress:
          | Partial<AddressData>
          | null = null;

        if (
          registration.pickupAddress
        ) {
          try {
            const parsed =
              JSON.parse(
                registration.pickupAddress
              );

            if (
              parsed &&
              typeof parsed === "object"
            ) {
              parsedAddress = parsed;
            }
          } catch {
            parsedAddress = null;
          }
        }

        const houseNumber =
          String(
            parsedAddress?.houseNumber ?? ""
          );

        const street =
          String(
            parsedAddress?.street ?? ""
          );

        const area =
          String(
            parsedAddress?.area ?? ""
          );

        const district =
          String(
            parsedAddress?.district ?? ""
          );

        const city =
          String(
            parsedAddress?.city ??
              registration.pickupCity ??
              ""
          );

        const state =
          String(
            parsedAddress?.state ??
              registration.pickupState ??
              ""
          );

        const pincode =
          String(
            parsedAddress?.pincode ??
              registration.pickupPincode ??
              ""
          );

        const latitude =
          typeof registration.pickupLatitude ===
            "number"
            ? registration.pickupLatitude
            : typeof parsedAddress?.latitude ===
                "number"
              ? parsedAddress.latitude
              : null;

        const longitude =
          typeof registration.pickupLongitude ===
            "number"
            ? registration.pickupLongitude
            : typeof parsedAddress?.longitude ===
                "number"
              ? parsedAddress.longitude
              : null;

        setAddress({
          houseNumber,
          street,
          area,
          city,
          district,
          state,
          pincode,
          latitude,
          longitude,
        });

        setContactName(
          String(
            registration.pickupContactName ??
              ""
          )
        );

        setContactMobile(
          String(
            registration.pickupContactMobile ??
              ""
          )
        );

        if (
          latitude !== null &&
          longitude !== null
        ) {
          setMapPosition([
            latitude,
            longitude,
          ]);
        }
      } catch (err) {
        console.error(
          "Seller registration load error:",
          err
        );

        if (!cancelled) {
          setError(
            "Unable to load your saved address details. Please try again."
          );
        }
      } finally {
        if (!cancelled) {
          setInitialLoading(false);
        }
      }
    }

    void loadRegistration();

    return () => {
      cancelled = true;
    };
  }, [router]);

  /*
   * ---------------------------------------------------------
   * CLEANUP GPS WATCH
   * ---------------------------------------------------------
   */

  useEffect(() => {
    return () => {
      if (
        watchIdRef.current !== null
      ) {
        navigator.geolocation.clearWatch(
          watchIdRef.current
        );

        watchIdRef.current = null;
      }
    };
  }, []);

  /*
   * ---------------------------------------------------------
   * REVERSE GEOCODING
   * ---------------------------------------------------------
   */

  async function getAddressFromCoordinates(
    latitude: number,
    longitude: number
  ) {
    try {
      setAddressLoading(true);
      setLocationError("");
      setError("");

      const response = await fetch(
        `/api/geocode/reverse?lat=${encodeURIComponent(
          latitude
        )}&lon=${encodeURIComponent(
          longitude
        )}`,
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(
          "Address lookup failed"
        );
      }

      const data =
        await response.json();

      const a =
        data?.address || {};

      setAddress(
        (previous) => ({
          ...previous,

          street:
            a.road ||
            a.pedestrian ||
            a.footway ||
            a.cycleway ||
            "",

          area:
            a.suburb ||
            a.neighbourhood ||
            a.quarter ||
            a.village ||
            a.town ||
            "",

          city:
            a.city ||
            a.town ||
            a.municipality ||
            a.village ||
            a.city_district ||
            "",

          district:
            a.state_district ||
            a.county ||
            a.district ||
            "",

          state:
            a.state || "",

          pincode:
            a.postcode || "",

          latitude,
          longitude,
        })
      );

      setLocationMessage(
        "✓ Location detected. Please check the address and add your house/shop number."
      );
    } catch (err) {
      console.error(err);

      setLocationError(
        "Location selected, but address details could not be loaded. Please fill them manually."
      );

      setAddress(
        (previous) => ({
          ...previous,
          latitude,
          longitude,
        })
      );
    } finally {
      setAddressLoading(false);
    }
  }

  /*
   * ---------------------------------------------------------
   * MANUAL MAP LOCATION CHANGE
   * ---------------------------------------------------------
   */

  async function handleLocationChange(
    latitude: number,
    longitude: number,
    accuracy?: number | null
  ) {
    setMapPosition([
      latitude,
      longitude,
    ]);

    setAddress(
      (previous) => ({
        ...previous,
        latitude,
        longitude,
      })
    );

    if (
      accuracy !== undefined &&
      accuracy !== null
    ) {
      setLocationAccuracy(
        accuracy
      );
    }

    setLocationMessage(
      "📍 Pickup point selected. Finding address..."
    );

    await getAddressFromCoordinates(
      latitude,
      longitude
    );
  }

  /*
   * ---------------------------------------------------------
   * FINISH GPS LOCATION
   * ---------------------------------------------------------
   */

  async function finishLocation(
    position: GeolocationPosition
  ) {
    if (finishedLocationRef.current) {
      return;
    }

    finishedLocationRef.current =
      true;

    if (
      watchIdRef.current !== null
    ) {
      navigator.geolocation.clearWatch(
        watchIdRef.current
      );

      watchIdRef.current = null;
    }

    const latitude =
      position.coords.latitude;

    const longitude =
      position.coords.longitude;

    const accuracy =
      position.coords.accuracy;

    setMapPosition([
      latitude,
      longitude,
    ]);

    setLocationAccuracy(
      accuracy
    );

    setAddress(
      (previous) => ({
        ...previous,
        latitude,
        longitude,
      })
    );

    setLocationLoading(false);

    if (accuracy <= 10) {
      setLocationMessage(
        `✓ Exact pickup location detected. GPS accuracy: ${Math.round(
          accuracy
        )}m`
      );
    } else {
      setLocationMessage(
        `✓ Best available pickup location detected. GPS accuracy: ${Math.round(
          accuracy
        )}m`
      );
    }

    await getAddressFromCoordinates(
      latitude,
      longitude
    );
  }

  /*
   * ---------------------------------------------------------
   * CURRENT LOCATION
   * ---------------------------------------------------------
   */

  function useCurrentLocation() {
    setLocationError("");
    setLocationMessage("");
    setError("");

    if (!navigator.geolocation) {
      setLocationError(
        "Your browser does not support location access."
      );
      return;
    }

    if (
      watchIdRef.current !== null
    ) {
      navigator.geolocation.clearWatch(
        watchIdRef.current
      );

      watchIdRef.current = null;
    }

    finishedLocationRef.current =
      false;

    bestAccuracyRef.current =
      null;

    bestPositionRef.current =
      null;

    locationStartedAtRef.current =
      Date.now();

    setLocationLoading(true);
    setLocationAccuracy(null);

    const watchId =
      navigator.geolocation.watchPosition(
        (position) => {
          if (
            finishedLocationRef.current
          ) {
            return;
          }

          const accuracy =
            position.coords.accuracy;

          const currentBest =
            bestAccuracyRef.current;

          if (
            currentBest === null ||
            accuracy < currentBest
          ) {
            bestAccuracyRef.current =
              accuracy;

            bestPositionRef.current =
              position;

            setLocationAccuracy(
              accuracy
            );

            setLocationMessage(
              `📍 Improving GPS accuracy... ${Math.round(
                accuracy
              )}m`
            );
          }

          if (accuracy <= 10) {
            void finishLocation(
              position
            );
            return;
          }

          const startedAt =
            locationStartedAtRef.current;

          if (
            startedAt !== null &&
            Date.now() - startedAt >=
              25000
          ) {
            const bestPosition =
              bestPositionRef.current;

            if (bestPosition) {
              void finishLocation(
                bestPosition
              );
            } else {
              setLocationLoading(
                false
              );

              setLocationError(
                "Unable to get a GPS fix. Please try again or select the pickup point manually on the map."
              );

              finishedLocationRef.current =
                true;

              if (
                watchIdRef.current !==
                null
              ) {
                navigator.geolocation.clearWatch(
                  watchIdRef.current
                );

                watchIdRef.current =
                  null;
              }
            }
          }
        },
        (geoError) => {
          if (
            finishedLocationRef.current
          ) {
            return;
          }

          setLocationLoading(false);

          if (
            watchIdRef.current !==
            null
          ) {
            navigator.geolocation.clearWatch(
              watchIdRef.current
            );

            watchIdRef.current =
              null;
          }

          if (
            geoError.code ===
            geoError.PERMISSION_DENIED
          ) {
            setLocationError(
              "Location permission was denied. Please allow location access and try again."
            );
          } else if (
            geoError.code ===
            geoError.TIMEOUT
          ) {
            setLocationError(
              "Location request timed out. Please try again."
            );
          } else {
            setLocationError(
              "Unable to detect your location. You can select the pickup point manually on the map."
            );
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 30000,
          maximumAge: 0,
        }
      );

    watchIdRef.current =
      watchId;

    window.setTimeout(() => {
      if (
        finishedLocationRef.current
      ) {
        return;
      }

      const bestPosition =
        bestPositionRef.current;

      if (bestPosition) {
        void finishLocation(
          bestPosition
        );
      } else {
        setLocationLoading(false);

        setLocationError(
          "Unable to get your GPS location. Please try again or select the pickup point manually on the map."
        );

        finishedLocationRef.current =
          true;

        if (
          watchIdRef.current !==
          null
        ) {
          navigator.geolocation.clearWatch(
            watchIdRef.current
          );

          watchIdRef.current =
            null;
        }
      }
    }, 25000);
  }

  /*
   * ---------------------------------------------------------
   * FORM FIELD UPDATE
   * ---------------------------------------------------------
   */

  function updateField(
    field: keyof AddressData,
    value: string
  ) {
    setAddress(
      (previous) => ({
        ...previous,
        [field]: value,
      })
    );
  }

  /*
   * ---------------------------------------------------------
   * VALIDATION
   * ---------------------------------------------------------
   */

  function validateForm() {
    if (
      !address.houseNumber.trim()
    ) {
      setError(
        "Please enter your house/shop number."
      );
      return false;
    }

    if (
      !address.street.trim()
    ) {
      setError(
        "Please enter your street/road."
      );
      return false;
    }

    if (
      !address.area.trim()
    ) {
      setError(
        "Please enter your area/locality."
      );
      return false;
    }

    if (
      !address.city.trim()
    ) {
      setError(
        "Please enter your city."
      );
      return false;
    }

    if (
      !address.state.trim()
    ) {
      setError(
        "Please enter your state."
      );
      return false;
    }

    if (
      !/^[0-9]{6}$/.test(
        address.pincode.trim()
      )
    ) {
      setError(
        "Please enter a valid 6-digit pincode."
      );
      return false;
    }

    if (
      !contactName.trim()
    ) {
      setError(
        "Please enter the pickup contact name."
      );
      return false;
    }

    if (
      !/^[6-9][0-9]{9}$/.test(
        contactMobile.trim()
      )
    ) {
      setError(
        "Please enter a valid 10-digit mobile number."
      );
      return false;
    }

    if (
      address.latitude === null ||
      address.longitude === null
    ) {
      setError(
        "Please select your exact pickup location on the map."
      );
      return false;
    }

    return true;
  }

  /*
   * ---------------------------------------------------------
   * SAVE ADDRESS TO DATABASE
   * ---------------------------------------------------------
   */

  async function handleContinue() {
    setError("");

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      /*
       * Store the structured address inside pickupAddress.
       *
       * The database currently has one pickupAddress
       * field rather than separate house/street/area fields.
       *
       * This keeps all address components safely together
       * without losing information.
       */
      const pickupAddress =
        JSON.stringify({
          houseNumber:
            address.houseNumber.trim(),

          street:
            address.street.trim(),

          area:
            address.area.trim(),

          district:
            address.district.trim(),

          city:
            address.city.trim(),

          state:
            address.state.trim(),

          pincode:
            address.pincode.trim(),

          latitude:
            address.latitude,

          longitude:
            address.longitude,
        });

      const response = await fetch(
        "/api/seller-registration",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            pickupAddress,
            pickupCity:
              address.city.trim(),
            pickupState:
              address.state.trim(),
            pickupPincode:
              address.pincode.trim(),

            pickupContactName:
              contactName.trim(),

            pickupContactMobile:
              contactMobile.trim(),

            pickupLatitude:
              address.latitude,

            pickupLongitude:
              address.longitude,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        if (
          response.status === 401
        ) {
          router.replace(
            "/login?callbackUrl=/seller-register/address"
          );
          return;
        }

        throw new Error(
          data?.error ||
            "Unable to save pickup address."
        );
      }

      router.push(
        "/seller-register/bank"
      );
    } catch (err) {
      console.error(
        "Address save error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save pickup address. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border-2 border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 px-4 py-3.5 outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-200";

  /*
   * ---------------------------------------------------------
   * INITIAL LOADING
   * ---------------------------------------------------------
   */

  if (initialLoading) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="bg-white border border-gray-300 rounded-2xl shadow-sm px-8 py-6 text-center">
              <div className="text-2xl mb-2">
                📍
              </div>

              <p className="text-gray-900 font-bold">
                Loading your pickup address...
              </p>

              <p className="text-sm text-gray-600 mt-1">
                Please wait.
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-5xl mx-auto">

        {/* HEADER */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900">
            Pickup Address
          </h1>

          <p className="mt-2 text-gray-600">
            Select the exact location from where
            your orders will be picked up
          </p>
        </div>

        {/* PROGRESS */}
        <div className="bg-white rounded-2xl border border-gray-300 p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between max-w-3xl mx-auto">

            {[
              ["1", "Mobile"],
              ["2", "Business"],
              ["3", "Address"],
              ["4", "Bank"],
              ["5", "Submit"],
            ].map(
              ([number, label], index) => {
                const active =
                  number === "3";

                const completed =
                  index < 2;

                return (
                  <div
                    key={number}
                    className="flex items-center flex-1 last:flex-none"
                  >
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-11 h-11 rounded-full flex items-center justify-center font-bold ${
                          active ||
                          completed
                            ? "bg-gray-900 text-white"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {number}
                      </div>

                      <span
                        className={`mt-2 text-sm font-medium ${
                          active
                            ? "text-gray-900"
                            : "text-gray-600"
                        }`}
                      >
                        {label}
                      </span>
                    </div>

                    {index < 4 && (
                      <div
                        className={`h-0.5 flex-1 mx-3 ${
                          index < 2
                            ? "bg-gray-900"
                            : "bg-gray-300"
                        }`}
                      />
                    )}
                  </div>
                );
              }
            )}

          </div>
        </div>

        {/* MAP */}
        <div className="bg-white rounded-2xl border border-gray-300 overflow-hidden mb-6 shadow-sm">

          <div className="p-6 pb-4">
            <h2 className="text-xl font-bold text-gray-900">
              📍 Choose your pickup location
            </h2>

            <p className="text-sm text-gray-600 mt-1">
              Use your current location or drag the
              pin to the exact location of your
              house/shop.
            </p>
          </div>

          <div className="px-6 pb-5">
            <button
              type="button"
              onClick={
                useCurrentLocation
              }
              disabled={
                locationLoading
              }
              className="w-full rounded-xl bg-gray-900 text-white py-4 px-5 font-bold hover:bg-gray-800 transition disabled:opacity-60"
            >
              {locationLoading
                ? "📍 Detecting accurate location..."
                : "📍 Use My Current Location"}
            </button>
          </div>

          <div className="relative h-[430px] w-full">

            <MapPicker
              position={mapPosition}
              accuracy={
                locationAccuracy
              }
              onLocationChange={
                handleLocationChange
              }
            />

            <div className="absolute left-1/2 top-4 -translate-x-1/2 z-[500] pointer-events-none">
              <div className="bg-white px-4 py-2 rounded-full shadow-lg border border-gray-200 text-sm font-semibold text-gray-900 whitespace-nowrap">
                📍 Drag pin to exact pickup point
              </div>
            </div>

          </div>

          <div className="p-5">

            {addressLoading && (
              <div className="text-sm text-gray-700 font-medium">
                🔄 Finding address...
              </div>
            )}

            {!addressLoading &&
              locationMessage && (
                <div className="text-sm text-green-700 font-semibold">
                  {locationMessage}
                </div>
              )}

            {locationError && (
              <div className="mt-2 text-sm text-red-600 font-medium">
                {locationError}
              </div>
            )}

            {locationAccuracy !== null && (
              <div className="mt-3 inline-flex rounded-lg bg-gray-100 px-3 py-2 text-xs text-gray-700">
                <span className="font-semibold">
                  GPS accuracy:
                </span>

                <span className="ml-1">
                  {Math.round(
                    locationAccuracy
                  )}
                  m
                </span>
              </div>
            )}

            {address.latitude !== null &&
              address.longitude !== null && (
                <div className="mt-3 text-xs text-gray-600">
                  <span className="font-semibold text-gray-800">
                    Pickup coordinates:
                  </span>{" "}
                  {address.latitude.toFixed(
                    6
                  )}
                  ,{" "}
                  {address.longitude.toFixed(
                    6
                  )}
                </div>
              )}

          </div>
        </div>

        {/* ADDRESS DETAILS */}
        <div className="bg-white rounded-2xl border border-gray-300 p-6 md:p-8 mb-6 shadow-sm">

          <h2 className="text-xl font-bold text-gray-900">
            Pickup Address Details
          </h2>

          <p className="text-sm text-gray-600 mt-1 mb-6">
            The map will automatically fill these
            details. Please check them carefully and
            correct anything that is wrong.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* HOUSE */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">
                House / Shop Number *
              </label>

              <input
                type="text"
                value={
                  address.houseNumber
                }
                onChange={(e) =>
                  updateField(
                    "houseNumber",
                    e.target.value
                  )
                }
                placeholder="e.g. 36"
                className={inputClass}
              />
            </div>

            {/* STREET */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">
                Street / Road *
              </label>

              <input
                type="text"
                value={
                  address.street
                }
                onChange={(e) =>
                  updateField(
                    "street",
                    e.target.value
                  )
                }
                placeholder="Street / Road"
                className={inputClass}
              />
            </div>

            {/* AREA */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">
                Area / Locality *
              </label>

              <input
                type="text"
                value={
                  address.area
                }
                onChange={(e) =>
                  updateField(
                    "area",
                    e.target.value
                  )
                }
                placeholder="Area / Locality"
                className={inputClass}
              />
            </div>

            {/* CITY */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">
                City *
              </label>

              <input
                type="text"
                value={
                  address.city
                }
                onChange={(e) =>
                  updateField(
                    "city",
                    e.target.value
                  )
                }
                placeholder="City"
                className={inputClass}
              />
            </div>

            {/* DISTRICT */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">
                District
              </label>

              <input
                type="text"
                value={
                  address.district
                }
                onChange={(e) =>
                  updateField(
                    "district",
                    e.target.value
                  )
                }
                placeholder="District"
                className={inputClass}
              />
            </div>

            {/* STATE */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">
                State *
              </label>

              <input
                type="text"
                value={
                  address.state
                }
                onChange={(e) =>
                  updateField(
                    "state",
                    e.target.value
                  )
                }
                placeholder="State"
                className={inputClass}
              />
            </div>

            {/* PINCODE */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">
                Pincode *
              </label>

              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={
                  address.pincode
                }
                onChange={(e) =>
                  updateField(
                    "pincode",
                    e.target.value.replace(
                      /\D/g,
                      ""
                    )
                  )
                }
                placeholder="6-digit pincode"
                className={inputClass}
              />

              <p className="mt-1.5 text-xs text-gray-500">
                Exactly 6 digits required.
              </p>
            </div>

          </div>
        </div>

        {/* CONTACT */}
        <div className="bg-white rounded-2xl border border-gray-300 p-6 md:p-8 mb-6 shadow-sm">

          <h2 className="text-xl font-bold text-gray-900">
            Pickup Contact
          </h2>

          <p className="text-sm text-gray-600 mt-1 mb-6">
            This person can coordinate with the
            delivery partner during pickup.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* CONTACT NAME */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">
                Contact Name *
              </label>

              <input
                type="text"
                value={
                  contactName
                }
                onChange={(e) =>
                  setContactName(
                    e.target.value
                  )
                }
                placeholder="Pickup contact name"
                className={inputClass}
              />
            </div>

            {/* CONTACT MOBILE */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">
                Contact Mobile *
              </label>

              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={
                  contactMobile
                }
                onChange={(e) =>
                  setContactMobile(
                    e.target.value.replace(
                      /\D/g,
                      ""
                    )
                  )
                }
                placeholder="10-digit mobile number"
                className={inputClass}
              />

              <p className="mt-1.5 text-xs text-gray-500">
                Must be a valid Indian 10-digit mobile
                number.
              </p>
            </div>

          </div>
        </div>

        {/* REQUIRED FIELDS NOTICE */}
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm text-amber-800">
            <span className="font-bold">
              *
            </span>{" "}
            All fields marked with * are mandatory.
            You cannot continue until they are
            completed correctly.
          </p>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-5 rounded-xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {/* CONTINUE */}
        <div className="flex justify-end pb-10">

          <button
            type="button"
            onClick={
              handleContinue
            }
            disabled={loading}
            className="w-full md:w-auto min-w-[240px] rounded-xl bg-gray-900 text-white px-8 py-4 font-bold hover:bg-gray-800 transition disabled:opacity-60"
          >
            {loading
              ? "Saving address..."
              : "Continue to Bank Details →"}
          </button>

        </div>

      </div>
    </main>
  );
}