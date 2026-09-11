"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  userId: string | null;
  createdAt: string;
};

export default function NotificationsPage() {
  const router = useRouter();

  const [notifications, setNotifications] = useState<
    Notification[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [marking, setMarking] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  async function loadNotifications() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/notifications", {
        method: "GET",
        cache: "no-store",
      });

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
        "NOTIFICATIONS LOAD ERROR:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Notifications load nahi ho paaya."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  const unreadCount = useMemo(() => {
    return notifications.filter(
      (notification) => !notification.isRead
    ).length;
  }, [notifications]);

  async function markAsRead(id: string) {
    try {
      setMarking(id);
      setError("");

      const response = await fetch(
        "/api/notifications",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            notificationId: id,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Notification could not be marked as read."
        );
      }

      setNotifications((current) =>
        current.map((notification) =>
          notification.id === id
            ? {
                ...notification,
                isRead: true,
              }
            : notification
        )
      );
    } catch (error) {
      console.error(
        "MARK NOTIFICATION READ ERROR:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Notification update nahi ho paaya."
      );
    } finally {
      setMarking(null);
    }
  }

  async function markAllAsRead() {
    if (unreadCount === 0 || markingAll) {
      return;
    }

    try {
      setMarkingAll(true);
      setError("");

      const response = await fetch(
        "/api/notifications",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            markAll: true,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Notifications could not be marked as read."
        );
      }

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          isRead: true,
        }))
      );
    } catch (error) {
      console.error(
        "MARK ALL NOTIFICATIONS ERROR:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Notifications update nahi ho paaya."
      );
    } finally {
      setMarkingAll(false);
    }
  }

  function formatDate(date: string) {
    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Invalid date";
    }

    return parsedDate.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function typeIcon(type: string) {
    const normalized = type.toLowerCase();

    if (normalized.includes("order")) {
      return "📦";
    }

    if (normalized.includes("payment")) {
      return "💳";
    }

    if (normalized.includes("delivery")) {
      return "🚚";
    }

    if (
      normalized.includes("return") ||
      normalized.includes("refund")
    ) {
      return "🔄";
    }

    return "🔔";
  }

  function typeClass(type: string) {
    const normalized = type.toLowerCase();

    if (normalized.includes("order")) {
      return "order";
    }

    if (normalized.includes("payment")) {
      return "payment";
    }

    if (normalized.includes("delivery")) {
      return "delivery";
    }

    if (
      normalized.includes("return") ||
      normalized.includes("refund")
    ) {
      return "return";
    }

    return "system";
  }

  function typeLabel(type: string) {
    return type
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
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
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
          padding: 28px 20px 50px;
        }

        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 25px;
        }

        .heading {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .heading-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: #111;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
        }

        .title h1 {
          margin: 0;
          font-size: 27px;
          font-weight: 800;
          letter-spacing: -0.5px;
        }

        .subtitle {
          margin-top: 5px;
          color: #999;
          font-size: 12px;
        }

        .actions {
          display: flex;
          gap: 9px;
        }

        .button {
          height: 40px;
          padding: 0 14px;
          border: 1px solid #ddd;
          border-radius: 9px;
          background: #fff;
          color: #222;
          cursor: pointer;
          font-size: 11px;
          font-weight: 700;
        }

        .button:hover {
          background: #f1f1f1;
        }

        .button:disabled {
          opacity: .55;
          cursor: not-allowed;
        }

        .primary {
          background: #111;
          color: white;
          border-color: #111;
        }

        .primary:hover {
          background: #333;
        }

        .summary {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          padding: 16px 18px;
          margin-bottom: 18px;
          background: #fff;
          border: 1px solid #e6e6e6;
          border-radius: 13px;
        }

        .summary-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .summary-number {
          min-width: 42px;
          height: 42px;
          border-radius: 10px;
          background: #111;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
          font-weight: 800;
        }

        .summary-title {
          font-size: 13px;
          font-weight: 800;
        }

        .summary-text {
          margin-top: 4px;
          color: #999;
          font-size: 10px;
        }

        .alert {
          margin-bottom: 18px;
          padding: 13px 15px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 600;
        }

        .error {
          background: #fff1f1;
          border: 1px solid #ffd0d0;
          color: #c62828;
        }

        .notifications-card {
          background: #fff;
          border: 1px solid #e6e6e6;
          border-radius: 15px;
          overflow: hidden;
        }

        .card-header {
          padding: 19px 20px;
          border-bottom: 1px solid #eee;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
        }

        .card-title {
          font-size: 15px;
          font-weight: 800;
        }

        .card-subtitle {
          margin-top: 4px;
          color: #999;
          font-size: 10px;
        }

        .notification-list {
          width: 100%;
        }

        .notification {
          display: flex;
          gap: 14px;
          padding: 18px 20px;
          border-bottom: 1px solid #f0f0f0;
          transition: background .15s ease;
        }

        .notification:last-child {
          border-bottom: 0;
        }

        .notification:hover {
          background: #fafafa;
        }

        .notification.unread {
          background: #fffdf5;
        }

        .notification-icon {
          flex: 0 0 auto;
          width: 43px;
          height: 43px;
          border-radius: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f1f1f1;
          font-size: 19px;
        }

        .notification-content {
          flex: 1;
          min-width: 0;
        }

        .notification-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .notification-title {
          font-size: 13px;
          font-weight: 800;
          color: #171717;
        }

        .notification-message {
          margin-top: 6px;
          color: #666;
          font-size: 11px;
          line-height: 1.5;
        }

        .notification-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 9px;
        }

        .type {
          display: inline-flex;
          padding: 5px 8px;
          border-radius: 20px;
          font-size: 8px;
          font-weight: 800;
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

        .date {
          color: #aaa;
          font-size: 9px;
        }

        .status {
          flex: 0 0 auto;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .unread-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #e2a800;
        }

        .read-label {
          color: #aaa;
          font-size: 9px;
          font-weight: 700;
        }

        .read-button {
          height: 31px;
          padding: 0 10px;
          border: 1px solid #ddd;
          border-radius: 7px;
          background: white;
          cursor: pointer;
          color: #333;
          font-size: 9px;
          font-weight: 700;
        }

        .read-button:hover {
          background: #f2f2f2;
        }

        .read-button:disabled {
          opacity: .55;
          cursor: not-allowed;
        }

        .loading,
        .empty {
          padding: 75px 20px;
          text-align: center;
        }

        .loading {
          color: #999;
          font-size: 11px;
        }

        .empty-icon {
          width: 62px;
          height: 62px;
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
          max-width: 400px;
          margin: 7px auto 0;
          color: #999;
          font-size: 10px;
          line-height: 1.5;
        }

        @media (max-width: 700px) {
          .container {
            padding: 18px 14px 40px;
          }

          .topbar {
            align-items: flex-start;
            flex-direction: column;
          }

          .actions {
            width: 100%;
          }

          .actions .button {
            flex: 1;
          }

          .summary {
            align-items: flex-start;
            flex-direction: column;
          }

          .notification {
            padding: 16px;
          }

          .notification-top {
            flex-direction: column;
            gap: 8px;
          }

          .status {
            width: 100%;
            justify-content: flex-start;
          }

          .card-header {
            align-items: flex-start;
            flex-direction: column;
          }
        }
      `}</style>

      <div className="container">

        <div className="topbar">
          <div className="heading">

            <div className="heading-icon">
              🔔
            </div>

            <div className="title">
              <h1>Notifications</h1>

              <div className="subtitle">
                Your latest ClothTym notifications.
              </div>
            </div>

          </div>

          <div className="actions">

            <button
              className="button"
              onClick={() => router.back()}
            >
              ← Back
            </button>

            <button
              className="button primary"
              onClick={loadNotifications}
              disabled={loading}
            >
              {loading
                ? "Refreshing..."
                : "↻ Refresh"}
            </button>

          </div>
        </div>

        {error && (
          <div className="alert error">
            {error}
          </div>
        )}

        <div className="summary">

          <div className="summary-left">

            <div className="summary-number">
              {loading ? "..." : unreadCount}
            </div>

            <div>
              <div className="summary-title">
                Unread Notifications
              </div>

              <div className="summary-text">
                {unreadCount === 0
                  ? "You are all caught up."
                  : "You have notifications waiting to be read."}
              </div>
            </div>

          </div>

          <button
            className="button"
            onClick={markAllAsRead}
            disabled={
              unreadCount === 0 ||
              markingAll ||
              loading
            }
          >
            {markingAll
              ? "Marking..."
              : "✓ Mark all as read"}
          </button>

        </div>

        <section className="notifications-card">

          <div className="card-header">

            <div>
              <div className="card-title">
                Notification History
              </div>

              <div className="card-subtitle">
                Notifications are loaded from your ClothTym account.
              </div>
            </div>

          </div>

          <div className="notification-list">

            {loading ? (

              <div className="loading">
                Loading notifications...
              </div>

            ) : notifications.length === 0 ? (

              <div className="empty">

                <div className="empty-icon">
                  🔔
                </div>

                <div className="empty-title">
                  No notifications yet
                </div>

                <div className="empty-text">
                  When ClothTym sends you a notification,
                  it will appear here.
                </div>

              </div>

            ) : (

              notifications.map((notification) => (

                <div
                  key={notification.id}
                  className={`notification ${
                    notification.isRead
                      ? ""
                      : "unread"
                  }`}
                >

                  <div className="notification-icon">
                    {typeIcon(
                      notification.type
                    )}
                  </div>

                  <div className="notification-content">

                    <div className="notification-top">

                      <div>
                        <div className="notification-title">
                          {notification.title}
                        </div>

                        <div className="notification-message">
                          {notification.message}
                        </div>
                      </div>

                      <div className="status">

                        {!notification.isRead && (
                          <span className="unread-dot" />
                        )}

                        {notification.isRead ? (

                          <span className="read-label">
                            READ
                          </span>

                        ) : (

                          <button
                            className="read-button"
                            onClick={() =>
                              markAsRead(
                                notification.id
                              )
                            }
                            disabled={
                              marking ===
                              notification.id
                            }
                          >
                            {marking ===
                            notification.id
                              ? "..."
                              : "Mark as read"}
                          </button>

                        )}

                      </div>

                    </div>

                    <div className="notification-meta">

                      <span
                        className={`type ${typeClass(
                          notification.type
                        )}`}
                      >
                        {typeLabel(
                          notification.type
                        )}
                      </span>

                      <span className="date">
                        {formatDate(
                          notification.createdAt
                        )}
                      </span>

                    </div>

                  </div>

                </div>

              ))

            )}

          </div>

        </section>

      </div>
    </main>
  );
}