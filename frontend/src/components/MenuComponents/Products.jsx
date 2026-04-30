import '../MenuComponents/Products.css';
import { ProductSidebar } from '../MenuComponents/ProductSidebar';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { socket, connectSocket } from '../../utils/socket.js';

export function Products() {
  const [AllProducts, setAllProducts] = useState([]);
  const [CartItems, setCartItems] = useState([]);
  const [OpenDetails, setOpenDetails] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

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

    // Connect to WebSocket if user is logged in
    if (currentUserId) {
      connectSocket(currentUserId);

      // Listen for cart updates
      socket.on('cart_updated', (data) => {
        console.log('🔔 Real-time cart update:', data);
        fetchCart(); // Auto-refresh cart
      });
    }

    // Cleanup
    return () => {
      socket.off('cart_updated');
    };
  }, [currentUserId]);

  const handleAddToBasket = (productId, quantityProduct) => {
    if (!currentUserId) {
      alert("Please log in to add items to cart!");
      return;
    }

    const finalQty = quantityProduct && quantityProduct > 0 ? quantityProduct : 1;

    console.log(`Adding product: ${productId} with quantity: ${finalQty}`);

    axios.post("http://127.0.0.1:5000/add_to_cart", {
      user_id: currentUserId,
      product_id: productId,
      quantity: finalQty
    })
      .then((res) => {
        console.log("Server Response:", res.data);
      })
      .catch(err => {
        console.error("Add Error:", err.response ? err.response.data : err.message);
        alert("Failed to add item. Please try again.");
      });
  };

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setOpenDetails(true);
  };

  return (
    <>


      <div className={`product-detail-overlay ${OpenDetails ? 'visible' : ''}`} onClick={() => setOpenDetails(false)}></div>

      <div className="menu-right-side">
        {AllProducts.map((product) => (
          <div className="product-wrapper" key={product.product_id}>
            <img
              onClick={() => handleProductClick(product)}
              className="product-image"
              src={product.image}
              alt={product.product_name}
            />

            {selectedProduct && (
              <ProductSidebar
                isOpen={OpenDetails}
                cartItems={CartItems}
                product={selectedProduct}
              />
            )}

            <div className="product-details">
              <p>{product.product_name}</p>
              <p className="price">₱{product.price}</p>
            </div>

            <div className="btn-below">
              <button onClick={(e) => {
                // We look for the input element next to this button
                const qtyInput = e.target.parentNode.querySelector('input');
                handleAddToBasket(product.product_id, parseInt(qtyInput.value));
              }}>
                Add to Basket
              </button>

              {/* Add a className so it's easy to find, and ensure it has a value */}
              <input
                type="number"
                className="product-qty-input"
                defaultValue={1}
                min={1}
              />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}