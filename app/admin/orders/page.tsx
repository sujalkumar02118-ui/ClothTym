"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Order = {
  id: string;
  totalAmount: number;
  status: string;
  address: string;

  paymentMethod: string;
  paymentStatus: string;

  createdAt: string;
  updatedAt: string;

  pickedUpAt?: string | null;
  deliveredAt?: string | null;

  returnStatus: string;
  refundStatus: string;

  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
    isBlocked: boolean;
  };

  items: {
    id: string;
    quantity: number;
    price: number;
    returnStatus: string;

    product: {
      id: string;
      name: string;
      image?: string | null;
      price: number;

      category?: {
        id: string;
        name: string;
      } | null;

      seller?: {
        id: string;
        shopName: string;
        ownerName: string;
      } | null;
    };
  }[];

  itemCount: number;
};

export default function AdminOrdersPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [paymentStatus, setPaymentStatus] = useState("ALL");

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/orders", {
        method: "GET",
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Orders could not be loaded."
        );
      }

      setOrders(
        Array.isArray(result.data)
          ? result.data
          : []
      );
    } catch (error) {
      console.error("ADMIN ORDERS ERROR:", error);
      setError("Orders load nahi ho paaye.");
    } finally {
      setLoading(false);
    }
  }

  function formatAmount(amount: number) {
    return `₹${Number(
      amount || 0
    ).toLocaleString("en-IN")}`;
  }

  function formatDate(date: string) {
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

  function formatStatus(value: string) {
    return value
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  }

  const statuses = Array.from(
    new Set(orders.map((order) => order.status))
  );

  const paymentStatuses = Array.from(
    new Set(
      orders.map(
        (order) => order.paymentStatus
      )
    )
  );

  const filteredOrders = orders.filter(
    (order) => {
      const searchText =
        search.trim().toLowerCase();

      const matchesSearch =
        !searchText ||
        order.id
          .toLowerCase()
          .includes(searchText) ||
        order.customer.name
          .toLowerCase()
          .includes(searchText) ||
        order.customer.email
          .toLowerCase()
          .includes(searchText) ||
        order.customer.phone
          .toLowerCase()
          .includes(searchText);

      const matchesStatus =
        status === "ALL" ||
        order.status === status;

      const matchesPaymentStatus =
        paymentStatus === "ALL" ||
        order.paymentStatus === paymentStatus;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPaymentStatus
      );
    }
  );

  return (
    <main className="orders-page">
      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: #f6f7fb;
        }

        .orders-page {
          min-height: 100vh;
          background: #f6f7fb;
          color: #171717;
          font-family: Arial, Helvetica, sans-serif;
        }

        .orders-container {
          max-width: 1450px;
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

        .actions {
          display: flex;
          gap: 8px;
        }

        .button {
          border: 1px solid #ddd;
          background: white;
          border-radius: 9px;
          padding: 10px 14px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 700;
        }

        .button:hover {
          background: #f1f1f1;
        }

        .summary {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
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

        .filter {
          height: 42px;
          min-width: 180px;
          border: 1px solid #ddd;
          border-radius: 9px;
          padding: 0 12px;
          background: white;
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
          min-width: 1150px;
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

        .order-id {
          font-weight: 700;
          color: #222;
        }

        .customer-name {
          font-weight: 700;
        }

        .customer-info {
          color: #999;
          font-size: 10px;
          margin-top: 3px;
        }

        .amount {
          font-weight: 700;
          font-size: 13px;
        }

        .badge {
          display: inline-flex;
          padding: 6px 9px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 700;
          white-space: nowrap;
        }

        .status {
          background: #f1f1f1;
          color: #333;
        }

        .payment-paid {
          background: #e9f8ee;
          color: #188a43;
        }

        .payment-pending {
          background: #fff5df;
          color: #a66a00;
        }

        .payment-failed {
          background: #ffeaea;
          color: #c62828;
        }

        .payment-refunded {
          background: #eeeaff;
          color: #6246a8;
        }

        .cod {
          background: #f2f2f2;
          color: #444;
        }

        .online {
          background: #eaf2ff;
          color: #2767b1;
        }

        .details-button {
          border: 1px solid #ddd;
          background: white;
          border-radius: 8px;
          padding: 7px 10px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
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

        @media (max-width: 900px) {
          .summary {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 700px) {
          .orders-container {
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
          .filter {
            width: 100%;
          }

          .summary {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="orders-container">

        <div className="topbar">
          <div className="title">
            <h1>Orders</h1>

            <p>
              Manage all marketplace orders
              from one place.
            </p>
          </div>

          <div className="actions">
            <button
              className="button"
              onClick={() =>
                router.push("/admin")
              }
            >
              ← Dashboard
            </button>

            <button
              className="button"
              onClick={loadOrders}
            >
              ↻ Refresh
            </button>
          </div>
        </div>

        <div className="summary">

          <div className="summary-card">
            <div className="summary-label">
              Total Orders
            </div>

            <div className="summary-value">
              {loading ? "..." : orders.length}
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-label">
              Pending Orders
            </div>

            <div className="summary-value">
              {loading
                ? "..."
                : orders.filter(
                    (order) =>
                      order.status === "PENDING"
                  ).length}
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-label">
              Delivered Orders
            </div>

            <div className="summary-value">
              {loading
                ? "..."
                : orders.filter(
                    (order) =>
                      order.status === "DELIVERED"
                  ).length}
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-label">
              Total Sales
            </div>

            <div className="summary-value">
              {loading
                ? "..."
                : formatAmount(
                    orders.reduce(
                      (total, order) =>
                        total +
                        Number(
                          order.totalAmount || 0
                        ),
                      0
                    )
                  )}
            </div>
          </div>

        </div>

        <div className="toolbar">

          <input
            className="search"
            type="text"
            placeholder="Search order ID, customer, email or phone..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />

          <select
            className="filter"
            value={status}
            onChange={(event) =>
              setStatus(event.target.value)
            }
          >
            <option value="ALL">
              All Order Status
            </option>

            {statuses.map((item) => (
              <option
                key={item}
                value={item}
              >
                {formatStatus(item)}
              </option>
            ))}
          </select>

          <select
            className="filter"
            value={paymentStatus}
            onChange={(event) =>
              setPaymentStatus(event.target.value)
            }
          >
            <option value="ALL">
              All Payment Status
            </option>

            {paymentStatuses.map((item) => (
              <option
                key={item}
                value={item}
              >
                {formatStatus(item)}
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
                  <th>ORDER ID</th>
                  <th>CUSTOMER</th>
                  <th>ITEMS</th>
                  <th>AMOUNT</th>
                  <th>ORDER STATUS</th>
                  <th>PAYMENT</th>
                  <th>RETURN</th>
                  <th>CREATED</th>
                  <th>ACTION</th>
                </tr>
              </thead>

              <tbody>

                {loading ? (

                  <tr>
                    <td colSpan={9}>
                      <div className="loading">
                        Loading orders...
                      </div>
                    </td>
                  </tr>

                ) : filteredOrders.length === 0 ? (

                  <tr>
                    <td colSpan={9}>
                      <div className="empty">
                        No orders found.
                      </div>
                    </td>
                  </tr>

                ) : (

                  filteredOrders.map(
                    (order) => {

                      const paymentClass =
                        order.paymentStatus === "PAID"
                          ? "badge payment-paid"
                          : order.paymentStatus === "FAILED"
                          ? "badge payment-failed"
                          : order.paymentStatus === "REFUNDED"
                          ? "badge payment-refunded"
                          : "badge payment-pending";

                      return (
                        <tr key={order.id}>

                          <td>
                            <div className="order-id">
                              #{order.id}
                            </div>
                          </td>

                          <td>
                            <div className="customer-name">
                              {order.customer.name}
                            </div>

                            <div className="customer-info">
                              {order.customer.phone}
                            </div>

                            <div className="customer-info">
                              {order.customer.email}
                            </div>
                          </td>

                          <td>
                            {order.itemCount}
                          </td>

                          <td>
                            <div className="amount">
                              {formatAmount(
                                order.totalAmount
                              )}
                            </div>
                          </td>

                          <td>
                            <span className="badge status">
                              {formatStatus(
                                order.status
                              )}
                            </span>
                          </td>

                          <td>
                            <span
                              className={`badge ${
                                paymentClass
                              }`}
                            >
                              {formatStatus(
                                order.paymentStatus
                              )}
                            </span>

                            <div
                              style={{
                                marginTop: 5,
                                fontSize: 10,
                                color: "#999",
                              }}
                            >
                              {order.paymentMethod}
                            </div>
                          </td>

                          <td>
                            <span className="badge status">
                              {formatStatus(
                                order.returnStatus
                              )}
                            </span>
                          </td>

                          <td>
                            {formatDate(
                              order.createdAt
                            )}
                          </td>

                          <td>
                            <button
                              className="details-button"
                              onClick={() =>
                                router.push(
                                  `/admin/orders/${order.id}`
                                )
                              }
                            >
                              View Details
                            </button>
                          </td>

                        </tr>
                      );
                    }
                  )

                )}

              </tbody>

            </table>

          </div>

        </div>

      </div>
    </main>
  );
}