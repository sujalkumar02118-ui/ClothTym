"use client";

import { useState } from "react";

type Step = 1 | 2 | 3 | 4;

const mainCategories = [
  ["Men's Wear", "👔", "Fashion for men"],
  ["Women's Wear", "👗", "Fashion for women"],
  ["Kids Wear", "👶", "Boys & girls clothing"],
  ["Shirts", "👕", "Shirts & casual wear"],
  ["Pants", "👖", "Pants, jeans & trousers"],
  ["Jackets", "🧥", "Jackets & outerwear"],
  ["Footwear", "👟", "Shoes & footwear"],
  ["Accessories", "👜", "Fashion accessories"],
];

const sizes = [
  "0-1 Years",
  "1-2 Years",
  "2-3 Years",
  "3-4 Years",
  "4-5 Years",
  "5-6 Years",
  "6-7 Years",
  "7-8 Years",
  "8-9 Years",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
];

const colors = [
  "Black",
  "White",
  "Red",
  "Blue",
  "Green",
  "Yellow",
  "Pink",
  "Orange",
  "Grey",
  "Brown",
  "Purple",
  "Multicolour",
];

export default function ProductUpload() {
  const [step, setStep] = useState<Step>(1);

  const [showCategory, setShowCategory] = useState(false);
  const [showKidsCategories, setShowKidsCategories] = useState(false);

  const [category, setCategory] = useState("");

  const [images, setImages] = useState<(string | null)[]>([
    null,
    null,
    null,
    null,
  ]);

  const [imageFiles, setImageFiles] = useState<(File | null)[]>([
    null,
    null,
    null,
    null,
  ]);

  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");

  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");

  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);

  /* =========================
     SIZE CHART
  ========================= */

  const [sizeChart, setSizeChart] = useState("");

  const [publishing, setPublishing] = useState(false);

  const imageLabels = [
    "Front View",
    "Back View",
    "Side View",
    "Other Pose",
  ];

  /* =========================
     IMAGE SELECT
  ========================= */

  const handleImageUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const imageUrl = URL.createObjectURL(file);

    setImages((previous) => {
      const updated = [...previous];
      updated[index] = imageUrl;
      return updated;
    });

    setImageFiles((previous) => {
      const updated = [...previous];
      updated[index] = file;
      return updated;
    });
  };

  /* =========================
     REMOVE IMAGE
  ========================= */

  const removeImage = (index: number) => {
    if (images[index]) {
      URL.revokeObjectURL(images[index] as string);
    }

    setImages((previous) => {
      const updated = [...previous];
      updated[index] = null;
      return updated;
    });

    setImageFiles((previous) => {
      const updated = [...previous];
      updated[index] = null;
      return updated;
    });
  };

  /* =========================
     CATEGORY
  ========================= */

  const selectCategory = (value: string) => {
    setCategory(value);
    setShowCategory(false);
    setShowKidsCategories(false);
  };

  const selectMainCategory = (value: string) => {
    if (value === "Kids Wear") {
      setShowKidsCategories(true);
      return;
    }

    selectCategory(value);
  };

  /* =========================
     SIZE
  ========================= */

  const toggleSize = (size: string) => {
    setSelectedSizes((previous) =>
      previous.includes(size)
        ? previous.filter((item) => item !== size)
        : [...previous, size]
    );
  };

  /* =========================
     COLOR
  ========================= */

  const toggleColor = (color: string) => {
    setSelectedColors((previous) =>
      previous.includes(color)
        ? previous.filter((item) => item !== color)
        : [...previous, color]
    );
  };

  /* =========================
     VALIDATION
  ========================= */

  const canContinue = () => {
    if (step === 1) {
      return (
        category !== "" &&
        imageFiles.some((file) => file !== null) &&
        productName.trim() !== "" &&
        description.trim() !== ""
      );
    }

    if (step === 2) {
      return (
        price.trim() !== "" &&
        stock.trim() !== "" &&
        Number(price) >= 0 &&
        Number(stock) >= 0
      );
    }

    if (step === 3) {
      return (
        selectedSizes.length > 0 &&
        selectedColors.length > 0
      );
    }

    return true;
  };

  /* =========================
     NEXT
  ========================= */

  const nextStep = () => {
    if (!canContinue()) return;

    if (step < 4) {
      setStep((step + 1) as Step);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  /* =========================
     PREVIOUS
  ========================= */

  const previousStep = () => {
    if (step > 1) {
      setStep((step - 1) as Step);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  /* =========================
     UPLOAD IMAGE
  ========================= */

  const uploadSingleImage = async (file: File) => {
    const formData = new FormData();

    formData.append("file", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok || !data.success || !data.url) {
      throw new Error(
        data.message || "Image upload failed"
      );
    }

    return data.url as string;
  };

  /* =========================
     PUBLISH PRODUCT
  ========================= */

  const publishProduct = async () => {
    if (publishing) return;

    try {
      setPublishing(true);

      /* -------------------------
         VALIDATION
      ------------------------- */

      if (!productName.trim()) {
        alert("Please enter product name.");
        setPublishing(false);
        return;
      }

      if (!description.trim()) {
        alert("Please enter product description.");
        setPublishing(false);
        return;
      }

      if (!category) {
        alert("Please select a category.");
        setPublishing(false);
        return;
      }

      if (!price || Number(price) < 0) {
        alert("Please enter a valid price.");
        setPublishing(false);
        return;
      }

      if (!stock || Number(stock) < 0) {
        alert("Please enter valid stock.");
        setPublishing(false);
        return;
      }

      if (selectedSizes.length === 0) {
        alert("Please select at least one size.");
        setPublishing(false);
        return;
      }

      if (selectedColors.length === 0) {
        alert("Please select at least one colour.");
        setPublishing(false);
        return;
      }

      const filesToUpload = imageFiles.filter(
        (file): file is File => file !== null
      );

      if (filesToUpload.length === 0) {
        alert("Please upload at least one product photo.");
        setPublishing(false);
        return;
      }

      /* -------------------------
         UPLOAD ALL IMAGES
      ------------------------- */

      const uploadedImages: string[] = [];

      for (const file of filesToUpload) {
        const imageUrl = await uploadSingleImage(file);

        uploadedImages.push(imageUrl);
      }

      if (uploadedImages.length === 0) {
        throw new Error("No images were uploaded.");
      }

      /* -------------------------
         PRODUCT DATA
      ------------------------- */

      const productData = {
        name: productName.trim(),

        description: description.trim(),

        price: Number(price),

        stock: Number(stock),

        category: category,

        /* Main image */
        image: uploadedImages[0],

        /* All images */
        images: uploadedImages,

        /* ALL SELECTED SIZES */
        sizes: selectedSizes,

        /* ALL SELECTED COLORS */
        colors: selectedColors,

        /* SIZE CHART */
        sizeChart: sizeChart.trim(),
      };

      console.log(
        "PRODUCT DATA BEING SENT:",
        productData
      );

      /* -------------------------
         CREATE PRODUCT
      ------------------------- */

      const response = await fetch("/api/products", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(productData),
      });

      const data = await response.json();

      console.log("PUBLISH RESPONSE:", data);

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Product could not be published"
        );
      }

      alert(
        "Product published successfully! 🎉"
      );

      window.location.href = "/seller";
    } catch (error) {
      console.error("PUBLISH ERROR:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Product could not be published."
      );

      setPublishing(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f4f6fa] text-[#111827]">

      {/* HEADER */}

      <header className="sticky top-0 z-30 border-b-2 border-[#d1d5db] bg-white">

        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">

          <div className="flex items-center gap-3">

            <button
              onClick={() => {
                if (step > 1) {
                  previousStep();
                } else {
                  window.location.href = "/seller";
                }
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xl font-extrabold text-[#111827]"
            >
              ←
            </button>

            <div>

              <h1 className="text-xl font-extrabold text-[#111827] sm:text-2xl">
                Upload Product
              </h1>

              <p className="text-xs font-bold text-[#374151] sm:text-sm">
                Add your product in a few simple steps
              </p>

            </div>

          </div>

          <div className="hidden rounded-full bg-[#071936] px-4 py-2 text-sm font-extrabold text-white sm:block">
            ClothTym Seller
          </div>

        </div>

      </header>

      <div className="mx-auto max-w-6xl px-4 py-5">

        {/* STEP INDICATOR */}

        <div className="mb-6 rounded-2xl border-2 border-[#d1d5db] bg-white p-4 shadow-sm sm:p-6">

          <div className="grid grid-cols-4 gap-2">

            {[
              ["1", "Product"],
              ["2", "Price & Stock"],
              ["3", "Size & Colour"],
              ["4", "Review"],
            ].map(([number, title], index) => {

              const stepNumber = index + 1;

              const active =
                step === stepNumber;

              const completed =
                step > stepNumber;

              return (
                <div
                  key={number}
                  className="text-center"
                >

                  <div
                    className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-extrabold ${
                      active || completed
                        ? "border-[#172554] bg-[#172554] text-white"
                        : "border-[#6b7280] bg-white text-[#374151]"
                    }`}
                  >
                    {completed
                      ? "✓"
                      : number}
                  </div>

                  <p
                    className={`mt-2 text-xs font-extrabold sm:text-sm ${
                      active
                        ? "text-[#172554]"
                        : "text-[#374151]"
                    }`}
                  >
                    {title}
                  </p>

                </div>
              );
            })}

          </div>

        </div>

        {/* MAIN CARD */}

        <section className="overflow-hidden rounded-3xl border-2 border-[#d1d5db] bg-white shadow-md">

          {/* =================================================
              STEP 1
          ================================================= */}

          {step === 1 && (
            <div>

              <div className="border-b-2 border-[#e5e7eb] px-5 py-5 sm:px-7">

                <h2 className="text-2xl font-extrabold text-[#111827]">
                  Add Product
                </h2>

                <p className="mt-1 text-sm font-bold text-[#374151]">
                  Add photos, product name and description
                </p>

              </div>

              <div className="space-y-7 p-5 sm:p-7">

                {/* CATEGORY */}

                <div>

                  <label className="mb-2 block text-base font-extrabold text-[#111827]">
                    Category *
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setShowCategory(true);
                      setShowKidsCategories(false);
                    }}
                    className="flex w-full items-center justify-between rounded-xl border-2 border-[#6b7280] bg-white px-4 py-4 text-left font-extrabold text-[#111827] outline-none hover:border-[#172554]"
                  >

                    <span>
                      {category ||
                        "Select product category"}
                    </span>

                    <span className="text-xl">
                      ›
                    </span>

                  </button>

                </div>

                {/* FOUR IMAGES */}

                <div>

                  <div className="mb-3 flex items-end justify-between gap-3">

                    <div>

                      <h3 className="text-base font-extrabold text-[#111827]">
                        Product Photos *
                      </h3>

                      <p className="mt-1 text-xs font-bold text-[#4b5563]">
                        Upload up to 4 photos of the product
                      </p>

                    </div>

                    <span className="rounded-lg bg-[#172554] px-3 py-1 text-xs font-extrabold text-white">
                      {
                        imageFiles.filter(Boolean)
                          .length
                      }
                      /4
                    </span>

                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

                    {images.map(
                      (image, index) => (

                        <div
                          key={index}
                          className="rounded-2xl border-2 border-[#9ca3af] bg-[#f8fafc] p-3"
                        >

                          <div className="mb-3 flex items-center justify-between">

                            <span className="text-sm font-extrabold text-[#111827]">
                              {imageLabels[index]}
                            </span>

                            <span className="rounded-md bg-[#172554] px-2 py-1 text-xs font-extrabold text-white">
                              {index + 1}
                            </span>

                          </div>

                          {image ? (

                            <div className="relative">

                              <img
                                src={image}
                                alt={
                                  imageLabels[index]
                                }
                                className="h-44 w-full rounded-xl border-2 border-[#d1d5db] bg-white object-contain"
                              />

                              <button
                                type="button"
                                onClick={() =>
                                  removeImage(
                                    index
                                  )
                                }
                                className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-red-600 text-lg font-extrabold text-white shadow"
                              >
                                ×
                              </button>

                            </div>

                          ) : (

                            <label className="flex h-44 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#6b7280] bg-white hover:border-[#172554] hover:bg-[#eef2ff]">

                              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-[#e8ecf7] text-2xl">
                                📷
                              </div>

                              <span className="text-sm font-extrabold text-[#172554]">
                                Upload Photo
                              </span>

                              <span className="mt-1 text-xs font-bold text-[#4b5563]">
                                {imageLabels[index]}
                              </span>

                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(
                                  event
                                ) =>
                                  handleImageUpload(
                                    event,
                                    index
                                  )
                                }
                              />

                            </label>

                          )}

                        </div>

                      )
                    )}

                  </div>

                </div>

                {/* PRODUCT NAME */}

                <div>

                  <label className="mb-2 block text-base font-extrabold text-[#111827]">
                    Product Name *
                  </label>

                  <input
                    type="text"
                    value={productName}
                    onChange={(event) =>
                      setProductName(
                        event.target.value
                      )
                    }
                    placeholder="e.g. Premium Cotton T-Shirt"
                    className="h-14 w-full rounded-xl border-2 border-[#6b7280] bg-white px-4 font-bold text-[#111827] outline-none placeholder:text-[#6b7280] focus:border-[#172554]"
                  />

                </div>

                {/* DESCRIPTION */}

                <div>

                  <label className="mb-2 block text-base font-extrabold text-[#111827]">
                    Product Description *
                  </label>

                  <textarea
                    value={description}
                    onChange={(event) =>
                      setDescription(
                        event.target.value
                      )
                    }
                    placeholder="Write a short description of your product..."
                    rows={5}
                    className="w-full resize-none rounded-xl border-2 border-[#6b7280] bg-white p-4 font-bold text-[#111827] outline-none placeholder:text-[#6b7280] focus:border-[#172554]"
                  />

                </div>

              </div>

            </div>
          )}

          {/* =================================================
              STEP 2
          ================================================= */}

          {step === 2 && (
            <div>

              <div className="border-b-2 border-[#e5e7eb] px-5 py-5 sm:px-7">

                <h2 className="text-2xl font-extrabold text-[#111827]">
                  Price & Stock
                </h2>

                <p className="mt-1 text-sm font-bold text-[#374151]">
                  Enter selling price and available stock
                </p>

              </div>

              <div className="grid gap-6 p-5 sm:grid-cols-2 sm:p-7">

                <div>

                  <label className="mb-2 block text-base font-extrabold text-[#111827]">
                    Selling Price *
                  </label>

                  <div className="flex overflow-hidden rounded-xl border-2 border-[#6b7280]">

                    <div className="flex items-center bg-[#f3f4f6] px-4 text-lg font-extrabold text-[#111827]">
                      ₹
                    </div>

                    <input
                      type="number"
                      min="0"
                      value={price}
                      onChange={(event) =>
                        setPrice(
                          event.target.value
                        )
                      }
                      placeholder="499"
                      className="h-14 w-full px-4 font-bold text-[#111827] outline-none placeholder:text-[#6b7280]"
                    />

                  </div>

                </div>

                <div>

                  <label className="mb-2 block text-base font-extrabold text-[#111827]">
                    Stock Quantity *
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={stock}
                    onChange={(event) =>
                      setStock(
                        event.target.value
                      )
                    }
                    placeholder="20"
                    className="h-14 w-full rounded-xl border-2 border-[#6b7280] px-4 font-bold text-[#111827] outline-none placeholder:text-[#6b7280] focus:border-[#172554]"
                  />

                </div>

              </div>

            </div>
          )}

          {/* =================================================
              STEP 3
          ================================================= */}

          {step === 3 && (
            <div>

              <div className="border-b-2 border-[#e5e7eb] px-5 py-5 sm:px-7">

                <h2 className="text-2xl font-extrabold text-[#111827]">
                  Size & Colour
                </h2>

                <p className="mt-1 text-sm font-bold text-[#374151]">
                  Select all available sizes and colours
                </p>

              </div>

              <div className="space-y-8 p-5 sm:p-7">

                {/* SIZES */}

                <div>

                  <h3 className="mb-3 text-base font-extrabold text-[#111827]">
                    Available Sizes *
                  </h3>

                  <div className="flex flex-wrap gap-3">

                    {sizes.map((size) => {

                      const selected =
                        selectedSizes.includes(
                          size
                        );

                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() =>
                            toggleSize(size)
                          }
                          className={`rounded-xl border-2 px-4 py-3 text-sm font-extrabold ${
                            selected
                              ? "border-[#172554] bg-[#172554] text-white"
                              : "border-[#6b7280] bg-white text-[#111827]"
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}

                  </div>

                  {selectedSizes.length > 0 && (
                    <p className="mt-3 text-sm font-bold text-[#172554]">
                      Selected:{" "}
                      {selectedSizes.join(", ")}
                    </p>
                  )}

                </div>

                {/* COLORS */}

                <div>

                  <h3 className="mb-3 text-base font-extrabold text-[#111827]">
                    Available Colours *
                  </h3>

                  <div className="flex flex-wrap gap-3">

                    {colors.map((color) => {

                      const selected =
                        selectedColors.includes(
                          color
                        );

                      return (
                        <button
                          key={color}
                          type="button"
                          onClick={() =>
                            toggleColor(color)
                          }
                          className={`rounded-xl border-2 px-5 py-3 text-sm font-extrabold ${
                            selected
                              ? "border-[#172554] bg-[#172554] text-white"
                              : "border-[#6b7280] bg-white text-[#111827]"
                          }`}
                        >
                          {color}
                        </button>
                      );
                    })}

                  </div>

                  {selectedColors.length > 0 && (
                    <p className="mt-3 text-sm font-bold text-[#172554]">
                      Selected:{" "}
                      {selectedColors.join(", ")}
                    </p>
                  )}

                </div>

                {/* SIZE CHART */}

                <div>

                  <h3 className="mb-2 text-base font-extrabold text-[#111827]">
                    Size Chart
                  </h3>

                  <p className="mb-3 text-xs font-bold text-[#4b5563]">
                    Optional. Add measurements or any
                    size information buyers should see.
                  </p>

                  <textarea
                    value={sizeChart}
                    onChange={(event) =>
                      setSizeChart(
                        event.target.value
                      )
                    }
                    rows={6}
                    placeholder={`Example:

Size     Chest     Length
S        36"       27"
M        38"       28"
L        40"       29"
XL       42"       30"`}
                    className="w-full resize-none rounded-xl border-2 border-[#6b7280] bg-white p-4 font-bold text-[#111827] outline-none placeholder:text-[#6b7280] focus:border-[#172554]"
                  />

                </div>

              </div>

            </div>
          )}

          {/* =================================================
              STEP 4
          ================================================= */}

          {step === 4 && (
            <div>

              <div className="border-b-2 border-[#e5e7eb] px-5 py-5 sm:px-7">

                <h2 className="text-2xl font-extrabold text-[#111827]">
                  Review & Publish
                </h2>

                <p className="mt-1 text-sm font-bold text-[#374151]">
                  Check your product before publishing
                </p>

              </div>

              <div className="space-y-5 p-5 sm:p-7">

                {/* PHOTOS */}

                <div>

                  <h3 className="mb-3 text-base font-extrabold text-[#111827]">
                    Product Photos
                  </h3>

                  <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">

                    {images.map(
                      (image, index) => (

                        <div
                          key={index}
                          className="overflow-hidden rounded-xl border-2 border-[#d1d5db] bg-[#f8fafc]"
                        >

                          {image ? (

                            <img
                              src={image}
                              alt={
                                imageLabels[index]
                              }
                              className="h-36 w-full bg-white object-contain"
                            />

                          ) : (

                            <div className="flex h-36 items-center justify-center text-sm font-bold text-[#4b5563]">
                              No Photo
                            </div>

                          )}

                          <div className="border-t-2 border-[#e5e7eb] p-2 text-center">

                            <p className="text-xs font-extrabold text-[#111827]">
                              {
                                imageLabels[
                                  index
                                ]
                              }
                            </p>

                          </div>

                        </div>

                      )
                    )}

                  </div>

                </div>

                {/* DETAILS */}

                <div className="rounded-2xl border-2 border-[#d1d5db] bg-[#f8fafc] p-5">

                  <div className="grid gap-5 sm:grid-cols-2">

                    <div>

                      <p className="text-xs font-bold text-[#4b5563]">
                        Category
                      </p>

                      <p className="mt-1 font-extrabold text-[#111827]">
                        {category}
                      </p>

                    </div>

                    <div>

                      <p className="text-xs font-bold text-[#4b5563]">
                        Product Name
                      </p>

                      <p className="mt-1 font-extrabold text-[#111827]">
                        {productName}
                      </p>

                    </div>

                    <div className="sm:col-span-2">

                      <p className="text-xs font-bold text-[#4b5563]">
                        Description
                      </p>

                      <p className="mt-1 font-semibold text-[#111827] whitespace-pre-line">
                        {description}
                      </p>

                    </div>

                    <div>

                      <p className="text-xs font-bold text-[#4b5563]">
                        Price
                      </p>

                      <p className="mt-1 text-xl font-extrabold text-[#111827]">
                        ₹{price}
                      </p>

                    </div>

                    <div>

                      <p className="text-xs font-bold text-[#4b5563]">
                        Stock
                      </p>

                      <p className="mt-1 text-xl font-extrabold text-[#111827]">
                        {stock}
                      </p>

                    </div>

                    <div>

                      <p className="text-xs font-bold text-[#4b5563]">
                        Sizes
                      </p>

                      <p className="mt-1 font-extrabold text-[#111827]">
                        {selectedSizes.join(
                          ", "
                        )}
                      </p>

                    </div>

                    <div>

                      <p className="text-xs font-bold text-[#4b5563]">
                        Colours
                      </p>

                      <p className="mt-1 font-extrabold text-[#111827]">
                        {selectedColors.join(
                          ", "
                        )}
                      </p>

                    </div>

                    <div className="sm:col-span-2">

                      <p className="text-xs font-bold text-[#4b5563]">
                        Size Chart
                      </p>

                      <p className="mt-2 whitespace-pre-line rounded-xl border border-[#d1d5db] bg-white p-4 font-semibold text-[#111827]">
                        {sizeChart.trim()
                          ? sizeChart
                          : "No size chart added"}
                      </p>

                    </div>

                  </div>

                </div>

                <div className="rounded-xl border-2 border-[#c7d2fe] bg-[#eef2ff] p-4">

                  <p className="font-extrabold text-[#172554]">
                    ✓ Product is ready to publish
                  </p>

                  <p className="mt-1 text-sm font-bold text-[#374151]">
                    Check the details once and publish
                    your product.
                  </p>

                </div>

              </div>

            </div>
          )}

          {/* BOTTOM BUTTONS */}

          <div className="flex gap-3 border-t-2 border-[#e5e7eb] bg-[#f8fafc] p-4 sm:p-6">

            {step > 1 && (

              <button
                type="button"
                onClick={previousStep}
                disabled={publishing}
                className="w-1/2 rounded-xl border-2 border-[#111827] bg-white px-6 py-4 font-extrabold text-[#111827] hover:bg-gray-100 disabled:opacity-50"
              >
                ← Back
              </button>

            )}

            {step < 4 ? (

              <button
                type="button"
                onClick={nextStep}
                disabled={!canContinue()}
                className={`rounded-xl px-8 py-4 font-extrabold text-white ${
                  step === 1
                    ? "w-full"
                    : "w-1/2"
                } ${
                  canContinue()
                    ? "bg-[#172554] hover:bg-[#0f1b3d]"
                    : "cursor-not-allowed bg-[#9ca3af]"
                }`}
              >
                Next →
              </button>

            ) : (

              <button
                type="button"
                onClick={publishProduct}
                disabled={publishing}
                className="w-full rounded-xl bg-[#172554] px-8 py-4 font-extrabold text-white hover:bg-[#0f1b3d] disabled:cursor-not-allowed disabled:bg-gray-500"
              >
                {publishing
                  ? "Publishing..."
                  : "✓ Publish Product"}
              </button>

            )}

          </div>

        </section>

      </div>

      {/* =====================================================
          CATEGORY MODAL
      ===================================================== */}

      {showCategory && (

        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">

          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-6">

            <div className="mb-5 flex items-center justify-between">

              <div>

                <h2 className="text-xl font-extrabold text-[#111827]">
                  {showKidsCategories
                    ? "Kids Wear"
                    : "Select Category"}
                </h2>

                <p className="mt-1 text-sm font-bold text-[#4b5563]">
                  {showKidsCategories
                    ? "Select boys or girls wear"
                    : "Choose your product category"}
                </p>

              </div>

              <button
                type="button"
                onClick={() => {
                  setShowCategory(false);
                  setShowKidsCategories(false);
                }}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f3f4f6] text-xl font-extrabold text-[#111827]"
              >
                ×
              </button>

            </div>

            {showKidsCategories ? (

              <div>

                <button
                  type="button"
                  onClick={() => {
                    setShowKidsCategories(false);
                  }}
                  className="mb-4 font-extrabold text-[#172554]"
                >
                  ← All Categories
                </button>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                  <button
                    type="button"
                    onClick={() =>
                      selectCategory(
                        "Boys Kids Wear"
                      )
                    }
                    className="rounded-2xl border-2 border-[#9ca3af] bg-white p-5 text-left hover:border-[#172554] hover:bg-[#eef2ff]"
                  >

                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#e8ecf7] text-2xl">
                      👦
                    </div>

                    <p className="font-extrabold text-[#111827]">
                      Boys Kids Wear
                    </p>

                    <p className="mt-1 text-xs font-bold text-[#4b5563]">
                      Clothing for boys
                    </p>

                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      selectCategory(
                        "Girls Kids Wear"
                      )
                    }
                    className="rounded-2xl border-2 border-[#9ca3af] bg-white p-5 text-left hover:border-[#172554] hover:bg-[#eef2ff]"
                  >

                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#e8ecf7] text-2xl">
                      👧
                    </div>

                    <p className="font-extrabold text-[#111827]">
                      Girls Kids Wear
                    </p>

                    <p className="mt-1 text-xs font-bold text-[#4b5563]">
                      Clothing for girls
                    </p>

                  </button>

                </div>

              </div>

            ) : (

              <div className="space-y-3">

                {mainCategories.map(
                  ([name, icon, description]) => (

                    <button
                      type="button"
                      key={name}
                      onClick={() =>
                        selectMainCategory(
                          name
                        )
                      }
                      className="flex w-full items-center justify-between rounded-xl border-2 border-[#9ca3af] bg-white p-4 text-left hover:border-[#172554] hover:bg-[#f8fafc]"
                    >

                      <div className="flex items-center gap-4">

                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#eef2ff] text-xl">
                          {icon}
                        </div>

                        <div>

                          <p className="font-extrabold text-[#111827]">
                            {name}
                          </p>

                          <p className="mt-1 text-xs font-bold text-[#4b5563]">
                            {description}
                          </p>

                        </div>

                      </div>

                      <span className="text-xl font-extrabold text-[#374151]">
                        ›
                      </span>

                    </button>

                  )
                )}

              </div>

            )}

          </div>

        </div>

      )}

    </main>
  );
}