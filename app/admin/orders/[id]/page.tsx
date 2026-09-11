"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Order = {
  id: string;
  totalAmount: number;
  status: string;
  address: string;

  paymentMethod: string;
  paymentStatus: string;

  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;

  paidAt?: string | null;

  createdAt: string;
  updatedAt: string;

  pickedUpAt?: string | null;
  deliveredAt?: string | null;

  sellerOtpVerifiedAt?: string | null;
  customerOtpVerifiedAt?: string | null;

  returnDeadline?: string | null;
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

  items: {
    id: string;
    quantity: number;
    price: number;
    returnStatus: string;

    product: {
      id: string;
      name: string;
      description: string;
      image?: string | null;
      images?: string | null;
      sizes?: string | null;
      colors?: string | null;
      sizeChart?: string | null;

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
      } | null;
    };
  }[];
};

export default function AdminOrderDetailsPage() {
  const router = useRouter();
  const params = useParams();

  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!orderId) return;

    loadOrder();

    const interval = setInterval(() => {
      loadOrder();
    }, 10000);

    return () => clearInterval(interval);
  }, [orderId]);

  async function loadOrder() {
    try {
      setError("");

      const response = await fetch(
        `/api/admin/orders/${orderId}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Order details could not be loaded."
        );
      }

      setOrder(result.data);
    } catch (error) {
      console.error(
        "ADMIN ORDER DETAILS ERROR:",
        error
      );

      setError(
        "Order details load nahi ho paaye."
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

  function formatDate(
    date?: string | null
  ) {
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

  if (loading) {
    return (
      <main className="page">
        <div className="center">
          Loading order details...
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="page">
        <div className="error-box">
          <h2>Order not found</h2>

          <p>
            {error ||
              "This order does not exist."}
          </p>

          <button
            onClick={() =>
              router.push("/admin/orders")
            }
          >
            ← Back to Orders
          </button>
        </div>
      </main>
    );
  }

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

        .grid {
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: 20px;
        }

        .card {
          background: white;
          border: 1px solid #e8e8e8;
          border-radius: 14px;
          padding: 20px;
          margin-bottom: 20px;
        }

        .card h2 {
          margin: 0 0 18px;
          font-size: 17px;
        }

        .order-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
        }

        .order-id {
          font-size: 18px;
          font-weight: 750;
        }

        .muted {
          color: #888;
          font-size: 12px;
          margin-top: 5px;
        }

        .badge {
          display: inline-flex;
          padding: 7px 10px;
          border-radius: 20px;
          background: #f1f1f1;
          font-size: 10px;
          font-weight: 700;
          white-space: nowrap;
        }

        .green {
          background: #e9f8ee;
          color: #188a43;
        }

        .yellow {
          background: #fff5df;
          color: #a66a00;
        }

        .red {
          background: #ffeaea;
          color: #c62828;
        }

        .blue {
          background: #eaf2ff;
          color: #2767b1;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        .info-label {
          color: #999;
          font-size: 10px;
          text-transform: uppercase;
          margin-bottom: 5px;
        }

        .info-value {
          font-size: 13px;
          font-weight: 700;
          word-break: break-word;
        }

        .address {
          background: #f7f7f7;
          border-radius: 9px;
          padding: 12px;
          font-size: 12px;
          line-height: 1.5;
        }

        .item {
          display: flex;
          gap: 14px;
          padding: 14px 0;
          border-bottom: 1px solid #eee;
        }

        .item:last-child {
          border-bottom: 0;
        }

        .product-image {
          width: 70px;
          height: 70px;
          object-fit: cover;
          border-radius: 9px;
          border: 1px solid #eee;
          background: #f1f1f1;
          flex-shrink: 0;
        }

        .product-info {
          flex: 1;
          min-width: 0;
        }

        .product-name {
          font-size: 14px;
          font-weight: 700;
        }

        .product-meta {
          color: #888;
          font-size: 11px;
          margin-top: 5px;
        }

        .item-right {
          text-align: right;
          min-width: 100px;
        }

        .item-price {
          font-weight: 700;
          font-size: 13px;
        }

        .total-row {
          border-top: 1px solid #eee;
          margin-top: 10px;
          padding-top: 15px;
          display: flex;
          justify-content: space-between;
          font-size: 18px;
          font-weight: 750;
        }

        .timeline {
          display: grid;
          gap: 12px;
        }

        .timeline-row {
          display: flex;
          justify-content: space-between;
          gap: 15px;
          padding: 10px 0;
          border-bottom: 1px solid #f0f0f0;
        }

        .timeline-row:last-child {
          border-bottom: 0;
        }

        .timeline-label {
          color: #777;
          font-size: 12px;
        }

        .timeline-value {
          font-size: 12px;
          font-weight: 700;
          text-align: right;
        }

        .empty {
          color: #999;
          font-size: 13px;
        }

        .center {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #888;
          font-size: 14px;
        }

        .error-box {
          max-width: 500px;
          margin: 100px auto;
          background: white;
          border: 1px solid #eee;
          border-radius: 14px;
          padding: 30px;
          text-align: center;
        }

        .error-box h2 {
          margin-top: 0;
        }

        .error-box p {
          color: #888;
          font-size: 13px;
        }

        .error-box button {
          border: 0;
          background: #111;
          color: white;
          border-radius: 8px;
          padding: 10px 14px;
          cursor: pointer;
          font-weight: 700;
        }

        @media (max-width: 900px) {
          .grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 600px) {
          .container {
            padding: 18px;
          }

          .topbar {
            flex-direction: column;
            align-items: flex-start;
          }

          .info-grid {
            grid-template-columns: 1fr;
          }

          .order-header {
            flex-direction: column;
          }

          .item {
            flex-wrap: wrap;
          }

          .item-right {
            width: 100%;
            text-align: left;
          }
        }
      `}</style>

      <div className="container">

        <div className="topbar">
          <div className="title">
            <h1>Order Details</h1>

            <p>
              Complete information for this
              marketplace order.
            </p>
          </div>

          <div className="actions">
            <button
              className="button"
              onClick={() =>
                router.push("/admin/orders")
              }
            >
              ← Orders
            </button>

            <button
              className="button"
              onClick={loadOrder}
            >
              ↻ Refresh
            </button>
          </div>
        </div>

        <div className="card">
          <div className="order-header">

            <div>
              <div className="order-id">
                #{order.id}
              </div>

              <div className="muted">
                Created:{" "}
                {formatDate(order.createdAt)}
              </div>
            </div>

            <span className="badge blue">
              {formatStatus(order.status)}
            </span>

          </div>
        </div>

        <div className="grid">

          <div>

            <div className="card">
              <h2>Customer Details</h2>

              <div className="info-grid">

                <div>
                  <div className="info-label">
                    Name
                  </div>

                  <div className="info-value">
                    {order.customer.name}
                  </div>
                </div>

                <div>
                  <div className="info-label">
                    Phone
                  </div>

                  <div className="info-value">
                    {order.customer.phone}
                  </div>
                </div>

                <div>
                  <div className="info-label">
                    Email
                  </div>

                  <div className="info-value">
                    {order.customer.email}
                  </div>
                </div>

                <div>
                  <div className="info-label">
                    Account
                  </div>

                  <div className="info-value">
                    {order.customer.isBlocked
                      ? "Blocked"
                      : "Active"}
                  </div>
                </div>

              </div>
            </div>

            <div className="card">
              <h2>Delivery Address</h2>

              <div className="address">
                {order.address}
              </div>
            </div>

            <div className="card">
              <h2>Ordered Products</h2>

              {order.items.length === 0 ? (
                <div className="empty">
                  No products found.
                </div>
              ) : (
                order.items.map((item) => (
                  <div
                    className="item"
                    key={item.id}
                  >

                    {item.product.image ? (
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="product-image"
                      />
                    ) : (
                      <div className="product-image" />
                    )}

                    <div className="product-info">

                      <div className="product-name">
                        {item.product.name}
                      </div>

                      <div className="product-meta">
                        Category:{" "}
                        {item.product.category
                          ?.name ||
                          "Uncategorized"}
                      </div>

                      <div className="product-meta">
                        Seller:{" "}
                        {item.product.seller
                          ?.shopName ||
                          "Unknown Seller"}
                      </div>

                      <div className="product-meta">
                        Quantity:{" "}
                        {item.quantity}
                      </div>

                    </div>

                    <div className="item-right">

                      <div className="item-price">
                        {formatAmount(
                          item.price
                        )}
                      </div>

                      <div className="product-meta">
                        Return:{" "}
                        {formatStatus(
                          item.returnStatus
                        )}
                      </div>

                    </div>

                  </div>
                ))
              )}

              <div className="total-row">
                <span>Total</span>

                <span>
                  {formatAmount(
                    order.totalAmount
                  )}
                </span>
              </div>
            </div>

            <div className="card">
              <h2>Order Timeline</h2>

              <div className="timeline">

                <div className="timeline-row">
                  <span className="timeline-label">
                    Order Created
                  </span>

                  <span className="timeline-value">
                    {formatDate(
                      order.createdAt
                    )}
                  </span>
                </div>

                <div className="timeline-row">
                  <span className="timeline-label">
                    Seller OTP Verified
                  </span>

                  <span className="timeline-value">
                    {formatDate(
                      order.sellerOtpVerifiedAt
                    )}
                  </span>
                </div>

                <div className="timeline-row">
                  <span className="timeline-label">
                    Picked Up
                  </span>

                  <span className="timeline-value">
                    {formatDate(
                      order.pickedUpAt
                    )}
                  </span>
                </div>

                <div className="timeline-row">
                  <span className="timeline-label">
                    Customer OTP Verified
                  </span>

                  <span className="timeline-value">
                    {formatDate(
                      order.customerOtpVerifiedAt
                    )}
                  </span>
                </div>

                <div className="timeline-row">
                  <span className="timeline-label">
                    Delivered
                  </span>

                  <span className="timeline-value">
                    {formatDate(
                      order.deliveredAt
                    )}
                  </span>
                </div>

              </div>
            </div>

          </div>

          <div>

            <div className="card">
              <h2>Payment</h2>

              <div className="info-grid">

                <div>
                  <div className="info-label">
                    Method
                  </div>

                  <div className="info-value">
                    {order.paymentMethod}
                  </div>
                </div>

                <div>
                  <div className="info-label">
                    Status
                  </div>

                  <div className="info-value">
                    <span
                      className={`badge ${
                        order.paymentStatus ===
                        "PAID"
                          ? "green"
                          : order.paymentStatus ===
                            "FAILED"
                          ? "red"
                          : "yellow"
                      }`}
                    >
                      {formatStatus(
                        order.paymentStatus
                      )}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="info-label">
                    Paid At
                  </div>

                  <div className="info-value">
                    {formatDate(
                      order.paidAt
                    )}
                  </div>
                </div>

                <div>
                  <div className="info-label">
                    Razorpay Order
                  </div>

                  <div className="info-value">
                    {order.razorpayOrderId ||
                      "—"}
                  </div>
                </div>

                <div>
                  <div className="info-label">
                    Razorpay Payment
                  </div>

                  <div className="info-value">
                    {order.razorpayPaymentId ||
                      "—"}
                  </div>
                </div>

              </div>
            </div>

            <div className="card">
              <h2>Return Information</h2>

              <div className="info-grid">

                <div>
                  <div className="info-label">
                    Return Status
                  </div>

                  <div className="info-value">
                    <span className="badge">
                      {formatStatus(
                        order.returnStatus
                      )}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="info-label">
                    Pickup Status
                  </div>

                  <div className="info-value">
                    {formatStatus(
                      order.returnPickupStatus
                    )}
                  </div>
                </div>

                <div>
                  <div className="info-label">
                    Return Deadline
                  </div>

                  <div className="info-value">
                    {formatDate(
                      order.returnDeadline
                    )}
                  </div>
                </div>

                <div>
                  <div className="info-label">
                    Requested At
                  </div>

                  <div className="info-value">
                    {formatDate(
                      order.returnRequestedAt
                    )}
                  </div>
                </div>

                <div>
                  <div className="info-label">
                    Reason
                  </div>

                  <div className="info-value">
                    {order.returnReason ||
                      "—"}
                  </div>
                </div>

                <div>
                  <div className="info-label">
                    Completed At
                  </div>

                  <div className="info-value">
                    {formatDate(
                      order.returnCompletedAt
                    )}
                  </div>
                </div>

              </div>
            </div>

            <div className="card">
              <h2>Refund Information</h2>

              <div className="info-grid">

                <div>
                  <div className="info-label">
                    Refund Status
                  </div>

                  <div className="info-value">
                    {formatStatus(
                      order.refundStatus
                    )}
                  </div>
                </div>

                <div>
                  <div className="info-label">
                    Refund Amount
                  </div>

                  <div className="info-value">
                    {order.refundAmount != null
                      ? formatAmount(
                          order.refundAmount
                        )
                      : "—"}
                  </div>
                </div>

                <div>
                  <div className="info-label">
                    Requested At
                  </div>

                  <div className="info-value">
                    {formatDate(
                      order.refundRequestedAt
                    )}
                  </div>
                </div>

                <div>
                  <div className="info-label">
                    Completed At
                  </div>

                  <div className="info-value">
                    {formatDate(
                      order.refundCompletedAt
                    )}
                  </div>
                </div>

                <div>
                  <div className="info-label">
                    Failure Reason
                  </div>

                  <div className="info-value">
                    {order.refundFailureReason ||
                      "—"}
                  </div>
                </div>

              </div>
            </div>

          </div>

        </div>

      </div>
    </main>
  );
}