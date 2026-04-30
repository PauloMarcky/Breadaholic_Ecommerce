import '../MenuComponents/Products.css'
import { ProductSidebar } from '../MenuComponents/ProductSidebar'
import { useState, useEffect } from 'react'

export function Products() {

  const [OpenDetails, setOpenDetails] = useState(false);

  function handleOpenDetail() {
    setOpenDetails(!OpenDetails);
  }

  useEffect(() => {
    if (OpenDetails) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [OpenDetails]);

  return (
    <>
      <div className={`product-detail-overlay ${OpenDetails && 'visible'}`}
        onClick={handleOpenDetail}>
      </div>
      <div className="menu-right-side">
        <div className="product-wrapper">
          <img onClick={handleOpenDetail} className="product-image" src="./src/assets/cart-item.jpg" alt="" />
          {<ProductSidebar isOpen={OpenDetails} />}
          <div className="product-details">
            <p>Product Name</p>
            <p className="price">100 Pesos</p>
          </div>
          <div className="btn-below">
            <button>Add to Basket</button>
            <input type="number" value={1} />
          </div>
        </div>
        <div className="product-wrapper">
          <img className="product-image" src="./src/assets/cart-item.jpg" alt="" />
          <div className="product-details">
            <p>Product Name</p>
            <p className="price">100 Pesos</p>
          </div>
          <div className="btn-below">
            <button>Add to Basket</button>
            <input type="number" value={1} />
          </div>
        </div>
        <div className="product-wrapper">
          <img className="product-image" src="./src/assets/cart-item.jpg" alt="" />
          <div className="product-details">
            <p>Product Name</p>
            <p className="price">100 Pesos</p>
          </div>
          <div className="btn-below">
            <button>Add to Basket</button>
            <input type="number" value={1} />
          </div>
        </div>
        <div className="product-wrapper">
          <img className="product-image" src="./src/assets/cart-item.jpg" alt="" />
          <div className="product-details">
            <p>Product Name</p>
            <p className="price">100 Pesos</p>
          </div>
          <div className="btn-below">
            <button>Add to Basket</button>
            <input type="number" value={1} />
          </div>
        </div>
        <div className="product-wrapper">
          <img className="product-image" src="./src/assets/cart-item.jpg" alt="" />
          <div className="product-details">
            <p>Product Name</p>
            <p className="price">100 Pesos</p>
          </div>
          <div className="btn-below">
            <button>Add to Basket</button>
            <input type="number" value={1} />
          </div>
        </div>
        <div className="product-wrapper">
          <img className="product-image" src="./src/assets/cart-item.jpg" alt="" />
          <div className="product-details">
            <p>Product Name</p>
            <p className="price">100 Pesos</p>
          </div>
          <div className="btn-below">
            <button>Add to Basket</button>
            <input type="number" value={1} />
          </div>
        </div>
        <div className="product-wrapper">
          <img className="product-image" src="./src/assets/cart-item.jpg" alt="" />
          <div className="product-details">
            <p>Product Name</p>
            <p className="price">100 Pesos</p>
          </div>
          <div className="btn-below">
            <button>Add to Basket</button>
            <input type="number" value={1} />
          </div>
        </div>
        <div className="product-wrapper">
          <img className="product-image" src="./src/assets/cart-item.jpg" alt="" />
          <div className="product-details">
            <p>Product Name</p>
            <p className="price">100 Pesos</p>
          </div>
          <div className="btn-below">
            <button>Add to Basket</button>
            <input type="number" value={1} />
          </div>
        </div>
        <div className="product-wrapper">
          <img className="product-image" src="./src/assets/cart-item.jpg" alt="" />
          <div className="product-details">
            <p>Product Name</p>
            <p className="price">100 Pesos</p>
          </div>
          <div className="btn-below">
            <button>Add to Basket</button>
            <input type="number" value={1} />
          </div>
        </div>
        <div className="product-wrapper">
          <img className="product-image" src="./src/assets/cart-item.jpg" alt="" />
          <div className="product-details">
            <p>Product Name</p>
            <p className="price">100 Pesos</p>
          </div>
          <div className="btn-below">
            <button>Add to Basket</button>
            <input type="number" value={1} />
          </div>
        </div>
        <div className="product-wrapper">
          <img className="product-image" src="./src/assets/cart-item.jpg" alt="" />
          <div className="product-details">
            <p>Product Name</p>
            <p className="price">100 Pesos</p>
          </div>
          <div className="btn-below">
            <button>Add to Basket</button>
            <input type="number" value={1} />
          </div>
        </div>
      </div>
    </>
  )
}