// ProductManagerBody.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ProductManagerBody.css';

/* ─────────────────────────────────────────────
   Shared UI
───────────────────────────────────────────── */

const PageHeader = ({ title, children }) => (
  <div className="pm-page-header">
    <h1>{title}</h1>
    {children}
  </div>
);

const StatCard = ({ label, value, sub, color }) => (
  <div className="pm-stat-card">
    <p className="pm-stat-label">{label}</p>
    <p
      className={`pm-stat-value ${typeof value === 'string' && value.length > 4
        ? 'long'
        : 'short'
        } ${color ? '' : 'default-color'}`}
      style={color ? { color } : {}}
    >
      {value}
    </p>
    <span className="pm-stat-sub">{sub}</span>
  </div>
);

const Btn = ({
  children,
  onClick,
  variant = 'primary',
  style: s = {},
  disabled
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`pm-btn pm-btn-${variant}`}
    style={s}
  >
    {children}
  </button>
);

/* ─────────────────────────────────────────────
   Product Modal
───────────────────────────────────────────── */

const ProductModal = ({
  product,
  onSave,
  onClose
}) => {

  const [form, setForm] = useState(
    product || {
      product_name: '',
      price: '',
      stock: '',
      category: 'Pastries',
      image: '',
      imageFile: null
    }
  );

  const set = key => e =>
    setForm(prev => ({
      ...prev,
      [key]: e.target.value
    }));

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(prev => ({
          ...prev,
          imageFile: file,
          image: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="pm-modal-overlay" onClick={onClose}>
      <div className="pm-modal-content" onClick={e => e.stopPropagation()}>
        <h2>{product ? 'Edit Product' : 'Add New Product'}</h2>

        <div className="pm-modal-body">
          <div className="pm-modal-preview">
            {form.image ? (
              <img src={form.image} alt="preview" className="pm-preview-image" />
            ) : (
              <span>📷</span>
            )}
          </div>

          <div className="pm-form-row">
            <div className="pm-form-group">
              <label className="pm-form-label">Product Name</label>
              <input type="text" value={form.product_name} onChange={set('product_name')} className="pm-form-input" />
            </div>

            <div className="pm-form-group">
              <label className="pm-form-label">Price (₱)</label>
              <input type="number" value={form.price} onChange={set('price')} className="pm-form-input" />
            </div>

            <div className="pm-form-group">
              <label className="pm-form-label">Stock</label>
              <input type="number" value={form.stock} onChange={set('stock')} className="pm-form-input" />
            </div>

            <div className="pm-form-group">
              <label className="pm-form-label">Image URL</label>
              <input type="file" accept="image/*" onChange={handleImageChange} className="pm-form-input" />
            </div>

            <div className="pm-form-group">
              <label className="pm-form-label">Category</label>
              <select value={form.category} onChange={set('category')} className="pm-form-select">
                <option>Pastries</option>
                <option>Coffee</option>
                <option>Drinks</option>
                <option>Cakes</option>
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

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */

// ✅ CONFIG: Update this to your machine's WiFi IP
const API_BASE = 'http://192.168.1.102';

function ProductManagerBody() {
  const [products, setProducts] = useState([]);
  const [modal, setModal] = useState(null);

  const fetchProducts = () => {
    axios.get(`${API_BASE}:5000/getProducts`)
      .then(res => setProducts(res.data))
      .catch(err => console.error("Fetch Products Error:", err));
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleSave = async (form) => {
    try {
      if (form.product_id) {
        // EDIT
        await axios.post(`${API_BASE}:5000/updateProduct`, {
          product_id: form.product_id,
          product_name: form.product_name,
          price: form.price,
          stock: form.stock,
          category: form.category
        });
        if (form.imageFile) {
          const imageData = new FormData();
          imageData.append("product_id", form.product_id);
          imageData.append("file", form.imageFile);
          await axios.post(`${API_BASE}:5000/upload_product_image`, imageData, {
            headers: { "Content-Type": "multipart/form-data" }
          });
        }
      } else {
        // ADD
        const res = await axios.post(`${API_BASE}:5000/addProduct`, {
          product_name: form.product_name,
          price: form.price,
          stock: form.stock,
          category: form.category
        });
        const product_id = res.data.product_id;
        if (form.imageFile) {
          const imageData = new FormData();
          imageData.append("product_id", product_id);
          imageData.append("file", form.imageFile);
          await axios.post(`${API_BASE}:5000/upload_product_image`, imageData, {
            headers: { "Content-Type": "multipart/form-data" }
          });
        }
      }
      fetchProducts();
      setModal(null);
    } catch (err) {
      console.error("Save Product Error:", err);
    }
  };

  const handleDelete = (product_id) => {
    if (!window.confirm("Delete this product?")) return;
    axios.post(`${API_BASE}:5000/deleteProduct`, { product_id })
      .then(() => fetchProducts())
      .catch(err => console.error("Delete Product Error:", err));
  };

  const outOfStock = products.filter(p => p.stock === 0).length;

  return (
    <div className="pm-container">
      <div style={{ padding: 24, width: '100%', height: '100%', overflow: 'hidden' }}>
        {modal && (
          <ProductModal
            product={modal === 'new' ? null : modal}
            onSave={handleSave}
            onClose={() => setModal(null)}
          />
        )}

        <PageHeader title="Product Management" />

        <div className="product-stats">
          <StatCard label="Out of Stock" value={outOfStock} sub="Unavailable" />
          <StatCard label="Total Products" value={products.length} sub="In catalog" />
          <StatCard label="Latest Added" value={products.length} sub="Database synced" color="var(--amber)" />
        </div>

        <div className="pm-table-scroll-wrapper">
          <div className="table-wrapper">
            <div className="table-header">
              <h3>All Products</h3>
              <Btn onClick={() => setModal('new')} style={{ fontSize: 12, padding: '6px 14px' }}>
                + Add Product
              </Btn>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Name</th><th>Price</th><th>Stock</th><th>Category</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product.product_id}>
                    <td style={{ fontWeight: 600, textAlign: 'left', paddingLeft: '50px' }}>{product.product_name}</td>
                    <td style={{ color: 'var(--amber-dk)', fontWeight: 600 }}>₱{product.price}</td>
                    <td>
                      <span className={product.stock === 0 ? 'stock-out' : product.stock < 20 ? 'stock-low' : 'stock-ok'}>
                        {product.stock === 0 ? 'Out of Stock' : product.stock}
                      </span>
                    </td>
                    <td>{product.category}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        <button onClick={() => setModal(product)} className="action-btn">✏️</button>
                        <button onClick={() => handleDelete(product.product_id)} className="action-btn delete">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductManagerBody;