"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Product = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  stock: number;
  image?: string | null;
  sizes?: string | null;
  colors?: string | null;
  createdAt: string;
  seller?: {
    id: string;
    shopName: string;
    ownerName: string;
    city: string;
    approved: boolean;
  } | null;
  category?: {
    id: string;
    name: string;
  } | null;
};

export default function AdminProductsPage() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/products", {
        method: "GET",
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Products could not be loaded."
        );
      }

      setProducts(
        Array.isArray(result.data)
          ? result.data
          : result.data?.products || []
      );
    } catch (error) {
      console.error("ADMIN PRODUCTS ERROR:", error);

      setError("Products load nahi ho paaye.");
    } finally {
      setLoading(false);
    }
  }

  function formatAmount(amount: number) {
    return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
  }

  function formatDate(date: string) {
    try {
      return new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return date;
    }
  }

  const categories = Array.from(
    new Set(
      products
        .map((product) => product.category?.name)
        .filter(Boolean)
    )
  ) as string[];

  const filteredProducts = products.filter((product) => {
    const searchText = search.trim().toLowerCase();

    const matchesSearch =
      !searchText ||
      product.name.toLowerCase().includes(searchText) ||
      product.seller?.shopName
        ?.toLowerCase()
        .includes(searchText) ||
      product.seller?.ownerName
        ?.toLowerCase()
        .includes(searchText);

    const matchesCategory =
      category === "ALL" ||
      product.category?.name === category;

    return matchesSearch && matchesCategory;
  });

  return (
    <main className="products-page">
      <style suppressHydrationWarning>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: #f6f7fb;
        }

        .products-page {
          min-height: 100vh;
          background: #f6f7fb;
          color: #171717;
          font-family: Arial, Helvetica, sans-serif;
        }

        .products-container {
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

        .toolbar {
          background: white;
          border: 1px solid #e8e8e8;
          border-radius: 14px;
          padding: 18px;
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
        }

        .search {
          flex: 1;
          min-width: 200px;
          height: 42px;
          border: 1px solid #ddd;
          border-radius: 9px;
          padding: 0 14px;
          outline: none;
        }

        .category {
          height: 42px;
          min-width: 180px;
          border: 1px solid #ddd;
          border-radius: 9px;
          padding: 0 12px;
          background: white;
        }

        .summary {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
          margin-bottom: 20px;
        }

        .summary-card {
          background: white;
          border: 1px solid #e8e8e8;
          border-radius: 14px;
          padding: 18px;
        }

        .summary-label {
          color: #888;
          font-size: 12px;
        }

        .summary-value {
          margin-top: 8px;
          font-size: 25px;
          font-weight: 750;
        }

        .panel {
          background: white;
          border: 1px solid #e8e8e8;
          border-radius: 14px;
          overflow: hidden;
        }

        .table-wrapper {
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          min-width: 900px;
        }

        th {
          text-align: left;
          padding: 14px;
          font-size: 11px;
          color: #999;
          border-bottom: 1px solid #eee;
          white-space: nowrap;
        }

        td {
          padding: 14px;
          border-bottom: 1px solid #f0f0f0;
          font-size: 12px;
          vertical-align: middle;
        }

        .product-cell {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .product-image {
          width: 52px;
          height: 52px;
          border-radius: 9px;
          background: #f1f1f1;
          object-fit: cover;
          border: 1px solid #eee;
        }

        .product-name {
          font-weight: 700;
          max-width: 230px;
        }

        .product-id {
          color: #999;
          font-size: 10px;
          margin-top: 4px;
        }

        .seller-name {
          font-weight: 700;
        }

        .seller-city {
          color: #999;
          font-size: 10px;
          margin-top: 3px;
        }

        .category-badge {
          display: inline-flex;
          padding: 6px 9px;
          background: #f2f2f2;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 700;
        }

        .stock {
          font-weight: 700;
        }

        .stock.low {
          color: #c77700;
        }

        .stock.out {
          color: #c62828;
        }

        .stock.good {
          color: #188a43;
        }

        .approved {
          display: inline-flex;
          padding: 6px 9px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 700;
        }

        .approved.yes {
          background: #e9f8ee;
          color: #188a43;
        }

        .approved.no {
          background: #ffeaea;
          color: #c62828;
        }

        .details-button {
          border: 1px solid #ddd;
          background: white;
          border-radius: 8px;
          padding: 7px 10px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
        }

        .details-button:hover {
          background: #111;
          color: white;
        }

        .loading,
        .empty,
        .error {
          text-align: center;
          padding: 50px 20px;
          color: #999;
          font-size: 13px;
        }

        .error {
          color: #c62828;
        }

        @media (max-width: 700px) {
          .products-container {
            padding: 18px;
          }

          .topbar {
            align-items: flex-start;
            flex-direction: column;
          }

          .toolbar {
            flex-direction: column;
          }

          .search,
          .category {
            width: 100%;
          }

          .summary {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="products-container">
        <div className="topbar">
          <div className="title">
            <h1>Products</h1>

            <p>
              Manage all marketplace products from one place.
            </p>
          </div>

          <div>
            <button
              className="back-button"
              onClick={() => router.push("/admin")}
            >
              ← Dashboard
            </button>

            {" "}

            <button
              className="refresh-button"
              onClick={loadProducts}
            >
              ↻ Refresh
            </button>
          </div>
        </div>

        <div className="summary">
          <div className="summary-card">
            <div className="summary-label">
              Total Products
            </div>

            <div className="summary-value">
              {loading ? "..." : products.length}
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-label">
              Visible Products
            </div>

            <div className="summary-value">
              {loading ? "..." : filteredProducts.length}
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-label">
              Categories
            </div>

            <div className="summary-value">
              {loading ? "..." : categories.length}
            </div>
          </div>
        </div>

        <div className="toolbar">
          <input
            className="search"
            type="text"
            placeholder="Search product or seller..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />

          <select
            className="category"
            value={category}
            onChange={(event) =>
              setCategory(event.target.value)
            }
          >
            <option value="ALL">
              All Categories
            </option>

            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="error">
            {error}
          </div>
        )}

        <div className="panel">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>PRODUCT</th>
                  <th>SELLER</th>
                  <th>CATEGORY</th>
                  <th>PRICE</th>
                  <th>STOCK</th>
                  <th>SELLER STATUS</th>
                  <th>CREATED</th>
                  <th>ACTION</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="loading">
                        Loading products...
                      </div>
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="empty">
                        No products found.
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => {
                    const stockClass =
                      product.stock <= 0
                        ? "stock out"
                        : product.stock <= 5
                        ? "stock low"
                        : "stock good";

                    return (
                      <tr key={product.id}>
                        <td>
                          <div className="product-cell">
                            {product.image ? (
                              <img
                                src={product.image}
                                alt={product.name}
                                className="product-image"
                              />
                            ) : (
                              <div className="product-image" />
                            )}

                            <div>
                              <div className="product-name">
                                {product.name}
                              </div>

                              <div className="product-id">
                                ID: {product.id}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div className="seller-name">
                            {product.seller?.shopName ||
                              "Unknown Seller"}
                          </div>

                          <div className="seller-city">
                            {product.seller?.ownerName || ""}
                            {product.seller?.city
                              ? ` • ${product.seller.city}`
                              : ""}
                          </div>
                        </td>

                        <td>
                          <span className="category-badge">
                            {product.category?.name ||
                              "Uncategorized"}
                          </span>
                        </td>

                        <td>
                          <strong>
                            {formatAmount(product.price)}
                          </strong>
                        </td>

                        <td>
                          <span className={stockClass}>
                            {product.stock}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`approved ${
                              product.seller?.approved
                                ? "yes"
                                : "no"
                            }`}
                          >
                            {product.seller?.approved
                              ? "Approved"
                              : "Not Approved"}
                          </span>
                        </td>

                        <td>
                          {formatDate(product.createdAt)}
                        </td>

                        <td>
                          <button
                            className="details-button"
                            onClick={() =>
                              router.push(
                                `/admin/products/${product.id}`
                              )
                            }
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}