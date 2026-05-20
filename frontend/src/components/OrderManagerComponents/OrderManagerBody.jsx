// OrderManagerBody.jsx
import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { socket, connectSocket } from '../../utils/socket.js';
import './OrderManagerBody.css';

const PageHeader = ({ title }) => (
  <div className="om-page-header">
    <h1 className="om-page-header__title">{title}</h1>
  </div>
);

const StatCard = ({ label, value, sub, color }) => (
  <div className="om-stat-card">
    <p className="om-stat-card__label">{label}</p>
    <p className="om-stat-card__value" style={color ? { color } : {}}>
      {value}
    </p>
    <span className="om-stat-card__sub">{sub}</span>
  </div>
);

const Btn = ({ children, onClick, variant = 'primary' }) => (
  <button onClick={onClick} className={`om-btn om-btn--${variant}`}>
    {children}
  </button>
);

const Badge = ({ status }) => (
  <span className={`om-badge om-badge--${status?.toLowerCase()}`}>
    {status}
  </span>
);

// ✅ Confirmation Modal Component
const ConfirmModal = ({ show, title, message, confirmText = "Confirm", cancelText = "Cancel", onConfirm, onCancel, variant = "danger", isLoading = false }) => {
  if (!show) return null;

  return (
    <div className="om-confirm-overlay" onClick={onCancel}>
      <div className="om-confirm-modal" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="om-confirm-actions">
          <button
            className="om-confirm-btn om-confirm-btn-secondary"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button
            className={`om-confirm-btn om-confirm-btn-${variant}`}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

function OrderManagerBody() {
  const [orders, setOrders] = useState([]);
  const [selected, setSelected] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newOrderToast, setNewOrderToast] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, orderId: null, orderLabel: '' });
  const listenersAttached = useRef(false);

  const showToast = (message, type = 'success') => {
    setNewOrderToast({ id: Date.now(), customer: 'System', total: '', time: new Date().toLocaleTimeString(), customMessage: message, type });
    setTimeout(() => setNewOrderToast(null), 4000);
  };

  // ✅ Fetch orders list
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.get('http://localhost:5000/getOrders');
        setOrders(res.data);
      } catch (err) {
        console.error('Failed to fetch orders:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  // ✅ Socket listeners
  useEffect(() => {
    if (listenersAttached.current) return;
    console.log('🔌 Admin: Setting up socket listeners...');
    connectSocket();

    const handleNewOrder = (data) => {
      console.log('🔔 New order received:', data);
      setNewOrderToast({ id: data.order_id, customer: data.customer || 'New Customer', total: data.total, time: new Date().toLocaleTimeString() });
      axios.get('http://localhost:5000/getOrders').then(res => setOrders(res.data)).catch(err => console.error("Order sync error:", err));
      setTimeout(() => setNewOrderToast(null), 5000);
    };

    const handleOrderStatusUpdated = (data) => {
      console.log('🔄 Order status updated by another admin:', data);
      setOrders(prev => prev.map(order => order.order_id === data.order_id ? { ...order, status: data.new_status } : order));
      if (selected?.order_id === data.order_id) {
        setSelected(prev => prev ? { ...prev, status: data.new_status } : null);
      }
    };

    socket.on('new_order_received', handleNewOrder);
    socket.on('order_status_updated', handleOrderStatusUpdated);
    listenersAttached.current = true;
    console.log('✅ Socket listeners attached');

    return () => {
      console.log('🔌 Cleaning up socket listeners');
      socket.off('new_order_received', handleNewOrder);
      socket.off('order_status_updated', handleOrderStatusUpdated);
      listenersAttached.current = false;
    };
  }, []);

  // ✅ Fetch order items when an order is selected
  useEffect(() => {
    if (selected?.order_id) {
      const fetchOrderItems = async () => {
        setItemsLoading(true);
        try {
          const res = await axios.get(`http://localhost:5000/getOrderItems/${selected.order_id}`);
          setOrderItems(res.data);
        } catch (err) {
          console.error('Failed to fetch order items:', err);
          showToast('Failed to load order items', 'error');
        } finally {
          setItemsLoading(false);
        }
      };
      fetchOrderItems();
    } else {
      setOrderItems([]);
    }
  }, [selected?.order_id]);

  const updateStatus = async (orderId, status) => {
    try {
      await axios.put(`http://localhost:5000/updateOrderStatus/${orderId}`, { status });
      setOrders(prev => prev.map(o => o.order_id === orderId ? { ...o, status } : o));
      if (selected?.order_id === orderId) {
        setSelected(prev => prev ? { ...prev, status } : null);
      }
    } catch (err) {
      console.error('Failed to update order:', err);
      showToast('Failed to update order status', 'error');
    }
  };

  const openDeleteConfirm = (orderId, orderLabel) => setDeleteConfirm({ show: true, orderId, orderLabel });
  const closeDeleteConfirm = () => setDeleteConfirm({ show: false, orderId: null, orderLabel: '' });

  const executeDeleteOrder = async () => {
    const { orderId } = deleteConfirm;
    if (!orderId) return;
    setLoading(true);
    try {
      await axios.delete(`http://localhost:5000/deleteOrder/${orderId}`);
      setOrders(prev => prev.filter(o => o.order_id !== orderId));
      if (selected?.order_id === orderId) setSelected(null);
      showToast('Order record deleted (stock unchanged)', 'success');
      closeDeleteConfirm();
    } catch (err) {
      console.error('Failed to delete order:', err);
      showToast('Failed to delete order', 'error');
    } finally {
      setLoading(false);
    }
  };

  const pending = orders.filter(o => o.status === 'Pending').length;
  const preparing = orders.filter(o => o.status === 'Preparing').length;
  const completed = orders.filter(o => o.status === 'Completed').length;
  const sel = orders.find(o => o.order_id === selected?.order_id);

  const closePanel = () => { setSelected(null); document.body.classList.remove('om-no-scroll'); };
  const openPanel = (order) => { setSelected(order); document.body.classList.add('om-no-scroll'); };

  return (
    <div className="om-layout">
      {/* Toast */}
      {newOrderToast && (
        <div className={`om-toast ${newOrderToast.type ? `om-toast--${newOrderToast.type}` : ''}`}>
          <div className="om-toast__content">
            <p className="om-toast__title">{newOrderToast.customMessage ? 'Update' : 'New Order Received!'}</p>
            <p className="om-toast__message">{newOrderToast.customMessage || <><strong>#{newOrderToast.id}</strong> from {newOrderToast.customer}</>}</p>
            {newOrderToast.total ? <p className="om-toast__meta">₱{newOrderToast.total} • {newOrderToast.time}</p> : <p className="om-toast__meta">{newOrderToast.time}</p>}
          </div>
          <button className="om-toast__close" onClick={() => setNewOrderToast(null)}>✕</button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        show={deleteConfirm.show}
        title="Delete Order?"
        message={`Are you sure you want to delete order ${deleteConfirm.orderLabel}? This will permanently remove the record (stock NOT restored).`}
        confirmText="Yes, Delete"
        cancelText="Keep Order"
        variant="danger"
        isLoading={loading}
        onConfirm={executeDeleteOrder}
        onCancel={closeDeleteConfirm}
      />

      {/* Main List */}
      <div className="om-main">
        <PageHeader title="Order Management" />
        <div className="om-stats-grid">
          <StatCard label="Pending" value={pending} sub="Awaiting action" color="#B45309" />
          <StatCard label="Preparing" value={preparing} sub="In kitchen" color="#1D4ED8" />
          <StatCard label="Completed" value={completed} sub="Fulfilled" color="#15803D" />
        </div>

        <div className="om-table-card">
          <div className="om-table-card__header"><h3 className="om-table-card__title">All Orders</h3></div>
          {loading ? <p className="om-table-card__loading">Loading orders…</p> : (
            <div className="om-table-scroll">
              <table className="om-table">
                <thead>
                  <tr><th>Order ID</th><th>Customer</th><th>Total</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: 'var(--muted)' }}>No orders yet.</td></tr>
                  ) : (
                    orders.map(order => (
                      <tr key={order.order_id}>
                        <td className="om-table__id">#{order.order_id}</td>
                        <td>{order.first_name} {order.last_name}</td>
                        <td>₱{Number(order.order_total) + Number(order.shipping_fee)}</td>
                        <td><Badge status={order.status} /></td>
                        <td>
                          <div className="om-table__actions">
                            <Btn onClick={() => openPanel(order)}>View</Btn>
                            <button onClick={() => openDeleteConfirm(order.order_id, `#${order.order_id}`)} className="om-delete-btn" aria-label="Delete order" disabled={loading}>
                              <img src="../public/delete-icon.png" alt="" width={'20px'} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Overlay */}
      <div className={`om-overlay${sel ? ' om-overlay--active' : ''}`} onClick={closePanel} aria-hidden="true" />

      {/* Detail Panel */}
      <aside className={`om-detail${sel ? ' om-detail--active' : ''}`}>
        {!sel ? (
          <div className="om-detail__empty"><p>Select an order to view details</p></div>
        ) : (
          <>
            <div className="om-detail__header">
              <h3 className="om-detail__heading">Order Detail</h3>
              <button className="om-detail__close" onClick={closePanel} aria-label="Close panel">✕</button>
            </div>

            <div className="om-detail__id">#{sel.order_id}</div>
            <p className="om-detail__customer">{sel.first_name} {sel.last_name}</p>

            {/* ✅ UPDATED: Address with house number from ORDERS table */}
            <p className="om-detail__address">
              {[
                sel.house_num,      // 🏠 House number (from ORDERS.house_num)
                sel.street_name,    // 🛣️ Street name
                sel.barangay,       // 📍 Barangay
                sel.landmark        // 🗺️ Optional landmark
              ]
                .filter(Boolean)    // Remove null/empty values gracefully
                .join(", ")}
            </p>

            <p className="om-detail__phone">📞 {sel.mobile_number}</p>

            {/* Order Items Section */}
            <div className="om-order-items">
              <h4 className="om-items-title">📦 Items to Prepare</h4>

              {itemsLoading ? (
                <p className="om-items-loading">Loading items...</p>
              ) : orderItems.length > 0 ? (
                <ul className="om-items-list">
                  {orderItems.map((item, idx) => (
                    <li key={item.order_item_id || idx} className="om-item-row">
                      <div className="om-item-info">
                        {item.image && <img src={item.image} alt={item.product_name} className="om-item-thumb" onError={(e) => { e.target.style.display = 'none'; }} />}
                        <div>
                          <strong className="om-item-name">{item.product_name}</strong>
                          {item.category && <span className="om-item-category">• {item.category}</span>}
                        </div>
                      </div>
                      <div className="om-item-qty">×{item.quantity}</div>
                      <div className="om-item-price">₱{item.price}</div>
                      <div className="om-item-subtotal">₱{item.subtotal}</div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="om-items-empty">No items found for this order.</p>
              )}
            </div>

            {/* Totals */}
            <div className="om-totals">
              <div className="om-totals__row"><span>Order Total</span><span>₱{sel.order_total}</span></div>
              <div className="om-totals__row"><span>Shipping</span><span>₱{sel.shipping_fee}</span></div>
              <div className="om-totals__grand"><span>Total</span><span>₱{Number(sel.order_total) + Number(sel.shipping_fee)}</span></div>
            </div>

            {/* Actions */}
            <div className="om-detail__actions">
              <Badge status={sel.status} />
              {sel.status === 'Pending' && (
                <>
                  <Btn variant="warning" onClick={() => updateStatus(sel.order_id, 'Preparing')}>Mark Preparing</Btn>
                  <Btn variant="danger" onClick={() => updateStatus(sel.order_id, 'Canceled')}>Cancel Order</Btn>
                </>
              )}
              {sel.status === 'Preparing' && (
                <Btn variant="success" onClick={() => updateStatus(sel.order_id, 'Completed')}>Mark Completed</Btn>
              )}
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

export default OrderManagerBody;