import './MenuCategories.css';
export function MenuCategories({ filters, setFilters }) {

  const handleCategory = (e) => {
    setFilters(prev => ({ ...prev, category: e.target.value }));
  };

  const handleSort = (e) => {
    setFilters(prev => ({ ...prev, sortBy: e.target.value }));
  };

  const handleMinPrice = (e) => {
    setFilters(prev => ({ ...prev, minPrice: Number(e.target.value) }));
  };

  const handleMaxPrice = (e) => {
    setFilters(prev => ({ ...prev, maxPrice: Number(e.target.value) }));
  };

  return (
    <div className="menu-left-sidebar">
      <div className="menu-wrapper">
        <h3 className='menu-heading'>CHOOSE WITH YOUR HEART</h3>
        <div className="menu-category">
          <p>MENU CATEGORY</p>
          <div className="radio-btn">
            {['All', 'Bread', 'Coffee', 'Tea'].map(cat => (
              <label key={cat}>
                <input
                  type="radio"
                  name="category"
                  value={cat}
                  checked={filters.category === cat}
                  onChange={handleCategory}
                /> {cat}
              </label>
            ))}
          </div>
        </div>

        <div className="menu-sorting">
          <p>Sort</p>
          <select value={filters.sortBy} onChange={handleSort}>
            <option value="newest">Newest</option>
            <option value="alphabetically">Name: A-Z</option>
            <option value="low_to_high">Price: Low - High</option>
            <option value="high_to_low">Price: High - Low</option>
          </select>

          <p>Price Range</p>
          <div className="filter-row">
            <span className="price-label">₱{filters.minPrice}</span>

            <div className="range-slider-container">
              <input
                type="range" min="0" max="1000"
                value={filters.minPrice}
                onChange={handleMinPrice}
              />
              <input
                type="range" min="0" max="1000"
                value={filters.maxPrice}
                onChange={handleMaxPrice}
              />
            </div>

            <span className="price-label">₱{filters.maxPrice}</span>
          </div>
        </div>

      </div>
    </div>
  );
}