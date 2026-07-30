import React, { useState } from 'react';
import { ShoppingCart, Check, X, ChevronLeft, ChevronRight } from 'lucide-react';

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
  const [activeImg, setActiveImg] = useState(0);

  if (!product) return null;

  const categoryMatch = categories.find(c => c.name === product.category);
  const catDiscount = categoryMatch ? (categoryMatch.discount_percent || 0) : 0;
  const prodDiscount = product.discount_percent || 0;
  const brandDiscount = product.brand_discount || 0;
  const bestDiscount = Math.max(catDiscount, prodDiscount, brandDiscount);

  const finalPrice = bestDiscount > 0
    ? Math.round(product.price * (1 - bestDiscount / 100))
    : product.price;

  // Build images array
  const allImages = (product.images && product.images.length > 0)
    ? product.images.map(img => `/api/uploads/${img}`)
    : product.image_url 
      ? [`/api/uploads/${product.image_url}`]
      : [product.image || CAT_IMAGE[product.category] || '/prod_oil.png'];

  const vehicleDisplay = product.vehicle_names && product.vehicle_names.length > 0
    ? product.vehicle_names
    : product.compatible_vehicles ? product.compatible_vehicles.split(',').map(v => v.trim()) : [];

  const handleAdd = () => {
    if (product.stock === 0 || added) return;
    onAddToCart({ ...product, finalPrice, original_price: product.price, discount_percent: bestDiscount });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div style={{ background: 'var(--bg-body)', border: '1px solid var(--border)', borderRadius: 16, maxWidth: 850, width: '100%', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', position: 'relative', boxShadow: 'var(--shadow)' }} onClick={e => e.stopPropagation()}>
        
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'var(--glass-bg)', border: '1px solid var(--border)', color: 'var(--white)', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}>
          <X size={20} />
        </button>

        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {/* Image Gallery */}
          <div style={{ flex: '1 1 320px', padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 280 }}>
              {allImages.length > 1 && (
                <button onClick={() => setActiveImg(prev => prev === 0 ? allImages.length - 1 : prev - 1)} style={{ position: 'absolute', left: 4, top: '50%', transform: 'translateY(-50%)', background: 'var(--glass-bg)', border: '1px solid var(--border)', color: 'var(--white)', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 2 }}>
                  <ChevronLeft size={16} />
                </button>
              )}
              <img src={allImages[activeImg]} alt={product.name} style={{ maxWidth: '85%', maxHeight: 280, objectFit: 'contain', borderRadius: 8 }} />
              {allImages.length > 1 && (
                <button onClick={() => setActiveImg(prev => prev === allImages.length - 1 ? 0 : prev + 1)} style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', background: 'var(--glass-bg)', border: '1px solid var(--border)', color: 'var(--white)', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 2 }}>
                  <ChevronRight size={16} />
                </button>
              )}
            </div>
            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                {allImages.map((img, i) => (
                  <div
                    key={i}
                    onClick={() => setActiveImg(i)}
                    style={{
                      width: 56, height: 56, borderRadius: 8, overflow: 'hidden', cursor: 'pointer',
                      border: activeImg === i ? '2px solid var(--red)' : '2px solid var(--border)',
                      opacity: activeImg === i ? 1 : 0.6,
                      transition: 'all 0.2s'
                    }}
                  >
                    <img src={img} alt={`Thumb ${i+1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Details */}
          <div style={{ flex: '1 1 300px', padding: 32, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <span style={{ color: 'var(--red)', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 'bold', letterSpacing: '0.05em' }}>{product.category}</span>
                {product.brand_name && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: 12, border: '1px solid var(--border)' }}>
                    {product.brand_logo && <img src={`/api/uploads/${product.brand_logo}`} alt={product.brand_name} style={{ height: 14, objectFit: 'contain' }} />}
                    <span style={{ fontSize: '0.75rem', color: 'var(--white)', fontWeight: '600' }}>{product.brand_name}</span>
                  </div>
                )}
              </div>
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

            {vehicleDisplay.length > 0 && (
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: 16, borderRadius: 8, border: '1px solid var(--border)' }}>
                <h4 style={{ color: 'var(--white)', margin: '0 0 8px 0', fontSize: '0.9rem', textTransform: 'uppercase' }}>🚗 Compatible Vehicles</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {vehicleDisplay.map((v, i) => (
                    <span key={i} style={{ background: 'rgba(228,0,15,0.15)', color: 'var(--text)', padding: '4px 10px', borderRadius: 20, fontSize: '0.8rem', border: '1px solid rgba(228,0,15,0.3)' }}>
                      {v}
                    </span>
                  ))}
                </div>
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
