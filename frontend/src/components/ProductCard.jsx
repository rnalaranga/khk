import React, { useState } from 'react';
import { ShoppingCart, Check } from 'lucide-react';

const CAT_IMAGE = {
  'Engine Oil': '/prod_oil.png',
  'Brake Pads': '/prod_brakes.png',
  'Chemicals': '/prod_chemical.png',
  'Combo Deals': '/prod_oil.png',
  'Filters': '/prod_oil.png',
  'Coolant': '/prod_chemical.png',
  'Wiper Blades': '/prod_brakes.png',
  'Brake Washers': '/prod_brakes.png',
};

export default function ProductCard({ product, onAddToCart, vehicleSelected }) {
  const [added, setAdded] = useState(false);

  const finalPrice = product.discount_percent > 0
    ? Math.round(product.price * (1 - product.discount_percent / 100))
    : product.price;

  const cvLower = (product.compatible_vehicles || '').toLowerCase();
  const isCompatible = vehicleSelected?.make && (
    cvLower.includes('all vehicles') ||
    cvLower.includes(vehicleSelected.make.toLowerCase())
  );

  const imageSrc = product.image_url 
    ? `/uploads/${product.image_url}` 
    : (product.image || CAT_IMAGE[product.category] || '/prod_oil.png');

  const handleAdd = () => {
    if (product.stock === 0 || added) return;
    onAddToCart({ ...product, finalPrice });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <div className="pcard">
      {/* Badges */}
      <div className="pcard-badges">
        {product.discount_percent > 0 && (
          <span className="badge-sale">-{product.discount_percent}% OFF</span>
        )}
        {isCompatible && <span className="badge-compat">✓ Fits Your Car</span>}
      </div>

      {/* Image */}
      <div className="pcard-img-wrap">
        <img src={imageSrc} alt={product.name} />
      </div>

      {/* Body */}
      <div className="pcard-body">
        <div className="pcard-cat">{product.category}</div>
        <h3 className="pcard-name">{product.name}</h3>
        {product.compatible_vehicles && (
          <p className="pcard-compat" title={product.compatible_vehicles}>
            {product.compatible_vehicles}
          </p>
        )}

        <div className="pcard-footer">
          <div className="price-wrap">
            {product.discount_percent > 0 && (
              <span className="price-orig">Rs. {product.price.toLocaleString()}</span>
            )}
            <span className="price-final">Rs. {finalPrice.toLocaleString()}</span>
          </div>

          <button
            className={`pcard-add-btn${added ? ' added' : ''}`}
            onClick={handleAdd}
            disabled={product.stock === 0}
          >
            {added ? <><Check size={14} /> Added</> : <><ShoppingCart size={14} /> Add</>}
          </button>
        </div>
      </div>
    </div>
  );
}
