import React, { useState } from 'react';
import { ShoppingCart, Check } from 'lucide-react';
import ProductModal from './ProductModal';

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

export default function ProductCard({ product, onAddToCart, vehicleSelected, categories = [] }) {
  const [added, setAdded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const categoryMatch = categories.find(c => c.name === product.category);
  const catDiscount = categoryMatch ? (categoryMatch.discount_percent || 0) : 0;
  const prodDiscount = product.discount_percent || 0;
  const brandDiscount = product.brand_discount || 0;
  const bestDiscount = Math.max(catDiscount, prodDiscount, brandDiscount);

  const finalPrice = bestDiscount > 0
    ? Math.round(product.price * (1 - bestDiscount / 100))
    : product.price;

  const cvLower = (product.compatible_vehicles || '').toLowerCase();
  const isCompatible = vehicleSelected?.make && (
    cvLower.includes('all vehicles') ||
    cvLower.includes(vehicleSelected.make.toLowerCase())
  );

  const imageSrc = (product.images && product.images.length > 0)
    ? `/api/uploads/${product.images[0]}`
    : (product.image_url ? `/api/uploads/${product.image_url}` : (product.image || CAT_IMAGE[product.category] || '/prod_oil.png'));

  const vehicleDisplay = product.vehicle_names && product.vehicle_names.length > 0
    ? product.vehicle_names.join(', ')
    : product.compatible_vehicles;

  const handleAdd = () => {
    if (product.stock === 0 || added) return;
    onAddToCart({ ...product, finalPrice, original_price: product.price, discount_percent: bestDiscount });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <>
      <div className="pcard" onClick={() => setIsModalOpen(true)} style={{ cursor: 'pointer' }}>
        {/* Badges */}
        <div className="pcard-badges">
        {product.stock === 0 ? (
          <span className="badge-sale" style={{ background: '#333' }}>OUT OF STOCK</span>
        ) : (
          bestDiscount > 0 && (
            <span className="badge-sale">-{bestDiscount}% OFF</span>
          )
        )}
        {isCompatible && <span className="badge-compat">✓ Fits Your Car</span>}
        {product.item_condition === 'reconditioned' && <span className="badge-sale" style={{ background: '#3b82f6', marginLeft: 4 }}>RECONDITIONED</span>}
      </div>

      {/* Image */}
      <div className="pcard-img-wrap">
        <img src={imageSrc} alt={product.name} />
      </div>

      {/* Body */}
      <div className="pcard-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <div className="pcard-cat">{product.category}</div>
          {product.brand_name && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {product.brand_logo && <img src={`/api/uploads/${product.brand_logo}`} alt={product.brand_name} style={{ height: 16, width: 16, objectFit: 'contain' }} />}
              <span style={{ fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 'bold' }}>{product.brand_name}</span>
            </div>
          )}
        </div>
        <h3 className="pcard-name">{product.name}</h3>
        {vehicleDisplay && (
          <p className="pcard-compat" title={vehicleDisplay}>
            🚗 {vehicleDisplay}
          </p>
        )}
        {product.vendor_name && (
          <p style={{ fontSize: '0.75rem', color: '#eab308', margin: '4px 0 0 0' }}>Sold by: {product.vendor_name}</p>
        )}

        <div className="pcard-footer">
          <div className="price-wrap">
            {bestDiscount > 0 && (
              <span className="price-orig">Rs. {product.price.toLocaleString()}</span>
            )}
            <span className="price-final">Rs. {finalPrice.toLocaleString()}</span>
          </div>

            <button
              className={`pcard-add-btn${added ? ' added' : ''}`}
              onClick={(e) => { e.stopPropagation(); handleAdd(); }}
              disabled={product.stock === 0}
            >
              {product.stock === 0 ? 'Out of Stock' : (added ? <><Check size={14} /> Added</> : <><ShoppingCart size={14} /> Add</>)}
            </button>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <ProductModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          product={product} 
          onAddToCart={onAddToCart}
          vehicleSelected={vehicleSelected}
          categories={categories}
        />
      )}
    </>
  );
}
