import './FeatureProduct.css'
import axios from 'axios';
import { useEffect, useState } from 'react'

export function FeatureProduct() {
  const [featuredProductData, setFeaturedProductData] = useState([]);
  const [flyingItem, setFlyingItem] = useState(null); // { src, startX, startY, endX, endY }
  const [isAnimating, setIsAnimating] = useState(false);

  const currentUserId = localStorage.getItem("currentUserId");

  useEffect(() => {
    axios.get("http://127.0.0.1:5000/getFeatured")
      .then(response => setFeaturedProductData(response.data))
      .catch(error => console.log("Error Fetching: ", error));
  }, []);

  const handleAddToBasket = (productId, quantityProduct, e) => {
    if (!currentUserId) {
      alert("Please log in to add items to cart!");
      return;
    }

    const finalQty = quantityProduct && quantityProduct > 0 ? quantityProduct : 1;

    // 1. Get the product image that was clicked (go up to product-item, then find img)
    const productItem = e.target.closest('.product-item');
    const productImg = productItem.querySelector('img');
    const cartIcon = document.getElementById('cart-icon');

    if (productImg && cartIcon) {
      // 2. Get positions
      const imgRect = productImg.getBoundingClientRect();
      const cartRect = cartIcon.getBoundingClientRect();

      // 3. Trigger the flying animation
      setFlyingItem({
        src: productImg.src,
        startX: imgRect.left,
        startY: imgRect.top,
        endX: cartRect.left,
        endY: cartRect.top,
      });
      setIsAnimating(true);

      // 4. Remove the clone after animation (0.8s)
      setTimeout(() => {
        setFlyingItem(null);
        setIsAnimating(false);
      }, 800);
    }

    // 5. Make the API call as normal
    axios.post("http://127.0.0.1:5000/add_to_cart", {
      user_id: currentUserId,
      product_id: productId,
      quantity: finalQty
    })
      .then(res => console.log("Server Response:", res.data))
      .catch(err => {
        console.error("Add Error:", err.response ? err.response.data : err.message);
        alert("Failed to add item. Please try again.");
      });
  };

  return (
    <div className="section-wrap">

      {/* Flying clone — rendered at the root level so it floats above everything */}
      {flyingItem && (
        <img
          className={`flying-item ${isAnimating ? 'fly' : ''}`}
          src={flyingItem.src}
          style={{
            '--start-x': `${flyingItem.startX}px`,
            '--start-y': `${flyingItem.startY}px`,
            '--end-x': `${flyingItem.endX}px`,
            '--end-y': `${flyingItem.endY}px`,
          }}
          alt="flying"
        />
      )}

      <div className="featured-card">
        <h2 className="section-title">THE CAMPUS CRUSH PRODUCTS</h2>
        <p className="section-sub-title">CURIOUS WHY? ORDER IT NOW</p>
        <div className="products-grid">
          {featuredProductData && featuredProductData.map((product) => (
            <div className="product-item" key={product.product_id}>
              <div className="product-placeholder">
                <img src={product.image} alt={product.product_name} />
              </div>
              <div className="product-footer">
                {/* ✅ Pass the event (e) into the handler */}
                <button className="btn-add" onClick={(e) => {
                  const qtyInput = e.target.parentNode.querySelector('input');
                  handleAddToBasket(product.product_id, parseInt(qtyInput.value), e);
                }}>Add to Menu</button>
                <input className="qty-input" type="number" defaultValue="1" min="1" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}