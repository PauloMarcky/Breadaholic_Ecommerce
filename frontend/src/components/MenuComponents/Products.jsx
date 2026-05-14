import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { socket, connectSocket } from '../../utils/socket.js';
import { ProductSidebar } from '../MenuComponents/ProductSidebar';
import './Products.css';

const API_BASE = 'http://192.168.1.102:5000'; // Update if your IP changes

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

  const handleProductClick = (product) => {
    if (product.stock > 0) {
      setSelectedProduct(product);
      setOpenDetails(true);
    }
  };

  const fetchCart = useCallback(() => {
    if (!currentUserId) return;
    axios.get(`${API_BASE}/view_cart/${currentUserId}`)
      .then(res => setCartItems(res.data))
      .catch(err => console.error("Cart Fetch Error:", err));
  }, [currentUserId]);

  useEffect(() => {
    axios.get(`${API_BASE}/getProducts`)
      .then(res => setAllProducts(res.data))
      .catch(err => console.error("Product Error:", err));
    fetchCart();
  }, []);

  // Socket listeners
  useEffect(() => {
    if (!currentUserId || listenersAttached.current) return;
    connectSocket(currentUserId);

    const handleStockUpdate = (data) => {
      setAllProducts(prev => prev.map(p => {
        const match = data.items?.find(i => String(i.product_id) === String(p.product_id));
        return match ? { ...p, stock: Math.max(0, match.stock) } : p;
      }));
    };

    const handleCartUpdate = () => fetchCart();

    // ✅ NEW: Sync when admin adds/updates/deletes a product
    const handleProductsUpdated = (data) => {
      console.log('📦 Product change from admin:', data);
      axios.get(`${API_BASE}/getProducts`)
        .then(res => setAllProducts(res.data))
        .catch(err => console.error("Product sync error:", err));
    };

    socket.on('stock_updated', handleStockUpdate);
    socket.on('cart_updated', handleCartUpdate);
    socket.on('products_updated', handleProductsUpdated); // ✅ Added

    listenersAttached.current = true;
    return () => {
      socket.off('stock_updated', handleStockUpdate);
      socket.off('cart_updated', handleCartUpdate);
      socket.off('products_updated', handleProductsUpdated); // ✅ Cleanup
      listenersAttached.current = false;
    };
  }, [currentUserId, fetchCart]);

  // Filter/Sort
  useEffect(() => {
    let filtered = AllProducts.filter(p => filters.category === 'All' || p.category === filters.category);
    filtered = filtered.filter(p => p.price >= filters.minPrice && p.price <= filters.maxPrice);
    if (filters.sortBy === 'alphabetically') filtered.sort((a, b) => a.product_name.localeCompare(b.product_name));
    if (filters.sortBy === 'low_to_high') filtered.sort((a, b) => a.price - b.price);
    if (filters.sortBy === 'high_to_low') filtered.sort((a, b) => b.price - a.price);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDisplayProducts(filters.sortBy === 'newest' ? [...filtered].sort(() => Math.random() - 0.5) : filtered);
  }, [AllProducts, filters]);

  const handleAddToBasket = (productId, qty, e) => {
    if (!currentUserId) return alert("Please log in!");
    const product = AllProducts.find(p => p.product_id === productId);
    if (!product || product.stock <= 0) return;

    // Animation
    try {
      const target = e.target.closest('.product-wrapper') || e.target;
      const img = target.querySelector('img');
      const cart = document.getElementById('cart-icon');
      if (img && cart) {
        const r1 = img.getBoundingClientRect(), r2 = cart.getBoundingClientRect();
        setFlyingItem({ src: img.src, sx: r1.left, sy: r1.top, ex: r2.left, ey: r2.top });
        setIsAnimating(true);
        setTimeout(() => { setFlyingItem(null); setIsAnimating(false); }, 800);
      }
    } catch (err) { console.warn("Anim error:", err); }

    axios.post(`${API_BASE}/add_to_cart`, { user_id: currentUserId, product_id: productId, quantity: qty || 1 })
      .catch(() => alert("Failed to add item"));
  };

  return (
    <>
      <div className={`product-detail-overlay ${OpenDetails ? 'visible' : ''}`} onClick={() => setOpenDetails(false)} />
      {flyingItem && (
        <img className={`flying-item ${isAnimating ? 'fly' : ''}`} src={flyingItem.src}
          style={{ '--start-x': `${flyingItem.sx}px`, '--start-y': `${flyingItem.sy}px`, '--end-x': `${flyingItem.ex}px`, '--end-y': `${flyingItem.ey}px` }} alt="flying" />
      )}
      <ProductSidebar isOpen={OpenDetails} product={selectedProduct} cartItems={CartItems} onAddToCart={handleAddToBasket} />

      <div className="menu-right-side">
        {displayProducts.map(product => {
          const isOutOfStock = product.stock <= 0;
          return (
            <div key={product.product_id} className={`product-wrapper ${isOutOfStock ? 'is-out-of-stock' : ''}`}
              style={isOutOfStock ? { opacity: 0.6, pointerEvents: 'none' } : {}}>
              {isOutOfStock && <div className='out-stock-message'>OUT OF STOCK</div>}
              <img onClick={() => handleProductClick(product)} className="product-image" src={product.image || 'https://via.placeholder.com/200'} alt={product.product_name} />
              <div className="product-details">
                <p>{product.product_name}</p>
                <p className="price-wrapper">₱{product.price}</p>
              </div>
              <div className="btn-below">
                <button disabled={isOutOfStock} onClick={(e) => {
                  const qty = parseInt(e.target.parentNode.querySelector('input').value) || 1;
                  handleAddToBasket(product.product_id, qty, e);
                }}>{isOutOfStock ? 'Unavailable' : 'Add to Basket'}</button>
                <input type="number" className="product-qty-input" value={quantities[product.product_id] || 1} min={1} max={Math.max(1, product.stock)} disabled={isOutOfStock}
                  onChange={(e) => setQuantities(prev => ({ ...prev, [product.product_id]: Math.max(1, parseInt(e.target.value) || 1) }))} />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}