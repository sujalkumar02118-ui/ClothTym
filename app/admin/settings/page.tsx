"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminSettingsPage() {
  const router = useRouter();

  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [codEnabled, setCodEnabled] = useState(true);
  const [onlinePaymentEnabled, setOnlinePaymentEnabled] =
    useState(true);
  const [newOrderAlerts, setNewOrderAlerts] = useState(true);
  const [lowStockAlerts, setLowStockAlerts] = useState(true);

  const [saved, setSaved] = useState(false);

  function saveSettings() {
    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2500);
  }

  function Toggle({
    enabled,
    onChange,
  }: {
    enabled: boolean;
    onChange: (value: boolean) => void;
  }) {
    return (
      <button
        type="button"
        className={`toggle ${enabled ? "active" : ""}`}
        onClick={() => onChange(!enabled)}
        aria-label="Toggle setting"
      >
        <span />
      </button>
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
          max-width: 1200px;
          margin: 0 auto;
          padding: 30px;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
          margin-bottom: 25px;
        }

        .heading h1 {
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
          border: 1px solid #ddd;
          border-radius: 9px;
          background: white;
          color: #171717;
          cursor: pointer;
          font-size: 12px;
          font-weight: 700;
        }

        .button:hover {
          background: #f1f1f1;
        }

        .save {
          background: #111;
          color: white;
          border-color: #111;
        }

        .save:hover {
          background: #333;
        }

        .success {
          margin-bottom: 20px;
          padding: 13px 15px;
          border: 1px solid #ccebd7;
          border-radius: 10px;
          background: #effaf3;
          color: #187a3e;
          font-size: 12px;
          font-weight: 700;
        }

        .grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
        }

        .card {
          background: white;
          border: 1px solid #e6e6e6;
          border-radius: 15px;
          overflow: hidden;
        }

        .card.full {
          grid-column: 1 / -1;
        }

        .card-header {
          padding: 20px 22px;
          border-bottom: 1px solid #eee;
        }

        .card-title {
          font-size: 16px;
          font-weight: 800;
        }

        .card-subtitle {
          margin-top: 5px;
          color: #999;
          font-size: 11px;
          line-height: 1.5;
        }

        .setting {
          min-height: 72px;
          padding: 17px 22px;
          border-bottom: 1px solid #f0f0f0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .setting:last-child {
          border-bottom: none;
        }

        .setting-info {
          min-width: 0;
        }

        .setting-title {
          font-size: 13px;
          font-weight: 700;
        }

        .setting-description {
          margin-top: 5px;
          color: #999;
          font-size: 10px;
          line-height: 1.5;
        }

        .toggle {
          width: 46px;
          height: 26px;
          min-width: 46px;
          padding: 3px;
          border: none;
          border-radius: 20px;
          background: #d8d8d8;
          cursor: pointer;
          transition: .2s;
        }

        .toggle span {
          display: block;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: white;
          box-shadow: 0 1px 3px rgba(0,0,0,.18);
          transition: .2s;
        }

        .toggle.active {
          background: #111;
        }

        .toggle.active span {
          transform: translateX(20px);
        }

        .status-box {
          padding: 20px 22px;
        }

        .status-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 13px 0;
          border-bottom: 1px solid #f0f0f0;
        }

        .status-row:last-child {
          border-bottom: none;
        }

        .status-name {
          font-size: 12px;
          font-weight: 700;
        }

        .status-value {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-size: 10px;
          font-weight: 700;
        }

        .status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #1b9b50;
        }

        .status-dot.off {
          background: #aaa;
        }

        .danger {
          border-color: #f0d5d5;
        }

        .danger .card-header {
          background: #fffafa;
        }

        .danger-title {
          color: #b52b2b;
        }

        .maintenance-warning {
          margin: 18px 22px 20px;
          padding: 13px;
          border-radius: 9px;
          background: #fff7e0;
          color: #8b6500;
          font-size: 11px;
          line-height: 1.5;
        }

        @media (max-width: 800px) {
          .container {
            padding: 18px;
          }

          .header {
            flex-direction: column;
          }

          .actions {
            width: 100%;
          }

          .button {
            flex: 1;
          }

          .grid {
            grid-template-columns: 1fr;
          }

          .card.full {
            grid-column: auto;
          }
        }
      `}</style>

      <div className="container">

        <div className="header">
          <div className="heading">
            <h1>Settings</h1>

            <div className="subtitle">
              Manage ClothTym marketplace and admin preferences.
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
              className="button save"
              onClick={saveSettings}
            >
              Save Changes
            </button>
          </div>
        </div>

        {saved && (
          <div className="success">
            ✓ Settings updated successfully.
          </div>
        )}

        <div className="grid">

          {/* PAYMENT SETTINGS */}

          <section className="card">

            <div className="card-header">
              <div className="card-title">
                Payment Settings
              </div>

              <div className="card-subtitle">
                Control the payment methods available on ClothTym.
              </div>
            </div>

            <div className="setting">
              <div className="setting-info">
                <div className="setting-title">
                  Cash on Delivery
                </div>

                <div className="setting-description">
                  Allow customers to place COD orders.
                </div>
              </div>

              <Toggle
                enabled={codEnabled}
                onChange={setCodEnabled}
              />
            </div>

            <div className="setting">
              <div className="setting-info">
                <div className="setting-title">
                  Online Payments
                </div>

                <div className="setting-description">
                  Allow customers to pay through online payment methods.
                </div>
              </div>

              <Toggle
                enabled={onlinePaymentEnabled}
                onChange={setOnlinePaymentEnabled}
              />
            </div>

          </section>

          {/* NOTIFICATION SETTINGS */}

          <section className="card">

            <div className="card-header">
              <div className="card-title">
                Alert Preferences
              </div>

              <div className="card-subtitle">
                Configure important admin alerts.
              </div>
            </div>

            <div className="setting">
              <div className="setting-info">
                <div className="setting-title">
                  New Order Alerts
                </div>

                <div className="setting-description">
                  Receive alerts when a new order is created.
                </div>
              </div>

              <Toggle
                enabled={newOrderAlerts}
                onChange={setNewOrderAlerts}
              />
            </div>

            <div className="setting">
              <div className="setting-info">
                <div className="setting-title">
                  Low Stock Alerts
                </div>

                <div className="setting-description">
                  Show alerts when product stock becomes low.
                </div>
              </div>

              <Toggle
                enabled={lowStockAlerts}
                onChange={setLowStockAlerts}
              />
            </div>

          </section>

          {/* SYSTEM STATUS */}

          <section className="card full">

            <div className="card-header">
              <div className="card-title">
                System Status
              </div>

              <div className="card-subtitle">
                Current status of the ClothTym admin system.
              </div>
            </div>

            <div className="status-box">

              <div className="status-row">
                <span className="status-name">
                  Admin Panel
                </span>

                <span className="status-value">
                  <span className="status-dot" />
                  Operational
                </span>
              </div>

              <div className="status-row">
                <span className="status-name">
                  Database
                </span>

                <span className="status-value">
                  <span className="status-dot" />
                  Connected
                </span>
              </div>

              <div className="status-row">
                <span className="status-name">
                  Payment System
                </span>

                <span className="status-value">
                  <span className="status-dot" />
                  Available
                </span>
              </div>

              <div className="status-row">
                <span className="status-name">
                  Maintenance Mode
                </span>

                <span className="status-value">
                  <span
                    className={`status-dot ${
                      maintenanceMode ? "off" : ""
                    }`}
                  />

                  {maintenanceMode
                    ? "Enabled"
                    : "Disabled"}
                </span>
              </div>

            </div>

          </section>

          {/* MAINTENANCE */}

          <section className="card full danger">

            <div className="card-header">
              <div className="card-title danger-title">
                Maintenance
              </div>

              <div className="card-subtitle">
                Temporarily restrict marketplace access during maintenance.
              </div>
            </div>

            <div className="setting">
              <div className="setting-info">
                <div className="setting-title">
                  Maintenance Mode
                </div>

                <div className="setting-description">
                  Enable this only when ClothTym requires scheduled maintenance.
                </div>
              </div>

              <Toggle
                enabled={maintenanceMode}
                onChange={setMaintenanceMode}
              />
            </div>

            {maintenanceMode && (
              <div className="maintenance-warning">
                ⚠ Maintenance mode is enabled. Customers may not be
                able to access marketplace functionality.
              </div>
            )}

          </section>

        </div>

      </div>
    </main>
  );
}