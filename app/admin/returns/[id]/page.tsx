"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type ReturnData = {
  id: string;
  status: string;
  returnStatus: string;
  returnRequestedAt?: string | null;
  returnReason?: string | null;
  returnRejectedReason?: string | null;
  returnCompletedAt?: string | null;
  returnPickupStatus: string;
  returnPickedUpAt?: string | null;
  refundStatus: string;
  refundAmount?: number | null;

  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    isBlocked: boolean;
  };

  totalAmount: number;

  items: {
    id: string;
    quantity: number;
    price: number;
    returnStatus: string;

    product: {
      id: string;
      name: string;
      image?: string | null;

      seller?: {
        shopName: string;
        ownerName: string;
      } | null;
    };
  }[];
};

export default function AdminReturnDetailsPage() {
  const router = useRouter();
  const params = useParams();

  const id = params.id as string;

  const [data, setData] =
    useState<ReturnData | null>(null);

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const [showReject, setShowReject] =
    useState(false);

  const [reason, setReason] = useState("");

  useEffect(() => {
    if (id) {
      loadReturn();
    }
  }, [id]);

  async function loadReturn() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/admin/orders/${id}`,
        {
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Return details could not be loaded."
        );
      }

      setData(result.data);
    } catch (error) {
      console.error(
        "ADMIN RETURN DETAILS ERROR:",
        error
      );

      setError(
        "Return details load nahi ho paaye."
      );
    } finally {
      setLoading(false);
    }
  }

  async function updateReturn(
    action: "APPROVE" | "REJECT"
  ) {
    if (action === "REJECT" && !reason.trim()) {
      alert("Rejection reason required.");
      return;
    }

    try {
      setProcessing(true);

      const response = await fetch(
        `/api/admin/returns/${id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            action,
            reason:
              action === "REJECT"
                ? reason.trim()
                : "",
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Return could not be updated."
        );
      }

      alert(result.message);

      setShowReject(false);
      setReason("");

      await loadReturn();
    } catch (error) {
      console.error(
        "RETURN UPDATE ERROR:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Return update failed."
      );
    } finally {
      setProcessing(false);
    }
  }

  function formatAmount(
    amount?: number | null
  ) {
    return `₹${Number(
      amount || 0
    ).toLocaleString("en-IN")}`;
  }

  function formatDate(
    value?: string | null
  ) {
    if (!value) return "—";

    return new Date(value).toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  }

  function formatStatus(value: string) {
    return value
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  }

  if (loading) {
    return (
      <main className="center">
        Loading return details...
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="center">
        <div>
          <h2>Return not found</h2>
          <p>{error}</p>

          <button
            onClick={() =>
              router.push("/admin/returns")
            }
          >
            ← Back to Returns
          </button>
        </div>
      </main>
    );
  }

  const canManage =
    data.returnStatus === "REQUESTED";

  return (
    <main className="page">
      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: #f6f7fb;
        }

        .page {
          min-height: 100vh;
          background: #f6f7fb;
          color: #171717;
          font-family: Arial, Helvetica, sans-serif;
        }

        .container {
          max-width: 1100px;
          margin: auto;
          padding: 30px;
        }

        .topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          margin-bottom: 22px;
        }

        h1 {
          margin: 0;
          font-size: 27px;
        }

        .muted {
          color: #888;
          font-size: 12px;
          margin-top: 6px;
        }

        .actions {
          display: flex;
          gap: 8px;
        }

        button {
          border: 1px solid #ddd;
          background: white;
          border-radius: 9px;
          padding: 10px 14px;
          cursor: pointer;
          font-weight: 700;
          font-size: 12px;
        }

        .card {
          background: white;
          border: 1px solid #e8e8e8;
          border-radius: 14px;
          padding: 20px;
          margin-bottom: 18px;
        }

        .card h2 {
          margin: 0 0 18px;
          font-size: 17px;
        }

        .grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .label {
          color: #999;
          font-size: 10px;
          text-transform: uppercase;
          margin-bottom: 5px;
        }

        .value {
          font-size: 13px;
          font-weight: 700;
          word-break: break-word;
        }

        .badge {
          display: inline-flex;
          padding: 7px 10px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 700;
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

        .product {
          display: flex;
          gap: 14px;
          padding: 14px 0;
          border-bottom: 1px solid #eee;
        }

        .product:last-child {
          border-bottom: 0;
        }

        .image {
          width: 65px;
          height: 65px;
          border-radius: 8px;
          object-fit: cover;
          background: #eee;
          border: 1px solid #eee;
        }

        .product-info {
          flex: 1;
        }

        .product-name {
          font-weight: 700;
          font-size: 14px;
        }

        .product-meta {
          margin-top: 5px;
          color: #888;
          font-size: 11px;
        }

        .approve {
          background: #188a43;
          color: white;
          border: 0;
        }

        .reject {
          background: #c62828;
          color: white;
          border: 0;
        }

        .action-box {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }

        textarea {
          width: 100%;
          min-height: 110px;
          resize: vertical;
          border: 1px solid #ddd;
          border-radius: 9px;
          padding: 12px;
          font-family: inherit;
          outline: none;
        }

        .cancel {
          margin-top: 10px;
        }

        .warning {
          background: #fff8e8;
          border: 1px solid #f2dfaa;
          color: #805d00;
          border-radius: 9px;
          padding: 12px;
          font-size: 12px;
          margin-bottom: 15px;
        }

        @media(max-width: 700px) {
          .container {
            padding: 18px;
          }

          .topbar {
            align-items: flex-start;
            flex-direction: column;
          }

          .grid {
            grid-template-columns: 1fr;
          }

          .action-box {
            flex-direction: column;
          }
        }
      `}</style>

      <div className="container">

        <div className="topbar">
          <div>
            <h1>Return Request</h1>

            <div className="muted">
              Order #{data.id}
            </div>
          </div>

          <div className="actions">
            <button
              onClick={() =>
                router.push("/admin/returns")
              }
            >
              ← Returns
            </button>

            <button
              onClick={loadReturn}
            >
              ↻ Refresh
            </button>
          </div>
        </div>

        <div className="card">
          <h2>Return Status</h2>

          <span
            className={`badge ${
              data.returnStatus ===
              "REQUESTED"
                ? "requested"
                : data.returnStatus ===
                  "APPROVED"
                ? "approved"
                : "rejected"
            }`}
          >
            {formatStatus(
              data.returnStatus
            )}
          </span>

          <div className="grid" style={{ marginTop: 20 }}>
            <div>
              <div className="label">
                Requested At
              </div>
              <div className="value">
                {formatDate(
                  data.returnRequestedAt
                )}
              </div>
            </div>

            <div>
              <div className="label">
                Reason
              </div>
              <div className="value">
                {data.returnReason || "—"}
              </div>
            </div>

            <div>
              <div className="label">
                Pickup Status
              </div>
              <div className="value">
                {formatStatus(
                  data.returnPickupStatus
                )}
              </div>
            </div>

            <div>
              <div className="label">
                Refund Status
              </div>
              <div className="value">
                {formatStatus(
                  data.refundStatus
                )}
              </div>
            </div>
          </div>

          {data.returnRejectedReason && (
            <div
              className="warning"
              style={{ marginTop: 18 }}
            >
              <strong>
                Rejection Reason:
              </strong>{" "}
              {data.returnRejectedReason}
            </div>
          )}

          {canManage && !showReject && (
            <div className="action-box">
              <button
                className="approve"
                disabled={processing}
                onClick={() =>
                  updateReturn("APPROVE")
                }
              >
                {processing
                  ? "Processing..."
                  : "✓ Approve Return"}
              </button>

              <button
                className="reject"
                disabled={processing}
                onClick={() =>
                  setShowReject(true)
                }
              >
                ✕ Reject Return
              </button>
            </div>
          )}

          {showReject && (
            <div style={{ marginTop: 20 }}>
              <div className="label">
                Rejection Reason
              </div>

              <textarea
                value={reason}
                onChange={(e) =>
                  setReason(e.target.value)
                }
                placeholder="Enter reason for rejecting this return..."
              />

              <div className="action-box">
                <button
                  className="reject"
                  disabled={processing}
                  onClick={() =>
                    updateReturn("REJECT")
                  }
                >
                  {processing
                    ? "Rejecting..."
                    : "Confirm Rejection"}
                </button>

                <button
                  className="cancel"
                  onClick={() => {
                    setShowReject(false);
                    setReason("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <h2>Customer</h2>

          <div className="grid">
            <div>
              <div className="label">Name</div>
              <div className="value">
                {data.user.name}
              </div>
            </div>

            <div>
              <div className="label">Phone</div>
              <div className="value">
                {data.user.phone}
              </div>
            </div>

            <div>
              <div className="label">Email</div>
              <div className="value">
                {data.user.email}
              </div>
            </div>

            <div>
              <div className="label">Account</div>
              <div className="value">
                {data.user.isBlocked
                  ? "Blocked"
                  : "Active"}
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h2>Returned Products</h2>

          {data.items.map((item) => (
            <div
              className="product"
              key={item.id}
            >
              {item.product.image ? (
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="image"
                />
              ) : (
                <div className="image" />
              )}

              <div className="product-info">
                <div className="product-name">
                  {item.product.name}
                </div>

                <div className="product-meta">
                  Quantity: {item.quantity}
                </div>

                <div className="product-meta">
                  Price:{" "}
                  {formatAmount(item.price)}
                </div>

                <div className="product-meta">
                  Seller:{" "}
                  {item.product.seller
                    ?.shopName ||
                    "Unknown Seller"}
                </div>
              </div>
            </div>
          ))}

          <div
            style={{
              borderTop: "1px solid #eee",
              marginTop: 10,
              paddingTop: 15,
              display: "flex",
              justifyContent: "space-between",
              fontWeight: 700,
            }}
          >
            <span>Order Total</span>
            <span>
              {formatAmount(
                data.totalAmount
              )}
            </span>
          </div>
        </div>

      </div>
    </main>
  );
}