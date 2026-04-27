import "./Header.css";
import { useState, useEffect } from "react";
import axios from 'axios';
import { Checkout } from "./HomeComponents/Checkout";
import { AllOrders } from "./HomeComponents/AllOrders";
import { useNavigate } from 'react-router-dom';
import { NavLink } from 'react-router-dom';

export function Header() {

  const navigate = useNavigate();

  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [userData, setUserData] = useState(null)
  const [proceedCheckout, setProceedCheckout] = useState(false)
  const [viewAllOrders, setViewAllOrders] = useState(false)

  const handleCheckout = () => {
    setProceedCheckout(!proceedCheckout)
  }
  const handleViewingOrders = () => {
    setViewAllOrders(!viewAllOrders)
  }

  useEffect(() => {
    if (isCartOpen || isProfileOpen) {
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }

    return () => document.body.classList.remove('no-scroll');
  }, [isCartOpen, isProfileOpen]);

  const openCartSideBar = () => {
    setIsCartOpen(!isCartOpen);
  }

  const fetchSpecificUser = (id) => {
    axios.get(`http://127.0.0.1:5000/getUser/${id}`)
      .then(res => {
        setUserData(res.data);
      })
      .catch(err => {
        console.log("Error fetching user for header:", err);
      });
  };

  useEffect(() => {
    const savedId = localStorage.getItem("currentUserId");

    if (savedId) {
      fetchSpecificUser(savedId);
    }
  }, []);

  const openSidebar = () => {
    setIsProfileOpen(!isProfileOpen)
  }

  const handleLogout = () => {
    localStorage.removeItem("currentUserId");
    setUserData(null);
    navigate("/");
  };
  return (
    <>
      <header className="nav-wrapper">
        <nav>
          <div className="logo-header-container">
            <img src="./public/business-logo.png" />
          </div>
          <div className="nav-link-container">
            <NavLink
              to="/home"
              className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
            >
              Home
            </NavLink>

            <NavLink
              to="/menu"
              className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
            >
              Menu
            </NavLink>

            <NavLink
              to="/contact"
              className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
            >
              Talk to us
            </NavLink>

            <NavLink
              to="/locations"
              className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
            >
              Locations
            </NavLink>
          </div>
          <div className="nav-right-side">
            <div className="searching-container">
              <input type="text" placeholder="Search" />
              <button className="search-button"><img src="./public/search-icon.png" alt="" /></button>
            </div>
            <div className="menu" onClick={openCartSideBar}>
              <button className="menu-button"><img src="./public/cart-icon.png" alt="" /></button>
              <p>Basket</p>
            </div>
            <>
              <div className={`sidebar-overlay ${isCartOpen && 'visible'}`}>
              </div>
              <div className={`cart-container ${isCartOpen ? 'active' : ''}`} >
                <div className="title-exit-btn">
                  <h2>BASKET ITEMS</h2>
                  <button onClick={openCartSideBar} ><img src="../public/hide-button.png" alt="" /></button>
                </div>
                <div className="items-container">
                  <div className="items">
                    <input className="checkbox" type="checkbox" />
                    <div className="item-display">
                      <img src="./src/assets/cart-item.jpg" alt="" />
                      <div className="item-infos">
                        <h5>Croissant Filled With Chocolate Cream</h5>
                        <p>8 Items Left</p>
                        <h4>99 Pesos</h4>
                      </div>
                      <input type="number" min="1" max="999999" step="1" value="1" />
                    </div>
                    <button className="remove-btn"><img src="../public/remove.png" alt="" /></button>
                  </div>
                  <div className="items">
                    <input className="checkbox" type="checkbox" />
                    <div className="item-display">
                      <img src="./src/assets/cart-item.jpg" alt="" />
                      <div className="item-infos">
                        <h5>Croissant Filled With Chocolate Cream</h5>
                        <p>8 Items Left</p>
                        <h4>99 Pesos</h4>
                      </div>
                      <input type="number" min="1" max="999999" step="1" value="1" />
                    </div>
                    <button className="remove-btn"><img src="../public/remove.png" alt="" /></button>
                  </div>
                  <div className="items">
                    <input className="checkbox" type="checkbox" />
                    <div className="item-display">
                      <img src="./src/assets/cart-item.jpg" alt="" />
                      <div className="item-infos">
                        <h5>Croissant Filled With Chocolate Cream</h5>
                        <p>8 Items Left</p>
                        <h4>99 Pesos</h4>
                      </div>
                      <input type="number" min="1" max="999999" step="1" value="1" />
                    </div>
                    <button className="remove-btn"><img src="../public/remove.png" alt="" /></button>
                  </div>
                  <div className="items">
                    <input className="checkbox" type="checkbox" />
                    <div className="item-display">
                      <img src="./src/assets/cart-item.jpg" alt="" />
                      <div className="item-infos">
                        <h5>Croissant Filled With Chocolate Cream</h5>
                        <p>8 Items Left</p>
                        <h4>99 Pesos</h4>
                      </div>
                      <input type="number" min="1" max="999999" step="1" value="1" />
                    </div>
                    <button className="remove-btn"><img src="../public/remove.png" alt="" /></button>
                  </div>
                </div>
                <div className="buttons-place">
                  <button className="checkout" onClick={handleCheckout}>CHECKOUT</button>
                  <div className={`checkout-overlay ${proceedCheckout && 'visible'}`}>
                  </div>
                  {proceedCheckout && <Checkout onCancel={handleCheckout} />}
                  <button className="view" onClick={handleViewingOrders}>VIEW ALL ORDERS</button>
                  <div className={`view-orders-overlay ${viewAllOrders && 'visible'}`}>
                  </div>
                  {viewAllOrders && <AllOrders onCancel={handleViewingOrders} />}
                </div>
              </div>
            </>
            <div className="profile" onClick={openSidebar}>
              <button className="profile-button"><img src="./public/profile-icon.png" alt="" /></button>
              <p>Profile</p>
            </div>
            <>
              <div className={`sidebar-overlay ${isProfileOpen && 'visible'}`}></div>
              <div className={`profile-detail-container ${isProfileOpen ? 'active' : ''}`}>
                <div className="header-profile">
                  <h2>Profile</h2>
                  <button className="hide-profile-btn" onClick={openSidebar}><img src="./public/hide-button.png" alt="" /></button>
                </div>
                <div className="profile-image-container">
                  <img className="profile-img" src={userData?.profile_picture || "/default-pfp.png"} alt="" />
                  <button><img className="add-icon" src="./public/add-icon.png" alt="" /></button>
                  <p>{userData ? `@${userData.first_name} ${userData.last_name}` : "Loading..."}</p>
                </div>
                <p className="personal-info-text">PERSONAL INFORMATIONS</p>
                <ul className="profile-infos">
                  <li>
                    <div className="info-img-container">
                      <img src="./public/phone-number.png" alt="" />
                    </div>
                    <p>{userData ? `${userData.mobile_number}` : "Loading..."}</p>
                  </li>
                  <li>
                    <div className="info-img-container">
                      <img src="./public/address.png" alt="" />
                    </div>
                    <p>{userData ? `${userData.barangay} ${userData.street_name}` : "Loading..."}</p>
                  </li>
                  <li>
                    <div className="info-img-container">
                      <img src="./public/date-joined.png" alt="" />
                    </div>
                    <p>{userData?.date_joined ? new Date(userData.date_joined).toLocaleDateString() : "Loading..."}</p>
                  </li>
                </ul>
                <button className="logout-btn" onClick={handleLogout}>LOG OUT<img src="./public/logout-icon.png" alt="" /></button>
              </div>
            </>
          </div>
        </nav>
      </header >
    </>
  )
}