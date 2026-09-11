"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type SalesOverviewItem = {
  date: string;
  label: string;
  sales: number;
  orders: number;
};

type AdminStats = {
  totalOrders: number;
  customers: number;
  sellers: number;
  totalProducts: number;
  totalSales: number;
  recentOrders: {
    id: string;
    totalAmount: number;
    status: string;
    createdAt: string;
    user?: {
      name?: string | null;
      email?: string | null;
    } | null;
  }[];
};

export default function AdminPage() {
  const router = useRouter();

  const [stats, setStats] = useState<AdminStats>({
    totalOrders: 0,
    customers: 0,
    sellers: 0,
    totalProducts: 0,
    totalSales: 0,
    recentOrders: [],
  });

  const [salesOverview, setSalesOverview] = useState<
    SalesOverviewItem[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadAdminStats();
  }, []);

  async function loadAdminStats() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/dashboard", {
        method: "GET",
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Admin statistics could not be loaded."
        );
      }

      const data = result.data || {};

      setStats({
        totalOrders: Number(data.totalOrders || 0),
        customers: Number(data.totalCustomers || 0),
        sellers: Number(data.totalSellers || 0),
        totalProducts: Number(data.totalProducts || 0),
        totalSales: Number(data.totalSales || 0),
        recentOrders: Array.isArray(data.recentOrders)
          ? data.recentOrders
          : [],
      });

      setSalesOverview(
        Array.isArray(data.salesOverview)
          ? data.salesOverview
          : []
      );
    } catch (error) {
      console.error("ADMIN DASHBOARD ERROR:", error);

      setError(
        "Dashboard data load nahi ho paaya."
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

  function getStatusClass(status: string) {
    switch (status) {
      case "DELIVERED":
        return "status delivered";

      case "CANCELLED":
        return "status cancelled";

      case "OUT_FOR_DELIVERY":
      case "PICKED_UP":
        return "status delivery";

      case "CONFIRMED":
      case "READY_FOR_PICKUP":
        return "status confirmed";

      default:
        return "status pending";
    }
  }

  function getStatusText(status: string) {
    return String(status).replaceAll("_", " ");
  }

  const maxSales = Math.max(
    ...salesOverview.map(
      (item) => Number(item.sales || 0)
    ),
    1
  );

  return (
    <main className="admin-page">
      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: #f6f7fb;
        }

        .admin-page {
          min-height: 100vh;
          background: #f6f7fb;
          color: #171717;
          font-family: Arial, Helvetica, sans-serif;
        }

        .admin-layout {
          display: flex;
          min-height: 100vh;
        }

        .sidebar {
          width: 250px;
          min-height: 100vh;
          background: #ffffff;
          border-right: 1px solid #e8e8e8;
          padding: 24px 16px;
          position: sticky;
          top: 0;
          overflow-y: auto;
        }

        .brand {
          padding: 4px 12px 28px;
          border-bottom: 1px solid #eeeeee;
          margin-bottom: 20px;
        }

        .brand-name {
          font-size: 24px;
          font-weight: 800;
          letter-spacing: -0.5px;
        }

        .brand-subtitle {
          font-size: 12px;
          color: #888;
          margin-top: 5px;
        }

        .menu-title {
          font-size: 11px;
          font-weight: 700;
          color: #999;
          letter-spacing: 1px;
          padding: 0 12px;
          margin: 20px 0 10px;
          text-transform: uppercase;
        }

        .menu-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          margin-bottom: 4px;
          border-radius: 10px;
          border: none;
          background: transparent;
          color: #555;
          font-size: 14px;
          text-align: left;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .menu-item:hover {
          background: #f1f1f1;
          color: #111;
          transform: translateX(2px);
        }

        .menu-item.active {
          background: #111;
          color: white;
          font-weight: 600;
        }

        .menu-icon {
          width: 22px;
          min-width: 22px;
          text-align: center;
          font-size: 16px;
        }

        .main-content {
          flex: 1;
          min-width: 0;
          padding: 0 30px 40px;
        }

        .topbar {
          min-height: 76px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #e8e8e8;
          margin-bottom: 30px;
          gap: 20px;
        }

        .page-title h1 {
          margin: 0;
          font-size: 25px;
          font-weight: 750;
        }

        .page-title p {
          margin: 5px 0 0;
          color: #888;
          font-size: 13px;
        }

        .top-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .search {
          width: 220px;
          height: 40px;
          border: 1px solid #dedede;
          border-radius: 9px;
          padding: 0 14px;
          outline: none;
          background: white;
        }

        .search:focus {
          border-color: #999;
        }

        .notification {
          width: 40px;
          height: 40px;
          border: 1px solid #dedede;
          background: white;
          border-radius: 9px;
          cursor: pointer;
          font-size: 17px;
          transition: 0.2s ease;
        }

        .notification:hover {
          background: #f1f1f1;
        }

        .admin-profile {
          display: flex;
          align-items: center;
          gap: 10px;
          padding-left: 8px;
        }

        .avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: #111;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
        }

        .profile-text {
          line-height: 1.2;
        }

        .profile-name {
          font-size: 13px;
          font-weight: 700;
        }

        .profile-role {
          font-size: 11px;
          color: #888;
          margin-top: 3px;
        }

        .welcome {
          background: #111;
          color: white;
          border-radius: 16px;
          padding: 28px 30px;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .welcome h2 {
          margin: 0;
          font-size: 21px;
        }

        .welcome p {
          margin: 7px 0 0;
          color: #c7c7c7;
          font-size: 13px;
        }

        .status-online {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #242424;
          padding: 9px 13px;
          border-radius: 30px;
          font-size: 12px;
          white-space: nowrap;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #35c759;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        .stat-card {
          background: white;
          border: 1px solid #e8e8e8;
          border-radius: 14px;
          padding: 20px;
        }

        .stat-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .stat-label {
          font-size: 13px;
          color: #777;
        }

        .stat-icon {
          width: 36px;
          height: 36px;
          border-radius: 9px;
          background: #f3f3f3;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-value {
          font-size: 27px;
          font-weight: 750;
          margin-top: 14px;
        }

        .stat-note {
          font-size: 11px;
          color: #999;
          margin-top: 5px;
        }

        .content-grid {
          display: grid;
          grid-template-columns: 1.7fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
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
          margin-bottom: 20px;
          gap: 10px;
        }

        .panel-title {
          font-size: 16px;
          font-weight: 700;
        }

        .panel-subtitle {
          font-size: 11px;
          color: #999;
          margin-top: 4px;
        }

        .view-all {
          border: none;
          background: transparent;
          font-size: 12px;
          font-weight: 600;
          color: #555;
          cursor: pointer;
        }

        .view-all:hover {
          color: #000;
        }

        .chart {
          height: 230px;
          display: flex;
          align-items: flex-end;
          gap: 12px;
          padding: 15px 5px 0;
          border-bottom: 1px solid #eeeeee;
        }

        .bar {
          flex: 1;
          background: #111;
          border-radius: 5px 5px 0 0;
          min-width: 12px;
          transition: height 0.3s ease;
          cursor: pointer;
        }

        .bar:hover {
          opacity: 0.75;
        }

        .chart-labels {
          display: flex;
          justify-content: space-between;
          padding: 9px 5px 0;
          color: #999;
          font-size: 10px;
        }

        .chart-empty {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #999;
          font-size: 13px;
        }

        .quick-actions {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }

        .quick-card {
          border: 1px solid #eeeeee;
          border-radius: 10px;
          padding: 16px;
          background: #fafafa;
          transition: 0.2s ease;
        }

        .quick-card:hover {
          background: #f2f2f2;
        }

        .quick-card strong {
          display: block;
          font-size: 13px;
          margin-bottom: 5px;
        }

        .quick-card span {
          font-size: 11px;
          color: #999;
        }

        .table-wrapper {
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th {
          text-align: left;
          font-size: 11px;
          color: #999;
          font-weight: 600;
          padding: 12px 10px;
          border-bottom: 1px solid #eeeeee;
        }

        td {
          padding: 15px 10px;
          font-size: 12px;
          border-bottom: 1px solid #f0f0f0;
        }

        .empty-state,
        .loading-state {
          text-align: center;
          padding: 38px 10px;
          color: #999;
          font-size: 13px;
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

        .status {
          display: inline-flex;
          padding: 6px 9px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 700;
          white-space: nowrap;
        }

        .status.delivered {
          background: #e9f8ee;
          color: #188a43;
        }

        .status.cancelled {
          background: #ffeaea;
          color: #c62828;
        }

        .status.delivery {
          background: #eaf3ff;
          color: #1769aa;
        }

        .status.confirmed {
          background: #fff6db;
          color: #a66b00;
        }

        .status.pending {
          background: #f1f1f1;
          color: #666;
        }

        .refresh-button {
          border: 1px solid #dedede;
          background: white;
          border-radius: 9px;
          padding: 9px 13px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .refresh-button:hover {
          background: #f5f5f5;
        }

        @media (max-width: 1100px) {
          .sidebar {
            width: 215px;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .content-grid {
            grid-template-columns: 1fr;
          }

          .search {
            width: 160px;
          }
        }

        @media (max-width: 750px) {
          .admin-layout {
            display: block;
          }

          .sidebar {
            position: relative;
            width: 100%;
            min-height: auto;
            max-height: none;
            border-right: none;
            border-bottom: 1px solid #e8e8e8;
          }

          .main-content {
            padding: 0 16px 30px;
          }

          .topbar {
            height: auto;
            padding: 18px 0;
            gap: 15px;
            align-items: flex-start;
            flex-direction: column;
          }

          .top-actions {
            width: 100%;
            flex-wrap: wrap;
          }

          .search {
            width: 100%;
          }

          .welcome {
            gap: 15px;
            align-items: flex-start;
            flex-direction: column;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="admin-layout">

        {/* SIDEBAR */}

        <aside className="sidebar">

          <div className="brand">
            <div className="brand-name">
              ClothTym
            </div>

            <div className="brand-subtitle">
              Admin Control Center
            </div>
          </div>

          <div className="menu-title">
            Overview
          </div>

          <button
            className="menu-item active"
            onClick={() => router.push("/admin")}
          >
            <span className="menu-icon">
              📊
            </span>
            Dashboard
          </button>

          <div className="menu-title">
            Management
          </div>

          <button
            className="menu-item"
            onClick={() => router.push("/admin/users")}
          >
            <span className="menu-icon">
              👥
            </span>
            Users
          </button>

          <button
            className="menu-item"
            onClick={() => router.push("/admin/products")}
          >
            <span className="menu-icon">
              👕
            </span>
            Products
          </button>

          <button
            className="menu-item"
            onClick={() => router.push("/admin/orders")}
          >
            <span className="menu-icon">
              📦
            </span>
            Orders
          </button>

          <button
            className="menu-item"
            onClick={() =>
              router.push("/admin/returns")
            }
          >
            <span className="menu-icon">
              🔄
            </span>
            Returns & Refunds
          </button>

          <button
            className="menu-item"
            onClick={() =>
              router.push("/admin/payments")
            }
          >
            <span className="menu-icon">
              💳
            </span>
            Payments
          </button>

          <button
            className="menu-item"
            onClick={() =>
              router.push("/admin/delivery")
            }
          >
            <span className="menu-icon">
              🚚
            </span>
            Delivery
          </button>

          <div className="menu-title">
            Business
          </div>

          <button
            className="menu-item"
            onClick={() =>
              router.push("/admin/reviews")
            }
          >
            <span className="menu-icon">
              ⭐
            </span>
            Reviews
          </button>

          <button
            className="menu-item"
            onClick={() =>
              router.push("/admin/analytics")
            }
          >
            <span className="menu-icon">
              📈
            </span>
            Analytics
          </button>

          <button
            className="menu-item"
            onClick={() =>
              router.push("/admin/notifications")
            }
          >
            <span className="menu-icon">
              🔔
            </span>
            Notifications
          </button>

          <div className="menu-title">
            System
          </div>

          <button
            className="menu-item"
            onClick={() =>
              router.push("/admin/settings")
            }
          >
            <span className="menu-icon">
              ⚙️
            </span>
            Settings
          </button>

        </aside>

        {/* MAIN */}

        <section className="main-content">

          {/* TOP BAR */}

          <header className="topbar">

            <div className="page-title">

              <h1>
                Dashboard
              </h1>

              <p>
                Monitor and manage your ClothTym marketplace.
              </p>

            </div>

            <div className="top-actions">

              <input
                className="search"
                type="text"
                placeholder="Search..."
              />

              <button
                className="notification"
                onClick={() =>
                  router.push(
                    "/admin/notifications"
                  )
                }
                title="Notifications"
              >
                🔔
              </button>

              <button
                className="refresh-button"
                onClick={loadAdminStats}
              >
                ↻ Refresh
              </button>

              <div className="admin-profile">

                <div className="avatar">
                  A
                </div>

                <div className="profile-text">

                  <div className="profile-name">
                    Admin
                  </div>

                  <div className="profile-role">
                    Administrator
                  </div>

                </div>

              </div>

            </div>

          </header>

          {/* ERROR */}

          {error && (
            <div className="error-box">
              {error}
            </div>
          )}

          {/* WELCOME */}

          <section className="welcome">

            <div>

              <h2>
                Welcome back, Admin 👋
              </h2>

              <p>
                Here's what's happening with your marketplace today.
              </p>

            </div>

            <div className="status-online">

              <span className="status-dot"></span>

              System operational

            </div>

          </section>

          {/* STATS */}

          <section className="stats-grid">

            <div className="stat-card">

              <div className="stat-top">

                <span className="stat-label">
                  Total Sales
                </span>

                <span className="stat-icon">
                  ₹
                </span>

              </div>

              <div className="stat-value">

                {loading
                  ? "..."
                  : formatAmount(
                      stats.totalSales
                    )}

              </div>

              <div className="stat-note">
                Total order value
              </div>

            </div>

            <div className="stat-card">

              <div className="stat-top">

                <span className="stat-label">
                  Total Orders
                </span>

                <span className="stat-icon">
                  📦
                </span>

              </div>

              <div className="stat-value">

                {loading
                  ? "..."
                  : stats.totalOrders.toLocaleString(
                      "en-IN"
                    )}

              </div>

              <div className="stat-note">
                Live order database
              </div>

            </div>

            <div className="stat-card">

              <div className="stat-top">

                <span className="stat-label">
                  Customers
                </span>

                <span className="stat-icon">
                  👥
                </span>

              </div>

              <div className="stat-value">

                {loading
                  ? "..."
                  : stats.customers.toLocaleString(
                      "en-IN"
                    )}

              </div>

              <div className="stat-note">
                Registered customers
              </div>

            </div>

            <div className="stat-card">

              <div className="stat-top">

                <span className="stat-label">
                  Sellers
                </span>

                <span className="stat-icon">
                  🏪
                </span>

              </div>

              <div className="stat-value">

                {loading
                  ? "..."
                  : stats.sellers.toLocaleString(
                      "en-IN"
                    )}

              </div>

              <div className="stat-note">
                Registered sellers
              </div>

            </div>

          </section>

          {/* SALES + QUICK OVERVIEW */}

          <section className="content-grid">

            {/* SALES OVERVIEW */}

            <div className="panel">

              <div className="panel-header">

                <div>

                  <div className="panel-title">
                    Sales Overview
                  </div>

                  <div className="panel-subtitle">
                    Real sales data from the last 7 days
                  </div>

                </div>

                <button
                  className="view-all"
                  onClick={() =>
                    router.push(
                      "/admin/analytics"
                    )
                  }
                >
                  View Analytics →
                </button>

              </div>

              <div className="chart">

                {loading ? (

                  <div className="chart-empty">
                    Loading sales...
                  </div>

                ) : salesOverview.length === 0 ? (

                  <div className="chart-empty">
                    No sales data available yet.
                  </div>

                ) : (

                  salesOverview.map(
                    (item) => (
                      <div
                        key={item.date}
                        className="bar"
                        title={`${item.label}: ${formatAmount(
                          item.sales
                        )} • ${
                          item.orders
                        } orders`}
                        style={{
                          height: `${Math.max(
                            (Number(
                              item.sales || 0
                            ) /
                              maxSales) *
                              100,
                            Number(
                              item.sales || 0
                            ) > 0
                              ? 8
                              : 2
                          )}%`,
                        }}
                      />
                    )
                  )

                )}

              </div>

              <div className="chart-labels">

                {salesOverview.map(
                  (item) => (
                    <span key={item.date}>
                      {item.label}
                    </span>
                  )
                )}

              </div>

            </div>

            {/* QUICK OVERVIEW */}

            <div className="panel">

              <div className="panel-header">

                <div>

                  <div className="panel-title">
                    Quick Overview
                  </div>

                  <div className="panel-subtitle">
                    Marketplace statistics
                  </div>

                </div>

              </div>

              <div className="quick-actions">

                <div className="quick-card">

                  <strong>
                    📦 Orders
                  </strong>

                  <span>
                    {stats.totalOrders} total orders
                  </span>

                </div>

                <div className="quick-card">

                  <strong>
                    👕 Products
                  </strong>

                  <span>
                    {stats.totalProducts} products
                  </span>

                </div>

                <div className="quick-card">

                  <strong>
                    👥 Customers
                  </strong>

                  <span>
                    {stats.customers} customers
                  </span>

                </div>

                <div className="quick-card">

                  <strong>
                    🏪 Sellers
                  </strong>

                  <span>
                    {stats.sellers} sellers
                  </span>

                </div>

              </div>

            </div>

          </section>

          {/* RECENT ORDERS */}

          <section className="panel">

            <div className="panel-header">

              <div>

                <div className="panel-title">
                  Recent Orders
                </div>

                <div className="panel-subtitle">
                  Latest marketplace orders
                </div>

              </div>

              <button
                className="view-all"
                onClick={() =>
                  router.push(
                    "/admin/orders"
                  )
                }
              >
                View All →
              </button>

            </div>

            <div className="table-wrapper">

              <table>

                <thead>

                  <tr>

                    <th>
                      ORDER ID
                    </th>

                    <th>
                      CUSTOMER
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

                  {loading ? (

                    <tr>

                      <td colSpan={5}>

                        <div className="loading-state">
                          Loading orders...
                        </div>

                      </td>

                    </tr>

                  ) : stats.recentOrders.length === 0 ? (

                    <tr>

                      <td colSpan={5}>

                        <div className="empty-state">

                          No order data available yet.

                          <br />

                          Orders will appear here automatically.

                        </div>

                      </td>

                    </tr>

                  ) : (

                    stats.recentOrders.map(
                      (order) => (

                        <tr key={order.id}>

                          <td>
                            #{order.id}
                          </td>

                          <td>

                            <strong>
                              {order.user?.name ||
                                order.user?.email ||
                                "Customer"}
                            </strong>

                          </td>

                          <td>
                            {formatAmount(
                              order.totalAmount
                            )}
                          </td>

                          <td>

                            <span
                              className={getStatusClass(
                                order.status
                              )}
                            >
                              {getStatusText(
                                order.status
                              )}
                            </span>

                          </td>

                          <td>
                            {formatDate(
                              order.createdAt
                            )}
                          </td>

                        </tr>

                      )
                    )

                  )}

                </tbody>

              </table>

            </div>

          </section>

        </section>

      </div>

    </main>
  );
}