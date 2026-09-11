"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type DeliveryStatus =
  | "PENDING"
  | "CONFIRMED"
  | "READY_FOR_PICKUP"
  | "PICKED_UP"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

type Delivery = {
  id: string;
  orderId: string;
  customer: string;
  customerPhone?: string | null;
  seller: string;
  shopName?: string | null;
  amount: number;
  status: DeliveryStatus;
  paymentMethod?: string;
  paymentStatus?: string;
  createdAt: string;
  pickedUpAt?: string | null;
  deliveredAt?: string | null;
};

type ApiResponse = {
  success: boolean;
  message?: string;
  data?: Delivery[];
};

export default function AdminDeliveryPage() {
  const router = useRouter();

  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<"ALL" | DeliveryStatus>("ALL");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] =
    useState<Date | null>(null);

  async function loadDeliveries() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/admin/delivery",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const result: ApiResponse =
        await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Delivery data could not be loaded."
        );
      }

      setDeliveries(
        Array.isArray(result.data)
          ? result.data
          : []
      );

      setLastUpdated(new Date());
    } catch (error) {
      console.error(
        "ADMIN DELIVERY ERROR:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Delivery data load nahi ho paaya."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDeliveries();
  }, []);

  const filteredDeliveries = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return deliveries.filter((delivery) => {
      const matchesSearch =
        !query ||
        delivery.orderId
          .toLowerCase()
          .includes(query) ||
        delivery.id
          .toLowerCase()
          .includes(query) ||
        delivery.customer
          .toLowerCase()
          .includes(query) ||
        delivery.seller
          .toLowerCase()
          .includes(query) ||
        (delivery.shopName || "")
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "ALL" ||
        delivery.status === statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    deliveries,
    search,
    statusFilter,
  ]);

  const stats = useMemo(() => {
    return {
      total: deliveries.length,

      pending: deliveries.filter(
        (item) =>
          item.status === "PENDING" ||
          item.status === "CONFIRMED" ||
          item.status ===
            "READY_FOR_PICKUP"
      ).length,

      pickedUp: deliveries.filter(
        (item) =>
          item.status === "PICKED_UP"
      ).length,

      outForDelivery: deliveries.filter(
        (item) =>
          item.status ===
          "OUT_FOR_DELIVERY"
      ).length,

      delivered: deliveries.filter(
        (item) =>
          item.status === "DELIVERED"
      ).length,

      cancelled: deliveries.filter(
        (item) =>
          item.status === "CANCELLED"
      ).length,
    };
  }, [deliveries]);

  function formatAmount(
    amount: number
  ) {
    return `₹${Number(
      amount || 0
    ).toLocaleString("en-IN")}`;
  }

  function formatDate(
    date?: string | null
  ) {
    if (!date) return "—";

    try {
      return new Date(
        date
      ).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "—";
    }
  }

  function formatTime(
    date?: string | null
  ) {
    if (!date) return "—";

    try {
      return new Date(
        date
      ).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "—";
    }
  }

  function statusText(
    status: DeliveryStatus
  ) {
    switch (status) {
      case "CONFIRMED":
        return "Confirmed";

      case "READY_FOR_PICKUP":
        return "Ready for pickup";

      case "PICKED_UP":
        return "Picked up";

      case "OUT_FOR_DELIVERY":
        return "Out for delivery";

      case "DELIVERED":
        return "Delivered";

      case "CANCELLED":
        return "Cancelled";

      default:
        return "Pending";
    }
  }

  function statusClass(
    status: DeliveryStatus
  ) {
    switch (status) {
      case "CONFIRMED":
      case "READY_FOR_PICKUP":
        return "status confirmed";

      case "PICKED_UP":
        return "status picked";

      case "OUT_FOR_DELIVERY":
        return "status out";

      case "DELIVERED":
        return "status delivered";

      case "CANCELLED":
        return "status cancelled";

      default:
        return "status pending";
    }
  }

  return (
    <main className="page">
      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: #f5f6f8;
        }

        .page {
          min-height: 100vh;
          background: #f5f6f8;
          color: #171717;
          font-family:
            Arial,
            Helvetica,
            sans-serif;
        }

        .container {
          max-width: 1550px;
          margin: 0 auto;
          padding: 30px;
        }

        /* HEADER */

        .header {
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

        .title p {
          margin: 7px 0 0;
          color: #777;
          font-size: 13px;
        }

        .last-updated {
          margin-top: 8px;
          color: #aaa;
          font-size: 10px;
        }

        .header-actions {
          display: flex;
          gap: 10px;
        }

        .button {
          height: 40px;
          padding: 0 16px;
          border-radius: 9px;
          border: 1px solid #ddd;
          background: #fff;
          color: #222;
          cursor: pointer;
          font-size: 12px;
          font-weight: 700;
        }

        .button:hover {
          background: #f1f1f1;
        }

        .button.dark {
          background: #111;
          border-color: #111;
          color: white;
        }

        .button.dark:hover {
          background: #292929;
        }

        .button:disabled {
          opacity: .55;
          cursor: not-allowed;
        }

        /* ERROR */

        .error {
          margin-bottom: 20px;
          padding: 14px 16px;
          border-radius: 10px;
          background: #fff0f0;
          border: 1px solid #ffd0d0;
          color: #c62828;
          font-size: 12px;
          font-weight: 600;
        }

        /* STATS */

        .stats {
          display: grid;
          grid-template-columns:
            repeat(6, 1fr);
          gap: 14px;
          margin-bottom: 22px;
        }

        .stat-card {
          background: #fff;
          border: 1px solid #e7e7e7;
          border-radius: 14px;
          padding: 18px;
        }

        .stat-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .stat-label {
          color: #777;
          font-size: 11px;
          font-weight: 600;
        }

        .stat-icon {
          width: 34px;
          height: 34px;
          border-radius: 9px;
          background: #f3f3f3;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
        }

        .stat-value {
          margin-top: 13px;
          font-size: 25px;
          font-weight: 800;
        }

        .stat-note {
          margin-top: 5px;
          color: #aaa;
          font-size: 10px;
        }

        /* MAIN CARD */

        .card {
          background: white;
          border: 1px solid #e6e6e6;
          border-radius: 15px;
          overflow: hidden;
        }

        .card-header {
          padding: 21px 22px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          border-bottom: 1px solid #eee;
        }

        .card-title {
          font-size: 16px;
          font-weight: 800;
        }

        .card-subtitle {
          margin-top: 5px;
          color: #999;
          font-size: 11px;
        }

        /* FILTERS */

        .filters {
          padding: 16px 22px;
          display: flex;
          align-items: center;
          gap: 10px;
          border-bottom: 1px solid #eee;
          background: #fff;
        }

        .search {
          height: 40px;
          width: 330px;
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 0 13px;
          outline: none;
          font-size: 12px;
          background: #fff;
        }

        .search:focus {
          border-color: #999;
        }

        .select {
          height: 40px;
          min-width: 170px;
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 0 11px;
          outline: none;
          background: #fff;
          font-size: 12px;
        }

        .result {
          margin-left: auto;
          color: #999;
          font-size: 11px;
        }

        /* TABLE */

        .table-wrapper {
          overflow-x: auto;
        }

        table {
          width: 100%;
          min-width: 1150px;
          border-collapse: collapse;
        }

        th {
          padding: 13px 18px;
          background: #fafafa;
          color: #999;
          border-bottom: 1px solid #eee;
          font-size: 10px;
          font-weight: 700;
          text-align: left;
          white-space: nowrap;
        }

        td {
          padding: 17px 18px;
          border-bottom: 1px solid #f0f0f0;
          font-size: 12px;
          vertical-align: middle;
        }

        tbody tr:hover {
          background: #fafafa;
        }

        tbody tr:last-child td {
          border-bottom: none;
        }

        .order-button {
          border: none;
          background: transparent;
          padding: 0;
          cursor: pointer;
          font-size: 12px;
          font-weight: 800;
          color: #111;
        }

        .order-button:hover {
          text-decoration: underline;
        }

        .customer {
          font-weight: 700;
        }

        .secondary {
          display: block;
          margin-top: 4px;
          color: #999;
          font-size: 10px;
        }

        .seller {
          font-weight: 700;
        }

        .amount {
          font-weight: 800;
        }

        .payment {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 8px;
          border-radius: 6px;
          background: #f4f4f4;
          color: #555;
          font-size: 9px;
          font-weight: 700;
        }

        .status {
          display: inline-flex;
          align-items: center;
          padding: 6px 10px;
          border-radius: 20px;
          font-size: 9px;
          font-weight: 800;
          white-space: nowrap;
        }

        .status.pending {
          background: #fff5d8;
          color: #986800;
        }

        .status.confirmed {
          background: #fff5d8;
          color: #986800;
        }

        .status.picked {
          background: #e9f1ff;
          color: #255b9d;
        }

        .status.out {
          background: #e9f8ff;
          color: #08759c;
        }

        .status.delivered {
          background: #e8f8ed;
          color: #178343;
        }

        .status.cancelled {
          background: #ffeaea;
          color: #c62828;
        }

        /* EMPTY */

        .empty {
          padding: 75px 20px;
          text-align: center;
        }

        .empty-icon {
          width: 64px;
          height: 64px;
          margin: 0 auto 17px;
          border-radius: 50%;
          background: #f3f3f3;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 27px;
        }

        .empty-title {
          font-size: 15px;
          font-weight: 800;
        }

        .empty-text {
          max-width: 440px;
          margin: 8px auto 0;
          color: #999;
          font-size: 11px;
          line-height: 1.6;
        }

        .loading {
          padding: 75px 20px;
          text-align: center;
          color: #888;
          font-size: 13px;
        }

        /* RESPONSIVE */

        @media (max-width: 1250px) {
          .stats {
            grid-template-columns:
              repeat(3, 1fr);
          }
        }

        @media (max-width: 800px) {
          .container {
            padding: 18px;
          }

          .header {
            flex-direction: column;
          }

          .header-actions {
            width: 100%;
          }

          .button {
            flex: 1;
          }

          .stats {
            grid-template-columns:
              repeat(2, 1fr);
          }

          .filters {
            flex-direction: column;
            align-items: stretch;
          }

          .search {
            width: 100%;
          }

          .select {
            width: 100%;
          }

          .result {
            margin-left: 0;
          }
        }

        @media (max-width: 480px) {
          .stats {
            grid-template-columns: 1fr;
          }

          .title h1 {
            font-size: 23px;
          }
        }
      `}</style>

      <div className="container">

        {/* HEADER */}

        <header className="header">

          <div className="title">

            <h1>
              Delivery Management
            </h1>

            <p>
              Monitor and manage all ClothTym marketplace deliveries.
            </p>

            {lastUpdated && (
              <div className="last-updated">
                Last updated{" "}
                {lastUpdated.toLocaleTimeString(
                  "en-IN",
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                )}
              </div>
            )}

          </div>

          <div className="header-actions">

            <button
              className="button"
              onClick={() =>
                router.push("/admin")
              }
            >
              ← Dashboard
            </button>

            <button
              className="button dark"
              onClick={loadDeliveries}
              disabled={loading}
            >
              {loading
                ? "Refreshing..."
                : "↻ Refresh"}
            </button>

          </div>

        </header>

        {/* ERROR */}

        {error && (
          <div className="error">
            {error}
          </div>
        )}

        {/* STATISTICS */}

        <section className="stats">

          <div className="stat-card">
            <div className="stat-top">
              <span className="stat-label">
                Total Deliveries
              </span>
              <span className="stat-icon">
                🚚
              </span>
            </div>

            <div className="stat-value">
              {loading
                ? "..."
                : stats.total}
            </div>

            <div className="stat-note">
              All marketplace deliveries
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              <span className="stat-label">
                Pending
              </span>
              <span className="stat-icon">
                ⏳
              </span>
            </div>

            <div className="stat-value">
              {loading
                ? "..."
                : stats.pending}
            </div>

            <div className="stat-note">
              Awaiting pickup
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              <span className="stat-label">
                Picked Up
              </span>
              <span className="stat-icon">
                📦
              </span>
            </div>

            <div className="stat-value">
              {loading
                ? "..."
                : stats.pickedUp}
            </div>

            <div className="stat-note">
              Picked from seller
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              <span className="stat-label">
                Out for Delivery
              </span>
              <span className="stat-icon">
                🛵
              </span>
            </div>

            <div className="stat-value">
              {loading
                ? "..."
                : stats.outForDelivery}
            </div>

            <div className="stat-note">
              Currently on the way
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              <span className="stat-label">
                Delivered
              </span>
              <span className="stat-icon">
                ✓
              </span>
            </div>

            <div className="stat-value">
              {loading
                ? "..."
                : stats.delivered}
            </div>

            <div className="stat-note">
              Successfully delivered
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              <span className="stat-label">
                Cancelled
              </span>
              <span className="stat-icon">
                !
              </span>
            </div>

            <div className="stat-value">
              {loading
                ? "..."
                : stats.cancelled}
            </div>

            <div className="stat-note">
              Cancelled deliveries
            </div>
          </div>

        </section>

        {/* DELIVERY TABLE */}

        <section className="card">

          <div className="card-header">

            <div>
              <div className="card-title">
                Delivery Orders
              </div>

              <div className="card-subtitle">
                Real delivery data from ClothTym orders database.
              </div>
            </div>

          </div>

          {/* FILTERS */}

          <div className="filters">

            <input
              className="search"
              type="text"
              placeholder="Search order, customer or seller..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />

            <select
              className="select"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as
                    | "ALL"
                    | DeliveryStatus
                )
              }
            >
              <option value="ALL">
                All statuses
              </option>

              <option value="PENDING">
                Pending
              </option>

              <option value="CONFIRMED">
                Confirmed
              </option>

              <option value="READY_FOR_PICKUP">
                Ready for pickup
              </option>

              <option value="PICKED_UP">
                Picked up
              </option>

              <option value="OUT_FOR_DELIVERY">
                Out for delivery
              </option>

              <option value="DELIVERED">
                Delivered
              </option>

              <option value="CANCELLED">
                Cancelled
              </option>
            </select>

            <div className="result">
              {filteredDeliveries.length}{" "}
              deliveries
            </div>

          </div>

          {/* TABLE */}

          {loading ? (

            <div className="loading">
              Loading real delivery data...
            </div>

          ) : filteredDeliveries.length === 0 ? (

            <div className="empty">

              <div className="empty-icon">
                🚚
              </div>

              <div className="empty-title">
                No delivery data found
              </div>

              <div className="empty-text">
                {search ||
                statusFilter !== "ALL"
                  ? "No delivery matches your current search or filter."
                  : "Delivery orders will automatically appear here when orders are available in the database."}
              </div>

            </div>

          ) : (

            <div className="table-wrapper">

              <table>

                <thead>
                  <tr>

                    <th>
                      ORDER
                    </th>

                    <th>
                      CUSTOMER
                    </th>

                    <th>
                      SELLER
                    </th>

                    <th>
                      AMOUNT
                    </th>

                    <th>
                      PAYMENT
                    </th>

                    <th>
                      DELIVERY STATUS
                    </th>

                    <th>
                      CREATED
                    </th>

                    <th>
                      PICKED UP
                    </th>

                    <th>
                      DELIVERED
                    </th>

                  </tr>
                </thead>

                <tbody>

                  {filteredDeliveries.map(
                    (delivery) => (

                      <tr
                        key={delivery.id}
                      >

                        <td>

                          <button
                            className="order-button"
                            onClick={() =>
                              router.push(
                                `/admin/orders/${delivery.orderId}`
                              )
                            }
                          >
                            #{delivery.orderId}
                          </button>

                          <span className="secondary">
                            ID: {delivery.id}
                          </span>

                        </td>

                        <td>

                          <span className="customer">
                            {delivery.customer ||
                              "Customer"}
                          </span>

                          {delivery.customerPhone && (
                            <span className="secondary">
                              {delivery.customerPhone}
                            </span>
                          )}

                        </td>

                        <td>

                          <span className="seller">
                            {delivery.shopName ||
                              delivery.seller ||
                              "Seller"}
                          </span>

                          {delivery.shopName &&
                            delivery.seller && (
                              <span className="secondary">
                                {delivery.seller}
                              </span>
                            )}

                        </td>

                        <td>

                          <span className="amount">
                            {formatAmount(
                              delivery.amount
                            )}
                          </span>

                        </td>

                        <td>

                          <span className="payment">
                            {delivery.paymentMethod ||
                              "COD"}

                            {delivery.paymentStatus
                              ? ` • ${delivery.paymentStatus}`
                              : ""}
                          </span>

                        </td>

                        <td>

                          <span
                            className={statusClass(
                              delivery.status
                            )}
                          >
                            {statusText(
                              delivery.status
                            )}
                          </span>

                        </td>

                        <td>

                          <span>
                            {formatDate(
                              delivery.createdAt
                            )}
                          </span>

                          <span className="secondary">
                            {formatTime(
                              delivery.createdAt
                            )}
                          </span>

                        </td>

                        <td>

                          <span>
                            {formatDate(
                              delivery.pickedUpAt
                            )}
                          </span>

                          {delivery.pickedUpAt && (
                            <span className="secondary">
                              {formatTime(
                                delivery.pickedUpAt
                              )}
                            </span>
                          )}

                        </td>

                        <td>

                          <span>
                            {formatDate(
                              delivery.deliveredAt
                            )}
                          </span>

                          {delivery.deliveredAt && (
                            <span className="secondary">
                              {formatTime(
                                delivery.deliveredAt
                              )}
                            </span>
                          )}

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </section>

      </div>
    </main>
  );
}