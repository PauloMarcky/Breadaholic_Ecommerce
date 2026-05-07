import './AllOrders.css';
import { useState, useEffect } from 'react';
import axios from 'axios';

export function AllOrders({ onCancel }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Get the current user ID
  const currentUserId = localStorage.getItem("currentUserId");

  useEffect(() => {
    const fetchUserOrders = async () => {
      try {
        // Note: I'm using the endpoint we discussed. 
        // If your backend specifically filters by user, ensure the URL matches.
        const res = await axios.get(`http://127.0.0.1:5000/getOrders`);

        // Since getOrders returns ALL orders (admin style), 
        // we filter them here to only show the ones belonging to this user.
        const userSpecificOrders = res.data.filter(
          order => String(order.user_id) === String(currentUserId)
        );

        setOrders(userSpecificOrders);
      } catch (err) {
        console.error("Failed to fetch orders:", err);
      } finally {
        setLoading(false);
      }
    };

    if (currentUserId) {
      fetchUserOrders();
    }
  }, [currentUserId]);

  return (
    <>
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
                {/* Dynamic Status */}
                <p className={`all-order-status ${order.status.toLowerCase()}`}>
                  {order.status.toUpperCase()}
                </p>

                <div className="order-id">
                  <h3>#{String(order.order_id).padStart(3, '0')}</h3>
                </div>

                <div className="all-order-info">
                  {/* Joining names from the JOIN query */}
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

                <div className="cancel-btn">
                  {order.status === 'Pending' && (
                    <button onClick={() => console.log("Cancel order:", order.order_id)}>
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