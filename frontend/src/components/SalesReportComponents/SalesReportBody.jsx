import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import { io } from 'socket.io-client';
import './SalesReportBody.css';

const API_BASE = 'http://localhost:5000';
const SOCKET_BASE = 'http://localhost:5000';

// ✅ Initialize socket once (outside component)
const socket = io(SOCKET_BASE, { transports: ['websocket', 'polling'] });

// ✅ Reuse your design components
const PageHeader = ({ title }) => (
  <div className="sr-page-header"><h1>{title}</h1></div>
);

const StatCard = ({ label, value, sub, color }) => (
  <div className="sr-stat-card">
    <p className="sr-stat-label">{label}</p>
    <p className="sr-stat-value" style={{ color: color || 'var(--brown)' }}>{value}</p>
    <span className="sr-stat-sub">{sub}</span>
  </div>
);

// ✅ LineChart tooltip (Gross Revenue)
const customTooltip = ({ active, payload, label }) => active && payload?.length ? (
  <div style={{
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 12,
    boxShadow: "var(--shadow)"
  }}>
    <p style={{ fontWeight: 700, color: "var(--brown)", marginBottom: 4 }}>{label}</p>
    {payload.map((p, i) => (
      <p key={i} style={{ color: p.color }}>₱{p.value?.toLocaleString()}</p>
    ))}
  </div>
) : null;

// ✅ BarChart tooltip (Top Products) - Shows FULL product name
const barTooltip = ({ active, payload, label }) => active && payload?.length ? (
  <div className="sr-tooltip">
    <p className="sr-tooltip-label">
      {payload[0]?.payload?.fullName || label}
    </p>
    {payload[0]?.payload?.revenue !== undefined && (
      <p style={{ color: 'var(--muted)', fontSize: 11, marginTop: 4 }}>
        ₱{Number(payload[0].payload.revenue).toLocaleString()} revenue
      </p>
    )}
  </div>
) : null;

// ✅ Helper: Calculate "nice" max value for Y-axis (auto-scaling)
const getNiceMax = (value, type = 'revenue') => {
  if (value <= 0) return type === 'revenue' ? 1000 : 10;

  if (type === 'revenue') {
    // For revenue: round to nearest 1k, 2k, 5k, 10k, etc. + 10% padding
    const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
    const normalized = value / magnitude;
    let niceMultiplier;
    if (normalized <= 1) niceMultiplier = 1;
    else if (normalized <= 2) niceMultiplier = 2;
    else if (normalized <= 5) niceMultiplier = 5;
    else niceMultiplier = 10;
    const niceValue = Math.ceil(value / (magnitude * niceMultiplier)) * magnitude * niceMultiplier;
    return Math.ceil(niceValue * 1.1); // 10% breathing room
  } else {
    // For units sold: round to nearest 5, 10, 20, 50, etc. + 15% padding
    if (value <= 10) {
      return Math.ceil((Math.ceil(value / 5) * 5) * 1.15);
    } else if (value <= 50) {
      return Math.ceil((Math.ceil(value / 10) * 10) * 1.15);
    } else if (value <= 200) {
      return Math.ceil((Math.ceil(value / 20) * 20) * 1.15);
    } else {
      return Math.ceil((Math.ceil(value / 50) * 50) * 1.15);
    }
  }
};

