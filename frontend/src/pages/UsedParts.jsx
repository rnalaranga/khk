import React, { useState, useEffect } from 'react';
import { Search, Sparkles, X, Filter, ChevronDown, Loader2 } from 'lucide-react';
import ProductCard from '../components/ProductCard';

export default function UsedParts({ products = [], categories = [], onAddToCart }) {
  const [searchQ, setSearchQ] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [selectedMake, setSelectedMake] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [vehicles, setVehicles] = useState([]);
  const [aiQuery, setAiQuery] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResults, setAiResults] = useState(null);
  const [aiMessage, setAiMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  useEffect(() => {
    fetch('/api/vehicles').then(r => r.json()).then(setVehicles).catch(console.error);
  }, []);

  // Only reconditioned items
  const base = products.filter(p => p.item_condition === 'reconditioned');

  // Unique categories from reconditioned items
  const usedCategories = [...new Set(base.map(p => p.category).filter(Boolean))];

  // Vehicle makes / models from fetched vehicles
  const makes = [...new Set(vehicles.map(v => v.make))].sort();
  const models = [...new Set(vehicles.filter(v => v.make === selectedMake).map(v => v.model))].sort();

  // Manual filter (when no AI results)
  const manualFiltered = base.filter(p => {
    const matchCat = selectedCat ? p.category === selectedCat : true;
    const matchSearch = searchQ
      ? (p.name?.toLowerCase().includes(searchQ.toLowerCase()) ||
         p.description?.toLowerCase().includes(searchQ.toLowerCase()))
      : true;
    const matchVehicle = selectedMake
      ? ((p.compatible_vehicles || '').toLowerCase().includes(selectedMake.toLowerCase()) ||
         (p.vehicle_names || []).some(v => v.toLowerCase().includes(selectedMake.toLowerCase())))
      : true;
    const matchModel = selectedModel
      ? ((p.compatible_vehicles || '').toLowerCase().includes(selectedModel.toLowerCase()) ||
         (p.vehicle_names || []).some(v => v.toLowerCase().includes(selectedModel.toLowerCase())))
      : true;
    return matchCat && matchSearch && matchVehicle && matchModel;
  });

  // Use AI results if available, else manual
  const displayProducts = aiResults !== null
    ? aiResults.filter(p => p.item_condition === 'reconditioned')
    : manualFiltered;

  const totalPages = Math.ceil(displayProducts.length / ITEMS_PER_PAGE);
  const currentProducts = displayProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleAiSearch = async (e) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    setAiResults(null);
    setAiMessage('');
    try {
      const res = await fetch('/api/ai/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: `${aiQuery} (reconditioned used parts only)` })
      });
      const data = await res.json();
      if (data.products && data.products.length > 0) {
        setAiResults(data.products);
        setAiMessage(`AI found ${data.products.filter(p => p.item_condition === 'reconditioned').length} reconditioned parts for "${aiQuery}"`);
      } else {
        setAiResults([]);
        setAiMessage(`No reconditioned parts found for "${aiQuery}". Try different keywords.`);
      }
    } catch {
      setAiMessage('AI search failed. Please try again.');
    } finally {
      setAiLoading(false);
      setCurrentPage(1);
    }
  };

  const clearAi = () => {
    setAiResults(null);
    setAiQuery('');
    setAiMessage('');
    setCurrentPage(1);
  };

  const clearAll = () => {
    setSearchQ('');
    setSelectedCat('');
    setSelectedMake('');
    setSelectedModel('');
    setCurrentPage(1);
    clearAi();
  };

  const hasFilters = searchQ || selectedCat || selectedMake || selectedModel || aiResults !== null;

  return (
    <div style={{ background: 'var(--bg-body)', minHeight: '100vh' }}>

      {/* ── Hero Banner ── */}
      <div style={{ background: 'var(--dark)', borderBottom: '1px solid var(--border)', padding: '60px 0 40px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'var(--red)' }} />
        <div style={{ position: 'absolute', top: 0, right: 0, width: 400, height: '100%', background: 'radial-gradient(ellipse at top right, rgba(228,0,15,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="section-eyebrow">Vendor Marketplace</div>
          <h1 className="section-title" style={{ marginBottom: 8 }}>Used &amp; Reconditioned Parts</h1>
          <p style={{ color: 'var(--muted)', fontSize: '1rem', marginBottom: 32, maxWidth: 560 }}>
            High-quality reconditioned spare parts from verified vendors. Budget-friendly, inspected, and ready to fit.
          </p>

          {/* AI Search Bar */}
          <form onSubmit={handleAiSearch} style={{ display: 'flex', gap: 10, maxWidth: 640 }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 12, padding: '0 16px', backdropFilter: 'blur(12px)' }}>
              <Sparkles size={18} style={{ color: 'var(--red)', flexShrink: 0 }} />
              <input
                type="text"
                value={aiQuery}
                onChange={e => setAiQuery(e.target.value)}
                placeholder="Ask AI — e.g. Brake pads for Toyota Corolla 2015..."
                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--white)', fontSize: '0.95rem', padding: '14px 0', fontFamily: 'var(--font-ui)' }}
              />
              {aiQuery && <button type="button" onClick={() => setAiQuery('')} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 4 }}><X size={16}/></button>}
            </div>
            <button type="submit" className="btn-primary" disabled={aiLoading} style={{ padding: '0 24px', flexShrink: 0 }}>
              {aiLoading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <><Sparkles size={16} style={{ marginRight: 6 }}/> Ask AI</>}
            </button>
          </form>

          {aiMessage && (
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10, color: aiResults?.length === 0 ? 'var(--muted)' : '#4ade80', fontSize: '0.9rem' }}>
              <span>{aiMessage}</span>
              <button onClick={clearAi} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline' }}>Clear</button>
            </div>
          )}
        </div>
      </div>

      {/* ── Filters + Grid ── */}
      <div className="container section" style={{ display: 'flex', gap: 32, alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* Sidebar Filters */}
        <aside style={{ flex: '0 0 220px', position: 'sticky', top: 80 }}>
          <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 16, padding: 24, backdropFilter: 'blur(12px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <span style={{ fontFamily: 'var(--font-hero)', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--white)' }}>Filters</span>
              {hasFilters && <button onClick={clearAll} style={{ background: 'none', border: 'none', color: 'var(--red)', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}>Clear All</button>}
            </div>

            {/* Keyword Search */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Keyword</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px' }}>
                <Search size={14} color="var(--muted)" />
                <input
                  type="text"
                  value={searchQ}
                  onChange={e => { setSearchQ(e.target.value); setCurrentPage(1); if (aiResults !== null) clearAi(); }}
                  placeholder="Part name..."
                  style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--white)', fontSize: '0.85rem', width: '100%', fontFamily: 'var(--font-ui)' }}
                />
                {searchQ && <button onClick={() => setSearchQ('')} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}><X size={12}/></button>}
              </div>
            </div>

            {/* Category */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Category</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <button
                  onClick={() => { setSelectedCat(''); setCurrentPage(1); }}
                  style={{ textAlign: 'left', padding: '7px 10px', borderRadius: 6, background: !selectedCat ? 'rgba(228,0,15,0.12)' : 'transparent', border: !selectedCat ? '1px solid rgba(228,0,15,0.3)' : '1px solid transparent', color: !selectedCat ? 'var(--red)' : 'var(--muted)', fontSize: '0.85rem', cursor: 'pointer', fontWeight: !selectedCat ? 700 : 400 }}
                >
                  All Categories <span style={{ opacity: 0.5 }}>({base.length})</span>
                </button>
                {usedCategories.map(cat => {
                  const count = base.filter(p => p.category === cat).length;
                  return (
                    <button
                      key={cat}
                      onClick={() => { setSelectedCat(cat); setCurrentPage(1); if (aiResults !== null) clearAi(); }}
                      style={{ textAlign: 'left', padding: '7px 10px', borderRadius: 6, background: selectedCat === cat ? 'rgba(228,0,15,0.12)' : 'transparent', border: selectedCat === cat ? '1px solid rgba(228,0,15,0.3)' : '1px solid transparent', color: selectedCat === cat ? 'var(--red)' : 'var(--muted)', fontSize: '0.85rem', cursor: 'pointer', fontWeight: selectedCat === cat ? 700 : 400 }}
                    >
                      {cat} <span style={{ opacity: 0.5 }}>({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Vehicle Make */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Vehicle Make</div>
              <select
                value={selectedMake}
                onChange={e => { setSelectedMake(e.target.value); setSelectedModel(''); setCurrentPage(1); if (aiResults !== null) clearAi(); }}
                style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 12px', color: 'var(--white)', fontSize: '0.85rem', fontFamily: 'var(--font-ui)', outline: 'none' }}
              >
                <option value="">All Makes</option>
                {makes.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            {/* Vehicle Model */}
            {selectedMake && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Model</div>
                <select
                  value={selectedModel}
                  onChange={e => { setSelectedModel(e.target.value); setCurrentPage(1); if (aiResults !== null) clearAi(); }}
                  style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 12px', color: 'var(--white)', fontSize: '0.85rem', fontFamily: 'var(--font-ui)', outline: 'none' }}
                >
                  <option value="">All Models</option>
                  {models.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            )}

          </div>
        </aside>

        {/* Main Grid */}
        <main style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <div className="section-eyebrow">Used Parts</div>
              <h2 className="section-title" style={{ fontSize: '1.8rem' }}>
                {selectedCat || 'All Reconditioned'}
              </h2>
            </div>
            <span style={{ color: 'var(--muted)', fontSize: '0.9rem', fontWeight: 600 }}>
              {displayProducts.length} result{displayProducts.length !== 1 ? 's' : ''}
            </span>
          </div>

          {currentProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 16 }}>
              <div style={{ fontSize: '3rem', marginBottom: 16 }}>🔍</div>
              <h3 style={{ color: 'var(--white)', fontFamily: 'var(--font-hero)', fontSize: '1.2rem', textTransform: 'uppercase', marginBottom: 8 }}>No parts found</h3>
              <p style={{ marginBottom: 20 }}>Try different keywords, categories or vehicle filters.</p>
              <button onClick={clearAll} className="btn-primary">Reset Filters</button>
            </div>
          ) : (
            <>
              <div className="product-grid">
                {currentProducts.map(p => (
                  <ProductCard key={p.id} product={p} onAddToCart={onAddToCart} categories={categories} />
                ))}
              </div>
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 32 }}>
                  <button className="btn-outline" disabled={currentPage === 1} onClick={() => { setCurrentPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }} style={{ padding: '8px 16px' }}>Previous</button>
                  <span style={{ display: 'flex', alignItems: 'center', padding: '0 16px', color: 'var(--muted)', fontWeight: 600 }}>Page {currentPage} of {totalPages}</span>
                  <button className="btn-outline" disabled={currentPage === totalPages} onClick={() => { setCurrentPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }} style={{ padding: '8px 16px' }}>Next</button>
                </div>
              )}
            </>
          )}
        </main>

      </div>
    </div>
  );
}
