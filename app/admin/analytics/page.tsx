"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type AnalyticsData = {
  range: {
    from: string;
    to: string;
  };

  sales: {
    totalSales: number;
    netSales: number;
  };

  orders: {
    total: number;
    delivered: number;
    cancelled: number;
    pending: number;
    returned: number;
  };

  customers: {
    total: number;
    new: number;
    repeat: number;
  };

  sellers: {
    total: number;
    active: number;
  };

  products: {
    total: number;
  };

  returns: {
    requested: number;
    approved: number;
    completed: number;
  };

  refunds: {
    processing: number;
    completed: number;
    failed: number;
    totalAmount: number;
  };

  charts: {
    salesOverTime: {
      date: string;
      sales: number;
    }[];

    ordersOverTime: {
      date: string;
      orders: number;
    }[];
  };
};

type Period = "TODAY" | "7D" | "30D" | "CUSTOM";

function getDateString(date: Date) {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getRange(period: Period) {
  const today = new Date();

  const to = new Date(today);
  let from = new Date(today);

  if (period === "7D") {
    from.setDate(
      from.getDate() - 6
    );
  }

  if (period === "30D") {
    from.setDate(
      from.getDate() - 29
    );
  }

  return {
    from: getDateString(from),
    to: getDateString(to),
  };
}

function formatAmount(
  amount?: number
) {
  return `₹${Number(
    amount || 0
  ).toLocaleString("en-IN")}`;
}

function formatNumber(
  value?: number
) {
  return Number(
    value || 0
  ).toLocaleString("en-IN");
}

function formatChartDate(
  date: string
) {
  const parsed = new Date(
    `${date}T00:00:00`
  );

  return parsed.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
    }
  );
}

