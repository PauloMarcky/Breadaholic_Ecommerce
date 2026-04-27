import './MenuCategories.css';

export function MenuCategories() {
  return (
    <>
      <div className="menu-left-sidebar">
        <div className="menu-wrapper">
          <div className="menu-heading">
            <h3>CHOOSE WITH YOUR HEART</h3>
          </div>
          <div className="menu-category">
            <p>MENU CATEGORY</p>
            <div className="radio-btn">
              <label for="radio"><input type="radio" name="tea" id="1" /> Bread </label>
              <label for="radio"><input type="radio" name="coffee" id="2" /> Coffee </label>
              <label for="radio"><input type="radio" name="bread" id="3" /> Tea </label>
            </div>
          </div>
          <div className="menu-sorting">
            <p>Sort</p>
            <select name="sort-options" id=" sort-options">
              <option value="newest">Newest</option>
              <option value="alpabhetically">Name: A-Z</option>
              <option value="low_to_high">Price: Low - High</option>
              <option value="high_to_low">Price: High - low</option>
            </select>

            <p>Price Range</p>

            <div className="filter-row">

              <span className="price-label">$<span id="min-price-text">20</span></span>

              <div className="range-slider-container">
                <div className="slider-track"></div>
                <input type="range" min="0" max="100" value="20" id="min-price" />
                <input type="range" min="0" max="100" value="80" id="max-price" />
              </div>

              <span className="price-label">$<span id="max-price-text">80</span></span>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}