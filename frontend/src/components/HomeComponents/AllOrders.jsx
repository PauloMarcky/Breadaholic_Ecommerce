// AllOrders.jsx
import './AllOrders.css';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { socket, connectSocket } from '../../utils/socket.js';

export function AllOrders({ onCancel }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState({ text: "", type: "" });

  const currentUserId = localStorage.getItem("currentUserId");
  const listenersAttached = useRef(false);

  // ✅ Auto-dismiss toast
  useEffect(() => {
    if (toastMessage.text) {
      const timer = setTimeout(() => setToastMessage({ text: "", type: "" }), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage.text]);

  // ✅ Fetch user orders
  const fetchUserOrders = async () => {
    try {
      const res = await axios.get(`http://192.168.1.100:5000/getOrders`);
      const userOrders = res.data.filter(
        order => String(order.user_id) === String(currentUserId)
      );
      setOrders(userOrders);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    }
  };

  // ✅ Initial fetch
  useEffect(() => {
    if (currentUserId) {
      fetchUserOrders();
      setLoading(false);
    }
  }, [currentUserId]);

  // ✅ NEW: Socket listener for real-time order status updates
  useEffect(() => {
    if (!currentUserId || listenersAttached.current) return;

    console.log('🔌 Customer: Setting up order status listener for user', currentUserId);
    connectSocket(currentUserId); // Ensures user is in user_{uid} room

    const handleMyOrderStatusUpdated = (data) => {
      console.log('🔄 Received order status update:', data);

      // Update the specific order in state
      setOrders(prev => prev.map(order =>
        order.order_id === data.order_id
          ? { ...order, status: data.new_status, updated_at: data.updated_at }
          : order
      ));

      // Show toast notification
      setToastMessage({
        text: ` ${data.message || `Order #${data.order_id} is now ${data.new_status}`}`,
        type: 'success'
      });
    };

    socket.on('my_order_status_updated', handleMyOrderStatusUpdated);
    listenersAttached.current = true;

    // Cleanup on unmount
    return () => {
      socket.off('my_order_status_updated', handleMyOrderStatusUpdated);
      listenersAttached.current = false;
      console.log('🔌 Customer: Cleaned up order status listener');
    };
  }, [currentUserId]);

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Cancel this order?")) return;

    try {
      const response = await axios.post("http://192.168.1.100:5000/cancel_order", {
        order_id: orderId,
        user_id: currentUserId
      });

      setToastMessage({
        text: response.data.message || "Order cancelled successfully! ",
        type: "success"
      });

      await fetchUserOrders();
    } catch (err) {
      console.error("Cancel failed:", err);
      const errorMsg = err.response?.data?.error || "Failed to cancel order";
      setToastMessage({ text: `❌ ${errorMsg}`, type: "error" });
    }
  };

  return (
    <>
      {toastMessage.text && (
        <div className={`order-toast ${toastMessage.type}`}>
          <p>{toastMessage.text}</p>
          <button className="toast-close" onClick={() => setToastMessage({ text: "", type: "" })}>
            &times;
          </button>
        </div>
      )}

      <div className="all-order-container">
        <div className="all-order-header">
          <h2>MY ORDERS</h2>
          <img src="../public/hide-button.png" alt="Close" onClick={onCancel} style={{ cursor: 'pointer' }} />
        </div>

        <div className="all-orders-wrapper">
          {loading ? (
            <p>Loading your orders...</p>
          ) : orders.length > 0 ? (
            orders.map((order) => (
              <div className="orders" key={order.order_id}>
                <p className={`all-order-status ${order.status?.toLowerCase() || 'pending'}`}>
                  {(order.status || 'Pending').toUpperCase()}
                </p>

                <div className="order-id">
                  <h3>#{String(order.order_id).padStart(3, '0')}</h3>
                </div>

                <div className="all-order-info">
                  <h4>{order.first_name} {order.last_name}</h4>
                  <h4>{order.street_name}, {order.barangay}</h4>
                  <h4>{order.mobile_number}</h4>
                </div>

                <div className="all-order-price">
                  <div className="fees">
                    <h4>ORDER TOTAL: ₱{order.order_total}</h4>
                    <h4>SHIPPING FEE: ₱{order.shipping_fee}</h4>
                    <h5>TOTAL: ₱{Number(order.order_total) + Number(order.shipping_fee)}</h5>
                  </div>
                </div>

                <div className="cancel-btn-ord">
                  {order.status === 'Pending' && (
                    <button className="cancel-order-btn" onClick={() => handleCancelOrder(order.order_id)}>
                      CANCEL ORDER
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="empty-orders">
              <p>You haven't placed any orders yet.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}