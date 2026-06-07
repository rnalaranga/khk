import React from 'react';
import ProductCard from '../components/ProductCard';

export default function ChemicalsPage({ products, vehicleSelected, onAddToCart }) {
  // Filter only chemicals from the global products list
  const chemicalProducts = products.filter(p => p.category === 'Chemicals');

  return (
    <div className="chemicals-page">
      <div className="hero" style={{ minHeight: '60vh', paddingTop: '80px' }}>
        <div className="hero-bg" style={{ backgroundImage: "url('/chemicals_hero.png')" }}></div>
        <div className="hero-gradient" style={{ background: 'linear-gradient(180deg, rgba(255,50,0,0.2) 0%, #090909 100%)' }}></div>
        <div className="hero-content">
          <h1 className="hero-title">Performance <br/><span>Additives &amp; Chemicals</span></h1>
          <p className="hero-sub">Maximize your engine's potential. Degreasers, octane boosters, and fuel system cleaners for ultimate reliability.</p>
        </div>
      </div>

      <div className="shop-section">
        <div className="section-header">
          <h2 className="section-title">Shop Chemicals</h2>
        </div>
        
        <div className="product-grid">
          {chemicalProducts.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} vehicleSelected={vehicleSelected} onAddToCart={onAddToCart} />
          ))}
        </div>
      </div>
    </div>
  );
}
