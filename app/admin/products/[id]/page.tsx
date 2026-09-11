"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Product = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  stock: number;
  image?: string | null;
  images?: string | null;
  sizes?: string | null;
  colors?: string | null;
  sizeChart?: string | null;
  createdAt: string;
  updatedAt?: string;

  category?: {
    id: string;
    name: string;
  } | null;

  seller?: {
    id: string;
    shopName: string;
    ownerName: string;
    city: string;
    address?: string | null;
    approved: boolean;

    user?: {
      id: string;
      name: string;
      email: string;
      phone: string;
      isBlocked: boolean;
      createdAt: string;
    } | null;
  } | null;

  sellerStatus: "ACTIVE" | "BLOCKED" | "PENDING";
};

export default function AdminProductDetailsPage() {
  const router = useRouter();
  const params = useParams();

  const productId = String(params.id);

  const [product, setProduct] =
    useState<Product | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (productId) {
      loadProduct();
    }
  }, [productId]);

  async function loadProduct() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/admin/products/${productId}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Product details could not be loaded."
        );
      }

      setProduct(result.data);
    } catch (error) {
      console.error(
        "ADMIN PRODUCT DETAILS ERROR:",
        error
      );

      setError(
        "Product details load nahi ho paaye."
      );
    } finally {
      setLoading(false);
    }
  }

  function formatAmount(amount: number) {
    return `₹${Number(
      amount || 0
    ).toLocaleString("en-IN")}`;
  }

  function formatDate(date?: string) {
    if (!date) return "-";

    try {
      return new Date(date).toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }
      );
    } catch {
      return date;
    }
  }

  function parseArray(value?: string | null) {
    if (!value) return [];

    try {
      const parsed = JSON.parse(value);

      return Array.isArray(parsed)
        ? parsed
        : [];
    } catch {
      return [];
    }
  }

  if (loading) {
    return (
      <main className="details-page">
        <style>{`
          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            background: #f6f7fb;
          }

          .details-page {
            min-height: 100vh;
            background: #f6f7fb;
            font-family: Arial, Helvetica, sans-serif;
            color: #171717;
          }

          .center-state {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #888;
            font-size: 14px;
          }
        `}</style>

        <div className="center-state">
          Loading product details...
        </div>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="details-page">
        <style>{`
          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            background: #f6f7fb;
          }

          .details-page {
            min-height: 100vh;
            background: #f6f7fb;
            font-family: Arial, Helvetica, sans-serif;
            color: #171717;
          }

          .error-container {
            max-width: 700px;
            margin: 0 auto;
            padding: 80px 20px;
            text-align: center;
          }

          .error-title {
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 10px;
          }

          .error-message {
            color: #c62828;
            font-size: 14px;
            margin-bottom: 25px;
          }

          .back-button {
            border: 1px solid #ddd;
            background: white;
            border-radius: 9px;
            padding: 10px 15px;
            cursor: pointer;
            font-weight: 700;
          }
        `}</style>

        <div className="error-container">
          <div className="error-title">
            Product Not Found
          </div>

          <div className="error-message">
            {error || "This product does not exist."}
          </div>

          <button
            className="back-button"
            onClick={() =>
              router.push("/admin/products")
            }
          >
            ← Back to Products
          </button>
        </div>
      </main>
    );
  }

  const sizes = parseArray(product.sizes);
  const colors = parseArray(product.colors);
  const images = parseArray(product.images);

  const allImages = [
    ...(product.image
      ? [product.image]
      : []),
    ...images,
  ].filter(
    (image, index, array) =>
      image &&
      array.indexOf(image) === index
  );

  const stockClass =
    product.stock <= 0
      ? "out"
      : product.stock <= 5
      ? "low"
      : "good";

  return (
    <main className="details-page">
      <style suppressHydrationWarning>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: #f6f7fb;
        }

        .details-page {
          min-height: 100vh;
          background: #f6f7fb;
          color: #171717;
          font-family: Arial, Helvetica, sans-serif;
        }

        .details-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 30px;
        }

        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 25px;
        }

        .title h1 {
          margin: 0;
          font-size: 28px;
        }

        .title p {
          margin: 7px 0 0;
          color: #888;
          font-size: 13px;
        }

        .back-button,
        .refresh-button {
          border: 1px solid #ddd;
          background: white;
          border-radius: 9px;
          padding: 10px 14px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 700;
        }

        .back-button:hover,
        .refresh-button:hover {
          background: #f4f4f4;
        }

        .main-grid {
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }

        .panel {
          background: white;
          border: 1px solid #e8e8e8;
          border-radius: 14px;
          padding: 22px;
        }

        .panel-title {
          font-size: 17px;
          font-weight: 700;
          margin-bottom: 18px;
        }

        .product-section {
          display: grid;
          grid-template-columns: 360px 1fr;
          gap: 25px;
        }

        .main-image {
          width: 100%;
          height: 360px;
          border-radius: 14px;
          object-fit: cover;
          background: #f2f2f2;
          border: 1px solid #eee;
        }

        .image-placeholder {
          width: 100%;
          height: 360px;
          border-radius: 14px;
          background: #f2f2f2;
          border: 1px solid #eee;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #aaa;
          font-size: 13px;
        }

        .thumbnail-row {
          display: flex;
          gap: 8px;
          margin-top: 10px;
          overflow-x: auto;
        }

        .thumbnail {
          width: 58px;
          height: 58px;
          border-radius: 8px;
          object-fit: cover;
          border: 1px solid #ddd;
        }

        .product-name {
          font-size: 25px;
          font-weight: 750;
          margin-bottom: 10px;
        }

        .product-id {
          font-size: 10px;
          color: #999;
          margin-bottom: 18px;
          word-break: break-all;
        }

        .description {
          color: #666;
          font-size: 13px;
          line-height: 1.7;
          margin-bottom: 20px;
        }

        .price {
          font-size: 28px;
          font-weight: 800;
          margin-bottom: 20px;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .info-box {
          background: #fafafa;
          border: 1px solid #eee;
          border-radius: 10px;
          padding: 13px;
        }

        .info-label {
          color: #999;
          font-size: 10px;
          margin-bottom: 5px;
        }

        .info-value {
          font-size: 13px;
          font-weight: 700;
        }

        .stock {
          font-weight: 800;
        }

        .stock.good {
          color: #188a43;
        }

        .stock.low {
          color: #c77700;
        }

        .stock.out {
          color: #c62828;
        }

        .badge-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .badge {
          display: inline-flex;
          padding: 7px 10px;
          border-radius: 20px;
          background: #f2f2f2;
          font-size: 11px;
          font-weight: 700;
        }

        .status {
          display: inline-flex;
          padding: 7px 11px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 800;
        }

        .status.active {
          background: #e9f8ee;
          color: #188a43;
        }

        .status.blocked {
          background: #ffeaea;
          color: #c62828;
        }

        .status.pending {
          background: #fff6db;
          color: #a66b00;
        }

        .seller-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 20px;
        }

        .seller-name {
          font-size: 20px;
          font-weight: 750;
        }

        .seller-owner {
          color: #888;
          font-size: 12px;
          margin-top: 4px;
        }

        .seller-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .seller-info {
          border: 1px solid #eee;
          border-radius: 10px;
          padding: 13px;
        }

        .seller-info-label {
          color: #999;
          font-size: 10px;
          margin-bottom: 5px;
        }

        .seller-info-value {
          font-size: 12px;
          font-weight: 700;
          word-break: break-word;
        }

        .section {
          margin-bottom: 20px;
        }

        .section-title {
          font-size: 14px;
          font-weight: 700;
          margin-bottom: 10px;
        }

        .empty-text {
          color: #999;
          font-size: 12px;
        }

        .meta-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }

        .meta-card {
          border: 1px solid #eee;
          border-radius: 10px;
          padding: 14px;
          background: #fafafa;
        }

        .meta-label {
          color: #999;
          font-size: 10px;
          margin-bottom: 5px;
        }

        .meta-value {
          font-size: 12px;
          font-weight: 700;
        }

        @media (max-width: 1000px) {
          .main-grid {
            grid-template-columns: 1fr;
          }

          .product-section {
            grid-template-columns: 280px 1fr;
          }

          .meta-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 700px) {
          .details-container {
            padding: 18px;
          }

          .topbar {
            align-items: flex-start;
            flex-direction: column;
          }

          .product-section {
            grid-template-columns: 1fr;
          }

          .main-image,
          .image-placeholder {
            height: 300px;
          }

          .info-grid,
          .seller-grid,
          .meta-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="details-container">
        <div className="topbar">
          <div className="title">
            <h1>Product Details</h1>

            <p>
              View complete marketplace product
              information.
            </p>
          </div>

          <div>
            <button
              className="back-button"
              onClick={() =>
                router.push("/admin/products")
              }
            >
              ← Products
            </button>

            {" "}

            <button
              className="refresh-button"
              onClick={loadProduct}
            >
              ↻ Refresh
            </button>
          </div>
        </div>

        <div className="main-grid">
          <section className="panel">
            <div className="product-section">
              <div>
                {allImages.length > 0 ? (
                  <>
                    <img
                      src={allImages[0]}
                      alt={product.name}
                      className="main-image"
                    />

                    {allImages.length > 1 && (
                      <div className="thumbnail-row">
                        {allImages.map(
                          (image, index) => (
                            <img
                              key={`${image}-${index}`}
                              src={image}
                              alt={`${product.name} ${
                                index + 1
                              }`}
                              className="thumbnail"
                            />
                          )
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="image-placeholder">
                    No product image
                  </div>
                )}
              </div>

              <div>
                <div className="product-name">
                  {product.name}
                </div>

                <div className="product-id">
                  Product ID: {product.id}
                </div>

                <div className="price">
                  {formatAmount(product.price)}
                </div>

                <div className="description">
                  {product.description ||
                    "No product description available."}
                </div>

                <div className="info-grid">
                  <div className="info-box">
                    <div className="info-label">
                      CATEGORY
                    </div>

                    <div className="info-value">
                      {product.category?.name ||
                        "Uncategorized"}
                    </div>
                  </div>

                  <div className="info-box">
                    <div className="info-label">
                      STOCK
                    </div>

                    <div
                      className={`info-value stock ${stockClass}`}
                    >
                      {product.stock}
                    </div>
                  </div>

                  <div className="info-box">
                    <div className="info-label">
                      CREATED
                    </div>

                    <div className="info-value">
                      {formatDate(product.createdAt)}
                    </div>
                  </div>

                  <div className="info-box">
                    <div className="info-label">
                      SELLER STATUS
                    </div>

                    <div>
                      <span
                        className={`status ${
                          product.sellerStatus ===
                          "ACTIVE"
                            ? "active"
                            : product.sellerStatus ===
                              "BLOCKED"
                            ? "blocked"
                            : "pending"
                        }`}
                      >
                        {product.sellerStatus}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="seller-header">
              <div>
                <div className="seller-name">
                  {product.seller?.shopName ||
                    "Unknown Seller"}
                </div>

                <div className="seller-owner">
                  Owner:{" "}
                  {product.seller?.ownerName ||
                    "Unknown"}
                </div>
              </div>

              <span
                className={`status ${
                  product.sellerStatus ===
                  "ACTIVE"
                    ? "active"
                    : product.sellerStatus ===
                      "BLOCKED"
                    ? "blocked"
                    : "pending"
                }`}
              >
                {product.sellerStatus}
              </span>
            </div>

            <div className="seller-grid">
              <div className="seller-info">
                <div className="seller-info-label">
                  SHOP
                </div>

                <div className="seller-info-value">
                  {product.seller?.shopName ||
                    "-"}
                </div>
              </div>

              <div className="seller-info">
                <div className="seller-info-label">
                  OWNER
                </div>

                <div className="seller-info-value">
                  {product.seller?.ownerName ||
                    "-"}
                </div>
              </div>

              <div className="seller-info">
                <div className="seller-info-label">
                  CITY
                </div>

                <div className="seller-info-value">
                  {product.seller?.city || "-"}
                </div>
              </div>

              <div className="seller-info">
                <div className="seller-info-label">
                  ADDRESS
                </div>

                <div className="seller-info-value">
                  {product.seller?.address || "-"}
                </div>
              </div>

              <div className="seller-info">
                <div className="seller-info-label">
                  EMAIL
                </div>

                <div className="seller-info-value">
                  {product.seller?.user?.email ||
                    "-"}
                </div>
              </div>

              <div className="seller-info">
                <div className="seller-info-label">
                  PHONE
                </div>

                <div className="seller-info-value">
                  {product.seller?.user?.phone ||
                    "-"}
                </div>
              </div>

              <div className="seller-info">
                <div className="seller-info-label">
                  APPROVAL
                </div>

                <div className="seller-info-value">
                  {product.seller?.approved
                    ? "Approved"
                    : "Not Approved"}
                </div>
              </div>

              <div className="seller-info">
                <div className="seller-info-label">
                  ACCOUNT
                </div>

                <div className="seller-info-value">
                  {product.seller?.user?.isBlocked
                    ? "Blocked"
                    : "Active"}
                </div>
              </div>
            </div>
          </section>
        </div>

        <section className="panel section">
          <div className="section-title">
            Available Sizes
          </div>

          {sizes.length > 0 ? (
            <div className="badge-row">
              {sizes.map((size, index) => (
                <span
                  className="badge"
                  key={`${size}-${index}`}
                >
                  {String(size)}
                </span>
              ))}
            </div>
          ) : (
            <div className="empty-text">
              No sizes available.
            </div>
          )}
        </section>

        <section className="panel section">
          <div className="section-title">
            Available Colours
          </div>

          {colors.length > 0 ? (
            <div className="badge-row">
              {colors.map((color, index) => (
                <span
                  className="badge"
                  key={`${color}-${index}`}
                >
                  {String(color)}
                </span>
              ))}
            </div>
          ) : (
            <div className="empty-text">
              No colours available.
            </div>
          )}
        </section>

        <section className="panel">
          <div className="section-title">
            Product Information
          </div>

          <div className="meta-grid">
            <div className="meta-card">
              <div className="meta-label">
                PRODUCT ID
              </div>

              <div className="meta-value">
                {product.id}
              </div>
            </div>

            <div className="meta-card">
              <div className="meta-label">
                CATEGORY ID
              </div>

              <div className="meta-value">
                {product.category?.id || "-"}
              </div>
            </div>

            <div className="meta-card">
              <div className="meta-label">
                SELLER ID
              </div>

              <div className="meta-value">
                {product.seller?.id || "-"}
              </div>
            </div>

            <div className="meta-card">
              <div className="meta-label">
                CREATED
              </div>

              <div className="meta-value">
                {formatDate(product.createdAt)}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}