export default function SalesReportBody() {
  const [period, setPeriod] = useState('monthly');
  const [revenueData, setRevenueData] = useState([]);
  const [productSalesData, setProductSalesData] = useState([]);
  const [stats, setStats] = useState({
    today: { gross_revenue: 0, orders: 0 },
    top_products: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [summaryRes, productRes, statsRes] = await Promise.all([
        axios.get(`${API_BASE}/sales_report/summary?period=${period}`),
        axios.get(`${API_BASE}/sales_report/products?period=${period}`),
        axios.get(`${API_BASE}/sales_report/stats`)
      ]);

      // ✅ Transform summary → LineChart (Gross Revenue)
      const formattedRevenue = summaryRes.data.data.map(item => ({
        m: item.period,
        revenue: item.gross_revenue
      }));
      setRevenueData(formattedRevenue);

      // ✅ Transform products → BarChart (Keep full name for tooltip)
      const latestPeriod = productRes.data.data[0];
      const formattedProducts = (latestPeriod?.products || []).slice(0, 10).map(p => ({
        name: p.product_name.length > 12
          ? p.product_name.substring(0, 12) + '...'
          : p.product_name,
        fullName: p.product_name,
        sales: p.total_sold,
        revenue: p.revenue
      }));
      setProductSalesData(formattedProducts);

      // ✅ Update KPI stats
      setStats(statsRes.data);

    } catch (err) {
      console.error("❌ Sales report fetch error:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        url: err.config?.url
      });

      setError(`Could not load sales data: ${err.response?.data?.error || err.message}`);
      setRevenueData([]);
      setProductSalesData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchData();
  };

  useEffect(() => {
    fetchData();
  }, [period]);

  useEffect(() => {
    const handleSalesUpdate = (data) => {
      console.log('🔄 Sales data updated, refreshing...', data);
      fetchData();
    };

    socket.on('sales_data_updated', handleSalesUpdate);
    socket.on('order_status_updated', handleSalesUpdate);

    return () => {
      socket.off('sales_data_updated', handleSalesUpdate);
      socket.off('order_status_updated', handleSalesUpdate);
    };
  }, []);

  const formatPeso = (amount) => `₱${Number(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;

  if (loading) return (
    <div className="sr-loading" style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
      Loading report data...
    </div>
  );

  if (error) return (
    <div className="sr-error" style={{
      padding: 24,
      textAlign: 'center',
      color: '#dc2626',
      background: '#fef2f2',
      borderRadius: 8,
      margin: '0 24px'
    }}>
      {error}
      <br />
      <button
        onClick={handleRefresh}
        style={{ marginTop: 12, padding: '6px 16px', background: 'var(--amber)', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}
      >
        Try Again
      </button>
    </div>
  );

  return (
    <div style={{ padding: 24, position: 'relative' }}>
      <PageHeader title="Sales Reports" />

      {/* ✅ Refresh Button */}
      <button
        onClick={handleRefresh}
        disabled={loading}
        style={{
          position: 'absolute',
          top: 24,
          right: 24,
          padding: '8px 16px',
          background: 'var(--amber)',
          color: 'white',
          border: 'none',
          borderRadius: 8,
          cursor: loading ? 'not-allowed' : 'pointer',
          fontWeight: 500,
          fontSize: 13
        }}
      >
        {loading ? 'Refreshing...' : 'Refresh'}
      </button>

      {/* ✅ KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 24 }}>
        <StatCard
          label="Today's Gross Revenue"
          value={formatPeso(stats.today?.gross_revenue || 0)}
          sub={new Date().toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
          color="var(--amber-dk)"
        />
        <StatCard
          label="Today's Orders"
          value={stats.today?.orders || 0}
          sub="Completed transactions"
          color="#856404"
        />
        <StatCard
          label="Best Seller"
          value={stats.top_products?.[0]?.name || "N/A"}
          sub={`${stats.top_products?.[0]?.sold || 0} units sold`}
        />
      </div>

      {/* ✅ Gross Revenue Chart - LineChart with Dynamic Y-Axis */}
      <div className="sr-chart-card">
        <div className="sr-chart-header">
          <h3>Gross Revenue</h3>
          <select value={period} onChange={(e) => setPeriod(e.target.value)} className="sr-select">
            <option value="monthly">Monthly</option>
            <option value="weekly">Weekly</option>
          </select>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={revenueData} margin={{ top: 8, right: 8, bottom: 10, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(160,100,40,.15)" />
            <XAxis
              dataKey="m"
              tick={{ fontSize: 10, fill: "#7A5030" }}
              axisLine={false}
              tickLine={false}
              interval={0}
            />
            {/* ✅ DYNAMIC Y-AXIS using getNiceMax helper */}
            <YAxis
              tick={{ fontSize: 11, fill: "#7A5030" }}
              axisLine={false}
              tickLine={false}
              domain={[0, (dataMax) => getNiceMax(dataMax, 'revenue')]}
              tickFormatter={(value) => {
                if (value >= 100000) {
                  return `₱${(value / 1000).toFixed(0)}k`;
                } else if (value >= 1000) {
                  return `₱${(value / 1000).toFixed(0)}k`;
                }
                return `₱${value.toLocaleString()}`;
              }}
              width={60}
            />
            <Tooltip content={customTooltip} />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#C07A1A"
              strokeWidth={2.5}
              dot={{ fill: "#C07A1A", r: 4 }}
              activeDot={{ r: 6 }}
              animationDuration={500}
            />
          </LineChart>
        </ResponsiveContainer>
        {revenueData.length === 0 && (
          <p className="sr-empty" style={{ textAlign: 'center', color: 'var(--muted)', padding: 20 }}>
            No revenue data for this period
          </p>
        )}
      </div>

      {/* ✅ Top Products Chart - BarChart with Dynamic Whole-Number Y-Axis */}
      <div className="sr-chart-card">
        <div className="sr-chart-header">
          <h3>Top Products</h3>
          <span className="sr-select" style={{ cursor: 'default', background: 'var(--cream)' }}>
            {period === 'weekly' ? 'This Week' : 'This Month'}
          </span>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={productSalesData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(160,100,40,.15)" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, fill: "#7A5030" }}
              axisLine={false}
              tickLine={false}
              interval={0}
              angle={-10}
              textAnchor="end"
              height={60}
            />
            {/* ✅ DYNAMIC WHOLE-NUMBER Y-AXIS using getNiceMax helper */}
            <YAxis
              tick={{ fontSize: 11, fill: "#7A5030" }}
              axisLine={false}
              tickLine={false}
              domain={[0, (dataMax) => getNiceMax(dataMax, 'units')]}
              tickFormatter={(value) => Math.round(value).toLocaleString()}
              allowDecimals={false}
              width={40}
            />
            <Tooltip content={barTooltip} />
            <Bar
              dataKey="sales"
              fill="#C07A1A"
              radius={[5, 5, 0, 0]}
              animationDuration={400}
              animationBegin={100}
            />
          </BarChart>
        </ResponsiveContainer>
        {productSalesData.length === 0 && (
          <p className="sr-empty" style={{ textAlign: 'center', color: 'var(--muted)', padding: 20 }}>
            No product sales data for this period
          </p>
        )}
      </div>
    </div>
  );
}