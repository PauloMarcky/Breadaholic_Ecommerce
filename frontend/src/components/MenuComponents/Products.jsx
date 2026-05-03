import '../MenuComponents/Products.css';
import { ProductSidebar } from '../MenuComponents/ProductSidebar';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { socket, connectSocket } from '../../utils/socket.js';

export function Products({ filters }) {
  const [AllProducts, setAllProducts] = useState([]);
  const [CartItems, setCartItems] = useState([]);
  const [OpenDetails, setOpenDetails] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [flyingItem, setFlyingItem] = useState(null); // { src, startX, startY, endX, endY }
  const [isAnimating, setIsAnimating] = useState(false);

  const currentUserId = localStorage.getItem("currentUserId");

  const fetchCart = () => {
    if (!currentUserId) return;

    axios.get(`http://127.0.0.1:5000/view_cart/${currentUserId}`)
      .then(res => setCartItems(res.data))
      .catch(err => console.error("Cart Fetch Error:", err));
  };

  useEffect(() => {
    // Fetch products
    axios.get("http://127.0.0.1:5000/getProducts")
      .then(res => setAllProducts(res.data))
      .catch(err => console.error("Product Error:", err));

    // Fetch cart
    fetchCart();

    if (currentUserId) {
      connectSocket(currentUserId);

      socket.on('cart_updated', (data) => {
        console.log('Real-time cart update:', data);
        fetchCart(); // Auto-refresh cart
      });
    }

    return () => {
      socket.off('cart_updated');
    };
  }, [currentUserId]);

  // ✅ Accept 'e' as a third parameter
  const handleAddToBasket = (productId, quantityProduct, e) => {
    if (!currentUserId) {
      alert("Please log in to add items to cart!");
      return;
    }

    const finalQty = quantityProduct && quantityProduct > 0 ? quantityProduct : 1;

    // ✅ Fly animation is now INSIDE the function
    const productItem = e.target.closest('.product-wrapper');
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
        console.error("Add Error:", err.response ? err.response.data : err.message);
        alert("Failed to add item. Please try again.");
      });
  };

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setOpenDetails(true);
  };

  const filteredProducts = AllProducts
    .filter(p => filters.category === 'All' || p.category === filters.category)
    .filter(p => p.price >= filters.minPrice && p.price <= filters.maxPrice)
    .sort((a, b) => {
      if (filters.sortBy === 'alphabetically') return a.product_name.localeCompare(b.product_name);
      if (filters.sortBy === 'low_to_high') return a.price - b.price;
      if (filters.sortBy === 'high_to_low') return b.price - a.price;
      return b.product_id - a.product_id;
    });


  return (
    <>
      <div className={`product-detail-overlay ${OpenDetails ? 'visible' : ''}`}
        onClick={() => setOpenDetails(false)} />

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

      <ProductSidebar
        isOpen={OpenDetails}
        product={selectedProduct}
        cartItems={CartItems}
        onAddToCart={handleAddToBasket}
      />

      <div className="menu-right-side">
        {filteredProducts.map((product) => (
          <div className="product-wrapper" key={product.product_id}>
            <img
              onClick={() => handleProductClick(product)}
              className="product-image"
              src={product.image}
              alt={product.product_name}
            />
            <div className="product-details">
              <p>{product.product_name}</p>
              <p className="price-wrapper">₱{product.price}</p>
            </div>
            <div className="btn-below">
              <button onClick={(e) => {
                const qtyInput = e.target.parentNode.querySelector('input');
                handleAddToBasket(product.product_id, parseInt(qtyInput.value), e);
              }}>
                Add to Basket
              </button>
              <input type="number" className="product-qty-input" defaultValue={1} min={1} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}