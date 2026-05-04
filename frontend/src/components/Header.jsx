import "./Header.css";
import { useState, useEffect, useRef } from "react";
import axios from 'axios';
import { Checkout } from "./HomeComponents/Checkout";
import { AllOrders } from "./HomeComponents/AllOrders";
import { useNavigate, NavLink } from 'react-router-dom';
import { socket, connectSocket, disconnectSocket } from '../utils/socket';


export function Header() {
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const [proceedCheckout, setProceedCheckout] = useState(false);
  const [viewAllOrders, setViewAllOrders] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const fileInputRef = useRef(null);
  const [isConfirmed, setIsConfirmed] = useState(false)

  const currentUserId = localStorage.getItem("currentUserId");

  // --- Handlers ---
  const handleCheckout = () => setProceedCheckout(!proceedCheckout);
  const handleViewingOrders = () => setViewAllOrders(!viewAllOrders);
  const openCartSideBar = () => setIsCartOpen(!isCartOpen);
  const openSidebar = () => setIsProfileOpen(!isProfileOpen);
  const handleConfirmation = () => setIsConfirmed(!isConfirmed);

  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("user_id", currentUserId);

    try {
      const res = await axios.post("http://127.0.0.1:5000/upload_pfp", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUserData((prev) => ({ ...prev, profile_picture: `${res.data.profile_picture}?t=${Date.now()}` }));
    } catch (err) {
      console.error("Upload failed:", err);
    }
  };

  const handleLogout = () => {
    disconnectSocket(currentUserId);
    localStorage.clear();
    setUserData(null);
    navigate("/");
  };

  const toggleItemSelection = (itemId) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  useEffect(() => {
    const shouldLock = isCartOpen || isProfileOpen || viewAllOrders || proceedCheckout;
    document.body.style.overflow = shouldLock ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isCartOpen, isProfileOpen, viewAllOrders, proceedCheckout]);

  // --- Fetch Cart Function ---
  const fetchCart = async () => {
    try {
      if (!currentUserId) return;
      const response = await axios.get(`http://127.0.0.1:5000/view_cart/${currentUserId}`);
      setCartItems(response.data);
    } catch (error) {
      console.error("Error fetching cart:", error);
    }
  };

  useEffect(() => {
    // Only proceed if we have a user
    if (!currentUserId) return;

    // 1. Define an async function to handle initial data loading
    const loadInitialData = async () => {
      try {
        // Fetch User Profile
        const userRes = await axios.get(`http://127.0.0.1:5000/getUser/${currentUserId}`);
        setUserData(userRes.data);

        // Fetch Cart Items
        await fetchCart();

        // Connect to WebSocket
        connectSocket(currentUserId);
      } catch (err) {
        console.error("Initialization error:", err);
      }
    };

    loadInitialData();

    // 2. Define the socket callback separately for easy cleanup
    const handleCartUpdate = (data) => {
      console.log('Cart updated via Socket:', data);
      fetchCart();
    };

    socket.on('cart_updated', handleCartUpdate);

    // 3. CLEANUP FUNCTION (This stops the error and prevents memory leaks)
    return () => {
      socket.off('cart_updated', handleCartUpdate);
      // If your connectSocket has a disconnect logic, put it here too
    };
  }, [currentUserId]); // Added currentUserId as a dependency

  const handleQuantityChange = async (productId, type) => {
    const endpoint = type === "add" ? "/add_to_cart" : "/reduce_quantity";

    try {
      await axios.post(`http://127.0.0.1:5000${endpoint}`, {
        user_id: currentUserId,
        product_id: productId,
        quantity: 1
      });

    } catch (err) {
      console.error("Failed to update quantity:", err);
    }
  };

  const handleRemoveItem = async (ordItemId) => {
    try {
      await axios.post("http://127.0.0.1:5000/remove_from_cart", {
        user_id: currentUserId,
        ordItem_id: ordItemId
      });
      // The socket listener handles the refresh automatically!
    } catch (err) {
      console.error("Remove Error:", err);
    }
  };

  return (
    <>

      <header className="nav-wrapper">
        <nav>
          <div className="logo-header-container">
            <img src="./public/business-logo.png" alt="Logo" />
          </div>

          <div className="nav-link-container">
            <NavLink to="/home" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Home</NavLink>
            <NavLink to="/menu" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Menu</NavLink>
            <NavLink to="/contacts" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Talk to us</NavLink>
            <NavLink to="/locations" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Locations</NavLink>
          </div>

          <div className="nav-right-side">
            <div className="searching-container">
              <input type="text" placeholder="Search" />
              <button className="search-button"><img src="./public/search-icon.png" alt="" /></button>
            </div>

            {/* Basket Trigger */}
            <div className="menu" onClick={openCartSideBar}>
              <div className="total-cart-item">{cartItems.length}</div>
              <button className="menu-button" id="cart-icon"><img src="./public/cart-icon.png" alt="" /></button>
              <p>Basket</p>
            </div>

            {/* --- CART SIDEBAR --- */}
            <div className={`sidebar-overlay ${isCartOpen && 'visible'}`} onClick={openCartSideBar}></div>
            <div className={`cart-container ${isCartOpen ? 'active' : ''}`}>
              <div className="title-exit-btn">
                <h2>BASKET ITEMS</h2>
                <button onClick={openCartSideBar}><img src="../public/hide-button.png" alt="" /></button>
              </div>

              <div className="items-container">
                {cartItems.length > 0 ? (
                  cartItems.map((item, index) => (
                    <div className="items" key={item.ordItem_id || index}>
                      <input
                        className="checkbox"
                        type="checkbox"
                        checked={selectedItems.includes(item.ordItem_id)}
                        onChange={() => toggleItemSelection(item.ordItem_id)}
                      />
                      <div className="item-display">
                        <img src={item.image} alt={item.product_name} />
                        <div className="item-infos">
                          <h5>{item.product_name}</h5>
                          <p>Stocks: {item.stock}</p>
                          <h4>{item.price} Pesos</h4>
                        </div>

                        <button
                          className="btn-adding"
                          onClick={() => handleQuantityChange(item.product_id, 'add')}
                          disabled={item.quantity >= item.stock}
                        >
                          +
                        </button>

                        <input type="number" min="1" max={item.stock} value={item.quantity} readOnly />

                        <button
                          className="btn-deducting"
                          onClick={() => handleQuantityChange(item.product_id, 'reduce')}
                          disabled={item.quantity <= 1}
                        >
                          -
                        </button>
                      </div>
                      <button onClick={() => handleRemoveItem(item.ordItem_id)} className="remove-btn">
                        <img src="../public/remove.png" alt="" />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="empty-cart-msg">Your basket is empty <br /> ORDER NOW</p>
                )}
              </div>

              <div className="buttons-place">
                <button className="checkout" onClick={handleCheckout} disabled={selectedItems.length === 0}
                >CHECKOUT ({selectedItems.length})</button>
                <div className={`sidebar-overlay ${proceedCheckout && 'visible'}`}></div>
                {proceedCheckout && <Checkout onCancel={handleCheckout}
                  itemsToBuy={cartItems.filter(item => selectedItems.includes(item.ordItem_id))}
                  setSelectedItems={setSelectedItems}
                />}

                <button className="view" onClick={handleViewingOrders}>VIEW ALL ORDERS</button>
                {viewAllOrders && <AllOrders onCancel={handleViewingOrders} />}
              </div>
            </div>

            {/* --- PROFILE SIDEBAR --- */}
            <div className="profile" onClick={openSidebar}>
              <button className="profile-button"><img src="./public/profile-icon.png" alt="" /></button>
              <p>Profile</p>
            </div>

            <div className={`sidebar-overlay ${isProfileOpen && 'visible'}`} onClick={openSidebar}></div>
            <div className={`profile-detail-container ${isProfileOpen ? 'active' : ''}`}>
              <div className="header-profile">
                <h2>Profile</h2>
                <button className="hide-profile-btn" onClick={openSidebar}><img src="./public/hide-button.png" alt="" /></button>
              </div>
              <div className="profile-image-container">
                <img
                  className="profile-img"
                  src={userData?.profile_picture ? `${userData.profile_picture.split('?')[0]}?t=${userData.profile_picture.split('?')[1] || 'init'}` : "/default-pfp.png"}
                  alt=""
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleProfilePictureUpload}
                />
                <button onClick={() => fileInputRef.current.click()}>
                  <img className="add-icon" src="./public/add-icon.png" alt="" />
                </button>
                <p>{userData ? `@${userData.first_name} ${userData.last_name}` : "Guest"}</p>
              </div>
              <p className="personal-info-text">PERSONAL INFORMATION</p>
              <ul className="profile-infos">
                <li><img className="info-img-container" src="./public/phone-number.png" alt="" /><p>{userData?.mobile_number || "N/A"}</p></li>
                <li><img className="info-img-container" src="./public/address.png" alt="" /><p>{userData ? `${userData.barangay} ${userData.street_name}` : "N/A"}</p></li>
                <li><img className="info-img-container" src="./public/date-joined.png" alt="" /><p>{userData?.date_joined ? new Date(userData.date_joined).toLocaleDateString() : "N/A"}</p></li>
              </ul>
              <div className={`confirmation-overlay ${isConfirmed && 'visible'}`} ></div>
              {isConfirmed &&
                <div className="confirmation">
                  <p>Are you sure you want to LOG OUT?</p>
                  <div className="confirm-btns">
                    <button className="proceed" onClick={handleLogout}>CONFIRM</button>
                    <button className="cancel-log" onClick={handleConfirmation}>CANCEL</button>
                  </div>
                </div>
              }
              <button className="logout-btn" onClick={handleConfirmation}>LOG OUT <img src="./public/logout-icon.png" alt="" /></button>
            </div>
          </div>
        </nav>
      </header >
    </>
  );
}