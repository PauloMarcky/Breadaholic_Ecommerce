import "./Header.css"
import { useState } from "react"

export function Header() {

  const [isProfileOpen, setIsProfileOpen] = useState(false)

  const openSidebar = () => {
    setIsProfileOpen(!isProfileOpen)
  }
  return (
    <>
      <nav>
        <div className="logo-container">
          <img src="./public/business-logo.png" />
        </div>
        <div className="nav-link-container">
          <a className="active">Home</a>
          <a>Menu</a>
          <a>Talk to us</a>
          <a>Locations</a>
        </div>
        <div className="nav-right-side">
          <div className="searching-container">
            <input type="text" placeholder="Search" />
            <button className="search-button"><img src="./public/search-icon.png" alt="" /></button>
          </div>
          <div className="menu">
            <button className="menu-button"><img src="./public/cart-icon.png" alt="" /></button>
            <p>Basket</p>
          </div>
          <div className="profile" onClick={openSidebar}>
            <button className="profile-button"><img src="./public/profile-icon.png" alt="" /></button>
            <p>Profile</p>
          </div>
          {isProfileOpen &&
            <div className="profile-detail-container">
              <div className="header-profile">
                <h2>Profile Details</h2>
                <button className="hide-profile-btn" onClick={openSidebar}><img src="./public/hide-button.png" alt="" /></button>
              </div>
              <div className="profile-image-container">
                <img src="./src/assets/profile-demo.jpg" alt="" />
                <button>Change Profile</button>
              </div>
              <ul className="profile-infos">
                <li>username</li>
                <li>mobile number</li>
                <li>address</li>
              </ul>
              <button className="logout-btn">LOG OUT<img src="./public/logout-icon.png" alt="" /></button>
            </div>
          }
        </div>
      </nav>
    </>
  )
}