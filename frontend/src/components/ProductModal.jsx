import React, { useState } from 'react';
import { ShoppingCart, Check, X } from 'lucide-react';

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

export default function ProductModal({ isOpen, onClose, product, onAddToCart, vehicleSelected, categories = [] }) {
  const [added, setAdded] = useState(false);

  if (!product) return null;

  const categoryMatch = categories.find(c => c.name === product.category);
  const catDiscount = categoryMatch ? (categoryMatch.discount_percent || 0) : 0;
  const prodDiscount = product.discount_percent || 0;
  const bestDiscount = Math.max(catDiscount, prodDiscount);

  const finalPrice = bestDiscount > 0
    ? Math.round(product.price * (1 - bestDiscount / 100))
    : product.price;

  const imageSrc = product.image_url 
    ? `/api/uploads/${product.image_url}` 
    : (product.image || CAT_IMAGE[product.category] || '/prod_oil.png');

  const handleAdd = () => {
    if (product.stock === 0 || added) return;
    onAddToCart({ ...product, finalPrice });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div style={{ background: 'var(--bg-body)', border: '1px solid var(--border)', borderRadius: 16, maxWidth: 800, width: '100%', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', position: 'relative', boxShadow: 'var(--shadow)' }} onClick={e => e.stopPropagation()}>
        
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'var(--glass-bg)', border: '1px solid var(--border)', color: 'var(--white)', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}>
          <X size={20} />
        </button>

        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {/* Image */}
          <div style={{ flex: '1 1 300px', padding: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.02)' }}>
            <img src={imageSrc} alt={product.name} style={{ maxWidth: '100%', maxHeight: 300, objectFit: 'contain' }} />
          </div>
          
          {/* Details */}
          <div style={{ flex: '1 1 300px', padding: 32, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <span style={{ color: 'var(--red)', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 'bold', letterSpacing: '0.05em' }}>{product.category}</span>
              <h2 style={{ fontFamily: 'var(--font-hero)', fontSize: '2rem', color: 'var(--white)', margin: '8px 0' }}>{product.name}</h2>
              {product.stock === 0 ? (
                <span className="badge-sale" style={{ background: '#333' }}>OUT OF STOCK</span>
              ) : (
                bestDiscount > 0 && (
                  <span className="badge-sale">-{bestDiscount}% OFF</span>
                )
              )}
              <span style={{ color: '#4ade80', fontSize: '0.9rem', display: 'block', marginTop: 4 }}>{product.stock} items available</span>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.2)', padding: 16, borderRadius: 8, border: '1px solid var(--border)' }}>
              <h4 style={{ color: 'var(--white)', margin: '0 0 8px 0', fontSize: '0.9rem', textTransform: 'uppercase' }}>Description</h4>
              <p style={{ color: 'var(--muted)', fontSize: '0.95rem', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>
                {product.description || 'No detailed description available for this product.'}
              </p>
            </div>

            {product.compatible_vehicles && (
              <div>
                <h4 style={{ color: 'var(--white)', margin: '0 0 8px 0', fontSize: '0.9rem', textTransform: 'uppercase' }}>Compatible Vehicles</h4>
                <p style={{ color: 'var(--muted)', fontSize: '0.9rem', margin: 0 }}>{product.compatible_vehicles}</p>
              </div>
            )}

            <div style={{ marginTop: 'auto', paddingTop: 20, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {bestDiscount > 0 && (
                  <span style={{ textDecoration: 'line-through', color: '#ff6b6b', fontSize: '1.1rem', fontWeight: '600', marginBottom: '-4px' }}>
                    Rs. {product.price.toLocaleString()}
                  </span>
                )}
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--white)' }}>Rs. {finalPrice.toLocaleString()}</span>
              </div>
              <button
                onClick={handleAdd}
                disabled={product.stock === 0}
                className={`btn-primary ${added ? 'added' : ''}`}
                style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}
              >
                {product.stock === 0 ? 'Out of Stock' : (added ? <><Check size={18} /> Added</> : <><ShoppingCart size={18} /> Add to Cart</>)}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
