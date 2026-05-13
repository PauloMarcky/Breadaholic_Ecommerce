import '../MenuComponents/Products.css';
import { ProductSidebar } from '../MenuComponents/ProductSidebar';
import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { socket, connectSocket } from '../../utils/socket.js';
import './Products.css'

export function Products({ filters }) {
  const [AllProducts, setAllProducts] = useState([]);
  const [CartItems, setCartItems] = useState([]);
  const [OpenDetails, setOpenDetails] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [flyingItem, setFlyingItem] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [displayProducts, setDisplayProducts] = useState([]);
  const [quantities, setQuantities] = useState({});

  const currentUserId = localStorage.getItem("currentUserId");
  const listenersAttached = useRef(false);

  // ✅ Restore this function
  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setOpenDetails(true);
  };

  // ✅ Memoized fetchCart
  const fetchCart = useCallback(() => {
    if (!currentUserId) return;
    axios.get(`http://192.168.1.102:5000/view_cart/${currentUserId}`)
      .then(res => setCartItems(res.data))
      .catch(err => console.error("Cart Fetch Error:", err));
  }, [currentUserId]);

  // ✅ Fetch initial products
  useEffect(() => {
    axios.get("http://192.168.1.102:5000/getProducts")
      .then(res => setAllProducts(res.data))
      .catch(err => console.error("Product Error:", err));
    fetchCart();
  }, []);

  // ✅ Socket listeners: attach ONCE, never detach on re-renders
  useEffect(() => {
    if (!currentUserId || listenersAttached.current) return;

    connectSocket(currentUserId);

    const handleStockUpdate = (data) => {

      // After updating state, add temporary class for animation
      setTimeout(() => {
        const updatedIds = data.items?.map(i => i.product_id) || [];
        updatedIds.forEach(id => {
          const el = document.querySelector(`.product-wrapper[data-product-id="${id}"]`);
          el?.classList.add('stock-updated');
          setTimeout(() => el?.classList.remove('stock-updated'), 1500);
        });
      }, 0);

      console.log('📦 STOCK UPDATE RECEIVED:', data);
      setAllProducts(prev => {
        let changed = false;
        const updated = prev.map(p => {
          const match = data.items?.find(i => String(i.product_id) === String(p.product_id));
          if (match) {
            const newStock = Math.max(0, match.stock);
            if (newStock !== p.stock) {
              changed = true;
              console.log(`🔄 Updated ${p.product_name}: ${p.stock} → ${newStock}`);
              return { ...p, stock: newStock };
            }
          }
          return p;
        });
        return changed ? updated : prev;
      });
    };

    const handleCartUpdate = () => fetchCart();

    socket.on('stock_updated', handleStockUpdate);
    socket.on('cart_updated', handleCartUpdate);
    listenersAttached.current = true;
    console.log('👂 Socket listeners attached');

    // Cleanup ONLY on unmount or userId change
    return () => {
      socket.off('stock_updated', handleStockUpdate);
      socket.off('cart_updated', handleCartUpdate);
      listenersAttached.current = false;
      console.log('🧹 Socket listeners cleaned up');
    };
  }, [currentUserId, fetchCart]);

  // ✅ Filtering/Sorting effect
  useEffect(() => {
    const filtered = AllProducts
      .filter(p => filters.category === 'All' || p.category === filters.category)
      .filter(p => p.price >= filters.minPrice && p.price <= filters.maxPrice)
      .sort((a, b) => {
        if (filters.sortBy === 'alphabetically') return a.product_name.localeCompare(b.product_name);
        if (filters.sortBy === 'low_to_high') return a.price - b.price;
        if (filters.sortBy === 'high_to_low') return b.price - a.price;
        return b.product_id - a.product_id;
      });

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDisplayProducts(filters.category === 'All' && filters.sortBy === 'newest'
      ? [...filtered].sort(() => Math.random() - 0.5)
      : filtered);
  }, [AllProducts, filters]);

  // ✅ Fallback: Listen for checkout success & refetch
  useEffect(() => {
    const refetchAfterCheckout = () => {
      console.log('🔄 Checkout completed, refetching products...');
      axios.get("http://192.168.1.102:5000/getProducts")
        .then(res => setAllProducts(res.data))
        .catch(err => console.error("Refetch Error:", err));
    };
    window.addEventListener('checkout_success', refetchAfterCheckout);
    return () => window.removeEventListener('checkout_success', refetchAfterCheckout);
  }, []);

  const handleAddToBasket = (productId, quantityProduct, e) => {
    if (!currentUserId) {
      alert("Please log in!");
      return;
    }

    const finalQty = quantityProduct > 0 ? quantityProduct : 1;

    // ✅ SAFE Flying Animation: Only run if e and required DOM methods exist
    try {
      if (e && typeof e.target?.closest === 'function') {
        const productItem = e.target.closest('.product-wrapper') ||
          e.target.closest('.product-sidebar'); // ✅ Support sidebar too
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
      }
    } catch (animErr) {
      console.warn('⚠️ Animation skipped:', animErr);
      // ✅ Continue anyway - animation is optional
    }

    // ✅ Cart API call (ALWAYS runs, regardless of animation)
    axios.post("http://192.168.1.102:5000/add_to_cart", {
      user_id: currentUserId,
      product_id: productId,
      quantity: finalQty
    })
      .then(res => {
        console.log("Server Response:", res.data);
        // Optional: trigger cart refresh via socket (already handled by backend emit)
      })
      .catch(err => {
        console.error("Add Error:", err.response?.data || err.message);
        alert("Failed to add item. Please try again.");
      });
  };
  return (
    <>
      <div className={`product-detail-overlay ${OpenDetails ? 'visible' : ''}`} onClick={() => setOpenDetails(false)} />
      {flyingItem && (
        <img className={`flying-item ${isAnimating ? 'fly' : ''}`} src={flyingItem.src} style={{ '--start-x': `${flyingItem.startX}px`, '--start-y': `${flyingItem.startY}px`, '--end-x': `${flyingItem.endX}px`, '--end-y': `${flyingItem.endY}px` }} alt="flying" />
      )}
      <ProductSidebar isOpen={OpenDetails} product={selectedProduct} cartItems={CartItems} onAddToCart={handleAddToBasket} />
      <div className="menu-right-side">
        {displayProducts.map(product => {
          const currentStock = product.stock ?? 0;
          const isOutOfStock = currentStock <= 0;

          return (
            <div
              className={`product-wrapper ${isOutOfStock ? 'is-out-of-stock' : ''}`}
              key={product.product_id}
            >
              {isOutOfStock && <div className='out-stock-message'>OUT OF STOCK</div>}

              {/* ✅ Product Image - Fixed onClick */}
              <img
                onClick={() => !isOutOfStock && handleProductClick(product)}
                className="product-image"
                src={product.image || 'https://via.placeholder.com/200'}
                alt={product.product_name}
                style={{ cursor: isOutOfStock ? 'not-allowed' : 'pointer' }}
              />

              <div className="product-details">
                <p>{product.product_name}</p>
                <p className="price-wrapper">₱{product.price}</p>
              </div>

              <div className="btn-below">
                <button
                  disabled={isOutOfStock}
                  onClick={(e) => {
                    const qty = parseInt(e.target.parentNode.querySelector('input').value) || 1;
                    handleAddToBasket(product.product_id, qty, e);
                    setQuantities(prev => ({ ...prev, [product.product_id]: 1 }));
                  }}
                >
                  {isOutOfStock ? 'Unavailable' : 'Add to Basket'}
                </button>
                <input
                  type="number"
                  className="product-qty-input"
                  value={quantities[product.product_id] || 1}
                  min={1}
                  max={Math.max(1, currentStock)}
                  disabled={isOutOfStock}
                  onChange={(e) => setQuantities(prev => ({
                    ...prev,
                    [product.product_id]: Math.min(Math.max(parseInt(e.target.value) || 1, 1), Math.max(1, currentStock))
                  }))}
                />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}