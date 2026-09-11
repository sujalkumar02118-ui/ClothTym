"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Review = {
  id: string;
  rating: number;
  comment: string | null;

  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };

  product: {
    id: string;
    name: string;
    price: number;
    image: string;
  };
};

export default function AdminReviewsPage() {
  const router = useRouter();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("ALL");

  async function loadReviews() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/reviews", {
        method: "GET",
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Reviews could not be loaded."
        );
      }

      setReviews(
        Array.isArray(result.reviews)
          ? result.reviews
          : []
      );
    } catch (error) {
      console.error("ADMIN REVIEWS ERROR:", error);
      setError("Reviews data load nahi ho paaya.");
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReviews();
  }, []);

  const filteredReviews = useMemo(() => {
    const searchText = search.toLowerCase().trim();

    return reviews.filter((review) => {
      const matchesSearch =
        review.id.toLowerCase().includes(searchText) ||
        review.customer.name
          .toLowerCase()
          .includes(searchText) ||
        review.customer.email
          .toLowerCase()
          .includes(searchText) ||
        review.customer.phone
          .toLowerCase()
          .includes(searchText) ||
        review.product.name
          .toLowerCase()
          .includes(searchText);

      const matchesRating =
        ratingFilter === "ALL" ||
        review.rating === Number(ratingFilter);

      return matchesSearch && matchesRating;
    });
  }, [reviews, search, ratingFilter]);

  const stats = useMemo(() => {
    const total = reviews.length;

    const average =
      total === 0
        ? 0
        : reviews.reduce(
            (sum, review) => sum + review.rating,
            0
          ) / total;

    const five = reviews.filter(
      (review) => review.rating === 5
    ).length;

    const low = reviews.filter(
      (review) => review.rating <= 2
    ).length;

    return {
      total,
      average: average.toFixed(1),
      five,
      low,
    };
  }, [reviews]);

  function formatAmount(amount: number) {
    return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
  }

  function stars(rating: number) {
    const safeRating = Math.max(
      0,
      Math.min(5, Number(rating) || 0)
    );

    return (
      "★".repeat(safeRating) +
      "☆".repeat(5 - safeRating)
    );
  }

  return (
    <main className="reviews-page">
      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: #f5f6f8;
        }

        .reviews-page {
          min-height: 100vh;
          background: #f5f6f8;
          color: #171717;
          font-family: Arial, Helvetica, sans-serif;
        }

        .container {
          max-width: 1500px;
          margin: 0 auto;
          padding: 30px;
        }

        .topbar {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
          margin-bottom: 28px;
        }

        .title h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.6px;
        }

        .subtitle {
          margin-top: 7px;
          color: #888;
          font-size: 13px;
        }

        .actions {
          display: flex;
          gap: 10px;
        }

        .button {
          height: 40px;
          padding: 0 16px;
          border: 1px solid #dedede;
          background: #fff;
          border-radius: 9px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 700;
        }

        .button:hover {
          background: #f1f1f1;
        }

        .refresh {
          background: #111;
          color: #fff;
          border-color: #111;
        }

        .refresh:hover {
          background: #333;
        }

        .refresh:disabled {
          opacity: .55;
          cursor: not-allowed;
        }

        .stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 20px;
        }

        .stat-card {
          background: #fff;
          border: 1px solid #e7e7e7;
          border-radius: 14px;
          padding: 20px;
        }

        .stat-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .stat-label {
          color: #777;
          font-size: 12px;
          font-weight: 600;
        }

        .stat-icon {
          width: 36px;
          height: 36px;
          display: flex;
          justify-content: center;
          align-items: center;
          background: #f3f3f3;
          border-radius: 9px;
          font-size: 17px;
        }

        .stat-value {
          margin-top: 12px;
          font-size: 27px;
          font-weight: 800;
        }

        .stat-note {
          margin-top: 5px;
          color: #999;
          font-size: 10px;
        }

        .main-card {
          background: #fff;
          border: 1px solid #e6e6e6;
          border-radius: 15px;
          overflow: hidden;
        }

        .card-header {
          padding: 21px 22px;
          border-bottom: 1px solid #eee;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .card-title {
          font-size: 16px;
          font-weight: 800;
        }

        .card-subtitle {
          margin-top: 4px;
          color: #999;
          font-size: 11px;
        }

        .filters {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 16px 22px;
          border-bottom: 1px solid #eee;
          flex-wrap: wrap;
        }

        .search {
          height: 40px;
          width: 340px;
          border: 1px solid #dedede;
          border-radius: 8px;
          padding: 0 13px;
          outline: none;
          font-size: 12px;
        }

        .search:focus {
          border-color: #999;
        }

        .select {
          height: 40px;
          min-width: 155px;
          border: 1px solid #dedede;
          border-radius: 8px;
          padding: 0 11px;
          background: #fff;
          outline: none;
          font-size: 12px;
        }

        .count {
          margin-left: auto;
          color: #999;
          font-size: 11px;
        }

        .table-wrapper {
          width: 100%;
          overflow-x: auto;
        }

        table {
          width: 100%;
          min-width: 1150px;
          border-collapse: collapse;
        }

        th {
          padding: 14px 18px;
          background: #fafafa;
          color: #999;
          border-bottom: 1px solid #eee;
          text-align: left;
          font-size: 10px;
          font-weight: 700;
          white-space: nowrap;
        }

        td {
          padding: 17px 18px;
          border-bottom: 1px solid #f0f0f0;
          vertical-align: middle;
          font-size: 12px;
        }

        tbody tr:hover {
          background: #fafafa;
        }

        tbody tr:last-child td {
          border-bottom: none;
        }

        .review-id {
          color: #111;
          font-weight: 750;
        }

        .customer {
          font-weight: 700;
        }

        .customer-email {
          display: block;
          margin-top: 4px;
          color: #999;
          font-size: 10px;
        }

        .customer-phone {
          display: block;
          margin-top: 3px;
          color: #aaa;
          font-size: 10px;
        }

        .product-box {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 230px;
        }

        .product-image {
          width: 48px;
          height: 58px;
          border-radius: 7px;
          border: 1px solid #eee;
          object-fit: cover;
          background: #f5f5f5;
        }

        .product-info {
          min-width: 0;
        }

        .product-name {
          font-weight: 700;
          max-width: 230px;
          line-height: 1.35;
        }

        .product-price {
          display: block;
          margin-top: 5px;
          color: #777;
          font-size: 10px;
        }

        .stars {
          font-size: 15px;
          letter-spacing: 1px;
          white-space: nowrap;
        }

        .rating-number {
          display: block;
          margin-top: 5px;
          color: #999;
          font-size: 10px;
        }

        .comment {
          max-width: 340px;
          color: #555;
          line-height: 1.55;
        }

        .no-comment {
          color: #aaa;
          font-style: italic;
        }

        .empty {
          padding: 80px 20px;
          text-align: center;
        }

        .empty-icon {
          width: 64px;
          height: 64px;
          margin: 0 auto 16px;
          display: flex;
          justify-content: center;
          align-items: center;
          border-radius: 50%;
          background: #f2f2f2;
          font-size: 27px;
        }

        .empty-title {
          font-size: 16px;
          font-weight: 750;
        }

        .empty-text {
          margin-top: 7px;
          color: #999;
          font-size: 11px;
        }

        .error {
          margin-bottom: 20px;
          padding: 14px 16px;
          border: 1px solid #ffd1d1;
          border-radius: 10px;
          background: #fff2f2;
          color: #c62828;
          font-size: 12px;
          font-weight: 600;
        }

        .loading {
          padding: 80px 20px;
          text-align: center;
          color: #999;
          font-size: 12px;
        }

        .loading-spinner {
          width: 28px;
          height: 28px;
          margin: 0 auto 12px;
          border: 3px solid #eee;
          border-top-color: #111;
          border-radius: 50%;
          animation: spin .8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 1000px) {
          .stats {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 700px) {
          .container {
            padding: 18px;
          }

          .topbar {
            flex-direction: column;
          }

          .actions {
            width: 100%;
          }

          .button {
            flex: 1;
          }

          .stats {
            grid-template-columns: 1fr;
          }

          .filters {
            flex-direction: column;
            align-items: stretch;
          }

          .search,
          .select {
            width: 100%;
          }

          .count {
            margin-left: 0;
          }
        }
      `}</style>

      <div className="container">

        {/* HEADER */}

        <div className="topbar">
          <div className="title">
            <h1>Reviews & Ratings</h1>

            <div className="subtitle">
              Monitor customer feedback, ratings and product reviews.
            </div>
          </div>

          <div className="actions">
            <button
              className="button"
              onClick={() => router.push("/admin")}
            >
              ← Dashboard
            </button>

            <button
              className="button refresh"
              onClick={loadReviews}
              disabled={loading}
            >
              {loading ? "Refreshing..." : "↻ Refresh"}
            </button>
          </div>
        </div>

        {/* ERROR */}

        {error && (
          <div className="error">
            {error}
          </div>
        )}

        {/* STATS */}

        <section className="stats">

          <div className="stat-card">
            <div className="stat-top">
              <span className="stat-label">
                Total Reviews
              </span>

              <span className="stat-icon">
                ⭐
              </span>
            </div>

            <div className="stat-value">
              {loading ? "..." : stats.total}
            </div>

            <div className="stat-note">
              All customer reviews
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              <span className="stat-label">
                Average Rating
              </span>

              <span className="stat-icon">
                ★
              </span>
            </div>

            <div className="stat-value">
              {loading ? "..." : `${stats.average}/5`}
            </div>

            <div className="stat-note">
              Across all products
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              <span className="stat-label">
                5 Star Reviews
              </span>

              <span className="stat-icon">
                🏆
              </span>
            </div>

            <div className="stat-value">
              {loading ? "..." : stats.five}
            </div>

            <div className="stat-note">
              Excellent customer feedback
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              <span className="stat-label">
                Low Ratings
              </span>

              <span className="stat-icon">
                ⚠️
              </span>
            </div>

            <div className="stat-value">
              {loading ? "..." : stats.low}
            </div>

            <div className="stat-note">
              1–2 star reviews
            </div>
          </div>

        </section>

        {/* REVIEWS */}

        <section className="main-card">

          <div className="card-header">
            <div>
              <div className="card-title">
                Customer Reviews
              </div>

              <div className="card-subtitle">
                Live reviews retrieved from the ClothTym database.
              </div>
            </div>
          </div>

          {/* FILTERS */}

          <div className="filters">

            <input
              className="search"
              type="text"
              placeholder="Search customer, phone, product or review ID..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />

            <select
              className="select"
              value={ratingFilter}
              onChange={(event) =>
                setRatingFilter(event.target.value)
              }
            >
              <option value="ALL">
                All ratings
              </option>

              <option value="5">
                ⭐ 5 Stars
              </option>

              <option value="4">
                ⭐ 4 Stars
              </option>

              <option value="3">
                ⭐ 3 Stars
              </option>

              <option value="2">
                ⭐ 2 Stars
              </option>

              <option value="1">
                ⭐ 1 Star
              </option>
            </select>

            <div className="count">
              {filteredReviews.length} reviews
            </div>

          </div>

          {/* TABLE */}

          <div className="table-wrapper">

            {loading ? (

              <div className="loading">
                <div className="loading-spinner" />
                Loading reviews...
              </div>

            ) : filteredReviews.length === 0 ? (

              <div className="empty">

                <div className="empty-icon">
                  ⭐
                </div>

                <div className="empty-title">
                  No reviews found
                </div>

                <div className="empty-text">
                  Customer reviews will appear here when users submit reviews.
                </div>

              </div>

            ) : (

              <table>

                <thead>
                  <tr>
                    <th>REVIEW ID</th>
                    <th>CUSTOMER</th>
                    <th>PRODUCT</th>
                    <th>RATING</th>
                    <th>REVIEW</th>
                  </tr>
                </thead>

                <tbody>

                  {filteredReviews.map((review) => (

                    <tr key={review.id}>

                      {/* REVIEW ID */}

                      <td>
                        <span className="review-id">
                          #{review.id}
                        </span>
                      </td>

                      {/* CUSTOMER */}

                      <td>
                        <span className="customer">
                          {review.customer.name}
                        </span>

                        <span className="customer-email">
                          {review.customer.email}
                        </span>

                        <span className="customer-phone">
                          {review.customer.phone}
                        </span>
                      </td>

                      {/* PRODUCT */}

                      <td>

                        <div className="product-box">

                          {review.product.image ? (
                            <img
                              className="product-image"
                              src={review.product.image}
                              alt={review.product.name}
                            />
                          ) : (
                            <div className="product-image" />
                          )}

                          <div className="product-info">

                            <div className="product-name">
                              {review.product.name}
                            </div>

                            <span className="product-price">
                              {formatAmount(
                                review.product.price
                              )}
                            </span>

                          </div>

                        </div>

                      </td>

                      {/* RATING */}

                      <td>

                        <span className="stars">
                          {stars(review.rating)}
                        </span>

                        <span className="rating-number">
                          {review.rating}/5
                        </span>

                      </td>

                      {/* COMMENT */}

                      <td>

                        <div
                          className={
                            review.comment
                              ? "comment"
                              : "comment no-comment"
                          }
                        >
                          {review.comment ||
                            "No written review provided."}
                        </div>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            )}

          </div>

        </section>

      </div>
    </main>
  );
}