"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type NotificationUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
};

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  userId: string | null;
  user: NotificationUser | null;
  createdAt: string;
};

type AdminUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
};

export default function AdminNotificationsPage() {
  const router = useRouter();

  const [notifications, setNotifications] = useState<
    Notification[]
  >([]);

  const [users, setUsers] = useState<AdminUser[]>([]);

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [readFilter, setReadFilter] = useState("ALL");

  const [showCreate, setShowCreate] = useState(false);

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("SYSTEM");
  const [userId, setUserId] = useState("");

  async function loadNotifications() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/admin/notifications",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Notifications could not be loaded."
        );
      }

      setNotifications(
        Array.isArray(result.data)
          ? result.data
          : []
      );
    } catch (error) {
      console.error(
        "ADMIN NOTIFICATIONS ERROR:",
        error
      );

      setError(
        "Notifications data load nahi ho paaya."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadUsers() {
    try {
      const response = await fetch(
        "/api/admin/users",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        return;
      }

      setUsers(
        Array.isArray(result.data)
          ? result.data
          : []
      );
    } catch (error) {
      console.error(
        "ADMIN USERS LOAD ERROR:",
        error
      );
    }
  }

  useEffect(() => {
    loadNotifications();
    loadUsers();
  }, []);

  async function createNotification(
    event: React.FormEvent
  ) {
    event.preventDefault();

    try {
      setCreating(true);
      setError("");
      setSuccess("");

      if (!title.trim()) {
        setError("Notification title required hai.");
        return;
      }

      if (!message.trim()) {
        setError("Notification message required hai.");
        return;
      }

      const response = await fetch(
        "/api/admin/notifications",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: title.trim(),
            message: message.trim(),
            type,
            userId: userId || null,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Notification could not be created."
        );
      }

      setSuccess(
        "Notification successfully created."
      );

      setTitle("");
      setMessage("");
      setType("SYSTEM");
      setUserId("");

      setShowCreate(false);

      await loadNotifications();
    } catch (error) {
      console.error(
        "CREATE NOTIFICATION ERROR:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Notification create nahi ho paaya."
      );
    } finally {
      setCreating(false);
    }
  }

  const filteredNotifications = useMemo(() => {
    const searchText = search
      .trim()
      .toLowerCase();

    return notifications.filter(
      (notification) => {
        const matchesSearch =
          !searchText ||
          notification.title
            .toLowerCase()
            .includes(searchText) ||
          notification.message
            .toLowerCase()
            .includes(searchText) ||
          notification.type
            .toLowerCase()
            .includes(searchText) ||
          notification.user?.name
            ?.toLowerCase()
            .includes(searchText) ||
          notification.user?.email
            ?.toLowerCase()
            .includes(searchText);

        const matchesType =
          typeFilter === "ALL" ||
          notification.type === typeFilter;

        const matchesRead =
          readFilter === "ALL" ||
          (readFilter === "READ" &&
            notification.isRead) ||
          (readFilter === "UNREAD" &&
            !notification.isRead);

        return (
          matchesSearch &&
          matchesType &&
          matchesRead
        );
      }
    );
  }, [
    notifications,
    search,
    typeFilter,
    readFilter,
  ]);

  const stats = useMemo(() => {
    return {
      total: notifications.length,

      unread: notifications.filter(
        (item) => !item.isRead
      ).length,

      read: notifications.filter(
        (item) => item.isRead
      ).length,

      userNotifications:
        notifications.filter(
          (item) => item.userId !== null
        ).length,
    };
  }, [notifications]);

  const notificationTypes = useMemo(() => {
    return Array.from(
      new Set(
        notifications.map(
          (notification) => notification.type
        )
      )
    );
  }, [notifications]);

  function formatDate(date: string) {
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
  }

  function typeLabel(type: string) {
    return type
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  }

  function typeClass(type: string) {
    const normalized =
      type.toLowerCase();

    if (
      normalized.includes("order")
    ) {
      return "type order";
    }

    if (
      normalized.includes("payment")
    ) {
      return "type payment";
    }

    if (
      normalized.includes("delivery")
    ) {
      return "type delivery";
    }

    if (
      normalized.includes("return") ||
      normalized.includes("refund")
    ) {
      return "type return";
    }

    return "type system";
  }

  return (
    <main className="notifications-page">
      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: #f6f7fb;
        }

        .notifications-page {
          min-height: 100vh;
          background: #f6f7fb;
          color: #171717;
          font-family:
            Arial,
            Helvetica,
            sans-serif;
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
          margin-bottom: 25px;
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
          padding: 0 15px;
          border: 1px solid #dedede;
          border-radius: 9px;
          background: #fff;
          cursor: pointer;
          font-size: 12px;
          font-weight: 700;
        }

        .button:hover {
          background: #f2f2f2;
        }

        .primary {
          background: #111;
          color: #fff;
          border-color: #111;
        }

        .primary:hover {
          background: #333;
        }

        .button:disabled {
          opacity: .55;
          cursor: not-allowed;
        }

        .stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
          margin-bottom: 20px;
        }

        .stat-card {
          background: #fff;
          border: 1px solid #e7e7e7;
          border-radius: 14px;
          padding: 19px;
        }

        .stat-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .stat-label {
          color: #777;
          font-size: 11px;
          font-weight: 700;
        }

        .stat-icon {
          width: 35px;
          height: 35px;
          border-radius: 9px;
          background: #f3f3f3;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
        }

        .stat-value {
          margin-top: 11px;
          font-size: 26px;
          font-weight: 800;
        }

        .stat-note {
          margin-top: 5px;
          color: #999;
          font-size: 10px;
        }

        .alert {
          margin-bottom: 18px;
          padding: 13px 15px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 600;
        }

        .error {
          background: #fff1f1;
          border: 1px solid #ffd0d0;
          color: #c62828;
        }

        .success {
          background: #edf9f1;
          border: 1px solid #ccefd6;
          color: #168344;
        }

        .main-card {
          background: #fff;
          border: 1px solid #e6e6e6;
          border-radius: 15px;
          overflow: hidden;
        }

        .card-header {
          padding: 20px 22px;
          border-bottom: 1px solid #eee;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
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
          width: 320px;
          height: 40px;
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 0 13px;
          outline: none;
          font-size: 12px;
        }

        .search:focus,
        .select:focus,
        .input:focus,
        .textarea:focus {
          border-color: #999;
        }

        .select {
          height: 40px;
          min-width: 145px;
          border: 1px solid #ddd;
          border-radius: 8px;
          background: #fff;
          padding: 0 11px;
          outline: none;
          font-size: 12px;
        }

        .count {
          margin-left: auto;
          color: #999;
          font-size: 11px;
        }

        .table-wrapper {
          overflow-x: auto;
        }

        table {
          width: 100%;
          min-width: 1050px;
          border-collapse: collapse;
        }

        th {
          padding: 13px 18px;
          background: #fafafa;
          color: #999;
          border-bottom: 1px solid #eee;
          text-align: left;
          font-size: 10px;
          font-weight: 700;
          white-space: nowrap;
        }

        td {
          padding: 16px 18px;
          border-bottom: 1px solid #f0f0f0;
          vertical-align: middle;
          font-size: 12px;
        }

        tbody tr:hover {
          background: #fafafa;
        }

        .notification-title {
          font-weight: 750;
          color: #111;
        }

        .notification-message {
          max-width: 390px;
          margin-top: 5px;
          color: #777;
          line-height: 1.45;
        }

        .type {
          display: inline-flex;
          padding: 6px 9px;
          border-radius: 20px;
          font-size: 9px;
          font-weight: 800;
          white-space: nowrap;
        }

        .type.system {
          background: #eee;
          color: #555;
        }

        .type.order {
          background: #e9f1ff;
          color: #245c9e;
        }

        .type.payment {
          background: #eaf8ef;
          color: #168344;
        }

        .type.delivery {
          background: #e9f8ff;
          color: #08769d;
        }

        .type.return {
          background: #fff3df;
          color: #a05c00;
        }

        .user-name {
          font-weight: 700;
        }

        .user-email {
          display: block;
          margin-top: 4px;
          color: #aaa;
          font-size: 10px;
        }

        .system-user {
          color: #888;
          font-size: 11px;
          font-weight: 600;
        }

        .read-status {
          display: inline-flex;
          padding: 6px 9px;
          border-radius: 20px;
          font-size: 9px;
          font-weight: 800;
        }

        .read {
          background: #eaf8ef;
          color: #168344;
        }

        .unread {
          background: #fff3d8;
          color: #9a6800;
        }

        .date {
          color: #777;
          white-space: nowrap;
          font-size: 11px;
        }

        .loading,
        .empty {
          padding: 70px 20px;
          text-align: center;
          color: #999;
          font-size: 12px;
        }

        .empty-icon {
          width: 60px;
          height: 60px;
          margin: 0 auto 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #f3f3f3;
          font-size: 25px;
        }

        .empty-title {
          color: #222;
          font-size: 15px;
          font-weight: 800;
        }

        .empty-text {
          margin-top: 7px;
          color: #999;
          font-size: 11px;
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,.45);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          z-index: 1000;
        }

        .modal {
          width: 100%;
          max-width: 560px;
          background: #fff;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 20px 60px rgba(0,0,0,.2);
        }

        .modal-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 22px;
        }

        .modal-title {
          font-size: 19px;
          font-weight: 800;
        }

        .modal-subtitle {
          margin-top: 5px;
          color: #999;
          font-size: 11px;
          line-height: 1.4;
        }

        .close {
          width: 32px;
          height: 32px;
          border: 1px solid #ddd;
          border-radius: 8px;
          background: #fff;
          cursor: pointer;
          font-size: 16px;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-label {
          display: block;
          margin-bottom: 7px;
          color: #555;
          font-size: 11px;
          font-weight: 700;
        }

        .input,
        .textarea {
          width: 100%;
          border: 1px solid #ddd;
          border-radius: 9px;
          padding: 11px 12px;
          outline: none;
          font-size: 12px;
          font-family: Arial, Helvetica, sans-serif;
        }

        .input {
          height: 42px;
        }

        .textarea {
          min-height: 105px;
          resize: vertical;
          line-height: 1.45;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 22px;
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

          .actions .button {
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

          .card-header {
            align-items: flex-start;
            flex-direction: column;
          }
        }
      `}</style>

      <div className="container">

        <div className="topbar">
          <div className="title">
            <h1>Notifications</h1>

            <div className="subtitle">
              Manage real ClothTym system and user notifications.
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
              className="button primary"
              onClick={() => {
                setError("");
                setSuccess("");
                setShowCreate(true);
              }}
            >
              + Create Notification
            </button>
          </div>
        </div>

        {error && (
          <div className="alert error">
            {error}
          </div>
        )}

        {success && (
          <div className="alert success">
            {success}
          </div>
        )}

        <section className="stats">

          <div className="stat-card">
            <div className="stat-top">
              <span className="stat-label">
                Total Notifications
              </span>

              <span className="stat-icon">
                🔔
              </span>
            </div>

            <div className="stat-value">
              {loading ? "..." : stats.total}
            </div>

            <div className="stat-note">
              All database notifications
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              <span className="stat-label">
                Unread
              </span>

              <span className="stat-icon">
                🟡
              </span>
            </div>

            <div className="stat-value">
              {loading ? "..." : stats.unread}
            </div>

            <div className="stat-note">
              Currently unread
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              <span className="stat-label">
                Read
              </span>

              <span className="stat-icon">
                ✓
              </span>
            </div>

            <div className="stat-value">
              {loading ? "..." : stats.read}
            </div>

            <div className="stat-note">
              Already viewed
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              <span className="stat-label">
                User Notifications
              </span>

              <span className="stat-icon">
                👤
              </span>
            </div>

            <div className="stat-value">
              {loading
                ? "..."
                : stats.userNotifications}
            </div>

            <div className="stat-note">
              Linked to real users
            </div>
          </div>

        </section>

        <section className="main-card">

          <div className="card-header">
            <div>
              <div className="card-title">
                Notification History
              </div>

              <div className="card-subtitle">
                Live notifications retrieved from the ClothTym database.
              </div>
            </div>

            <button
              className="button"
              onClick={loadNotifications}
              disabled={loading}
            >
              {loading
                ? "Refreshing..."
                : "↻ Refresh"}
            </button>
          </div>

          <div className="filters">

            <input
              className="search"
              type="text"
              placeholder="Search notification, user or email..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />

            <select
              className="select"
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(event.target.value)
              }
            >
              <option value="ALL">
                All types
              </option>

              {notificationTypes.map(
                (notificationType) => (
                  <option
                    key={notificationType}
                    value={notificationType}
                  >
                    {typeLabel(notificationType)}
                  </option>
                )
              )}
            </select>

            <select
              className="select"
              value={readFilter}
              onChange={(event) =>
                setReadFilter(event.target.value)
              }
            >
              <option value="ALL">
                Read & Unread
              </option>

              <option value="UNREAD">
                Unread
              </option>

              <option value="READ">
                Read
              </option>
            </select>

            <div className="count">
              {filteredNotifications.length} notifications
            </div>

          </div>

          <div className="table-wrapper">

            {loading ? (
              <div className="loading">
                Loading notifications...
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="empty">

                <div className="empty-icon">
                  🔔
                </div>

                <div className="empty-title">
                  No notifications found
                </div>

                <div className="empty-text">
                  Real notifications will appear here when they are created.
                </div>

              </div>
            ) : (
              <table>

                <thead>
                  <tr>
                    <th>
                      NOTIFICATION
                    </th>

                    <th>
                      TYPE
                    </th>

                    <th>
                      USER
                    </th>

                    <th>
                      STATUS
                    </th>

                    <th>
                      CREATED
                    </th>
                  </tr>
                </thead>

                <tbody>

                  {filteredNotifications.map(
                    (notification) => (
                      <tr key={notification.id}>

                        <td>
                          <div className="notification-title">
                            {notification.title}
                          </div>

                          <div className="notification-message">
                            {notification.message}
                          </div>
                        </td>

                        <td>
                          <span
                            className={typeClass(
                              notification.type
                            )}
                          >
                            {typeLabel(
                              notification.type
                            )}
                          </span>
                        </td>

                        <td>
                          {notification.user ? (
                            <>
                              <span className="user-name">
                                {notification.user.name}
                              </span>

                              <span className="user-email">
                                {notification.user.email}
                              </span>
                            </>
                          ) : (
                            <span className="system-user">
                              System / Global
                            </span>
                          )}
                        </td>

                        <td>
                          <span
                            className={`read-status ${
                              notification.isRead
                                ? "read"
                                : "unread"
                            }`}
                          >
                            {notification.isRead
                              ? "READ"
                              : "UNREAD"}
                          </span>
                        </td>

                        <td>
                          <span className="date">
                            {formatDate(
                              notification.createdAt
                            )}
                          </span>
                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>
            )}

          </div>

        </section>

      </div>

      {showCreate && (
        <div
          className="modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              setShowCreate(false);
            }
          }}
        >
          <div className="modal">

            <div className="modal-header">

              <div>
                <div className="modal-title">
                  Create Notification
                </div>

                <div className="modal-subtitle">
                  This will create a real notification in the ClothTym database.
                </div>
              </div>

              <button
                className="close"
                onClick={() =>
                  setShowCreate(false)
                }
              >
                ×
              </button>

            </div>

            <form onSubmit={createNotification}>

              <div className="form-group">

                <label className="form-label">
                  TITLE
                </label>

                <input
                  className="input"
                  value={title}
                  onChange={(event) =>
                    setTitle(event.target.value)
                  }
                  placeholder="Enter notification title"
                  maxLength={150}
                />

              </div>

              <div className="form-group">

                <label className="form-label">
                  MESSAGE
                </label>

                <textarea
                  className="textarea"
                  value={message}
                  onChange={(event) =>
                    setMessage(event.target.value)
                  }
                  placeholder="Enter notification message"
                  maxLength={1000}
                />

              </div>

              <div className="form-group">

                <label className="form-label">
                  TYPE
                </label>

                <select
                  className="select"
                  style={{
                    width: "100%",
                  }}
                  value={type}
                  onChange={(event) =>
                    setType(event.target.value)
                  }
                >
                  <option value="SYSTEM">
                    System
                  </option>

                  <option value="ORDER">
                    Order
                  </option>

                  <option value="PAYMENT">
                    Payment
                  </option>

                  <option value="DELIVERY">
                    Delivery
                  </option>

                  <option value="RETURN">
                    Return
                  </option>

                  <option value="REFUND">
                    Refund
                  </option>
                </select>

              </div>

              <div className="form-group">

                <label className="form-label">
                  SEND TO USER
                </label>

                <select
                  className="select"
                  style={{
                    width: "100%",
                  }}
                  value={userId}
                  onChange={(event) =>
                    setUserId(event.target.value)
                  }
                >
                  <option value="">
                    System / Global Notification
                  </option>

                  {users.map((user) => (
                    <option
                      key={user.id}
                      value={user.id}
                    >
                      {user.name} — {user.email}
                    </option>
                  ))}
                </select>

              </div>

              <div className="modal-actions">

                <button
                  type="button"
                  className="button"
                  onClick={() =>
                    setShowCreate(false)
                  }
                  disabled={creating}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="button primary"
                  disabled={creating}
                >
                  {creating
                    ? "Creating..."
                    : "Create Notification"}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

    </main>
  );
}