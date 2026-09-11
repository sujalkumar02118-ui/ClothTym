"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type PaymentStatus =
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "REFUNDED";

type Payment = {
  id: string;
  orderId: string;
  customer: string;
  email: string;
  phone: string;
  method: string;
  amount: number;
  status: PaymentStatus;
  date: string;
  paidAt: string | null;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  refundStatus: string;
  refundAmount: number;
};

type Summary = {
  transactions: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  failedAmount: number;
  refundedAmount: number;
  paidCount: number;
  pendingCount: number;
  failedCount: number;
  refundedCount: number;
};

export default function AdminPaymentsPage() {
  const router = useRouter();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<Summary>({
    transactions: 0,
    totalAmount: 0,
    paidAmount: 0,
    pendingAmount: 0,
    failedAmount: 0,
    refundedAmount: 0,
    paidCount: 0,
    pendingCount: 0,
    failedCount: 0,
    refundedCount: 0,
  });

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"ALL" | PaymentStatus>("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  async function loadPayments() {
    try {
      setError("");
      setRefreshing(true);

      const response = await fetch(
        "/api/admin/payments",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Payments could not be loaded."
        );
      }

      setPayments(
        Array.isArray(result.data?.payments)
          ? result.data.payments
          : []
      );

      if (result.data?.summary) {
        setSummary(result.data.summary);
      }
    } catch (err) {
      console.error(
        "ADMIN PAYMENTS PAGE ERROR:",
        err
      );

      setError(
        "Payments data load nahi ho paaya."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadPayments();
  }, []);

  function money(amount: number) {
    return `₹${Number(
      amount || 0
    ).toLocaleString("en-IN")}`;
  }

  function formatDate(date: string | null) {
    if (!date) return "—";

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
      return "—";
    }
  }

  function formatDateTime(date: string | null) {
    if (!date) return "—";

    try {
      return new Date(date).toLocaleString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }
      );
    } catch {
      return "—";
    }
  }

  function statusClass(status: PaymentStatus) {
    switch (status) {
      case "PAID":
        return "status paid";

      case "PENDING":
        return "status pending";

      case "FAILED":
        return "status failed";

      case "REFUNDED":
        return "status refunded";

      default:
        return "status";
    }
  }

  function statusText(status: PaymentStatus) {
    switch (status) {
      case "PAID":
        return "Paid";

      case "PENDING":
        return "Pending";

      case "FAILED":
        return "Failed";

      case "REFUNDED":
        return "Refunded";

      default:
        return status;
    }
  }

  const filteredPayments = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return payments.filter((payment) => {
      const matchesSearch =
        !query ||
        payment.id
          .toLowerCase()
          .includes(query) ||
        payment.orderId
          .toLowerCase()
          .includes(query) ||
        payment.customer
          .toLowerCase()
          .includes(query) ||
        payment.email
          .toLowerCase()
          .includes(query) ||
        payment.phone
          .toLowerCase()
          .includes(query) ||
        payment.method
          .toLowerCase()
          .includes(query);

      const matchesFilter =
        filter === "ALL" ||
        payment.status === filter;

      return (
        matchesSearch &&
        matchesFilter
      );
    });
  }, [payments, search, filter]);

  return (
    <main className="admin-payments">
      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: #f5f6f8;
          font-family:
            Arial,
            Helvetica,
            sans-serif;
        }

        .admin-payments {
          min-height: 100vh;
          background: #f5f6f8;
          color: #171717;
          padding: 0;
        }

        .top-header {
          height: 74px;
          background: #ffffff;
          border-bottom: 1px solid #e6e7eb;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 34px;
          position: sticky;
          top: 0;
          z-index: 20;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .brand {
          font-size: 22px;
          font-weight: 800;
          letter-spacing: -0.5px;
        }

        .divider {
          width: 1px;
          height: 25px;
          background: #ddd;
        }

        .section-name {
          font-size: 14px;
          color: #777;
          font-weight: 600;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .admin-avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: #111;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 800;
        }

        .admin-info {
          line-height: 1.2;
        }

        .admin-name {
          font-size: 13px;
          font-weight: 700;
        }

        .admin-role {
          font-size: 11px;
          color: #888;
          margin-top: 3px;
        }

        .content {
          padding: 30px 34px 50px;
          max-width: 1600px;
          margin: 0 auto;
        }

        .page-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
          margin-bottom: 26px;
        }

        .page-title {
          margin: 0;
          font-size: 29px;
          font-weight: 800;
          letter-spacing: -0.6px;
        }

        .page-subtitle {
          margin: 7px 0 0;
          color: #7d7d7d;
          font-size: 13px;
        }

        .head-actions {
          display: flex;
          gap: 10px;
        }

        .button {
          border: 1px solid #dedede;
          background: #fff;
          border-radius: 9px;
          padding: 10px 15px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .button:hover {
          background: #f7f7f7;
        }

        .button.dark {
          background: #111;
          border-color: #111;
          color: #fff;
        }

        .button.dark:hover {
          background: #222;
        }

        .stats {
          display: grid;
          grid-template-columns:
            repeat(4, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 22px;
        }

        .stat-card {
          background: #fff;
          border: 1px solid #e5e6e9;
          border-radius: 14px;
          padding: 20px;
          min-height: 125px;
        }

        .stat-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .stat-label {
          font-size: 12px;
          color: #777;
          font-weight: 600;
        }

        .stat-icon {
          width: 36px;
          height: 36px;
          border-radius: 9px;
          background: #f3f4f6;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 17px;
        }

        .stat-value {
          margin-top: 13px;
          font-size: 25px;
          font-weight: 800;
          letter-spacing: -0.4px;
        }

        .stat-note {
          margin-top: 5px;
          font-size: 11px;
          color: #999;
        }

        .toolbar {
          background: #fff;
          border: 1px solid #e5e6e9;
          border-radius: 14px;
          padding: 15px;
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
        }

        .search-box {
          flex: 1;
          height: 43px;
          border: 1px solid #ddd;
          border-radius: 9px;
          padding: 0 14px;
          outline: none;
          font-size: 12px;
          background: #fff;
        }

        .search-box:focus {
          border-color: #111;
        }

        .filter {
          height: 43px;
          min-width: 145px;
          border: 1px solid #ddd;
          border-radius: 9px;
          padding: 0 12px;
          background: #fff;
          outline: none;
          font-size: 12px;
          cursor: pointer;
        }

        .result-count {
          white-space: nowrap;
          font-size: 11px;
          color: #888;
          padding: 0 6px;
        }

        .table-card {
          background: #fff;
          border: 1px solid #e5e6e9;
          border-radius: 14px;
          overflow: hidden;
        }

        .table-head {
          padding: 20px 22px;
          border-bottom: 1px solid #eeeeee;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .table-title {
          font-size: 16px;
          font-weight: 800;
        }

        .table-subtitle {
          margin-top: 4px;
          color: #999;
          font-size: 11px;
        }

        .table-wrapper {
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          min-width: 950px;
        }

        th {
          background: #fafafa;
          color: #8b8b8b;
          font-size: 10px;
          font-weight: 700;
          text-align: left;
          padding: 13px 16px;
          border-bottom: 1px solid #eeeeee;
          white-space: nowrap;
        }

        td {
          padding: 16px;
          border-bottom: 1px solid #f0f0f0;
          font-size: 12px;
          vertical-align: middle;
        }

        tr:last-child td {
          border-bottom: none;
        }

        tr:hover td {
          background: #fcfcfc;
        }

        .payment-id {
          font-weight: 800;
          color: #111;
        }

        .order-id {
          font-weight: 700;
          color: #555;
        }

        .customer-name {
          font-weight: 700;
        }

        .customer-contact {
          margin-top: 4px;
          color: #999;
          font-size: 10px;
        }

        .method {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-weight: 700;
        }

        .method-icon {
          width: 28px;
          height: 28px;
          border-radius: 7px;
          background: #f3f3f3;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
        }

        .amount {
          font-weight: 800;
          white-space: nowrap;
        }

        .status {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          border-radius: 20px;
          font-size: 9px;
          font-weight: 800;
          white-space: nowrap;
        }

        .status::before {
          content: "";
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: currentColor;
        }

        .status.paid {
          color: #168344;
          background: #eaf8ef;
        }

        .status.pending {
          color: #9b6a00;
          background: #fff5d9;
        }

        .status.failed {
          color: #c62828;
          background: #ffeaea;
        }

        .status.refunded {
          color: #555;
          background: #eeeeee;
        }

        .date {
          color: #666;
          white-space: nowrap;
        }

        .empty {
          text-align: center;
          padding: 70px 20px;
          color: #999;
        }

        .empty-icon {
          font-size: 35px;
          margin-bottom: 12px;
        }

        .empty-title {
          font-size: 14px;
          font-weight: 700;
          color: #666;
        }

        .empty-text {
          margin-top: 5px;
          font-size: 11px;
        }

        .loading {
          text-align: center;
          padding: 70px 20px;
          color: #999;
          font-size: 13px;
        }

        .error {
          background: #fff1f1;
          border: 1px solid #ffd1d1;
          color: #c62828;
          border-radius: 10px;
          padding: 13px 15px;
          margin-bottom: 18px;
          font-size: 12px;
          font-weight: 600;
        }

        .footer-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-top: 1px solid #eee;
          color: #999;
          font-size: 10px;
        }

        @media(max-width: 1100px) {
          .stats {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }

          .content {
            padding-left: 22px;
            padding-right: 22px;
          }

          .top-header {
            padding: 0 22px;
          }
        }

        @media(max-width: 700px) {
          .top-header {
            height: auto;
            padding: 14px 16px;
          }

          .section-name,
          .divider,
          .admin-info {
            display: none;
          }

          .content {
            padding: 20px 14px 35px;
          }

          .page-head {
            flex-direction: column;
          }

          .head-actions {
            width: 100%;
          }

          .head-actions .button {
            flex: 1;
          }

          .stats {
            grid-template-columns: 1fr;
          }

          .toolbar {
            flex-direction: column;
            align-items: stretch;
          }

          .result-count {
            text-align: right;
          }
        }
      `}</style>

      {/* HEADER */}

      <header className="top-header">
        <div className="header-left">
          <div className="brand">
            ClothTym
          </div>

          <div className="divider" />

          <div className="section-name">
            Admin Control Center
          </div>
        </div>

        <div className="header-right">
          <div className="admin-avatar">
            A
          </div>

          <div className="admin-info">
            <div className="admin-name">
              Admin
            </div>

            <div className="admin-role">
              Administrator
            </div>
          </div>
        </div>
      </header>

      <div className="content">

        {/* PAGE HEADER */}

        <section className="page-head">
          <div>
            <h1 className="page-title">
              Payments
            </h1>

            <p className="page-subtitle">
              Monitor all marketplace payment
              transactions in real time.
            </p>
          </div>

          <div className="head-actions">
            <button
              className="button"
              onClick={() => router.push("/admin")}
            >
              ← Dashboard
            </button>

            <button
              className="button dark"
              onClick={loadPayments}
              disabled={refreshing}
            >
              {refreshing
                ? "Refreshing..."
                : "↻ Refresh"}
            </button>
          </div>
        </section>

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
                Total Transactions
              </span>

              <span className="stat-icon">
                💳
              </span>
            </div>

            <div className="stat-value">
              {loading
                ? "..."
                : summary.transactions.toLocaleString(
                    "en-IN"
                  )}
            </div>

            <div className="stat-note">
              All recorded payments
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              <span className="stat-label">
                Paid Amount
              </span>

              <span className="stat-icon">
                ₹
              </span>
            </div>

            <div className="stat-value">
              {loading
                ? "..."
                : money(summary.paidAmount)}
            </div>

            <div className="stat-note">
              {summary.paidCount} successful
              payments
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
                : summary.pendingCount.toLocaleString(
                    "en-IN"
                  )}
            </div>

            <div className="stat-note">
              Awaiting payment completion
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              <span className="stat-label">
                Failed / Refunded
              </span>

              <span className="stat-icon">
                ↩
              </span>
            </div>

            <div className="stat-value">
              {loading
                ? "..."
                : (
                    summary.failedCount +
                    summary.refundedCount
                  ).toLocaleString(
                    "en-IN"
                  )}
            </div>

            <div className="stat-note">
              Failed {summary.failedCount}
              {" • "}
              Refunded {summary.refundedCount}
            </div>
          </div>

        </section>

        {/* SEARCH / FILTER */}

        <section className="toolbar">

          <input
            className="search-box"
            type="text"
            placeholder="Search payment ID, order ID, customer, email, phone..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

          <select
            className="filter"
            value={filter}
            onChange={(e) =>
              setFilter(
                e.target.value as
                  | "ALL"
                  | PaymentStatus
              )
            }
          >
            <option value="ALL">
              All Payments
            </option>

            <option value="PAID">
              Paid
            </option>

            <option value="PENDING">
              Pending
            </option>

            <option value="FAILED">
              Failed
            </option>

            <option value="REFUNDED">
              Refunded
            </option>
          </select>

          <span className="result-count">
            {filteredPayments.length} results
          </span>

        </section>

        {/* TABLE */}

        <section className="table-card">

          <div className="table-head">
            <div>
              <div className="table-title">
                Payment Transactions
              </div>

              <div className="table-subtitle">
                Real payment records from
                ClothTym database
              </div>
            </div>
          </div>

          <div className="table-wrapper">

            {loading ? (
              <div className="loading">
                Loading real payment data...
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="empty">

                <div className="empty-icon">
                  💳
                </div>

                <div className="empty-title">
                  No payment transactions found
                </div>

                <div className="empty-text">
                  Payments will appear here
                  automatically when orders are
                  created.
                </div>

              </div>
            ) : (
              <table>

                <thead>
                  <tr>
                    <th>
                      PAYMENT
                    </th>

                    <th>
                      ORDER
                    </th>

                    <th>
                      CUSTOMER
                    </th>

                    <th>
                      METHOD
                    </th>

                    <th>
                      AMOUNT
                    </th>

                    <th>
                      STATUS
                    </th>

                    <th>
                      DATE
                    </th>
                  </tr>
                </thead>

                <tbody>

                  {filteredPayments.map(
                    (payment) => (
                      <tr
                        key={payment.id}
                      >

                        <td>
                          <div className="payment-id">
                            {payment.id}
                          </div>

                          {payment.razorpayPaymentId && (
                            <div className="customer-contact">
                              Razorpay ID
                            </div>
                          )}
                        </td>

                        <td>
                          <div className="order-id">
                            #{payment.orderId}
                          </div>
                        </td>

                        <td>
                          <div className="customer-name">
                            {payment.customer}
                          </div>

                          <div className="customer-contact">
                            {payment.email ||
                              payment.phone ||
                              "No contact"}
                          </div>
                        </td>

                        <td>
                          <div className="method">
                            <span className="method-icon">
                              {payment.method ===
                              "COD"
                                ? "💵"
                                : "💳"}
                            </span>

                            {payment.method}
                          </div>
                        </td>

                        <td>
                          <div className="amount">
                            {money(
                              payment.amount
                            )}
                          </div>
                        </td>

                        <td>
                          <span
                            className={statusClass(
                              payment.status
                            )}
                          >
                            {statusText(
                              payment.status
                            )}
                          </span>
                        </td>

                        <td>
                          <div className="date">
                            {formatDate(
                              payment.date
                            )}
                          </div>
                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>
            )}

          </div>

          {!loading &&
            filteredPayments.length > 0 && (
              <div className="footer-info">
                <span>
                  Showing{" "}
                  {filteredPayments.length}{" "}
                  payment records
                </span>

                <span>
                  Last updated:{" "}
                  {formatDateTime(
                    new Date().toISOString()
                  )}
                </span>
              </div>
            )}

        </section>

      </div>
    </main>
  );
}