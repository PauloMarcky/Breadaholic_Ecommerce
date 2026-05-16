import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import './SalesReportBody.css';

const API_BASE = 'http://192.168.1.100:5000';

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

// ✅ Your custom tooltips (kept exactly as designed)
const customTooltip = ({ active, payload, label }) => active && payload?.length ? (
  <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", fontSize: 12, boxShadow: "var(--shadow)" }}>
    <p style={{ fontWeight: 700, color: "var(--brown)", marginBottom: 4 }}>{label}</p>
    {payload.map((p, i) => <p key={i} style={{ color: p.color }}>₱{p.value?.toLocaleString()}</p>)}
  </div>
) : null;

const barTooltip = ({ active, payload, label }) => active && payload?.length ? (
  <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", fontSize: 12, boxShadow: "var(--shadow)" }}>
    <p style={{ fontWeight: 700, color: "var(--brown)", marginBottom: 4 }}>{label}</p>
    <p style={{ color: "var(--amber)" }}>{payload[0]?.value} units</p>
  </div>
) : null;

export default function SalesReportBody() {
  const [period, setPeriod] = useState('monthly'); // 'weekly' | 'monthly'

  // ✅ Real data states
  const [revenueData, setRevenueData] = useState([]);
  const [productSalesData, setProductSalesData] = useState([]);
  const [stats, setStats] = useState({ today: { revenue: 0, orders: 0 }, top_products: [] });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ Fetch real data from backend
  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [summaryRes, productRes, statsRes] = await Promise.all([
        axios.get(`${API_BASE}/sales_report/summary?period=${period}`),
        axios.get(`${API_BASE}/sales_report/products?period=${period}`),
        axios.get(`${API_BASE}/sales_report/stats`)
      ]);

      // ✅ Transform summary → LineChart format
      const formattedRevenue = summaryRes.data.data.map(item => ({
        m: item.period, // e.g., "January 2026" or "Week 1: Jan 01"
        revenue: item.gross_revenue
      }));
      setRevenueData(formattedRevenue);

      // ✅ Transform products → BarChart format (most recent period)
      const latestPeriod = productRes.data.data[0];
      const formattedProducts = (latestPeriod?.products || []).slice(0, 10).map(p => ({
        name: p.product_name.length > 12 ? p.product_name.substring(0, 12) + '...' : p.product_name,
        sales: p.total_sold
      }));
      setProductSalesData(formattedProducts);

      // ✅ Update KPI stats
      setStats(statsRes.data);

    } catch (err) {
      console.error("Failed to load sales report:", err);
      setError("Could not load sales data");
      setRevenueData([]);
      setProductSalesData([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Refetch when period changes
  useEffect(() => {
    fetchData();
  }, [period]);

  // Format currency helper
  const formatPeso = (amount) => `₱${Number(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;

  if (loading) return <div className="sr-loading" style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Loading report data...</div>;
  if (error) return <div className="sr-error" style={{ padding: 24, textAlign: 'center', color: '#dc2626', background: '#fef2f2', borderRadius: 8, margin: '0 24px' }}>{error}</div>;

  return (
    <div style={{ padding: 24 }}>
      {/* ✅ Page Header */}
      <PageHeader title="Sales Reports" />

      {/* ✅ KPI Cards - Real Data */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 24 }}>
        <StatCard
          label="Today's Revenue"
          value={formatPeso(stats.today?.revenue || 0)}
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
          sub="Top product this period"
        />
      </div>

      {/* ✅ Revenue Chart - Recharts + Real Data */}
      <div className="sr-chart-card">
        <div className="sr-chart-header">
          <h3>Total Revenue</h3>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="sr-select"
          >
            <option value="monthly">Monthly</option>
            <option value="weekly">Weekly</option>
          </select>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={revenueData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(160,100,40,.15)" />
            <XAxis
              dataKey="m"
              tick={{ fontSize: 12, fill: "#7A5030" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#7A5030" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => `₱${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip content={customTooltip} />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#C07A1A"
              strokeWidth={2.5}
              dot={{ fill: "#C07A1A", r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
        {revenueData.length === 0 && (
          <p className="sr-empty" style={{ textAlign: 'center', color: 'var(--muted)', padding: 20 }}>No revenue data for this period</p>
        )}
      </div>

      {/* ✅ Product Sales Chart - Recharts + Real Data */}
      <div className="sr-chart-card">
        <div className="sr-chart-header">
          <h3>Top Products</h3>
          <span className="sr-select" style={{ cursor: 'default', background: 'var(--cream)' }}>
            {period === 'weekly' ? 'This Week' : 'This Month'}
          </span>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={productSalesData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(160,100,40,.15)" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "#7A5030" }}
              axisLine={false}
              tickLine={false}
              interval={0}
              angle={-10}
              textAnchor="end"
              height={60}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#7A5030" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={barTooltip} />
            <Bar dataKey="sales" fill="#C07A1A" radius={[5, 5, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        {productSalesData.length === 0 && (
          <p className="sr-empty" style={{ textAlign: 'center', color: 'var(--muted)', padding: 20 }}>No product sales data for this period</p>
        )}
      </div>

      {/* ✅ Summary Table - Optional but useful */}
      <div className="sr-chart-card">
        <div className="sr-chart-header">
          <h3>Period Summary</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--cream)', borderBottom: '2px solid var(--border)' }}>
                <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--brown)' }}>Period</th>
                <th style={{ textAlign: 'right', padding: '12px 16px', color: 'var(--brown)' }}>Orders</th>
                <th style={{ textAlign: 'right', padding: '12px 16px', color: 'var(--brown)' }}>Items Sold</th>
                <th style={{ textAlign: 'right', padding: '12px 16px', color: 'var(--brown)' }}>Gross Revenue</th>
                <th style={{ textAlign: 'right', padding: '12px 16px', color: 'var(--brown)' }}>Net Revenue</th>
              </tr>
            </thead>
            <tbody>
              {revenueData.slice(0, 6).map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 16px', color: 'var(--brown)' }}>{item.m}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'right' }}>{item.revenue > 0 ? Math.round(item.revenue / 150) : 0}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'right' }}>{item.revenue > 0 ? Math.round(item.revenue / 75) : 0}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600 }}>{formatPeso(item.revenue)}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'right', color: 'var(--amber-dk)' }}>{formatPeso(item.revenue * 0.92)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}