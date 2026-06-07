import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import ProductCard from '../components/ProductCard';

const CATS = ['Engine Oil', 'Filters', 'Brake Pads', 'Coolant', 'Chemicals', 'Combo Deals', 'Wiper Blades', 'Brake Washers'];

export default function Shop({ products, onAddToCart }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const cat = searchParams.get('category') || '';

  const filtered = cat ? products.filter(p => p.category === cat) : products;

  return (
    <section className="section">
      <div className="container">
        <div className="shop-layout">

          {/* Sidebar */}
          <aside className="shop-sidebar">
            <div className="sidebar-block">
              <div className="sidebar-title">Categories</div>
              <div className="sidebar-categories-wrap">
                <button
                  className={`sidebar-cat-btn${!cat ? ' active' : ''}`}
                  onClick={() => setSearchParams({})}
                >
                  All Products <span style={{ color:'var(--muted)', fontSize:'0.8rem', marginLeft: 8 }}>{products.length}</span>
                </button>
                {CATS.map(c => {
                  const count = products.filter(p => p.category === c).length;
                  if (!count) return null;
                  return (
                    <button
                      key={c}
                      className={`sidebar-cat-btn${cat === c ? ' active' : ''}`}
                      onClick={() => setSearchParams({ category: c })}
                    >
                      {c} <span style={{ color:'var(--muted)', fontSize:'0.8rem', marginLeft: 8 }}>{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* Main */}
          <main className="shop-main">
            <div className="section-header" style={{ marginBottom:24 }}>
              <div>
                <div className="section-eyebrow">Catalogue</div>
                <h1 className="section-title">{cat || 'All Products'}</h1>
              </div>
              <span style={{ color:'var(--muted)', fontSize:'0.9rem', fontWeight:600 }}>
                {filtered.length} result{filtered.length !== 1 ? 's' : ''}
              </span>
            </div>

            {filtered.length === 0 ? (
              <div style={{ padding:'80px 0', textAlign:'center', color:'var(--muted)' }}>
                <p style={{ fontSize:'1.2rem', marginBottom:16 }}>No products found.</p>
                <button onClick={() => setSearchParams({})} className="btn-primary">View All Parts</button>
              </div>
            ) : (
              <div className="product-grid">
                {filtered.map(p => (
                  <ProductCard key={p.id} product={p} onAddToCart={onAddToCart} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </section>
  );
}
