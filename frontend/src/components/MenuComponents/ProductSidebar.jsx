import '../MenuComponents/ProductSidebar.css';

export function ProductSidebar({ isOpen }) {


  return (
    <div className={`product-sidebar ${isOpen ? 'active' : ''}`}>
      <div className="product-profile">
        <img src="../src/assets/cart-item.jpg" alt="Pandesal" />
      </div>
      <h3>Malungay w/ Cheese Pandesal</h3>
      <div className="product-foot">
        <div className="product-ingredients">
          <p>Ingredients</p>
          <ul>
            <li>Bread Flour</li>
            <li>Salt</li>
            <li>Active Dry Yeast</li>
            <li>Lukewarm Water</li>

          </ul>
        </div>
        <div className="btn-addcart">
          <button>ADD TO BASKET</button>
          <input type="number" defaultValue="1" />
        </div>
      </div>
    </div>
  );
}