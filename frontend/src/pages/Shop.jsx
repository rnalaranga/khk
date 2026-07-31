import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useLocation } from 'react-router-dom';
import { ArrowRight, Filter, X } from 'lucide-react';
import ProductCard from '../components/ProductCard';

export default function Shop({ products, categories = [], onAddToCart }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const cat = searchParams.get('category') || '';
  const [currentPage, setCurrentPage] = useState(1);
  const [isCatOpen, setIsCatOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (location.state?.openCategories) {
      setIsCatOpen(true);
      // Clean up the state so it doesn't trigger on reload/back
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Handle scroll and page resets
  useEffect(() => {
    setCurrentPage(1);
    if (location.state?.scrollToResults) {
      setTimeout(() => {
        const main = document.querySelector('.shop-main');
        if (main) {
           window.scrollTo({ top: main.offsetTop - 20, behavior: 'smooth' });
        } else {
           window.scrollTo({ top: 300, behavior: 'smooth' });
        }
      }, 100);
      window.history.replaceState({}, document.title);
    }
  }, [searchParams, location.state]);

  const searchQ = searchParams.get('search') || '';
  const brandQ = searchParams.get('brand') || '';
  const conditionQ = searchParams.get('condition') || '';
  
  const filtered = products.filter(p => {
    const matchCat = cat ? p.category === cat : true;
    const matchBrand = brandQ ? p.brand_name === brandQ : true;
    const matchCondition = conditionQ ? p.item_condition === conditionQ : true;
    const matchSearch = searchQ 
      ? (p.name?.toLowerCase().includes(searchQ.toLowerCase()) || 
         p.description?.toLowerCase().includes(searchQ.toLowerCase()) ||
         p.brand_name?.toLowerCase().includes(searchQ.toLowerCase()))
      : true;
    return matchCat && matchSearch && matchBrand && matchCondition;
  });
  
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
                  className={`sidebar-cat-btn${!cat && !conditionQ ? ' active' : ''}`}
                  onClick={() => { setSearchParams({}); setIsCatOpen(false); }}
                >
                  All Products <span style={{ color:'var(--muted)', fontSize:'0.8rem', marginLeft: 8 }}>{products.length}</span>
                </button>
                <button
                  className={`sidebar-cat-btn${conditionQ === 'reconditioned' ? ' active' : ''}`}
                  onClick={() => { setSearchParams({ condition: 'reconditioned' }); setIsCatOpen(false); }}
                >
                  <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>Used / Reconditioned</span> <span style={{ color:'var(--muted)', fontSize:'0.8rem', marginLeft: 8 }}>{products.filter(p => p.item_condition === 'reconditioned').length}</span>
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
                <h1 className="section-title">
                  {conditionQ === 'reconditioned' ? 'Used & Reconditioned Parts' : (brandQ ? `${brandQ} Products` : (cat || 'All Products'))}
                </h1>
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
              <div style={{ textAlign:'center', padding:'60px 20px', gridColumn:'1/-1', color:'var(--muted)' }}>
                <div style={{ fontSize:'3rem', marginBottom:16 }}>🔍</div>
                <h3 style={{ color:'var(--text)', fontSize:'1.2rem', marginBottom:8 }}>No products found</h3>
                <p>Try adjusting your search "{searchQ}" or category filters.</p>
                <button onClick={() => setSearchParams({})} className="btn-primary" style={{ marginTop: 16 }}>View All Parts</button>
              </div>
            ) : (
              <>
                <div className="product-grid">
                  {currentProducts.map(p => (
                    <ProductCard key={p.id} product={p} onAddToCart={onAddToCart} categories={categories} />
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
