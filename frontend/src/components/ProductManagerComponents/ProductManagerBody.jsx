// ProductManagerBody.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import './ProductManagerBody.css';

const API_BASE = 'http://10.137.201.159:5000';
const SOCKET_BASE = 'http://10.137.201.159:5000';

const getImageUrl = (relativePath) => {
  if (!relativePath) return 'https://via.placeholder.com/200';
  if (relativePath.startsWith('http')) return relativePath;
  const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  return `${API_BASE}${path}`;
};

// ✅ Socket connection (outside component)
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

const ProductModal = ({ product, onSave, onClose, showToast }) => {
  const [form, setForm] = useState(() => {
    if (product) {
      return {
        product_id: product.product_id,
        product_name: product.product_name || '',
        price: product.price || '',
        stock: product.stock || '',
        category: product.category || 'Bread',
        ingredients: product.ingredients || '',
        image: product.image || '',  // ← Keep as relative path from backend
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
        showToast('Please select an image file', 'error');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        showToast('Image must be less than 5MB', 'error');
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
              <img
                src={getImageUrl(form.image)}  // ✅ Resolve relative path to full URL
                alt="preview"
                className="pm-preview-image"
                onError={(e) => { e.target.src = 'https://via.placeholder.com/200'; }}
              />
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

// ✅ NEW: Confirmation Modal Component
const ConfirmModal = ({ show, title, message, confirmText = "Confirm", cancelText = "Cancel", onConfirm, onCancel, variant = "danger" }) => {
  if (!show) return null;

  return (
    <div className="pm-confirm-overlay" onClick={onCancel}>
      <div className="pm-confirm-modal" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="pm-confirm-actions">
          <button className="pm-confirm-btn pm-confirm-btn-secondary" onClick={onCancel}>
            {cancelText}
          </button>
          <button className={`pm-confirm-btn pm-confirm-btn-${variant}`} onClick={onConfirm}>
            {confirmText}
          </button>
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
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  // ✅ NEW: Confirmation modal state
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    productId: null,
    productName: '',
    action: null // 'delete' or other actions
  });

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

  // ✅ Socket.IO event listener
  useEffect(() => {
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
            if (data.product_data) {
              return [...prevProducts, data.product_data];
            }
            fetchProducts();
            return prevProducts;

          case 'updated':
            if (data.product_data) {
              return prevProducts.map(p =>
                p.product_id === data.product_id ? data.product_data : p
              );
            }
            return prevProducts;

          case 'deleted':
            return prevProducts.filter(p => p.product_id !== data.product_id);

          default:
            return prevProducts;
        }
      });

      const actionText = {
        added: 'Product added',
        updated: 'Product updated',
        deleted: 'Product deleted'
      }[data.action] || 'Products updated';

      showToast(actionText, 'success');
    };

    if (socket.connected) {
      setIsSocketConnected(true);
      console.log('✅ Socket already connected on mount');
    }

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('products_updated', handleProductsUpdated);

    fetchProducts();

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('products_updated', handleProductsUpdated);
    };
  }, []);

  const handleSave = async (form) => {
    setLoading(true);
    try {
      if (form.product_id) {
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

  // ✅ NEW: Open delete confirmation modal
  const openDeleteConfirm = (product_id, product_name) => {
    setConfirmModal({
      show: true,
      productId: product_id,
      productName: product_name,
      action: 'delete'
    });
  };

  // ✅ NEW: Close confirmation modal
  const closeConfirmModal = () => {
    setConfirmModal({ show: false, productId: null, productName: '', action: null });
  };

  // ✅ NEW: Execute delete after confirmation
  const executeDelete = async () => {
    const { productId, action } = confirmModal;
    if (!productId || action !== 'delete') return;

    setLoading(true);
    try {
      await axios.post(`${API_BASE}/deleteProduct`, { product_id: productId });
      showToast("Product deleted successfully!", "success");
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
      closeConfirmModal();
    }
  };

  return (
    <div className="pm-container">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`pm-toast ${toast.type}`}>
          <p>{toast.message}</p>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="pm-loading-overlay">
          <p>Processing...</p>
        </div>
      )}

      {/* ✅ Confirmation Modal */}
      <ConfirmModal
        show={confirmModal.show}
        title="Delete Product?"
        message={`Are you sure you want to delete "${confirmModal.productName}"? This action cannot be undone.`}
        confirmText="Yes, Delete"
        cancelText="Keep Product"
        variant="danger"
        onConfirm={executeDelete}
        onCancel={closeConfirmModal}
      />

      {/* Connection Status */}
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

      {/* Product Modal */}
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
                      <button onClick={() => setModal(p)} className="action-btn" disabled={loading}>                        <img src="../public/edit-icon.png" alt="" width={'20px'} /></button>
                      <button
                        onClick={() => openDeleteConfirm(p.product_id, p.product_name)}
                        className="action-btn delete"
                        disabled={loading}
                      >
                        <img src="../public/delete-icon.png" alt="" width={'23px'} />
                      </button>
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