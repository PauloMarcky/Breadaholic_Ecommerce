import './Checkout.css'
import Select from 'react-select'
import axios from 'axios';
import { useState } from 'react'

export function Checkout({ onCancel, itemsToBuy, setSelectedItems }) {

  const productTotal = itemsToBuy.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const shippingFee = 50;
  const grandTotal = productTotal + shippingFee;
  const [selectedBarangay, setSelectedBarangay] = useState(null);
  const [streetInput, setStreetInput] = useState("");
  const [landmarkInput, setLandmarkInput] = useState("");



  const handleConfirmOrder = async () => {
    // Basic Validation: Don't let them order without an address
    if (!selectedBarangay || !streetInput) {
      alert("Please provide a Barangay and Street name!");
      return;
    }

    const orderData = {
      user_id: localStorage.getItem("currentUserId"),
      items: itemsToBuy, // Passed as prop from Header
      total_price: itemsToBuy.reduce((acc, item) => acc + (item.price * item.quantity), 0) + 50,
      address: {
        barangay: selectedBarangay.value,
        street: streetInput,
        landmark: landmarkInput
      }
    };

    console.log("Sending Order Data:", orderData);

    try {
      const res = await axios.post("http://127.0.0.1:5000/confirm_order", orderData);
      console.log("Server says:", res.data);
      alert("Order Placed Successfully!");
      setSelectedItems([]);
      onCancel();
    } catch (err) {
      console.error(err);
      alert("Error placing order.");
    }
  };

  const barangayOptions = [
    { value: "Calao East", label: "Calao East" },
    { value: "Calaocan", label: "Calaocan" },
    { value: "Calao West", label: "Calao West" },
    { value: "Dubinan East", label: "Dubinan East" },
    { value: "Dubinan West", label: "Dubinan West" },
    { value: "Patul", label: "Patul" },
    { value: "Plaridel", label: "Plaridel" },
    { value: "Rosario", label: "Rosario" },
    { value: "Sinsayon", label: "Sinsayon" },
    { value: "Victory Norte", label: "Victory Norte" },
    { value: "Victory Sur", label: "Victory Sur" },
    { value: "Villasis", label: "Villasis" },
  ];
  return (
    <>
      <div className="checkout-container">
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
        <div className="order-location">
          <p>Address</p>
          <div className="location">
            <Select
              classNamePrefix="checkoutSelect"
              options={barangayOptions}
              placeholder="Select Barangay"
              onChange={(option) => setSelectedBarangay(option)}
            />
            <input type="text" placeholder="Street"
              onChange={(e) => setStreetInput(e.target.value)} />
          </div>
          <p>Landmark</p>
          <div className="landmark">
            <textarea
              name="" id=""
              value={landmarkInput}
              onChange={(e) => setLandmarkInput(e.target.value)}
            ></textarea>
          </div>
        </div>
        <div className="order-pricing">
          <div className="total-shipping">
            <p>PRODUCT TOTAL: {productTotal} Pesos</p>
            <p>SHIPPING FEE: {shippingFee} Pesos</p>
          </div>
          <div className="total-price">
            <p>TOTAL {grandTotal} Pesos</p>
          </div>
        </div>
        <div className="below-btn">
          <button className="confirm" onClick={() => handleConfirmOrder()}>CONFIRM ORDER</button>
          <button className="cancel" onClick={onCancel}>CANCEL</button>
        </div>
      </div>
    </>
  )
}