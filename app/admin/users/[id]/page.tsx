"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type UserDetails = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isBlocked: boolean;
  createdAt: string;

  seller?: {
    id: string;
    shopName: string;
    ownerName: string;
    city: string;
    address?: string | null;
    approved: boolean;
  } | null;

  orderStats?: {
    totalOrders: number;
    totalSpent: number;
  };
};

export default function AdminUserDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const userId = String(params.id);

  const [user, setUser] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadUser() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/admin/users/${userId}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "User details could not be loaded."
        );
      }

      setUser(data.data);
    } catch (error) {
      console.error("USER DETAILS ERROR:", error);

      setError(
        "User details load nahi ho paaya."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (userId) {
      loadUser();
    }
  }, [userId]);

  async function toggleBlock() {
    if (!user) return;

    const action = user.isBlocked
      ? "unblock"
      : "block";

    const confirmed = window.confirm(
      user.isBlocked
        ? "Are you sure you want to unblock this user?"
        : "Are you sure you want to block this user?"
    );

    if (!confirmed) return;

    try {
      setActionLoading(true);
      setError("");

      const response = await fetch(
        `/api/admin/users/${user.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "User status could not be updated."
        );
      }

      setUser((previous) =>
        previous
          ? {
              ...previous,
              isBlocked: data.data.isBlocked,
            }
          : previous
      );
    } catch (error) {
      console.error("BLOCK USER ERROR:", error);

      setError(
        "User status update nahi ho paaya."
      );
    } finally {
      setActionLoading(false);
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

  if (loading) {
    return (
      <main className="page">
        <div className="loading">
          Loading user details...
        </div>

        <style>{styles}</style>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="page">
        <div className="error-page">
          <h2>User not found</h2>

          <button
            className="back-button"
            onClick={() => router.push("/admin/users")}
          >
            ← Back to Users
          </button>
        </div>

        <style>{styles}</style>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="container">

        <div className="topbar">
          <button
            className="back-button"
            onClick={() => router.push("/admin/users")}
          >
            ← Back to Users
          </button>

          <button
            className="refresh-button"
            onClick={loadUser}
            disabled={actionLoading}
          >
            ↻ Refresh
          </button>
        </div>

        {error && (
          <div className="error-box">
            {error}
          </div>
        )}

        <section className="profile-card">

          <div className="avatar">
            {user.name
              ? user.name.charAt(0).toUpperCase()
              : "U"}
          </div>

          <div className="profile-info">
            <h1>{user.name}</h1>

            <p>{user.email}</p>

            <div className="badges">

              <span className={`role ${user.role.toLowerCase()}`}>
                {user.role}
              </span>

              <span
                className={
                  user.isBlocked
                    ? "status blocked"
                    : "status active"
                }
              >
                {user.isBlocked
                  ? "BLOCKED"
                  : "ACTIVE"}
              </span>

            </div>
          </div>

          <button
            className={
              user.isBlocked
                ? "action unblock"
                : "action block"
            }
            onClick={toggleBlock}
            disabled={actionLoading}
          >
            {actionLoading
              ? "Updating..."
              : user.isBlocked
              ? "Unblock User"
              : "Block User"}
          </button>

        </section>

        <section className="stats-grid">

          <div className="stat-card">
            <span>Total Orders</span>
            <strong>
              {user.orderStats?.totalOrders || 0}
            </strong>
          </div>

          <div className="stat-card">
            <span>Total Spending</span>
            <strong>
              {formatAmount(
                user.orderStats?.totalSpent || 0
              )}
            </strong>
          </div>

          <div className="stat-card">
            <span>Account Status</span>
            <strong>
              {user.isBlocked
                ? "Blocked"
                : "Active"}
            </strong>
          </div>

        </section>

        <section className="card">

          <div className="card-title">
            Personal Information
          </div>

          <div className="details-grid">

            <div>
              <label>Full Name</label>
              <p>{user.name}</p>
            </div>

            <div>
              <label>Email</label>
              <p>{user.email}</p>
            </div>

            <div>
              <label>Phone</label>
              <p>{user.phone}</p>
            </div>

            <div>
              <label>User ID</label>
              <p className="small">
                {user.id}
              </p>
            </div>

            <div>
              <label>Role</label>
              <p>{user.role}</p>
            </div>

            <div>
              <label>Joined</label>
              <p>
                {formatDate(user.createdAt)}
              </p>
            </div>

          </div>

        </section>

        {user.seller && (
          <section className="card">

            <div className="card-title">
              Seller Information
            </div>

            <div className="details-grid">

              <div>
                <label>Shop Name</label>
                <p>
                  {user.seller.shopName}
                </p>
              </div>

              <div>
                <label>Owner Name</label>
                <p>
                  {user.seller.ownerName}
                </p>
              </div>

              <div>
                <label>City</label>
                <p>
                  {user.seller.city}
                </p>
              </div>

              <div>
                <label>Address</label>
                <p>
                  {user.seller.address || "Not provided"}
                </p>
              </div>

              <div>
                <label>Seller Approval</label>
                <p>
                  {user.seller.approved
                    ? "Approved"
                    : "Pending"}
                </p>
              </div>

            </div>

          </section>
        )}

      </div>

      <style>{styles}</style>
    </main>
  );
}

const styles = `
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
    padding: 30px;
  }

  .container {
    max-width: 1250px;
    margin: 0 auto;
  }

  .topbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 22px;
  }

  .back-button,
  .refresh-button {
    border: 1px solid #dedede;
    background: #fff;
    padding: 10px 15px;
    border-radius: 9px;
    cursor: pointer;
    font-weight: 600;
  }

  .back-button:hover,
  .refresh-button:hover {
    background: #f2f2f2;
  }

  .profile-card {
    background: #fff;
    border: 1px solid #e8e8e8;
    border-radius: 16px;
    padding: 25px;
    display: flex;
    align-items: center;
    gap: 18px;
    margin-bottom: 20px;
  }

  .avatar {
    width: 68px;
    height: 68px;
    border-radius: 50%;
    background: #111;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 25px;
    font-weight: 800;
  }

  .profile-info {
    flex: 1;
  }

  .profile-info h1 {
    margin: 0;
    font-size: 24px;
  }

  .profile-info p {
    margin: 5px 0 10px;
    color: #777;
    font-size: 13px;
  }

  .badges {
    display: flex;
    gap: 8px;
  }

  .role,
  .status {
    display: inline-flex;
    padding: 6px 10px;
    border-radius: 20px;
    font-size: 10px;
    font-weight: 800;
  }

  .role.buyer {
    background: #eaf3ff;
    color: #1769aa;
  }

  .role.seller {
    background: #fff5d9;
    color: #a66b00;
  }

  .role.admin {
    background: #eee;
    color: #111;
  }

  .status.active {
    background: #e8f8ee;
    color: #188a43;
  }

  .status.blocked {
    background: #ffeaea;
    color: #c62828;
  }

  .action {
    border: none;
    padding: 11px 17px;
    border-radius: 9px;
    cursor: pointer;
    font-weight: 700;
  }

  .action.block {
    background: #111;
    color: #fff;
  }

  .action.unblock {
    background: #e9f8ee;
    color: #188a43;
  }

  .action:disabled {
    opacity: .6;
    cursor: not-allowed;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-bottom: 20px;
  }

  .stat-card {
    background: #fff;
    border: 1px solid #e8e8e8;
    border-radius: 14px;
    padding: 20px;
  }

  .stat-card span {
    display: block;
    color: #777;
    font-size: 13px;
  }

  .stat-card strong {
    display: block;
    margin-top: 10px;
    font-size: 25px;
  }

  .card {
    background: #fff;
    border: 1px solid #e8e8e8;
    border-radius: 14px;
    padding: 22px;
    margin-bottom: 20px;
  }

  .card-title {
    font-size: 17px;
    font-weight: 700;
    margin-bottom: 20px;
  }

  .details-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }

  .details-grid label {
    display: block;
    color: #999;
    font-size: 11px;
    margin-bottom: 6px;
    text-transform: uppercase;
  }

  .details-grid p {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
  }

  .details-grid p.small {
    font-size: 11px;
    word-break: break-all;
    color: #555;
  }

  .error-box {
    background: #fff2f2;
    border: 1px solid #ffd1d1;
    color: #c62828;
    padding: 14px;
    border-radius: 10px;
    margin-bottom: 20px;
    font-size: 13px;
    font-weight: 600;
  }

  .loading,
  .error-page {
    min-height: 70vh;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 15px;
    font-size: 14px;
    color: #777;
  }

  @media (max-width: 700px) {
    .page {
      padding: 16px;
    }

    .profile-card {
      align-items: flex-start;
      flex-direction: column;
    }

    .action {
      width: 100%;
    }

    .stats-grid,
    .details-grid {
      grid-template-columns: 1fr;
    }
  }
`;