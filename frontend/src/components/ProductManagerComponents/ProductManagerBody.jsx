// ProductManagerBody.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client'; // ✅ NEW: Import socket.io-client
import './ProductManagerBody.css';

const API_BASE = 'http://192.168.1.100:5000';
const SOCKET_BASE = 'http://192.168.1.100:5000'; // ✅ NEW: Socket server URL

// ✅ NEW: Initialize socket connection (outside component to avoid re-creation)
const socket = io(SOCKET_BASE, {
  transports: ['websocket', 'polling'],
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5
});

const PageHeader = ({ title, children }) => (
  <div className="pm-page-header"><h1>{title}</h1>{children}</div>
);

const StatCard = ({ label, value, sub, color }) => (
  <div className="pm-stat-card">
    <p className="pm-stat-label">{label}</p>
    <p className={`pm-stat-value ${typeof value === 'string' && value.length > 4 ? 'long' : 'short'}`} style={color ? { color } : {}}>{value}</p>
    <span className="pm-stat-sub">{sub}</span>
  </div>
);

const Btn = ({ children, onClick, variant = 'primary', style: s = {}, disabled }) => (
  <button onClick={onClick} disabled={disabled} className={`pm-btn pm-btn-${variant}`} style={s}>{children}</button>
);

const ProductModal = ({ product, onSave, onClose }) => {
  const [form, setForm] = useState(() => {
    if (product) {
      return {
        product_id: product.product_id,
        product_name: product.product_name || '',
        price: product.price || '',
        stock: product.stock || '',
        category: product.category || 'Bread',
        ingredients: product.ingredients || '',
        image: product.image || '',
        imageFile: null
      };
    }
    return {
      product_id: null,
      product_name: '',
      price: '',
      stock: '',
      category: 'Bread',
      ingredients: '',
      image: '',
      imageFile: null
    };
  });

  const fileInputRef = useRef(null);

  const set = key => e => setForm(prev => ({ ...prev, [key]: e.target.value }));

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('Image must be less than 5MB');
        return;
      }
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

  const handlePreviewClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="pm-modal-overlay" onClick={onClose}>
      <div className="pm-modal-content" onClick={e => e.stopPropagation()}>
        <h2>{form.product_id ? 'Edit Product' : 'Add New Product'}</h2>
        <div className="pm-modal-body">
          <div className="pm-modal-preview clickable" onClick={handlePreviewClick} title="Click to change image">
            {form.image ? (
              <img src={form.image} alt="preview" className="pm-preview-image" />
            ) : (
              <span className="pm-preview-placeholder"><small>Click to add</small></span>
            )}
            <div className="pm-preview-overlay">
              <span>CHANGE</span>
            </div>
          </div>

          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="pm-file-input-hidden" />

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
              <input type="number" min={1} value={form.stock} onChange={set('stock')} className="pm-form-input" />
            </div>
            <div className="pm-form-group">
              <label className="pm-form-label">Category</label>
              <select value={form.category} onChange={set('category')} className="pm-form-select">
                <option>Bread</option>
                <option>Coffee</option>
                <option>Tea</option>
              </select>
            </div>
            <div className="pm-form-group">
              <label className="pm-form-label">Ingredients</label>
              <textarea value={form.ingredients} onChange={set('ingredients')} placeholder="Separate them by comma" className="pm-form-textarea" rows="3" />
              <small className="pm-form-hint">Example: flour, sugar, eggs, butter</small>
            </div>
          </div>

          <div className="pm-modal-actions">
            <Btn onClick={() => onSave(form)}>Save</Btn>
            <Btn onClick={onClose} variant="secondary">Cancel</Btn>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function ProductManagerBody() {
  const [products, setProducts] = useState([]);
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [isSocketConnected, setIsSocketConnected] = useState(false); // ✅ NEW: Track socket connection

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API_BASE}/getProducts`);
      setProducts(res.data);
    } catch (err) {
      console.error("Fetch Products Error:", err);
      showToast("Failed to load products", "error");
    }
  };

  // ✅ NEW: Socket.IO event listener for real-time product updates
  useEffect(() => {
    // Handle connection status
    const handleConnect = () => {
      console.log('✅ Socket connected');
      setIsSocketConnected(true);
    };

    const handleDisconnect = () => {
      console.log('❌ Socket disconnected');
      setIsSocketConnected(false);
    };

    const handleProductsUpdated = (data) => {
      console.log('🔄 Product update received:', data);

      setProducts(prevProducts => {
        switch (data.action) {
          case 'added':
            // ✅ Now we have full product data - just add it!
            if (data.product_data) {
              return [...prevProducts, data.product_data];
            }
            // Fallback: re-fetch if data missing
            fetchProducts();
            return prevProducts;

          case 'updated':
            // ✅ Replace the updated product with fresh data
            if (data.product_data) {
              return prevProducts.map(p =>
                p.product_id === data.product_id ? data.product_data : p
              );
            }
            return prevProducts;

          case 'deleted':
            // ✅ Remove by product_id
            return prevProducts.filter(p => p.product_id !== data.product_id);

          default:
            return prevProducts;
        }
      });

      // Show subtle notification
      const actionText = {
        added: '✨ Product added',
        updated: '✏️ Product updated',
        deleted: '🗑️ Product deleted'
      }[data.action] || '🔄 Products updated';

      showToast(actionText, 'success');
    };

    // Register event listeners
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('products_updated', handleProductsUpdated);

    // Initial fetch
    fetchProducts();

    // Cleanup on unmount
    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('products_updated', handleProductsUpdated);
    };
  }, []); // Empty dependency array = run once on mount

  const handleSave = async (form) => {
    setLoading(true);
    try {
      if (form.product_id) {
        // UPDATE existing product
        await axios.post(`${API_BASE}/updateProduct`, {
          product_id: form.product_id,
          product_name: form.product_name,
          price: Number(form.price),
          stock: Number(form.stock),
          category: form.category,
          ingredients: form.ingredients
        });

        if (form.imageFile) {
          const fd = new FormData();
          fd.append("product_id", form.product_id);
          fd.append("file", form.imageFile);
          await axios.post(`${API_BASE}/upload_product_image`, fd, {
            headers: { "Content-Type": "multipart/form-data" }
          });
        }
        showToast("Product updated successfully!");

      } else {
        // ADD new product
        const res = await axios.post(`${API_BASE}/addProduct`, {
          product_name: form.product_name,
          price: Number(form.price),
          stock: Number(form.stock),
          category: form.category,
          ingredients: form.ingredients
        });

        if (form.imageFile) {
          const fd = new FormData();
          fd.append("product_id", res.data.product_id);
          fd.append("file", form.imageFile);
          await axios.post(`${API_BASE}/upload_product_image`, fd, {
            headers: { "Content-Type": "multipart/form-data" }
          });
        }
        showToast("Product added successfully!");
      }

      // ✅ NOTE: We no longer call fetchProducts() here!
      // The socket event will trigger the update automatically.
      // But for safety (in case socket fails), we keep a fallback:
      setTimeout(() => fetchProducts(), 1000);

      setModal(null);

    } catch (err) {
      console.error("Save Error:", err);
      if (err.response?.status >= 400) {
        showToast(err.response?.data?.error || "Failed to save product", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (product_id) => {
    if (!window.confirm("Delete this product?")) return;

    setLoading(true);
    try {
      await axios.post(`${API_BASE}/deleteProduct`, { product_id });
      showToast("Product deleted successfully!", "success");
      // ✅ Socket event will handle UI update, but keep fallback
      setTimeout(() => fetchProducts(), 1000);
    } catch (err) {
      console.error("Delete Error:", err);
      if (err.response?.status === 409) {
        showToast(err.response?.data?.error, "error");
      } else {
        showToast(err.response?.data?.error || "Failed to delete product", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pm-container">
      {toast.show && (
        <div className={`pm-toast ${toast.type}`}>
          <p>{toast.message}</p>
        </div>
      )}

      {loading && (
        <div className="pm-loading-overlay">
          <p>Processing...</p>
        </div>
      )}

      {/* ✅ NEW: Connection status indicator */}
      <div style={{
        position: 'fixed',
        top: 10,
        right: 10,
        padding: '4px 12px',
        borderRadius: 20,
        fontSize: 11,
        background: isSocketConnected ? '#10b981' : '#ef4444',
        color: 'white',
        zIndex: 1000,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        {isSocketConnected ? '🟢 Live' : '🔴 Offline'}
      </div>

      {modal && <ProductModal product={modal === 'new' ? null : modal} onSave={handleSave} onClose={() => setModal(null)} />}

      <PageHeader title="Product Management" />

      <div className="product-stats">
        <StatCard label="Out of Stock" value={products.filter(p => p.stock <= 0).length} sub="Unavailable" />
        <StatCard label="Total Products" value={products.length} sub="In catalog" />
        <StatCard label="Database" value={isSocketConnected ? "Live Sync" : "Synced"} sub={isSocketConnected ? "Real-time" : "Manual"} color={isSocketConnected ? "var(--amber)" : "#6b7280"} />
      </div>

      <div className="pm-table-scroll-wrapper">
        <div className="table-header">
          <h3>All Products</h3>
          <Btn onClick={() => setModal('new')} style={{ fontSize: 12, padding: '6px 14px' }} disabled={loading}>+ Add Product</Btn>
        </div>

        <div className="table-scroll-area">
          <table>
            <thead>
              <tr><th>Name</th><th>Price</th><th>Stock</th><th>Category</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr><td colSpan="5" className="empty-state">No products found.</td></tr>
              ) : (
                products.map(p => (
                  <tr key={p.product_id}>
                    <td className="cell-name">{p.product_name}</td>
                    <td className="cell-price">₱{p.price}</td>
                    <td><span className={p.stock <= 0 ? 'stock-out' : p.stock < 20 ? 'stock-low' : 'stock-ok'}>{p.stock <= 0 ? 'Out of Stock' : p.stock}</span></td>
                    <td>{p.category}</td>
                    <td className="cell-actions">
                      <button onClick={() => setModal(p)} className="action-btn" disabled={loading}>✏️</button>
                      <button onClick={() => handleDelete(p.product_id)} className="action-btn delete" disabled={loading}>🗑️</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}