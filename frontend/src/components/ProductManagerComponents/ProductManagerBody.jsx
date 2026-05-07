import React, { useState } from 'react';
import './ProductManagerBody.css';

/* ─── Shared UI (Directly Included) ─── */
const PageHeader = ({ title, children }) => (
  <div className="pm-page-header"><h1>{title}</h1>{children}</div>
);
const StatCard = ({ label, value, sub, color }) => (
  <div className="pm-stat-card">
    <p className="pm-stat-label">{label}</p>
    <p className={`pm-stat-value ${typeof value === 'string' && value.length > 4 ? 'long' : 'short'} ${color ? '' : 'default-color'}`} style={color ? { color } : {}}>{value}</p>
    <span className="pm-stat-sub">{sub}</span>
  </div>
);
const Btn = ({ children, onClick, variant = 'primary', style: s = {}, disabled }) => (
  <button onClick={onClick} disabled={disabled} className={`pm-btn pm-btn-${variant}`} style={s}>{children}</button>
);
const ProductModal = ({ product, onSave, onClose }) => {
  const [form, setForm] = useState(product || { name: '', price: '', stock: '', category: 'Pastries' });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  return (
    <div className="pm-modal-overlay" onClick={onClose}>
      <div className="pm-modal-content" onClick={e => e.stopPropagation()}>
        <h2>{product ? 'Edit Product' : 'Add New Product'}</h2>
        <div className="pm-modal-body">
          <div className="pm-modal-preview"><span>{form.emoji || '📷'}</span><span>Add Image</span></div>
          <div className="pm-form-row">
            {[['Product Name', 'name', 'text'], ['Price (₱)', 'price', 'number'], ['Stock', 'stock', 'number']].map(([l, k, t]) => (
              <div key={k} className="pm-form-group">
                <label className="pm-form-label">{l}</label>
                <input type={t} value={form[k] || ''} onChange={set(k)} className="pm-form-input" />
              </div>
            ))}
            <div className="pm-form-group">
              <label className="pm-form-label">Category</label>
              <select value={form.category} onChange={set('category')} className="pm-form-select">
                <option>Pastries</option><option>Coffee</option><option>Drinks</option><option>Cakes</option>
              </select>
            </div>
            <div className="pm-modal-actions">
              <Btn onClick={() => onSave(form)}>Save Product</Btn>
              <Btn onClick={onClose} variant="secondary">Cancel</Btn>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Component ─── */
const initialProducts = [
  { id: 1, name: "Spanish Bread", price: 15, stock: 120, category: "Pastries", updated: "30/6/25", emoji: "" },
  { id: 2, name: "Pandesal", price: 5, stock: 200, category: "Pastries", updated: "30/6/25", emoji: "" },
  { id: 3, name: "Ensaymada", price: 45, stock: 35, category: "Pastries", updated: "30/6/25", emoji: "" },
  { id: 4, name: "Brewed Coffee", price: 80, stock: 0, category: "Coffee", updated: "30/6/25", emoji: "" },
  { id: 5, name: "Cheese Roll", price: 25, stock: 60, category: "Pastries", updated: "30/6/25", emoji: "" },
  { id: 6, name: "Ube Bread", price: 30, stock: 45, category: "Pastries", updated: "30/6/25", emoji: "" },
  { id: 7, name: "Latte", price: 95, stock: 0, category: "Coffee", updated: "29/6/25", emoji: "" },
  { id: 8, name: "Croissant", price: 55, stock: 22, category: "Pastries", updated: "28/6/25", emoji: "" },
];

function ProductManagerBody() {
  const [products, setProducts] = useState(initialProducts);
  const [modal, setModal] = useState(null);
  const outOfStock = products.filter(p => p.stock === 0).length;

  const handleSave = form => {
    if (form.id) setProducts(ps => ps.map(p => p.id === form.id ? { ...form, price: Number(form.price), stock: Number(form.stock) } : p));
    else setProducts(ps => [...ps, { ...form, id: Date.now(), price: Number(form.price), stock: Number(form.stock), updated: new Date().toLocaleDateString('en-GB').replace(/\//g, '/').slice(0, 7), emoji: "🍞" }]);
    setModal(null);
  };

  return (
    <div style={{ padding: 24 }}>
      {modal && <ProductModal product={modal === 'new' ? null : modal} onSave={handleSave} onClose={() => setModal(null)} />}
      <PageHeader title="Product Management" />
      <div className="product-stats">
        <StatCard label="Out of Stock" value={outOfStock} sub="Unavailable" />
        <StatCard label="Total Products" value={products.length} sub="In catalog" />
        <StatCard label="Latest Added" value={6} sub="Recently added" color="var(--amber)" />
      </div>
      <div className="table-wrapper">
        <div className="table-header">
          <h3>All Products</h3>
          <Btn onClick={() => setModal('new')} style={{ fontSize: 12, padding: '6px 14px' }}>+ Add Product</Btn>
        </div>
        <table>
          <thead><tr><th>Image</th><th>Name</th><th>Price</th><th>Stock</th><th>Category</th><th>Last Update</th><th>Actions</th></tr></thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id}>
                <td><div className="product-img">{p.emoji}</div></td>
                <td style={{ fontWeight: 600 }}>{p.name}</td>
                <td style={{ color: 'var(--amber-dk)', fontWeight: 600 }}>₱{p.price}</td>
                <td><span className={p.stock === 0 ? 'stock-out' : p.stock < 20 ? 'stock-low' : 'stock-ok'}>{p.stock === 0 ? 'Out of Stock' : p.stock}</span></td>
                <td>{p.category}</td>
                <td style={{ color: 'var(--muted)' }}>{p.updated}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => setModal(p)} className="action-btn">✏️</button>
                    <button onClick={() => setProducts(ps => ps.filter(x => x.id !== p.id))} className="action-btn delete">🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ProductManagerBody;