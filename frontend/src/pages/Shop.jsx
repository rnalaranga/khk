import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ArrowRight, Filter, X } from 'lucide-react';
import ProductCard from '../components/ProductCard';

export default function Shop({ products, categories = [], onAddToCart }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const cat = searchParams.get('category') || '';
  const [currentPage, setCurrentPage] = useState(1);
  const [isCatOpen, setIsCatOpen] = useState(false);

  // Reset page when category changes
  useEffect(() => {
    setCurrentPage(1);
  }, [cat]);

  const filtered = cat ? products.filter(p => p.category === cat) : products;
  
  const ITEMS_PER_PAGE = 12;
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const currentProducts = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <section className="section">
      <div className="container">
        <div className="shop-layout">

          {/* Mobile Overlay */}
          {isCatOpen && <div className="cart-overlay" onClick={() => setIsCatOpen(false)} style={{ zIndex: 1999 }} />}

          {/* Sidebar */}
          <aside className={`shop-sidebar ${isCatOpen ? 'drawer-open' : ''}`}>
            <div className="sidebar-block">
              <div className="sidebar-title-row">
                <div className="sidebar-title">Categories</div>
                <button className="mobile-close-btn" onClick={() => setIsCatOpen(false)}><X size={20}/></button>
              </div>
              <div className="sidebar-categories-wrap">
                <button
                  className={`sidebar-cat-btn${!cat ? ' active' : ''}`}
                  onClick={() => { setSearchParams({}); setIsCatOpen(false); }}
                >
                  All Products <span style={{ color:'var(--muted)', fontSize:'0.8rem', marginLeft: 8 }}>{products.length}</span>
                </button>
                {categories.map(c => {
                  const count = products.filter(p => p.category === c.name).length;
                  if (!count) return null;
                  return (
                    <button
                      key={c.id}
                      className={`sidebar-cat-btn${cat === c.name ? ' active' : ''}`}
                      onClick={() => { setSearchParams({ category: c.name }); setIsCatOpen(false); }}
                    >
                      {c.name} <span style={{ color:'var(--muted)', fontSize:'0.8rem', marginLeft: 8 }}>{count}</span>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ color:'var(--muted)', fontSize:'0.9rem', fontWeight:600 }}>
                  {filtered.length} result{filtered.length !== 1 ? 's' : ''}
                </span>
                <button className="mobile-filter-btn btn-outline" onClick={() => setIsCatOpen(true)} style={{ display: 'none', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: '8px' }}>
                  <Filter size={16}/> Categories
                </button>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div style={{ padding:'80px 0', textAlign:'center', color:'var(--muted)' }}>
                <p style={{ fontSize:'1.2rem', marginBottom:16 }}>No products found.</p>
                <button onClick={() => setSearchParams({})} className="btn-primary">View All Parts</button>
              </div>
            ) : (
              <>
                <div className="product-grid">
                  {currentProducts.map(p => (
                    <ProductCard key={p.id} product={p} onAddToCart={onAddToCart} />
                  ))}
                </div>
                {totalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '32px' }}>
                    <button 
                      className="btn-outline" 
                      disabled={currentPage === 1} 
                      onClick={() => { setCurrentPage(prev => prev - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      style={{ padding: '8px 16px', borderRadius: '4px' }}
                    >
                      Previous
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                      Page {currentPage} of {totalPages}
                    </div>
                    <button 
                      className="btn-outline" 
                      disabled={currentPage === totalPages} 
                      onClick={() => { setCurrentPage(prev => prev + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      style={{ padding: '8px 16px', borderRadius: '4px' }}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </section>
  );
}
