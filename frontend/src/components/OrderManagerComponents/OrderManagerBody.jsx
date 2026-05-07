import React, { useState } from 'react';
import './OrderManagerBody.css';

const PageHeader = ({ title }) => <div className="om-page-header"><h1>{title}</h1></div>;
const StatCard = ({ label, value, sub, color }) => (
  <div className="om-stat-card"><p className="om-stat-label">{label}</p><p className={`om-stat-value ${typeof value === 'string' && value.length > 4 ? 'long' : 'short'}`} style={color ? { color } : {}}>{value}</p><span className="om-stat-sub">{sub}</span></div>
);
const Btn = ({ children, onClick, variant = 'primary', style: s = {} }) => <button onClick={onClick} className={`om-btn om-btn-${variant}`} style={s}>{children}</button>;
const Badge = ({ status }) => <span className={`om-badge om-badge-${status}`}>{status}</span>;

const initialOrders = [
  { id: "001", name: "Escanor Noli Nis", date: "24-May-2026", status: "COMPLETED", items: [{ name: "Spanish Bread", qty: 3, price: 45, emoji: "🍞" }, { name: "Latte", qty: 1, price: 95, emoji: "☕" }, { name: "Pandesal", qty: 10, price: 50, emoji: "🥖" }], shipping: 50 },
  { id: "002", name: "Lelouch vi Britannia", date: "24-May-2026", status: "CANCELED", items: [{ name: "Ensaymada", qty: 2, price: 90, emoji: "🥐" }, { name: "Brewed Coffee", qty: 2, price: 160, emoji: "☕" }], shipping: 50 },
  { id: "003", name: "Juan Dela Cruz", date: "24-May-2026", status: "PENDING", items: [{ name: "Cheese Roll", qty: 4, price: 100, emoji: "🥐" }, { name: "Pandesal", qty: 12, price: 60, emoji: "🥖" }], shipping: 50 },
  { id: "004", name: "Marcky Balaba", date: "24-May-2026", status: "PENDING", items: [{ name: "Croissant", qty: 2, price: 110, emoji: "🥐" }, { name: "Latte", qty: 1, price: 95, emoji: "☕" }], shipping: 50 },
  { id: "005", name: "Gojo Satoru", date: "24-May-2026", status: "PREPARING", items: [{ name: "Spanish Bread", qty: 5, price: 75, emoji: "🍞" }, { name: "Ube Bread", qty: 3, price: 90, emoji: "🍞" }, { name: "Latte", qty: 2, price: 190, emoji: "☕" }], shipping: 50 },
  { id: "006", name: "Reehzie Calinawan", date: "23-May-2026", status: "COMPLETED", items: [{ name: "Pandesal", qty: 20, price: 100, emoji: "🥖" }, { name: "Brewed Coffee", qty: 1, price: 80, emoji: "☕" }], shipping: 50 },
];

function OrderManagerBody() {
  const [orders, setOrders] = useState(initialOrders);
  const [selected, setSelected] = useState(null);
  const pending = orders.filter(o => o.status === "PENDING").length;
  const preparing = orders.filter(o => o.status === "PREPARING").length;
  const completed = orders.filter(o => o.status === "COMPLETED").length;
  const sel = orders.find(o => o.id === selected);

  const update = (id, status) => setOrders(os => os.map(o => o.id === id ? { ...o, status } : o));

  return (
    <div className="order-layout">
      <div className="order-list">
        <PageHeader title="Order Management" />
        <div className="order-stats">
          <StatCard label="Pending Orders" value={pending} sub="Awaiting action" color="#856404" />
          <StatCard label="Preparing" value={preparing} sub="In kitchen" color="#004085" />
          <StatCard label="Completed Today" value={completed} sub="Fulfilled" color="#155724" />
        </div>
        <div className="table-wrapper">
          <div className="table-header"><h3>All Orders</h3></div>
          <table>
            <thead><tr><th>Order ID</th><th>Customer</th><th>Date</th><th>Total</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {orders.map(o => {
                const total = o.items.reduce((s, i) => s + i.price, 0) + o.shipping;
                return (
                  <tr key={o.id}>
                    <td style={{ fontWeight: 700, color: 'var(--amber-dk)' }}># <span style={{ fontFamily: 'monospace' }}>{o.id}</span></td>
                    <td style={{ fontWeight: 600 }}>{o.name}</td>
                    <td style={{ color: 'var(--muted)' }}>{o.date}</td>
                    <td style={{ fontWeight: 600 }}>₱{total}</td>
                    <td><Badge status={o.status} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Btn onClick={() => setSelected(o.id)} variant={selected === o.id ? 'secondary' : 'ghost'} style={{ fontSize: 12, padding: '5px 10px' }}>{selected === o.id ? 'Viewing' : 'View'}</Btn>
                        <button onClick={() => setOrders(os => os.filter(x => x.id !== o.id))} className="action-btn delete">🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <aside className="detail-panel">
        {!sel ? (
          <div className="detail-empty"><span style={{ fontSize: 42 }}>🧾</span><p style={{ fontSize: 14, fontWeight: 500, textAlign: 'center' }}>Select an order to view its details</p></div>
        ) : (
          <>
            <div className="detail-header"><h3>Order Detail</h3><button onClick={() => setSelected(null)} className="close-btn">✕</button></div>
            <div className="order-id-box">#{sel.id}</div>
            <p className="items-label">Items Ordered</p>
            {sel.items.map((item, i) => (
              <div key={i} className="item-row">
                <div className="item-icon">{item.emoji}</div>
                <div className="item-info"><p className="item-name">{item.name}</p><span className="item-qty">Qty: {item.qty}</span></div>
                <span className="item-price">₱{item.price}</span>
              </div>
            ))}
            <div className="totals-card">
              <div className="total-row"><span>Order Total</span><span>₱{sel.items.reduce((s, i) => s + i.price, 0)}</span></div>
              <div className="total-row"><span>Shipping Fee</span><span>₱{sel.shipping}</span></div>
              <div className="grand-total"><span>Total</span><span>₱{sel.items.reduce((s, i) => s + i.price, 0) + sel.shipping}</span></div>
            </div>
            <div className="action-buttons">
              <div style={{ marginBottom: 6 }}><Badge status={sel.status} /></div>
              {sel.status === "PENDING" && <Btn onClick={() => update(sel.id, "PREPARING")} variant="warning">Mark as Preparing</Btn>}
              {(sel.status === "PENDING" || sel.status === "PREPARING") && <Btn onClick={() => update(sel.id, "COMPLETED")} variant="success">Mark as Completed</Btn>}
              {sel.status !== "CANCELED" && sel.status !== "COMPLETED" && <Btn onClick={() => update(sel.id, "CANCELED")} variant="danger">Confirm Cancellation</Btn>}
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

export default OrderManagerBody;