export default function AdminAnalyticsPage() {
  const router = useRouter();

  const [period, setPeriod] =
    useState<Period>("TODAY");

  const [fromDate, setFromDate] =
    useState("");

  const [toDate, setToDate] =
    useState("");

  const [data, setData] =
    useState<AnalyticsData | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [lastUpdated, setLastUpdated] =
    useState<Date | null>(null);

  const activeRange = useMemo(() => {
    if (period === "CUSTOM") {
      return {
        from: fromDate,
        to: toDate,
      };
    }

    return getRange(period);
  }, [
    period,
    fromDate,
    toDate,
  ]);

  async function loadAnalytics() {
    try {
      setLoading(true);
      setError("");

      if (
        !activeRange.from ||
        !activeRange.to
      ) {
        setError(
          "Please select both dates."
        );

        setLoading(false);
        return;
      }

      if (
        activeRange.from >
        activeRange.to
      ) {
        setError(
          "From date cannot be after to date."
        );

        setLoading(false);
        return;
      }

      const response = await fetch(
        `/api/admin/analytics?from=${activeRange.from}&to=${activeRange.to}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            "Analytics could not be loaded."
        );
      }

      setData(result);
      setLastUpdated(
        new Date()
      );
    } catch (error) {
      console.error(
        "ADMIN ANALYTICS UI ERROR:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Analytics load nahi ho paaye."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (
      period === "CUSTOM" &&
      (!fromDate || !toDate)
    ) {
      return;
    }

    loadAnalytics();
  }, [
    period,
    fromDate,
    toDate,
  ]);

  function applyCustomRange() {
    if (
      !fromDate ||
      !toDate
    ) {
      setError(
        "Please select both dates."
      );
      return;
    }

    if (
      fromDate > toDate
    ) {
      setError(
        "From date cannot be after to date."
      );
      return;
    }

    loadAnalytics();
  }

  function renderLineChart(
    points: {
      date: string;
      value: number;
    }[],
    prefix = "",
    suffix = ""
  ) {
    if (!points.length) {
      return (
        <div className="empty-chart">
          No data available for
          selected range.
        </div>
      );
    }

    const width = 1000;
    const height = 300;

    const paddingLeft = 55;
    const paddingRight = 25;
    const paddingTop = 25;
    const paddingBottom = 50;

    const chartWidth =
      width -
      paddingLeft -
      paddingRight;

    const chartHeight =
      height -
      paddingTop -
      paddingBottom;

    const maxValue = Math.max(
      ...points.map(
        (point) => point.value
      ),
      1
    );

    const minValue = Math.min(
      ...points.map(
        (point) => point.value
      ),
      0
    );

    const range =
      maxValue - minValue || 1;

    const getX = (index: number) => {
      if (points.length === 1) {
        return (
          paddingLeft +
          chartWidth / 2
        );
      }

      return (
        paddingLeft +
        (index /
          (points.length - 1)) *
          chartWidth
      );
    };

    const getY = (value: number) => {
      return (
        paddingTop +
        chartHeight -
        ((value - minValue) /
          range) *
          chartHeight
      );
    };

    const linePoints = points
      .map(
        (point, index) =>
          `${getX(index)},${getY(
            point.value
          )}`
      )
      .join(" ");

    const gridValues = [
      minValue,
      minValue + range * 0.25,
      minValue + range * 0.5,
      minValue + range * 0.75,
      maxValue,
    ];

    const labelIndexes =
      points.length <= 7
        ? points.map(
            (_, index) => index
          )
        : [
            0,
            Math.floor(
              points.length / 4
            ),
            Math.floor(
              points.length / 2
            ),
            Math.floor(
              (points.length * 3) /
                4
            ),
            points.length - 1,
          ];

    return (
      <div className="chart-wrapper">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="line-chart"
          preserveAspectRatio="none"
        >
          {gridValues.map(
            (value, index) => {
              const y = getY(value);

              return (
                <g key={index}>
                  <line
                    x1={
                      paddingLeft
                    }
                    y1={y}
                    x2={
                      width -
                      paddingRight
                    }
                    y2={y}
                    stroke="#eeeeee"
                    strokeWidth="1"
                  />

                  <text
                    x={
                      paddingLeft -
                      10
                    }
                    y={y + 4}
                    textAnchor="end"
                    fontSize="11"
                    fill="#999"
                  >
                    {prefix}
                    {Math.round(
                      value
                    ).toLocaleString(
                      "en-IN"
                    )}
                    {suffix}
                  </text>
                </g>
              );
            }
          )}

          <polyline
            points={linePoints}
            fill="none"
            stroke="#111"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {points.map(
            (point, index) => (
              <circle
                key={`${point.date}-${index}`}
                cx={getX(index)}
                cy={getY(
                  point.value
                )}
                r="4"
                fill="#111"
              />
            )
          )}

          {labelIndexes.map(
            (index) => {
              const point =
                points[index];

              return (
                <text
                  key={`label-${index}`}
                  x={getX(index)}
                  y={
                    height -
                    17
                  }
                  textAnchor="middle"
                  fontSize="11"
                  fill="#888"
                >
                  {formatChartDate(
                    point.date
                  )}
                </text>
              );
            }
          )}
        </svg>
      </div>
    );
  }

  return (
    <main className="analytics-page">
      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: #f6f7fb;
        }

        .analytics-page {
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
          justify-content: space-between;
          align-items: flex-start;
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

        .top-actions {
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

        .filter-panel {
          background: white;
          border: 1px solid #e8e8e8;
          border-radius: 14px;
          padding: 18px;
          margin-bottom: 20px;
        }

        .filter-title {
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 12px;
        }

        .period-buttons {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .period-button {
          border: 1px solid #ddd;
          background: white;
          border-radius: 8px;
          padding: 9px 14px;
          cursor: pointer;
          font-size: 11px;
          font-weight: 700;
        }

        .period-button:hover {
          background: #f1f1f1;
        }

        .period-button.active {
          background: #111;
          color: white;
          border-color: #111;
        }

        .custom-range {
          display: flex;
          align-items: flex-end;
          gap: 12px;
          margin-top: 15px;
          flex-wrap: wrap;
        }

        .date-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .date-field label {
          font-size: 10px;
          font-weight: 700;
          color: #777;
        }

        .date-input {
          height: 40px;
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 0 10px;
          font-size: 12px;
        }

        .apply-button {
          height: 40px;
          border: 0;
          background: #111;
          color: white;
          border-radius: 8px;
          padding: 0 16px;
          cursor: pointer;
          font-size: 11px;
          font-weight: 700;
        }

        .apply-button:hover {
          background: #333;
        }

        .range-info {
          margin-top: 12px;
          color: #888;
          font-size: 11px;
        }

        .sales-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
          margin-bottom: 20px;
        }

        .metric-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 15px;
          margin-bottom: 20px;
        }

        .card {
          background: white;
          border: 1px solid #e8e8e8;
          border-radius: 14px;
          padding: 18px;
        }

        .card-label {
          color: #888;
          font-size: 11px;
        }

        .card-value {
          margin-top: 8px;
          font-size: 25px;
          font-weight: 750;
        }

        .sales-card {
          padding: 22px;
        }

        .sales-card .card-value {
          font-size: 30px;
        }

        .section-title {
          margin: 28px 0 12px;
          font-size: 17px;
        }

        .orders-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 15px;
        }

        .small-card {
          background: white;
          border: 1px solid #e8e8e8;
          border-radius: 14px;
          padding: 17px;
        }

        .small-label {
          font-size: 11px;
          color: #888;
        }

        .small-value {
          margin-top: 7px;
          font-size: 23px;
          font-weight: 750;
        }

        .status-line {
          margin-top: 10px;
          height: 5px;
          background: #eee;
          border-radius: 10px;
          overflow: hidden;
        }

        .status-fill {
          height: 100%;
          background: #111;
          border-radius: 10px;
        }

        .chart-panel {
          background: white;
          border: 1px solid #e8e8e8;
          border-radius: 14px;
          padding: 20px;
          margin-top: 20px;
        }

        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
        }

        .chart-title {
          font-size: 13px;
          font-weight: 700;
        }

        .chart-subtitle {
          color: #aaa;
          font-size: 10px;
          margin-top: 4px;
        }

        .chart-value {
          font-size: 18px;
          font-weight: 750;
        }

        .chart-wrapper {
          width: 100%;
          height: 300px;
          margin-top: 15px;
        }

        .line-chart {
          width: 100%;
          height: 100%;
          display: block;
        }

        .empty-chart {
          height: 250px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #999;
          font-size: 12px;
          border: 1px dashed #ddd;
          border-radius: 10px;
          margin-top: 15px;
          background: #fafafa;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
          margin-top: 20px;
        }

        .info-card {
          background: white;
          border: 1px solid #e8e8e8;
          border-radius: 14px;
          padding: 18px;
        }

        .info-card h3 {
          margin: 0 0 12px;
          font-size: 13px;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          padding: 7px 0;
          border-bottom: 1px solid #f1f1f1;
          font-size: 11px;
        }

        .info-row:last-child {
          border-bottom: 0;
        }

        .info-row span:first-child {
          color: #888;
        }

        .error {
          background: #fff0f0;
          border: 1px solid #ffd0d0;
          color: #c62828;
          border-radius: 10px;
          padding: 12px 14px;
          font-size: 12px;
          margin-bottom: 15px;
        }

        .loading-card {
          height: 100px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #999;
          font-size: 12px;
        }

        .last-updated {
          margin-top: 8px;
          color: #aaa;
          font-size: 10px;
        }

        @media (max-width: 1100px) {
          .metric-grid,
          .orders-grid {
            grid-template-columns: repeat(3, 1fr);
          }

          .info-grid {
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

          .sales-grid {
            grid-template-columns: 1fr;
          }

          .metric-grid,
          .orders-grid,
          .info-grid {
            grid-template-columns: 1fr;
          }

          .custom-range {
            flex-direction: column;
            align-items: stretch;
          }

          .date-input,
          .apply-button {
            width: 100%;
          }

          .chart-wrapper {
            height: 250px;
          }
        }
      `}</style>

      <div className="container">

        <div className="topbar">
          <div className="title">
            <h1>
              Analytics & Reports
            </h1>

            <p>
              Sales and order performance
              overview.
            </p>

            {lastUpdated && (
              <div className="last-updated">
                Last updated:{" "}
                {lastUpdated.toLocaleTimeString(
                  "en-IN",
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                )}
              </div>
            )}
          </div>

          <div className="top-actions">
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
              onClick={
                loadAnalytics
              }
              disabled={loading}
            >
              ↻ Refresh
            </button>
          </div>
        </div>

        <div className="filter-panel">

          <div className="filter-title">
            Date Range
          </div>

          <div className="period-buttons">

            <button
              className={`period-button ${
                period === "TODAY"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setPeriod("TODAY")
              }
            >
              Today
            </button>

            <button
              className={`period-button ${
                period === "7D"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setPeriod("7D")
              }
            >
              Last 7 Days
            </button>

            <button
              className={`period-button ${
                period === "30D"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setPeriod("30D")
              }
            >
              Last 30 Days
            </button>

            <button
              className={`period-button ${
                period === "CUSTOM"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setPeriod("CUSTOM")
              }
            >
              Custom Range
            </button>

          </div>

          {period === "CUSTOM" && (
            <div className="custom-range">

              <div className="date-field">
                <label>
                  FROM
                </label>

                <input
                  className="date-input"
                  type="date"
                  value={fromDate}
                  onChange={(event) =>
                    setFromDate(
                      event.target.value
                    )
                  }
                />
              </div>

              <div className="date-field">
                <label>
                  TO
                </label>

                <input
                  className="date-input"
                  type="date"
                  value={toDate}
                  onChange={(event) =>
                    setToDate(
                      event.target.value
                    )
                  }
                />
              </div>

              <button
                className="apply-button"
                onClick={
                  applyCustomRange
                }
              >
                Apply Range
              </button>

            </div>
          )}

          <div className="range-info">
            Showing:{" "}
            {activeRange.from || "—"}
            {" → "}
            {activeRange.to || "—"}
          </div>

        </div>

        {error && (
          <div className="error">
            {error}
          </div>
        )}

        {loading ? (
          <>
            <div className="sales-grid">
              <div className="card loading-card">
                Loading sales...
              </div>

              <div className="card loading-card">
                Loading net sales...
              </div>
            </div>

            <div className="metric-grid">
              {Array.from({
                length: 5,
              }).map((_, index) => (
                <div
                  className="card loading-card"
                  key={index}
                >
                  Loading...
                </div>
              ))}
            </div>
          </>
        ) : data ? (
          <>

            <div className="sales-grid">

              <div className="card sales-card">
                <div className="card-label">
                  Total Sales
                </div>

                <div className="card-value">
                  {formatAmount(
                    data.sales.totalSales
                  )}
                </div>
              </div>

              <div className="card sales-card">
                <div className="card-label">
                  Net Sales
                </div>

                <div className="card-value">
                  {formatAmount(
                    data.sales.netSales
                  )}
                </div>
              </div>

            </div>

            <h2 className="section-title">
              Orders Overview
            </h2>

            <div className="orders-grid">

              <div className="small-card">
                <div className="small-label">
                  Total Orders
                </div>

                <div className="small-value">
                  {formatNumber(
                    data.orders.total
                  )}
                </div>

                <div className="status-line">
                  <div
                    className="status-fill"
                    style={{
                      width: "100%",
                    }}
                  />
                </div>
              </div>

              <div className="small-card">
                <div className="small-label">
                  Delivered
                </div>

                <div className="small-value">
                  {formatNumber(
                    data.orders.delivered
                  )}
                </div>

                <div className="status-line">
                  <div
                    className="status-fill"
                    style={{
                      width:
                        data.orders.total
                          ? `${
                              (data.orders
                                .delivered /
                                data.orders
                                  .total) *
                              100
                            }%`
                          : "0%",
                    }}
                  />
                </div>
              </div>

              <div className="small-card">
                <div className="small-label">
                  Cancelled
                </div>

                <div className="small-value">
                  {formatNumber(
                    data.orders.cancelled
                  )}
                </div>

                <div className="status-line">
                  <div
                    className="status-fill"
                    style={{
                      width:
                        data.orders.total
                          ? `${
                              (data.orders
                                .cancelled /
                                data.orders
                                  .total) *
                              100
                            }%`
                          : "0%",
                    }}
                  />
                </div>
              </div>

              <div className="small-card">
                <div className="small-label">
                  Pending
                </div>

                <div className="small-value">
                  {formatNumber(
                    data.orders.pending
                  )}
                </div>

                <div className="status-line">
                  <div
                    className="status-fill"
                    style={{
                      width:
                        data.orders.total
                          ? `${
                              (data.orders
                                .pending /
                                data.orders
                                  .total) *
                              100
                            }%`
                          : "0%",
                    }}
                  />
                </div>
              </div>

              <div className="small-card">
                <div className="small-label">
                  Returned
                </div>

                <div className="small-value">
                  {formatNumber(
                    data.orders.returned
                  )}
                </div>

                <div className="status-line">
                  <div
                    className="status-fill"
                    style={{
                      width:
                        data.orders.total
                          ? `${
                              (data.orders
                                .returned /
                                data.orders
                                  .total) *
                              100
                            }%`
                          : "0%",
                    }}
                  />
                </div>
              </div>

            </div>

            <h2 className="section-title">
              Sales & Orders Charts
            </h2>

            <div className="chart-panel">

              <div className="chart-header">
                <div>
                  <div className="chart-title">
                    Sales over time
                  </div>

                  <div className="chart-subtitle">
                    Sales excluding cancelled
                    orders.
                  </div>
                </div>

                <div className="chart-value">
                  {formatAmount(
                    data.sales.totalSales
                  )}
                </div>
              </div>

              {renderLineChart(
                data.charts.salesOverTime.map(
                  (item) => ({
                    date: item.date,
                    value: item.sales,
                  })
                ),
                "₹"
              )}

            </div>

            <div className="chart-panel">

              <div className="chart-header">
                <div>
                  <div className="chart-title">
                    Orders over time
                  </div>

                  <div className="chart-subtitle">
                    Total orders created
                    during selected range.
                  </div>
                </div>

                <div className="chart-value">
                  {formatNumber(
                    data.orders.total
                  )}
                </div>
              </div>

              {renderLineChart(
                data.charts.ordersOverTime.map(
                  (item) => ({
                    date: item.date,
                    value: item.orders,
                  })
                )
              )}

            </div>

            <div className="info-grid">

              <div className="info-card">
                <h3>
                  Customers
                </h3>

                <div className="info-row">
                  <span>
                    Total
                  </span>

                  <strong>
                    {formatNumber(
                      data.customers
                        .total
                    )}
                  </strong>
                </div>

                <div className="info-row">
                  <span>
                    New
                  </span>

                  <strong>
                    {formatNumber(
                      data.customers
                        .new
                    )}
                  </strong>
                </div>

                <div className="info-row">
                  <span>
                    Repeat
                  </span>

                  <strong>
                    {formatNumber(
                      data.customers
                        .repeat
                    )}
                  </strong>
                </div>
              </div>

              <div className="info-card">
                <h3>
                  Sellers
                </h3>

                <div className="info-row">
                  <span>
                    Total
                  </span>

                  <strong>
                    {formatNumber(
                      data.sellers
                        .total
                    )}
                  </strong>
                </div>

                <div className="info-row">
                  <span>
                    Active
                  </span>

                  <strong>
                    {formatNumber(
                      data.sellers
                        .active
                    )}
                  </strong>
                </div>
              </div>

              <div className="info-card">
                <h3>
                  Products
                </h3>

                <div className="info-row">
                  <span>
                    Total
                  </span>

                  <strong>
                    {formatNumber(
                      data.products
                        .total
                    )}
                  </strong>
                </div>
              </div>

              <div className="info-card">
                <h3>
                  Returns & Refunds
                </h3>

                <div className="info-row">
                  <span>
                    Returns
                  </span>

                  <strong>
                    {formatNumber(
                      data.returns
                        .completed
                    )}
                  </strong>
                </div>

                <div className="info-row">
                  <span>
                    Refund Processing
                  </span>

                  <strong>
                    {formatNumber(
                      data.refunds
                        .processing
                    )}
                  </strong>
                </div>

                <div className="info-row">
                  <span>
                    Refund Completed
                  </span>

                  <strong>
                    {formatNumber(
                      data.refunds
                        .completed
                    )}
                  </strong>
                </div>

                <div className="info-row">
                  <span>
                    Refund Amount
                  </span>

                  <strong>
                    {formatAmount(
                      data.refunds
                        .totalAmount
                    )}
                  </strong>
                </div>
              </div>

            </div>

          </>
        ) : null}

      </div>
    </main>
  );
}