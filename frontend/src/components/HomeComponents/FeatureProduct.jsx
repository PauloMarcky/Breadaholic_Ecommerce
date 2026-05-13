// FeatureProduct.jsx
import './FeatureProduct.css'
import axios from 'axios';
import { useEffect, useState } from 'react'

// ✅ CONFIG: Use your PC's WiFi IP for API calls
const API_BASE = 'http://192.168.1.102:5000'; // ← Change if your IP is different

export function FeatureProduct() {
  const [featuredProductData, setFeaturedProductData] = useState([]);
  const [loading, setLoading] = useState(true);   // ✅ Add loading state
  const [error, setError] = useState(null);       // ✅ Add error state
  const [flyingItem, setFlyingItem] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const currentUserId = localStorage.getItem("currentUserId");

  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  useEffect(() => {
    // ✅ Use API_BASE instead of hardcoded localhost
    axios.get(`${API_BASE}/getFeatured`)
      .then(response => {
        console.log("✅ Featured products loaded:", response.data);
        setFeaturedProductData(shuffleArray(response.data));
        setError(null);
      })
      .catch(error => {
        console.error("❌ Fetch error:", error);
        setError("Could not connect to server. Check WiFi & backend.");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleAddToBasket = (productId, quantityProduct, e) => {
    if (!currentUserId) {
      alert("Please log in to add items to cart!");
      return;
    }

    const finalQty = quantityProduct && quantityProduct > 0 ? quantityProduct : 1;
    const productItem = e.target.closest('.product-item');
    const productImg = productItem?.querySelector('img');
    const cartIcon = document.getElementById('cart-icon');

    if (productImg && cartIcon) {
      const imgRect = productImg.getBoundingClientRect();
      const cartRect = cartIcon.getBoundingClientRect();

      setFlyingItem({
        src: productImg.src,
        startX: imgRect.left,
        startY: imgRect.top,
        endX: cartRect.left,
        endY: cartRect.top,
      });
      setIsAnimating(true);

      setTimeout(() => {
        setFlyingItem(null);
        setIsAnimating(false);
      }, 800);
    }

    axios.post(`${API_BASE}/add_to_cart`, {
      user_id: currentUserId,
      product_id: productId,
      quantity: finalQty
    })
      .then(res => console.log("✅ Cart response:", res.data))
      .catch(err => {
        console.error("❌ Cart error:", err);
        alert("Failed to add item. Check connection.");
      });
  };

  // ✅ Loading state
  if (loading) {
    return (
      <div className="section-wrap">
        <p style={{ textAlign: 'center', padding: 40 }}>Loading featured products...</p>
      </div>
    );
  }

  // ✅ Error state
  if (error) {
    return (
      <div className="section-wrap">
        <p style={{ textAlign: 'center', padding: 40, color: '#dc3545' }}>
          ⚠️ {error}<br />
          <small>Make sure backend is running at {API_BASE}</small>
        </p>
      </div>
    );
  }

  // ✅ Empty state
  if (featuredProductData.length === 0) {
    return (
      <div className="section-wrap">
        <p style={{ textAlign: 'center', padding: 40 }}>
          No featured products found. <br />
          <small>Check if products have <code>featured = TRUE</code> in database</small>
        </p>
      </div>
    );
  }

  // ✅ Success: Render products
  return (
    <div className="section-wrap">
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
          {featuredProductData.map((product) => {
            const isOutOfStock = product.stock === 0;
            return (
              <div
                className={`product-card-container ${isOutOfStock ? 'is-out-of-stock' : ''}`}
                key={product.product_id}
              >
                <div className="product-item">
                  {isOutOfStock && <div className='out-stock-message'>OUT OF STOCK</div>}

                  <div className="product-placeholder">
                    <img src={product.image} alt={product.product_name} />
                  </div>

                  <div className="product-footer">
                    <button
                      className="btn-add"
                      disabled={isOutOfStock}
                      onClick={(e) => {
                        const qtyInput = e.target.parentNode.querySelector('input');
                        handleAddToBasket(product.product_id, parseInt(qtyInput?.value || 1), e);
                      }}
                    >
                      {isOutOfStock ? "Sold Out" : "Add to Menu"}
                    </button>
                    <input
                      disabled={isOutOfStock}
                      className="qty-input"
                      type="number"
                      defaultValue="1"
                      min="1"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}