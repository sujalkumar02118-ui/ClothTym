"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isBlocked: boolean;
  createdAt: string;
};

export default function AdminUsersPage() {
  const router = useRouter();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [updatingId, setUpdatingId] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/users", {
        method: "GET",
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Users could not be loaded."
        );
      }

      setUsers(
        Array.isArray(result.data)
          ? result.data
          : []
      );
    } catch (error) {
      console.error("ADMIN USERS ERROR:", error);
      setError("Users load nahi ho paaye.");
    } finally {
      setLoading(false);
    }
  }

  async function toggleBlock(user: AdminUser) {
    const nextStatus = !user.isBlocked;

    const confirmed = window.confirm(
      nextStatus
        ? `Kya aap "${user.name}" ko block karna chahte hain?`
        : `Kya aap "${user.name}" ko unblock karna chahte hain?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setUpdatingId(user.id);

      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          isBlocked: nextStatus,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "User status could not be updated."
        );
      }

      setUsers((currentUsers) =>
        currentUsers.map((item) =>
          item.id === user.id
            ? {
                ...item,
                isBlocked: nextStatus,
              }
            : item
        )
      );
    } catch (error) {
      console.error("BLOCK USER ERROR:", error);

      window.alert(
        error instanceof Error
          ? error.message
          : "User status update failed."
      );
    } finally {
      setUpdatingId("");
    }
  }

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !query ||
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.phone.toLowerCase().includes(query) ||
        user.id.toLowerCase().includes(query);

      const matchesRole =
        roleFilter === "ALL" ||
        user.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  }

  function getInitial(user: AdminUser) {
    return (
      user.name
        ?.trim()
        ?.charAt(0)
        .toUpperCase() || "U"
    );
  }

  return (
    <main className="users-page">
      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: #f6f7fb;
        }

        .users-page {
          min-height: 100vh;
          background: #f6f7fb;
          color: #171717;
          font-family: Arial, Helvetica, sans-serif;
        }

        .users-container {
          padding: 30px;
          max-width: 1500px;
          margin: 0 auto;
        }

        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 26px;
        }

        .title h1 {
          margin: 0;
          font-size: 27px;
          font-weight: 800;
        }

        .title p {
          margin: 6px 0 0;
          color: #888;
          font-size: 13px;
        }

        .refresh {
          border: 1px solid #ddd;
          background: white;
          border-radius: 9px;
          padding: 10px 15px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 20px;
        }

        .stat {
          background: white;
          border: 1px solid #e7e7e7;
          border-radius: 14px;
          padding: 20px;
        }

        .stat-label {
          color: #888;
          font-size: 12px;
        }

        .stat-value {
          margin-top: 9px;
          font-size: 25px;
          font-weight: 800;
        }

        .toolbar {
          background: white;
          border: 1px solid #e7e7e7;
          border-radius: 14px;
          padding: 16px;
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
          font-size: 13px;
        }

        .filter {
          height: 42px;
          border: 1px solid #ddd;
          border-radius: 9px;
          padding: 0 13px;
          background: white;
          font-size: 13px;
        }

        .panel {
          background: white;
          border: 1px solid #e7e7e7;
          border-radius: 14px;
          overflow: hidden;
        }

        .panel-header {
          padding: 20px 22px;
          border-bottom: 1px solid #eee;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .panel-title {
          font-size: 16px;
          font-weight: 800;
        }

        .panel-count {
          color: #888;
          font-size: 12px;
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
          text-align: left;
          padding: 13px 18px;
          border-bottom: 1px solid #eee;
          color: #999;
          font-size: 10px;
          letter-spacing: .5px;
        }

        td {
          padding: 15px 18px;
          border-bottom: 1px solid #f1f1f1;
          font-size: 12px;
        }

        .user-cell {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #111;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 800;
          flex-shrink: 0;
        }

        .user-name {
          font-weight: 700;
        }

        .user-link {
          border: none;
          background: transparent;
          padding: 0;
          margin: 0;
          font: inherit;
          font-weight: inherit;
          color: inherit;
          cursor: pointer;
          text-align: left;
        }

        .user-link:hover {
          text-decoration: underline;
        }

        .user-email {
          margin-top: 3px;
          color: #999;
          font-size: 11px;
        }

        .role,
        .account-status {
          display: inline-flex;
          padding: 6px 9px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 800;
        }

        .buyer {
          background: #eef5ff;
          color: #1769aa;
        }

        .seller {
          background: #fff5df;
          color: #a66b00;
        }

        .active {
          background: #e9f8ee;
          color: #188a43;
        }

        .blocked {
          background: #ffeaea;
          color: #c62828;
        }

        .phone {
          color: #555;
        }

        .id {
          color: #777;
          font-family: monospace;
          font-size: 11px;
        }

        .action {
          border: 1px solid #ddd;
          background: white;
          border-radius: 8px;
          padding: 7px 11px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
        }

        .action.block {
          color: #c62828;
        }

        .action.unblock {
          color: #188a43;
        }

        .action:disabled {
          opacity: .5;
          cursor: not-allowed;
        }

        .empty,
        .loading,
        .error {
          padding: 45px 20px;
          text-align: center;
          font-size: 13px;
        }

        .empty,
        .loading {
          color: #999;
        }

        .error {
          color: #c62828;
          background: #fff2f2;
        }

        @media (max-width: 900px) {
          .stats {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 700px) {
          .users-container {
            padding: 18px 14px;
          }

          .topbar {
            align-items: flex-start;
          }

          .stats {
            grid-template-columns: 1fr;
          }

          .toolbar {
            flex-direction: column;
          }

          .search {
            width: 100%;
          }
        }
      `}</style>

      <div className="users-container">

        <header className="topbar">
          <div className="title">
            <h1>Users</h1>
            <p>
              Manage ClothTym customers and sellers.
            </p>
          </div>

          <button
            className="refresh"
            onClick={loadUsers}
          >
            ↻ Refresh
          </button>
        </header>

        <section className="stats">

          <div className="stat">
            <div className="stat-label">
              Total Users
            </div>
            <div className="stat-value">
              {loading ? "..." : users.length}
            </div>
          </div>

          <div className="stat">
            <div className="stat-label">
              Customers
            </div>
            <div className="stat-value">
              {loading
                ? "..."
                : users.filter(
                    (user) =>
                      user.role === "BUYER"
                  ).length}
            </div>
          </div>

          <div className="stat">
            <div className="stat-label">
              Sellers
            </div>
            <div className="stat-value">
              {loading
                ? "..."
                : users.filter(
                    (user) =>
                      user.role === "SELLER"
                  ).length}
            </div>
          </div>

          <div className="stat">
            <div className="stat-label">
              Blocked Users
            </div>
            <div className="stat-value">
              {loading
                ? "..."
                : users.filter(
                    (user) =>
                      user.isBlocked
                  ).length}
            </div>
          </div>

        </section>

        <section className="toolbar">

          <input
            className="search"
            type="text"
            placeholder="Search by name, email, phone or ID..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />

          <select
            className="filter"
            value={roleFilter}
            onChange={(event) =>
              setRoleFilter(event.target.value)
            }
          >
            <option value="ALL">
              All Users
            </option>

            <option value="BUYER">
              Customers
            </option>

            <option value="SELLER">
              Sellers
            </option>
          </select>

        </section>

        <section className="panel">

          <div className="panel-header">
            <div className="panel-title">
              All Users
            </div>

            <div className="panel-count">
              {filteredUsers.length} users
            </div>
          </div>

          {error ? (
            <div className="error">
              {error}
            </div>
          ) : loading ? (
            <div className="loading">
              Loading users...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="empty">
              No users found.
            </div>
          ) : (
            <div className="table-wrapper">

              <table>

                <thead>
                  <tr>
                    <th>USER</th>
                    <th>PHONE</th>
                    <th>USER ID</th>
                    <th>ROLE</th>
                    <th>STATUS</th>
                    <th>JOINED</th>
                    <th>ACTION</th>
                  </tr>
                </thead>

                <tbody>

                  {filteredUsers.map((user) => (
                    <tr key={user.id}>

                      <td>
                        <div className="user-cell">

                          <div className="avatar">
                            {getInitial(user)}
                          </div>

                          <div>
                            <div className="user-name">
                              <button
                                className="user-link"
                                onClick={() =>
                                  router.push(
                                    `/admin/users/${user.id}`
                                  )
                                }
                              >
                                {user.name}
                              </button>
                            </div>

                            <div className="user-email">
                              {user.email}
                            </div>
                          </div>

                        </div>
                      </td>

                      <td>
                        <span className="phone">
                          {user.phone}
                        </span>
                      </td>

                      <td>
                        <span className="id">
                          {user.id}
                        </span>
                      </td>

                      <td>
                        <span
                          className={
                            user.role === "SELLER"
                              ? "role seller"
                              : "role buyer"
                          }
                        >
                          {user.role === "SELLER"
                            ? "SELLER"
                            : "CUSTOMER"}
                        </span>
                      </td>

                      <td>
                        <span
                          className={
                            user.isBlocked
                              ? "account-status blocked"
                              : "account-status active"
                          }
                        >
                          {user.isBlocked
                            ? "BLOCKED"
                            : "ACTIVE"}
                        </span>
                      </td>

                      <td>
                        {formatDate(
                          user.createdAt
                        )}
                      </td>

                      <td>
                        <button
                          className={
                            user.isBlocked
                              ? "action unblock"
                              : "action block"
                          }
                          disabled={
                            updatingId === user.id
                          }
                          onClick={() =>
                            toggleBlock(user)
                          }
                        >
                          {updatingId === user.id
                            ? "Updating..."
                            : user.isBlocked
                            ? "Unblock"
                            : "Block"}
                        </button>
                      </td>

                    </tr>
                  ))}

                </tbody>

              </table>

            </div>
          )}

        </section>

      </div>
    </main>
  );
}