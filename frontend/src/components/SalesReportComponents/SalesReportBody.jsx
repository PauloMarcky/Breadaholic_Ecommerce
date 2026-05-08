import React, { useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './SalesReportBody.css';

const PageHeader = ({ title }) => <div className="sr-page-header"><h1>{title}</h1></div>;
const StatCard = ({ label, value, sub, color }) => (
  <div className="sr-stat-card"><p className="sr-stat-label">{label}</p><p className="sr-stat-value" style={{ color: color || 'var(--brown)' }}>{value}</p><span className="sr-stat-sub">{sub}</span></div>
);

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

const revenueData = [
  { m: "Jan ", revenue: 28400 }, { m: "Feb ", revenue: 35200 }, { m: "Mar ", revenue: 41800 },
  { m: "Apr ", revenue: 38600 }, { m: "May ", revenue: 52300 }, { m: "Jun ", revenue: 47900 }, { m: "Jul ", revenue: 56100 },
];
const productSalesData = [
  { name: "Spanish Bread ", sales: 890 }, { name: "Pandesal ", sales: 750 },
  { name: "Ensaymada ", sales: 620 }, { name: "Cheese Roll ", sales: 580 }, { name: "Ube Bread ", sales: 460 },
];

function SalesReportBody() {
  const [revFilter, setRevFilter] = useState("Monthly ");
  const [prodFilter, setProdFilter] = useState("Annually ");

  return (
    <div style={{ padding: 24 }}>
      <PageHeader title="Sales Reports " />
      <div style={{ display: "grid ", gridTemplateColumns: "repeat(3,1fr) ", gap: 16, marginBottom: 24 }}>
        <StatCard label="Today's Revenue " value="₱3,469 " sub="May 24, 2026 " color="var(--amber-dk) " />
        <StatCard label="Average Rating " value="4.9 ⭐ " sub="Customer satisfaction " color="#856404 " />
        <StatCard label="Best Seller " value="Spanish Bread " sub="Top product this month " />
      </div>
      <div className="sr-chart-card">
        <div className="sr-chart-header">
          <h3>Total Revenue</h3>
          <select value={revFilter} onChange={e => setRevFilter(e.target.value)} className="sr-select">
            <option>Monthly</option><option>Weekly</option>
          </select>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={revenueData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(160,100,40,.15)" />
            <XAxis dataKey="m" tick={{ fontSize: 12, fill: "#7A5030" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#7A5030" }} axisLine={false} tickLine={false} tickFormatter={v => `₱${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={customTooltip} />
            <Line type="monotone" dataKey="revenue" stroke="#C07A1A" strokeWidth={2.5} dot={{ fill: "#C07A1A", r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="sr-chart-card">
        <div className="sr-chart-header">
          <h3>Product Sales</h3>
          <select value={prodFilter} onChange={e => setProdFilter(e.target.value)} className="sr-select">
            <option>Annually</option><option>Monthly</option>
          </select>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={productSalesData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(160,100,40,.15)" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#7A5030" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#7A5030" }} axisLine={false} tickLine={false} />
            <Tooltip content={barTooltip} />
            <Bar dataKey="sales" fill="#C07A1A" radius={[5, 5, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default SalesReportBody;