import '../MenuComponents/ProductSidebar.css';
import { useState, useEffect } from 'react';

export function ProductSidebar({ isOpen, product, onAddToCart }) {
  const [qty, setQty] = useState(1);

  useEffect(() => {
    const shouldLock = isOpen;
    document.body.style.overflow = shouldLock ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  // REMOVED: if (!product) return null; (This was the bug!)

  return (
    <div className={`product-sidebar ${isOpen ? 'active' : ''}`}>
      {product && (
        <>
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
              <button
                onClick={(e) => onAddToCart(product.product_id, qty, e)}  // ✅ Pass 'e'!
                disabled={product.stock <= 0}
              >
                {product.stock <= 0 ? 'OUT OF STOCK' : 'ADD TO BASKET'}
              </button>
              <input
                type="number"
                value={qty}
                min={1}
                max={product.stock || 1}
                disabled={product.stock <= 0}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1;
                  setQty(Math.min(Math.max(val, 1), product.stock || 1));
                }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}