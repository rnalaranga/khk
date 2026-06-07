import React, { useState } from 'react';
import ProductCard from '../components/ProductCard';

const LM_PRODUCTS = [
  { id: 201, name: 'Liqui Moly Molygen 5W-40 (4L)', category: 'Engine Oil', price: 14500, discount_percent: 5, stock: 20, compatible_vehicles: 'High-Performance European & Japanese', image: '/prod_oil.png' },
  { id: 202, name: 'Liqui Moly Ceratec Additive', category: 'Chemicals', price: 4200, discount_percent: 0, stock: 50, compatible_vehicles: 'All Vehicles', image: '/prod_chemical.png' },
  { id: 203, name: 'Liqui Moly Engine Flush Plus', category: 'Chemicals', price: 2800, discount_percent: 10, stock: 35, compatible_vehicles: 'All Vehicles', image: '/prod_chemical.png' },
  { id: 204, name: 'Liqui Moly Top Tec 4200 5W-30', category: 'Engine Oil', price: 15800, discount_percent: 0, stock: 15, compatible_vehicles: 'Audi, BMW, VW, Porsche', image: '/prod_oil.png' },
];

export default function LiquiMolyPage({ onAddToCart, vehicleSelected }) {
  return (
    <div className="lm-page">
      <div className="hero" style={{ minHeight: '60vh', paddingTop: '80px' }}>
        <div className="hero-bg" style={{ backgroundImage: "url('/liquimoly_hero.png')" }}></div>
        <div className="hero-gradient" style={{ background: 'linear-gradient(180deg, rgba(0,25,100,0.4) 0%, #090909 100%)' }}></div>
        <div className="hero-content">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '16px' }}>
             <img src="https://upload.wikimedia.org/wikipedia/commons/e/ec/Liqui_Moly_Logo.svg" alt="Liqui Moly" style={{ height: '60px', filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.3))' }} />
          </div>
          <h1 className="hero-title">German <span style={{ color: '#0055FF' }}>Engineering.</span><br/>Peak <span style={{ color: '#FF0022' }}>Performance.</span></h1>
          <p className="hero-sub">The ultimate motor oils and additives. Trusted by professional racing teams worldwide.</p>
        </div>
      </div>

      <div className="shop-section">
        <div className="section-header">
          <h2 className="section-title">Liqui Moly Lineup</h2>
        </div>
        
        <div className="product-grid">
          {LM_PRODUCTS.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} vehicleSelected={vehicleSelected} onAddToCart={onAddToCart} />
          ))}
        </div>
      </div>
    </div>
  );
}
