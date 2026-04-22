import '../components/FeatureProduct.css'
import axios from 'axios';
import { useEffect, useState } from 'react'


export function FeatureProduct() {

  const [featuredProductData, setFeaturedProductData] = useState([]);

  useEffect(() => {
    axios.get("http://127.0.0.1:5000/getFeatured")
      .then(response => {
        setFeaturedProductData(response.data);
      })
      .catch(error => console.log("Error Fetching: ", error));
  }, []);

  return (
    <div className="section-wrap">
      <div className="featured-card">
        <h2 className="section-title">THE CAMPUS CRUSH PRODUCTS</h2>
        <p className="section-sub-title">CURIOUS WHY? ORDER IT NOW</p>
        <div className="products-grid">

          {featuredProductData && featuredProductData.map((product) => (
            <div className="product-item" key={product.id}>
              <div className="product-placeholder">
                <img src={product.image && product.image} />
              </div>
              <div className="product-footer">
                <button className="btn-add">Add to Menu</button>
                <input className="qty-input" type="number" defaultValue="1" min="1" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}