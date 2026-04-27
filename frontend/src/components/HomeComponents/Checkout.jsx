import './Checkout.css'

export function Checkout({ onCancel }) {
  return (
    <>
      <div className="checkout-container">
        <div className="orders-grid">
          <div className="order-display">
            <img src="../src/assets/cart-item.jpg" alt="" />
            <div className="order-info">
              <h5>Marcky Balaba</h5>
              <h5>1T Pesos</h5>
            </div>
            <p>Qty. 1</p>
          </div>
          <div className="order-display">
            <img src="../src/assets/cart-item.jpg" alt="" />
            <div className="order-info">
              <h5>Marcky Balaba</h5>
              <h5>1T Pesos</h5>
            </div>
            <p>Qty. 1</p>
          </div>
          <div className="order-display">
            <img src="../src/assets/cart-item.jpg" alt="" />
            <div className="order-info">
              <h5>Marcky Balaba</h5>
              <h5>1T Pesos</h5>
            </div>
            <p>Qty. 1</p>
          </div>
        </div>
        <h4 className="note">NOTE: ORDER CANCELATION IS ONLY AVAILABLE WHEN ORDER IS PENDING</h4>
        <div className="order-location">
          <p>Address</p>
          <div className="location">
            <select id="cars" name="cars">
              <option value="volvo">Volvo</option>
              <option value="saab">Saab</option>
              <option value="fiat">Fiat</option>
              <option value="audi">Audi</option>
            </select>
            <input type="text" placeholder="Street" />
          </div>
          <p>Landmark</p>
          <div className="landmark">
            <textarea name="" id=""></textarea>
          </div>
        </div>
        <div className="order-pricing">
          <div className="total-shipping">
            <p>PRODUCT TOTAL: 999 Pesos</p>
            <p>SHIPPING FEE: 50 Pesos</p>
          </div>
          <div className="total-price">
            <p>TOTAL 1049 Pesos</p>
          </div>
        </div>
        <div className="below-btn">
          <button className="confirm">CONFIRM ORDER</button>
          <button className="cancel" onClick={onCancel}>CANCEL</button>
        </div>
      </div>
    </>
  )
}