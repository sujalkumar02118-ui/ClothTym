"use client";

import { useEffect, useState } from "react";

type Seller = {
  id: string;
  registrationId?: string | null;
  shopName: string;
  ownerName: string;
  city: string;
  address?: string | null;
  approved: boolean;
  registrationStatus?: string;
  rejectionReason?: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    isBlocked: boolean;
    createdAt: string;
  };
};

export default function AdminSellersPage() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");
  const [error, setError] = useState("");

  async function loadSellers() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/admin/sellers",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Seller data could not be loaded."
        );
      }

      setSellers(
        Array.isArray(data.data?.sellers)
          ? data.data.sellers
          : []
      );
    } catch (error) {
      console.error(
        "ADMIN SELLERS ERROR:",
        error
      );

      setError(
        "Seller data load nahi ho paaya."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSellers();
  }, []);

  async function updateApproval(
    sellerId: string,
    approved: boolean
  ) {
    try {
      setUpdatingId(sellerId);
      setError("");

      const response = await fetch(
        "/api/admin/sellers",
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            sellerId,
            approved,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Seller status could not be updated."
        );
      }

      await loadSellers();
    } catch (error) {
      console.error(
        "SELLER APPROVAL ERROR:",
        error
      );

      setError(
        "Seller approval update nahi ho paaya."
      );
    } finally {
      setUpdatingId("");
    }
  }

  const totalSellers = sellers.length;

  const approvedSellers = sellers.filter(
    (seller) => seller.approved
  ).length;

  const pendingSellers = sellers.filter(
    (seller) => !seller.approved
  ).length;

  function getStatusLabel(
    seller: Seller
  ) {
    if (seller.approved) {
      return "APPROVED";
    }

    if (
      seller.registrationStatus ===
      "REJECTED"
    ) {
      return "REJECTED";
    }

    if (
      seller.registrationStatus ===
      "SUBMITTED"
    ) {
      return "SUBMITTED";
    }

    return "PENDING";
  }

  return (
    <main className="seller-page">
      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: #f6f7fb;
        }

        .seller-page {
          min-height: 100vh;
          background: #f6f7fb;
          color: #171717;
          font-family: Arial, Helvetica, sans-serif;
          padding: 30px;
        }

        .seller-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 28px;
        }

        .seller-header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 800;
        }

        .seller-header p {
          margin: 7px 0 0;
          color: #777;
          font-size: 13px;
        }

        .refresh-btn {
          border: 1px solid #ddd;
          background: white;
          padding: 10px 15px;
          border-radius: 9px;
          font-weight: 700;
          cursor: pointer;
        }

        .refresh-btn:hover {
          background: #f3f3f3;
        }

        .stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 22px;
        }

        .stat {
          background: white;
          border: 1px solid #e8e8e8;
          border-radius: 14px;
          padding: 20px;
        }

        .stat-label {
          color: #777;
          font-size: 13px;
        }

        .stat-value {
          margin-top: 10px;
          font-size: 28px;
          font-weight: 800;
        }

        .stat-note {
          margin-top: 5px;
          color: #999;
          font-size: 11px;
        }

        .error {
          background: #fff0f0;
          border: 1px solid #ffd0d0;
          color: #c62828;
          padding: 13px;
          border-radius: 10px;
          margin-bottom: 18px;
          font-size: 13px;
          font-weight: 600;
        }

        .panel {
          background: white;
          border: 1px solid #e8e8e8;
          border-radius: 14px;
          padding: 22px;
        }

        .panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 18px;
        }

        .panel-title {
          font-size: 17px;
          font-weight: 800;
        }

        .panel-subtitle {
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
          min-width: 900px;
        }

        th {
          text-align: left;
          padding: 12px 10px;
          border-bottom: 1px solid #eee;
          color: #999;
          font-size: 10px;
        }

        td {
          padding: 15px 10px;
          border-bottom: 1px solid #f0f0f0;
          font-size: 12px;
        }

        .shop-name {
          font-weight: 700;
          font-size: 13px;
        }

        .owner {
          margin-top: 4px;
          color: #888;
          font-size: 11px;
        }

        .contact {
          line-height: 1.5;
        }

        .city {
          font-weight: 600;
        }

        .status {
          display: inline-flex;
          padding: 6px 10px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 800;
        }

        .approved {
          background: #e8f8ee;
          color: #168342;
        }

        .pending {
          background: #fff5d8;
          color: #9b6700;
        }

        .rejected {
          background: #ffeaea;
          color: #c62828;
        }

        .action-btn {
          border: none;
          border-radius: 8px;
          padding: 8px 12px;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
        }

        .approve-btn {
          background: #111;
          color: white;
        }

        .approve-btn:hover {
          background: #333;
        }

        .unapprove-btn {
          background: #ffeaea;
          color: #c62828;
        }

        .unapprove-btn:hover {
          background: #ffdada;
        }

        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .loading,
        .empty {
          text-align: center;
          padding: 45px 10px;
          color: #999;
          font-size: 13px;
        }

        @media (max-width: 800px) {
          .seller-page {
            padding: 16px;
          }

          .stats {
            grid-template-columns: 1fr;
          }

          .seller-header {
            align-items: flex-start;
            gap: 15px;
          }
        }
      `}</style>

      <div className="seller-header">
        <div>
          <h1>Sellers</h1>

          <p>
            Manage ClothTym sellers and approval status.
          </p>
        </div>

        <button
          className="refresh-btn"
          onClick={loadSellers}
        >
          ↻ Refresh
        </button>
      </div>

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      <section className="stats">
        <div className="stat">
          <div className="stat-label">
            Total Sellers
          </div>

          <div className="stat-value">
            {loading ? "..." : totalSellers}
          </div>

          <div className="stat-note">
            All registered sellers
          </div>
        </div>

        <div className="stat">
          <div className="stat-label">
            Approved Sellers
          </div>

          <div className="stat-value">
            {loading ? "..." : approvedSellers}
          </div>

          <div className="stat-note">
            Sellers allowed to operate
          </div>
        </div>

        <div className="stat">
          <div className="stat-label">
            Pending Approval
          </div>

          <div className="stat-value">
            {loading ? "..." : pendingSellers}
          </div>

          <div className="stat-note">
            Sellers waiting for approval
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <div className="panel-title">
              All Sellers
            </div>

            <div className="panel-subtitle">
              Review and manage seller approval.
            </div>
          </div>
        </div>

        <div className="table-wrapper">
          {loading ? (
            <div className="loading">
              Loading sellers...
            </div>
          ) : sellers.length === 0 ? (
            <div className="empty">
              No sellers found.
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>SHOP</th>
                  <th>OWNER</th>
                  <th>CONTACT</th>
                  <th>CITY</th>
                  <th>STATUS</th>
                  <th>JOINED</th>
                  <th>ACTION</th>
                </tr>
              </thead>

              <tbody>
                {sellers.map((seller) => {
                  const status =
                    getStatusLabel(
                      seller
                    );

                  return (
                    <tr key={seller.id}>
                      <td>
                        <div className="shop-name">
                          {seller.shopName}
                        </div>

                        <div className="owner">
                          Seller ID: {seller.id}
                        </div>
                      </td>

                      <td>
                        <strong>
                          {seller.ownerName}
                        </strong>
                      </td>

                      <td className="contact">
                        <div>
                          {seller.user.email}
                        </div>

                        <div>
                          {seller.user.phone}
                        </div>
                      </td>

                      <td>
                        <span className="city">
                          {seller.city}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`status ${
                            status ===
                            "APPROVED"
                              ? "approved"
                              : status ===
                                "REJECTED"
                              ? "rejected"
                              : "pending"
                          }`}
                        >
                          {status}
                        </span>
                      </td>

                      <td>
                        {new Date(
                          seller.user.createdAt
                        ).toLocaleDateString(
                          "en-IN",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          }
                        )}
                      </td>

                      <td>
                        {seller.approved ? (
                          <button
                            className="action-btn unapprove-btn"
                            disabled={
                              updatingId ===
                              seller.id
                            }
                            onClick={() =>
                              updateApproval(
                                seller.id,
                                false
                              )
                            }
                          >
                            {updatingId ===
                            seller.id
                              ? "Updating..."
                              : "Unapprove"}
                          </button>
                        ) : (
                          <button
                            className="action-btn approve-btn"
                            disabled={
                              updatingId ===
                              seller.id
                            }
                            onClick={() =>
                              updateApproval(
                                seller.id,
                                true
                              )
                            }
                          >
                            {updatingId ===
                            seller.id
                              ? "Updating..."
                              : "Approve"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </main>
  );
}