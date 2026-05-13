import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './OrderManagerBody.css';

const PageHeader = ({ title }) => (
  <div className="om-page-header">
    <h1>{title}</h1>
  </div>
);

const StatCard = ({ label, value, sub, color }) => (
  <div className="om-stat-card">
    <p className="om-stat-label">{label}</p>
    <p className="om-stat-value" style={color ? { color } : {}}>
      {value}
    </p>
    <span className="om-stat-sub">{sub}</span>
  </div>
);

const Btn = ({ children, onClick, variant = 'primary' }) => (
  <button onClick={onClick} className={`om-btn om-btn-${variant}`}>
    {children}
  </button>
);

const Badge = ({ status }) => (
  <span className={`om-badge om-badge-${status?.toLowerCase()}`}>
    {status}
  </span>
);

function OrderManagerBody() {
  const [orders, setOrders] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  // FETCH ALL ORDERS (ADMIN VIEW)
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.get("http://192.168.1.102:5000/getOrders");
        setOrders(res.data);
      } catch (err) {
        console.error("Failed to fetch orders:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // UPDATE ORDER STATUS (YOU NEED BACKEND ROUTE)
  const updateStatus = async (orderId, status) => {
    try {
      await axios.put(`http://192.168.1.102:5000/updateOrderStatus/${orderId}`, {
        status,
      });

      setOrders(prev =>
        prev.map(o =>
          o.order_id === orderId ? { ...o, status } : o
        )
      );

      if (selected?.order_id === orderId) {
        setSelected(prev => ({ ...prev, status }));
      }
    } catch (err) {
      console.error("Failed to update order:", err);
    }
  };

  // DELETE ORDER (OPTIONAL ADMIN ACTION)
  const deleteOrder = async (orderId) => {
    try {
      await axios.delete(`http://192.168.1.102:5000/deleteOrder/${orderId}`);
      setOrders(prev => prev.filter(o => o.order_id !== orderId));
      if (selected?.order_id === orderId) setSelected(null);
    } catch (err) {
      console.error("Failed to delete order:", err);
    }
  };

  // STATS
  const pending = orders.filter(o => o.status === "Pending").length;
  const preparing = orders.filter(o => o.status === "Preparing").length;
  const completed = orders.filter(o => o.status === "Completed").length;

  const sel = orders.find(o => o.order_id === selected?.order_id);

  return (
    <div className="order-layout">
      <div className="order-list">
        <PageHeader title="Order Management" />

        <div className="order-stats">
          <StatCard label="Pending" value={pending} sub="Awaiting action" color="#856404" />
          <StatCard label="Preparing" value={preparing} sub="In kitchen" color="#004085" />
          <StatCard label="Completed" value={completed} sub="Fulfilled" color="#155724" />
        </div>

        <div className="table-wrapper">
          <div className="table-header">
            <h3>All Orders</h3>
          </div>

          {loading ? (
            <p style={{ padding: 20 }}>Loading orders...</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {orders.map(order => (
                  <tr key={order.order_id}>
                    <td># {order.order_id}</td>

                    <td>
                      {order.first_name} {order.last_name}
                    </td>

                    <td>
                      ₱{Number(order.order_total) + Number(order.shipping_fee)}
                    </td>

                    <td>
                      <Badge status={order.status} />
                    </td>

                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Btn onClick={() => setSelected(order)}>View</Btn>

                        <button
                          onClick={() => deleteOrder(order.order_id)}
                          className="action-btn delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* DETAIL PANEL */}
      <aside className="detail-panel">
        {!sel ? (
          <div className="detail-empty">
            <p>Select an order to view details</p>
          </div>
        ) : (
          <>
            <div className="detail-header">
              <h3>Order Detail</h3>
              <button onClick={() => setSelected(null)}>✕</button>
            </div>

            <div className="order-id-box">#{sel.order_id}</div>

            <p>
              {sel.first_name} {sel.last_name}
            </p>

            <p>{sel.street_name}, {sel.barangay}</p>
            <p>{sel.mobile_number}</p>

            <div className="totals-card">
              <div className="total-row">
                <span>Order Total</span>
                <span>₱{sel.order_total}</span>
              </div>

              <div className="total-row">
                <span>Shipping</span>
                <span>₱{sel.shipping_fee}</span>
              </div>

              <div className="grand-total">
                <span>Total</span>
                <span>
                  ₱{Number(sel.order_total) + Number(sel.shipping_fee)}
                </span>
              </div>
            </div>

            <div className="action-buttons">
              <Badge status={sel.status} />

              {sel.status === "Pending" && (
                <Btn
                  variant="warning"
                  onClick={() => updateStatus(sel.order_id, "Preparing")}
                >
                  Mark Preparing
                </Btn>
              )}

              {sel.status !== "Completed" && (
                <Btn
                  variant="success"
                  onClick={() => updateStatus(sel.order_id, "Completed")}
                >
                  Mark Completed
                </Btn>
              )}

              {sel.status !== "Canceled" && (
                <Btn
                  variant="danger"
                  onClick={() => updateStatus(sel.order_id, "Canceled")}
                >
                  Cancel Order
                </Btn>
              )}
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

export default OrderManagerBody;