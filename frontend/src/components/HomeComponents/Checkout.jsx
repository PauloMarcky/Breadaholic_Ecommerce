import './Checkout.css'
import axios from 'axios';
import { useState, useEffect } from 'react'

const API_BASE = 'http://192.168.1.100:5000'; // ✅ Centralized API base

export function Checkout({ onCancel, itemsToBuy, setSelectedItems, setToastMessage }) {
  const productTotal = itemsToBuy.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  // ✅ NEW: Dynamic shipping fee state
  const [shippingFee, setShippingFee] = useState(50);
  const [feeLoading, setFeeLoading] = useState(false);

  const grandTotal = productTotal + shippingFee; // ✅ Auto-updates when shippingFee changes

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [landmarkInput, setLandmarkInput] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingAddresses, setIsFetchingAddresses] = useState(true);

  const userId = localStorage.getItem("currentUserId");

  // ✅ Fetch saved addresses on mount
  useEffect(() => {
    fetchSavedAddresses();
  }, []);

  // ✅ NEW: Fetch dynamic shipping fee when barangay changes
  useEffect(() => {
    const fetchShippingFee = async () => {
      if (!selectedAddress?.barangay) {
        setShippingFee(50);
        return;
      }

      setFeeLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/shipping_fee/${encodeURIComponent(selectedAddress.barangay)}`);
        setShippingFee(res.data.fee);
      } catch (err) {
        console.warn("Failed to fetch shipping fee, using default ₱50");
        setShippingFee(50);
      } finally {
        setFeeLoading(false);
      }
    };

    fetchShippingFee();
  }, [selectedAddress?.barangay]); // 🔁 Re-run when barangay changes

  const fetchSavedAddresses = async () => {
    setIsFetchingAddresses(true);
    try {
      const res = await axios.get(`${API_BASE}/get_user_addresses/${userId}`);
      setSavedAddresses(res.data);

      if (res.data.length > 0) {
        setSelectedAddress(res.data[0]);
        setLandmarkInput(res.data[0].landmark || "");
      }
    } catch (err) {
      console.error("Error fetching addresses:", err);
    } finally {
      setIsFetchingAddresses(false);
    }
  };

  const handleAddressSelect = (addr) => {
    setSelectedAddress(addr);
    setLandmarkInput(addr.landmark || "");
  };

  const handleConfirmOrder = async () => {
    if (!selectedAddress) {
      setMessage({ text: "Please select a delivery address!", type: "error" });
      return;
    }

    // ✅ Frontend sends total for display; backend recalculates shipping_fee securely
    const orderData = {
      user_id: userId,
      items: itemsToBuy,
      total_price: grandTotal, // ✅ Now includes dynamic shipping
      address: {
        barangay: selectedAddress.barangay,
        street: selectedAddress.street,
        landmark: landmarkInput
      }
    };

    setIsLoading(true);
    setMessage({ text: "", type: "" });
    try {
      const res = await axios.post(`${API_BASE}/confirm_order`, orderData);
      console.log("Server says:", res.data);
      setSelectedItems([]);
      setToastMessage({ text: res.data.message, type: "success" });

      // ✅ TRIGGER GUARANTEED REFRESH
      window.dispatchEvent(new Event('checkout_success'));

      setTimeout(() => setToastMessage({ text: "", type: "" }), 3000);
      onCancel();
    } catch (err) {
      console.error(err);
      const serverMessage = err.response?.data?.error;
      setMessage({ text: serverMessage || "Something went wrong. Please try again.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="checkout-container">
      {/* ORDER ITEMS */}
      <div className="orders-grid">
        {itemsToBuy.map((item) => (
          <div className="order-display" key={item.ordItem_id}>
            <img src={item.image || "../src/assets/cart-item.jpg"} alt={item.product_name} />
            <div className="order-info">
              <h5>{item.product_name}</h5>
              <h5>₱{item.price}</h5>
            </div>
            <p>Qty. {item.quantity}</p>
          </div>
        ))}
      </div>

      <h4 className="note">NOTE: ORDER CANCELATION IS ONLY AVAILABLE WHEN ORDER IS PENDING</h4>

      {/* ADDRESS SECTION */}
      <div className="order-location">
        {isFetchingAddresses ? (
          <p className="loading-text">Loading addresses...</p>
        ) : savedAddresses.length > 0 ? (
          <div className="address-list">
            {savedAddresses.map((addr) => (
              <div
                key={addr.id}
                className={`address-option ${selectedAddress?.id === addr.id ? 'selected' : ''}`}
                onClick={() => handleAddressSelect(addr)}
              >
                <input
                  type="radio"
                  name="deliveryAddress"
                  checked={selectedAddress?.id === addr.id}
                  onChange={() => handleAddressSelect(addr)}
                />
                <div className="address-info">
                  <span className="address-label">Address {addr.position}</span>
                  <p className="address-line">{addr.barangay}, {addr.street}</p>
                  {addr.landmark && <p className="address-landmark">📍 {addr.landmark}</p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-address-box">
            <p>⚠ No saved addresses found</p>
            <small>Please add an address in your Profile first.</small>
          </div>
        )}

        <div className="landmark-section">
          <label>Landmark <span className="optional-label">(optional)</span></label>
          <textarea
            value={landmarkInput}
            onChange={(e) => setLandmarkInput(e.target.value)}
            placeholder="e.g. Near the 7-Eleven, Blue gate"
            disabled={isLoading || !selectedAddress}
          ></textarea>
        </div>
      </div>

      {/* ✅ UPDATED PRICING SECTION */}
      <div className="order-pricing">
        <div className="total-shipping">
          <p>PRODUCT TOTAL: ₱{productTotal.toFixed(2)}</p>
          <p>
            SHIPPING FEE ({selectedAddress?.barangay || 'Select area'}):
            {feeLoading ? (
              <span className="loading-fee"> Calculating...</span>
            ) : (
              <span> ₱{shippingFee.toFixed(2)}</span>
            )}
          </p>
        </div>
        <div className="total-price">
          <p>TOTAL: ₱{grandTotal.toFixed(2)}</p>
        </div>
      </div>

      {/* ERROR MESSAGE ONLY — success is handled by toast in Header */}
      {message.text && (
        <div className={`order-message ${message.type}`}>
          <p>{message.text}</p>
        </div>
      )}

      {/* BUTTONS */}
      <div className="below-btn">
        <button
          className="confirm"
          onClick={handleConfirmOrder}
          disabled={isLoading || !selectedAddress || feeLoading}
        >
          {isLoading ? "PLACING ORDER..." : `CONFIRM ORDER • ₱${grandTotal.toFixed(2)}`}
        </button>
        <button className="cancel" onClick={onCancel} disabled={isLoading}>CANCEL</button>
      </div>
    </div>
  );
}