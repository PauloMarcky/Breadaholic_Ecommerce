import '../MenuComponents/ProductSidebar.css';
import { useState, useEffect } from 'react';

export function ProductSidebar({ isOpen, product, onAddToCart }) {
  const [qty, setQty] = useState(1);

  useEffect(() => {
    const shouldLock = isOpen;
    document.body.style.overflow = shouldLock ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!product) return null;

  return (
    <div className={`product-sidebar ${isOpen ? 'active' : ''}`}>
      <div className="product-profile">
        <img src={product.image} alt={product.product_name} />
      </div>

      <h3>{product.product_name}</h3>
      <p className="price">₱{product.price}</p>

      <div className="product-foot">
        <div className="product-ingredients">
          <p>Ingredients</p>
          <ul>
            {product.ingredients
              ? product.ingredients.split(',').map((ingredient, index) => (
                <li key={index}>{`- ${ingredient.trim()}`}</li>
              ))
              : <li>No ingredients listed.</li>
            }
          </ul>
        </div>

        <div className="btn-addcart">
          <button onClick={() => onAddToCart(product.product_id, qty)}>
            ADD TO BASKET
          </button>
          <input
            type="number"
            value={qty}
            min={1}
            onChange={(e) => setQty(parseInt(e.target.value))}
          />
        </div>
      </div>
    </div>
  );
}