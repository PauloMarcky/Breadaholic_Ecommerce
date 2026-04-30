import '../MenuComponents/Products.css'
import { ProductSidebar } from '../MenuComponents/ProductSidebar'
import { useState, useEffect } from 'react'
import axios from 'axios';
export function Products() {
  const [AllProducts, setAllProducts] = useState([]);
  const [CartItems, setCartItems] = useState([]);
  const [OpenDetails, setOpenDetails] = useState(false);
  const currentUserId = 1;

  const fetchCart = () => {
    axios.get(`http://127.0.0.1:5000/view_cart/${currentUserId}`)
      .then(res => setCartItems(res.data))
      .catch(err => console.error("Cart Fetch Error:", err));
  };

  useEffect(() => {
    axios.get("http://127.0.0.1:5000/getProducts")
      .then(res => setAllProducts(res.data))
      .catch(err => console.error("Product Error:", err));
    fetchCart();
  }, []);

  const handleAddToBasket = (productId) => {
    console.log("Button clicked for product:", productId); // CHECK YOUR CONSOLE FOR THIS

    axios.post("http://127.0.0.1:5000/add_to_cart", { // MAKE SURE THIS MATCHES PYTHON
      user_id: currentUserId,
      product_id: productId,
      quantity: 1
    })
      .then((res) => {
        console.log("Server Response:", res.data);
        fetchCart();
        alert("Added!");
      })
      .catch(err => {
        console.error("Add Error Detail:", err.response ? err.response.data : err.message);
        alert("Failed to add! Check console.");
      });
  };

  return (
    <>
      <div className={`product-detail-overlay ${OpenDetails ? 'visible' : ''}`} onClick={() => setOpenDetails(false)}></div>

      <div className="menu-right-side">
        {AllProducts.map((product) => (
          <div className="product-wrapper" key={product.product_id}>
            <img onClick={() => setOpenDetails(true)} className="product-image" src={product.image} alt="" />

            <ProductSidebar isOpen={OpenDetails} cartItems={CartItems} />

            <div className="product-details">
              <p>{product.product_name}</p>
              <p className="price">₱{product.price}</p>
            </div>
            <div className="btn-below">
              {/* Ensure this is exactly like this */}
              <button onClick={() => handleAddToBasket(product.product_id)}>
                Add to Basket
              </button>
              <input type="number" defaultValue={1} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}