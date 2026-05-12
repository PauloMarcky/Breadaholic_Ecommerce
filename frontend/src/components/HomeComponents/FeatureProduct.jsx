import './FeatureProduct.css'
import axios from 'axios';
import { useEffect, useState } from 'react'

export function FeatureProduct() {
  const [featuredProductData, setFeaturedProductData] = useState([]);
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
    axios.get("http://127.0.0.1:5000/getFeatured")
      .then(response => setFeaturedProductData(shuffleArray(response.data)))
      .catch(error => console.log("Error Fetching: ", error));
  }, []);

  const handleAddToBasket = (productId, quantityProduct, e) => {
    if (!currentUserId) {
      alert("Please log in to add items to cart!");
      return;
    }

    const finalQty = quantityProduct && quantityProduct > 0 ? quantityProduct : 1;
    // Look for product-item specifically
    const productItem = e.target.closest('.product-item');
    const productImg = productItem.querySelector('img');
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

    axios.post("http://127.0.0.1:5000/add_to_cart", {
      user_id: currentUserId,
      product_id: productId,
      quantity: finalQty
    })
      .then(res => console.log("Server Response:", res.data))
      .catch(err => {
        console.error("Add Error:", err);
        alert("Failed to add item.");
      });
  };

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
          {featuredProductData && featuredProductData.map((product) => {
            const isOutOfStock = product.stock === 0;
            return (
              <div
                className={`product-card-container ${isOutOfStock ? 'is-out-of-stock' : ''}`}
                key={product.product_id}
              >
                {/* The card itself */}
                <div className="product-item">
                  {/* Stock Message Overlay */}
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
                        handleAddToBasket(product.product_id, parseInt(qtyInput.value), e);
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