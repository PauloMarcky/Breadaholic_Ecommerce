import './Checkout.css'
import axios from 'axios';
import { useState, useEffect } from 'react'

export function Checkout({ onCancel, itemsToBuy, setSelectedItems }) {
  const productTotal = itemsToBuy.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const shippingFee = 50;
  const grandTotal = productTotal + shippingFee;

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [landmarkInput, setLandmarkInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingAddresses, setIsFetchingAddresses] = useState(true);

  const userId = localStorage.getItem("currentUserId");

  useEffect(() => {
    fetchSavedAddresses();
  }, []);

  const fetchSavedAddresses = async () => {
    setIsFetchingAddresses(true);
    try {
      const res = await axios.get(`http://127.0.0.1:5000/get_user_addresses/${userId}`);
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
      alert("Please select a delivery address!");
      return;
    }

    const orderData = {
      user_id: userId,
      items: itemsToBuy,
      total_price: productTotal,
      address: {
        barangay: selectedAddress.barangay,
        street: selectedAddress.street,
        landmark: landmarkInput
      }
    };

    setIsLoading(true);
    try {
      const res = await axios.post("http://127.0.0.1:5000/confirm_order", orderData);
      console.log("Server says:", res.data);
      setSelectedItems([]);
      onCancel();
      alert("Order Placed Successfully!");
    } catch (err) {
      console.error(err);
      const serverMessage = err.response?.data?.error;
      alert(serverMessage || "Something went wrong. Please try again.");
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
              <h5>{item.price} Pesos</h5>
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

      {/* PRICING */}
      <div className="order-pricing">
        <div className="total-shipping">
          <p>PRODUCT TOTAL: {productTotal} Pesos</p>
          <p>SHIPPING FEE: {shippingFee} Pesos</p>
        </div>
        <div className="total-price">
          <p>TOTAL {grandTotal} Pesos</p>
        </div>
      </div>

      {/* BUTTONS */}
      <div className="below-btn">
        <button
          className="confirm"
          onClick={handleConfirmOrder}
          disabled={isLoading || !selectedAddress}
        >
          {isLoading ? "PLACING ORDER..." : "CONFIRM ORDER"}
        </button>
        <button className="cancel" onClick={onCancel} disabled={isLoading}>CANCEL</button>
      </div>
    </div>
  );
}