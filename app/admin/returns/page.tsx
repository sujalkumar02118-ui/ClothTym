"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type ReturnItem = {
  id: string;
  quantity: number;
  price: number;
  returnStatus: string;

  product: {
    id: string;
    name: string;
    image?: string | null;
    price: number;

    seller?: {
      id: string;
      shopName: string;
      ownerName: string;
    } | null;

    category?: {
      id: string;
      name: string;
    } | null;
  };
};

type ReturnRequest = {
  orderId: string;
  totalAmount: number;

  orderStatus: string;
  returnStatus: string;

  returnRequestedAt?: string | null;
  returnReason?: string | null;
  returnRejectedReason?: string | null;
  returnCompletedAt?: string | null;

  returnPickupStatus: string;
  returnPickedUpAt?: string | null;

  refundStatus: string;
  refundAmount?: number | null;
  refundRequestedAt?: string | null;
  refundCompletedAt?: string | null;
  refundFailureReason?: string | null;

  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
    isBlocked: boolean;
  };

  items: ReturnItem[];
  itemCount: number;
};

export default function AdminReturnsPage() {
  const router = useRouter();

  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [returnStatus, setReturnStatus] = useState("ALL");
  const [refundStatus, setRefundStatus] = useState("ALL");

  const [actionLoading, setActionLoading] =
    useState<string | null>(null);

  const [rejectModalOpen, setRejectModalOpen] =
    useState(false);

  const [rejectOrderId, setRejectOrderId] =
    useState("");

  const [rejectReason, setRejectReason] =
    useState("");

  const [refundFailModalOpen, setRefundFailModalOpen] =
    useState(false);

  const [refundFailOrderId, setRefundFailOrderId] =
    useState("");

  const [refundFailReason, setRefundFailReason] =
    useState("");

  useEffect(() => {
    loadReturns();
  }, []);

  async function loadReturns() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/admin/returns",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Returns could not be loaded."
        );
      }

      setReturns(
        Array.isArray(result.data)
          ? result.data
          : []
      );
    } catch (error) {
      console.error(
        "ADMIN RETURNS ERROR:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Return requests load nahi ho paaye."
      );
    } finally {
      setLoading(false);
    }
  }

  async function updateReturn(
    orderId: string,
    action:
      | "APPROVE"
      | "REJECT"
      | "START_REFUND"
      | "COMPLETE_REFUND"
      | "FAIL_REFUND",
    reason?: string
  ) {
    try {
      setActionLoading(orderId);
      setError("");

      const response = await fetch(
        `/api/admin/returns/${orderId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action,
            ...(reason
              ? { reason }
              : {}),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Action could not be completed."
        );
      }

      await loadReturns();
    } catch (error) {
      console.error(
        "ADMIN RETURN/REFUND ACTION ERROR:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Action complete nahi ho paya."
      );
    } finally {
      setActionLoading(null);
    }
  }

  async function approveReturn(
    orderId: string
  ) {
    const confirmed = window.confirm(
      "Are you sure you want to approve this return?"
    );

    if (!confirmed) return;

    await updateReturn(
      orderId,
      "APPROVE"
    );
  }

  function openRejectModal(
    orderId: string
  ) {
    setRejectOrderId(orderId);
    setRejectReason("");
    setRejectModalOpen(true);
  }

  function closeRejectModal() {
    if (actionLoading) return;

    setRejectModalOpen(false);
    setRejectOrderId("");
    setRejectReason("");
  }

  async function rejectReturn() {
    const reason =
      rejectReason.trim();

    if (!reason || !rejectOrderId) {
      return;
    }

    await updateReturn(
      rejectOrderId,
      "REJECT",
      reason
    );

    setRejectModalOpen(false);
    setRejectOrderId("");
    setRejectReason("");
  }

  async function startRefund(
    orderId: string
  ) {
    const confirmed = window.confirm(
      "Start refund processing for this order?"
    );

    if (!confirmed) return;

    await updateReturn(
      orderId,
      "START_REFUND"
    );
  }

  async function completeRefund(
    orderId: string
  ) {
    const confirmed = window.confirm(
      "Confirm that the refund has been successfully completed?"
    );

    if (!confirmed) return;

    await updateReturn(
      orderId,
      "COMPLETE_REFUND"
    );
  }

  function openRefundFailModal(
    orderId: string
  ) {
    setRefundFailOrderId(orderId);
    setRefundFailReason("");
    setRefundFailModalOpen(true);
  }

  function closeRefundFailModal() {
    if (actionLoading) return;

    setRefundFailModalOpen(false);
    setRefundFailOrderId("");
    setRefundFailReason("");
  }

  async function failRefund() {
    const reason =
      refundFailReason.trim();

    if (
      !reason ||
      !refundFailOrderId
    ) {
      return;
    }

    await updateReturn(
      refundFailOrderId,
      "FAIL_REFUND",
      reason
    );

    setRefundFailModalOpen(false);
    setRefundFailOrderId("");
    setRefundFailReason("");
  }

  function formatAmount(
    amount?: number | null
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
      ).toLocaleDateString(
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

  function formatDateTime(
    date?: string | null
  ) {
    if (!date) return "—";

    try {
      return new Date(
        date
      ).toLocaleString(
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
      return date;
    }
  }

  function formatStatus(
    value: string
  ) {
    return value
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(
        /\b\w/g,
        (letter) =>
          letter.toUpperCase()
      );
  }

  const returnStatuses =
    Array.from(
      new Set(
        returns.map(
          (item) =>
            item.returnStatus
        )
      )
    );

  const refundStatuses =
    Array.from(
      new Set(
        returns.map(
          (item) =>
            item.refundStatus
        )
      )
    );

  const filteredReturns =
    returns.filter(
      (item) => {
        const searchText =
          search
            .trim()
            .toLowerCase();

        const matchesSearch =
          !searchText ||
          item.orderId
            .toLowerCase()
            .includes(searchText) ||
          item.customer.name
            .toLowerCase()
            .includes(searchText) ||
          item.customer.email
            .toLowerCase()
            .includes(searchText) ||
          item.customer.phone
            .toLowerCase()
            .includes(searchText);

        const matchesReturnStatus =
          returnStatus ===
            "ALL" ||
          item.returnStatus ===
            returnStatus;

        const matchesRefundStatus =
          refundStatus ===
            "ALL" ||
          item.refundStatus ===
            refundStatus;

        return (
          matchesSearch &&
          matchesReturnStatus &&
          matchesRefundStatus
        );
      }
    );

  const requestedCount =
    returns.filter(
      (item) =>
        item.returnStatus ===
        "REQUESTED"
    ).length;

  const approvedCount =
    returns.filter(
      (item) =>
        item.returnStatus ===
        "APPROVED"
    ).length;

  const completedCount =
    returns.filter(
      (item) =>
        item.returnStatus ===
        "COMPLETED"
    ).length;

  const pendingRefundCount =
    returns.filter(
      (item) =>
        item.refundStatus ===
          "PENDING" ||
        item.refundStatus ===
          "PROCESSING"
    ).length;

  return (
    <main className="returns-page">
      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: #f6f7fb;
        }

        .returns-page {
          min-height: 100vh;
          background: #f6f7fb;
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

        .button:disabled {
          opacity: .55;
          cursor: not-allowed;
        }

        .summary {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
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
          min-width: 220px;
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
          min-width: 1650px;
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

        .requested {
          background: #fff5df;
          color: #a66a00;
        }

        .approved {
          background: #e9f8ee;
          color: #188a43;
        }

        .rejected {
          background: #ffeaea;
          color: #c62828;
        }

        .completed {
          background: #e9f8ee;
          color: #188a43;
        }

        .expired {
          background: #eee;
          color: #666;
        }

        .refund-pending {
          background: #fff5df;
          color: #a66a00;
        }

        .refund-processing {
          background: #eaf2ff;
          color: #2767b1;
        }

        .refund-completed {
          background: #e9f8ee;
          color: #188a43;
        }

        .refund-failed {
          background: #ffeaea;
          color: #c62828;
        }

        .refund-none {
          background: #f2f2f2;
          color: #555;
        }

        .reason {
          max-width: 220px;
          color: #555;
          line-height: 1.4;
        }

        .items {
          font-weight: 700;
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

        .approve-button {
          border: 0;
          background: #188a43;
          color: white;
          border-radius: 8px;
          padding: 8px 11px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
        }

        .reject-button {
          border: 0;
          background: #c62828;
          color: white;
          border-radius: 8px;
          padding: 8px 11px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
        }

        .refund-start-button {
          border: 0;
          background: #2767b1;
          color: white;
          border-radius: 8px;
          padding: 8px 11px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
        }

        .refund-complete-button {
          border: 0;
          background: #188a43;
          color: white;
          border-radius: 8px;
          padding: 8px 11px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
        }

        .refund-fail-button {
          border: 0;
          background: #c62828;
          color: white;
          border-radius: 8px;
          padding: 8px 11px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
        }

        .approve-button:hover,
        .refund-complete-button:hover {
          background: #126d35;
        }

        .reject-button:hover,
        .refund-fail-button:hover {
          background: #a51f1f;
        }

        .refund-start-button:hover {
          background: #1d4f87;
        }

        .disabled-button {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .action-stack {
          display: flex;
          flex-direction: column;
          gap: 7px;
          align-items: flex-start;
        }

        .manage-actions {
          display: flex;
          gap: 5px;
          flex-wrap: wrap;
        }

        .refund-info {
          margin-top: 6px;
          color: #777;
          font-size: 10px;
          line-height: 1.5;
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

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          z-index: 1000;
        }

        .modal {
          width: 100%;
          max-width: 500px;
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
        }

        .modal h2 {
          margin: 0;
          font-size: 19px;
        }

        .modal p {
          color: #777;
          font-size: 12px;
          line-height: 1.5;
          margin: 8px 0 18px;
        }

        .reason-label {
          display: block;
          font-size: 11px;
          font-weight: 700;
          margin-bottom: 7px;
        }

        .reason-input {
          width: 100%;
          min-height: 110px;
          resize: vertical;
          border: 1px solid #ddd;
          border-radius: 9px;
          padding: 12px;
          font-family: inherit;
          font-size: 13px;
          outline: none;
        }

        .reason-input:focus {
          border-color: #999;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 18px;
        }

        .cancel-button {
          border: 1px solid #ddd;
          background: white;
          border-radius: 8px;
          padding: 9px 14px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 700;
        }

        .confirm-reject-button {
          border: 0;
          background: #c62828;
          color: white;
          border-radius: 8px;
          padding: 9px 14px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 700;
        }

        .confirm-reject-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 1100px) {
          .summary {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 700px) {
          .container {
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

      <div className="container">

        <div className="topbar">
          <div className="title">
            <h1>Returns & Refunds</h1>

            <p>
              Manage customer return requests
              and refund processing.
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
              onClick={loadReturns}
              disabled={loading}
            >
              ↻ Refresh
            </button>
          </div>
        </div>

        <div className="summary">

          <div className="summary-card">
            <div className="summary-label">
              Total Return Cases
            </div>

            <div className="summary-value">
              {loading
                ? "..."
                : returns.length}
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-label">
              Requested
            </div>

            <div className="summary-value">
              {loading
                ? "..."
                : requestedCount}
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-label">
              Approved
            </div>

            <div className="summary-value">
              {loading
                ? "..."
                : approvedCount}
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-label">
              Completed
            </div>

            <div className="summary-value">
              {loading
                ? "..."
                : completedCount}
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-label">
              Pending Refunds
            </div>

            <div className="summary-value">
              {loading
                ? "..."
                : pendingRefundCount}
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
              setSearch(
                event.target.value
              )
            }
          />

          <select
            className="filter"
            value={returnStatus}
            onChange={(event) =>
              setReturnStatus(
                event.target.value
              )
            }
          >
            <option value="ALL">
              All Return Status
            </option>

            {returnStatuses.map(
              (item) => (
                <option
                  key={item}
                  value={item}
                >
                  {formatStatus(item)}
                </option>
              )
            )}
          </select>

          <select
            className="filter"
            value={refundStatus}
            onChange={(event) =>
              setRefundStatus(
                event.target.value
              )
            }
          >
            <option value="ALL">
              All Refund Status
            </option>

            {refundStatuses.map(
              (item) => (
                <option
                  key={item}
                  value={item}
                >
                  {formatStatus(item)}
                </option>
              )
            )}
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
                  <th>RETURN STATUS</th>
                  <th>REASON</th>
                  <th>PICKUP</th>
                  <th>REFUND</th>
                  <th>REQUESTED</th>
                  <th>ACTION</th>
                </tr>
              </thead>

              <tbody>

                {loading ? (
                  <tr>
                    <td colSpan={10}>
                      <div className="loading">
                        Loading return requests...
                      </div>
                    </td>
                  </tr>
                ) : filteredReturns.length === 0 ? (
                  <tr>
                    <td colSpan={10}>
                      <div className="empty">
                        No return requests found.
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredReturns.map(
                    (item) => {

                      const returnClass =
                        item.returnStatus ===
                        "REQUESTED"
                          ? "badge requested"
                          : item.returnStatus ===
                            "APPROVED"
                          ? "badge approved"
                          : item.returnStatus ===
                            "REJECTED"
                          ? "badge rejected"
                          : item.returnStatus ===
                            "COMPLETED"
                          ? "badge completed"
                          : "badge expired";

                      const refundClass =
                        item.refundStatus ===
                        "COMPLETED"
                          ? "badge refund-completed"
                          : item.refundStatus ===
                            "PROCESSING"
                          ? "badge refund-processing"
                          : item.refundStatus ===
                            "FAILED"
                          ? "badge refund-failed"
                          : item.refundStatus ===
                            "PENDING"
                          ? "badge refund-pending"
                          : "badge refund-none";

                      const isRequested =
                        item.returnStatus ===
                        "REQUESTED";

                      const isApproved =
                        item.returnStatus ===
                        "APPROVED";

                      const isRefundPending =
                        item.refundStatus ===
                        "PENDING";

                      const isRefundProcessing =
                        item.refundStatus ===
                        "PROCESSING";

                      const isActionLoading =
                        actionLoading ===
                        item.orderId;

                      return (
                        <tr
                          key={
                            item.orderId
                          }
                        >

                          <td>
                            <div className="order-id">
                              #{item.orderId}
                            </div>
                          </td>

                          <td>
                            <div className="customer-name">
                              {
                                item
                                  .customer
                                  .name
                              }
                            </div>

                            <div className="customer-info">
                              {
                                item
                                  .customer
                                  .phone
                              }
                            </div>

                            <div className="customer-info">
                              {
                                item
                                  .customer
                                  .email
                              }
                            </div>
                          </td>

                          <td>
                            <div className="items">
                              {
                                item.itemCount
                              }
                            </div>
                          </td>

                          <td>
                            <div className="amount">
                              {formatAmount(
                                item.totalAmount
                              )}
                            </div>
                          </td>

                          <td>
                            <span
                              className={
                                returnClass
                              }
                            >
                              {formatStatus(
                                item.returnStatus
                              )}
                            </span>
                          </td>

                          <td>
                            <div className="reason">
                              {item.returnReason ||
                                item.returnRejectedReason ||
                                "—"}
                            </div>
                          </td>

                          <td>
                            <span className="badge">
                              {formatStatus(
                                item.returnPickupStatus
                              )}
                            </span>
                          </td>

                          <td>
                            <span
                              className={
                                refundClass
                              }
                            >
                              {formatStatus(
                                item.refundStatus
                              )}
                            </span>

                            {item.refundAmount !=
                              null && (
                              <div className="refund-info">
                                Amount:{" "}
                                {formatAmount(
                                  item.refundAmount
                                )}
                              </div>
                            )}

                            {item.refundRequestedAt && (
                              <div className="refund-info">
                                Started:{" "}
                                {formatDateTime(
                                  item.refundRequestedAt
                                )}
                              </div>
                            )}

                            {item.refundCompletedAt && (
                              <div className="refund-info">
                                Completed:{" "}
                                {formatDateTime(
                                  item.refundCompletedAt
                                )}
                              </div>
                            )}

                            {item.refundFailureReason && (
                              <div className="refund-info">
                                Reason:{" "}
                                {
                                  item.refundFailureReason
                                }
                              </div>
                            )}
                          </td>

                          <td>
                            {formatDate(
                              item.returnRequestedAt
                            )}
                          </td>

                          <td>

                            <div className="action-stack">

                              {isRequested && (
                                <div className="manage-actions">

                                  <button
                                    className={`approve-button ${
                                      isActionLoading
                                        ? "disabled-button"
                                        : ""
                                    }`}
                                    disabled={
                                      isActionLoading
                                    }
                                    onClick={() =>
                                      approveReturn(
                                        item.orderId
                                      )
                                    }
                                  >
                                    {isActionLoading
                                      ? "Updating..."
                                      : "Approve"}
                                  </button>

                                  <button
                                    className={`reject-button ${
                                      isActionLoading
                                        ? "disabled-button"
                                        : ""
                                    }`}
                                    disabled={
                                      isActionLoading
                                    }
                                    onClick={() =>
                                      openRejectModal(
                                        item.orderId
                                      )
                                    }
                                  >
                                    Reject
                                  </button>

                                </div>
                              )}

                              {isApproved &&
                                (isRefundPending ||
                                  item.refundStatus ===
                                    "FAILED") && (
                                  <button
                                    className={`refund-start-button ${
                                      isActionLoading
                                        ? "disabled-button"
                                        : ""
                                    }`}
                                    disabled={
                                      isActionLoading
                                    }
                                    onClick={() =>
                                      startRefund(
                                        item.orderId
                                      )
                                    }
                                  >
                                    {isActionLoading
                                      ? "Starting..."
                                      : "Start Refund"}
                                  </button>
                                )}

                              {isRefundProcessing && (
                                <div className="manage-actions">

                                  <button
                                    className={`refund-complete-button ${
                                      isActionLoading
                                        ? "disabled-button"
                                        : ""
                                    }`}
                                    disabled={
                                      isActionLoading
                                    }
                                    onClick={() =>
                                      completeRefund(
                                        item.orderId
                                      )
                                    }
                                  >
                                    {isActionLoading
                                      ? "Updating..."
                                      : "Complete Refund"}
                                  </button>

                                  <button
                                    className={`refund-fail-button ${
                                      isActionLoading
                                        ? "disabled-button"
                                        : ""
                                    }`}
                                    disabled={
                                      isActionLoading
                                    }
                                    onClick={() =>
                                      openRefundFailModal(
                                        item.orderId
                                      )
                                    }
                                  >
                                    Fail Refund
                                  </button>

                                </div>
                              )}

                              <button
                                className="details-button"
                                onClick={() =>
                                  router.push(
                                    `/admin/orders/${item.orderId}`
                                  )
                                }
                              >
                                View Order
                              </button>

                            </div>

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

      {rejectModalOpen && (
        <div
          className="modal-overlay"
          onClick={closeRejectModal}
        >
          <div
            className="modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <h2>
              Reject Return Request
            </h2>

            <p>
              Order #{rejectOrderId}
              <br />
              Please enter a reason for rejecting
              this return request.
            </p>

            <label className="reason-label">
              Rejection Reason
            </label>

            <textarea
              className="reason-input"
              placeholder="Enter rejection reason..."
              value={rejectReason}
              onChange={(event) =>
                setRejectReason(
                  event.target.value
                )
              }
              autoFocus
            />

            <div className="modal-actions">

              <button
                className="cancel-button"
                onClick={
                  closeRejectModal
                }
                disabled={
                  actionLoading !== null
                }
              >
                Cancel
              </button>

              <button
                className="confirm-reject-button"
                onClick={
                  rejectReturn
                }
                disabled={
                  !rejectReason.trim() ||
                  actionLoading !== null
                }
              >
                {actionLoading
                  ? "Rejecting..."
                  : "Confirm Reject"}
              </button>

            </div>

          </div>
        </div>
      )}

      {refundFailModalOpen && (
        <div
          className="modal-overlay"
          onClick={
            closeRefundFailModal
          }
        >
          <div
            className="modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <h2>
              Refund Failed
            </h2>

            <p>
              Order #{refundFailOrderId}
              <br />
              Please enter the reason why the
              refund failed.
            </p>

            <label className="reason-label">
              Refund Failure Reason
            </label>

            <textarea
              className="reason-input"
              placeholder="Enter refund failure reason..."
              value={
                refundFailReason
              }
              onChange={(event) =>
                setRefundFailReason(
                  event.target.value
                )
              }
              autoFocus
            />

            <div className="modal-actions">

              <button
                className="cancel-button"
                onClick={
                  closeRefundFailModal
                }
                disabled={
                  actionLoading !== null
                }
              >
                Cancel
              </button>

              <button
                className="confirm-reject-button"
                onClick={
                  failRefund
                }
                disabled={
                  !refundFailReason.trim() ||
                  actionLoading !== null
                }
              >
                {actionLoading
                  ? "Updating..."
                  : "Mark Refund Failed"}
              </button>

            </div>

          </div>
        </div>
      )}

    </main>
  );
}