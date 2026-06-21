import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, Droplets, Disc, SlidersHorizontal, FlaskConical, PackageOpen, Snowflake, ChevronDown, Truck, ShieldCheck, Lock, Settings, Sparkles } from 'lucide-react';
import ProductCard from '../components/ProductCard';

const getCategoryIcon = (name) => {
  const n = name.toLowerCase();
  if (n.includes('oil') || n.includes('fluid')) return <Droplets size={32} strokeWidth={1.5} className="cat-strip-icon-svg" />;
  if (n.includes('brake') || n.includes('pad') || n.includes('shoe')) return <Disc size={32} strokeWidth={1.5} className="cat-strip-icon-svg" />;
  if (n.includes('filter')) return <SlidersHorizontal size={32} strokeWidth={1.5} className="cat-strip-icon-svg" />;
  if (n.includes('chemical') || n.includes('additive')) return <FlaskConical size={32} strokeWidth={1.5} className="cat-strip-icon-svg" />;
  if (n.includes('coolant')) return <Snowflake size={32} strokeWidth={1.5} className="cat-strip-icon-svg" />;
  return <PackageOpen size={32} strokeWidth={1.5} className="cat-strip-icon-svg" />;
};
const SLIDES = [
  {
    bg: '/slide_oil.png',
    eyebrow: 'Performance Oils',
    title: ['Maximum', 'Protection.'],
    highlight: 1,
    desc: 'High-performance synthetic oils for every vehicle on the road.',
    cta: 'Shop Engine Oil',
    ctaLink: '/shop?category=Engine+Oil',
  },
  {
    bg: '/slide_brakes.png',
    eyebrow: 'Braking Systems',
    title: ['Stop Faster.', 'Drive Safer.'],
    highlight: 0,
    desc: 'Premium ceramic and performance brake pads for maximum stopping power.',
    cta: 'Shop Brakes',
    ctaLink: '/shop?category=Brake+Pads',
  },
  {
    bg: '/slide_filters.png',
    eyebrow: 'Premium Filters',
    title: ['Breathe', 'Easier.'],
    highlight: 0,
    desc: 'High-flow air filters and OEM-grade oil filters for peak performance.',
    cta: 'Shop Filters',
    ctaLink: '/shop?category=Filters',
  },
  {
    bg: '/slide_coolant.png',
    eyebrow: 'Engine Cooling',
    title: ['Keep It', 'Cool.'],
    highlight: 1,
    desc: 'All-season coolants to prevent overheating and corrosion.',
    cta: 'Shop Coolants',
    ctaLink: '/shop?category=Coolant',
  },
];



export default function Home({ products, categories = [], onAddToCart, onOpenAI }) {
  const [slide, setSlide] = useState(0);
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [vehicleSelected, setVehicleSelected] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const dealsRef = useRef(null);

  // Auto-advance slider
  useEffect(() => {
    const timer = setInterval(() => setSlide(s => (s + 1) % SLIDES.length), 5000);
    fetch('/api/vehicles').then(res => res.json()).then(data => setVehicles(data)).catch(console.error);
    return () => clearInterval(timer);
  }, []);

  const dynamicMakes = [...new Set(vehicles.map(v => v.make))].sort();
  const dynamicModels = [...new Set(vehicles.filter(v => v.make === make).map(v => v.model))].sort();

  const hotDeals = products.filter(p => p.discount_percent > 0);
  const featured = products.slice(0, 8);

  const handleVehicleSearch = () => {
    if (make) setVehicleSelected({ make, model, year });
  };

  return (
    <div>
      {/* ── Hero Slider ── */}
      <div className="hero-slider">
        {SLIDES.map((s, i) => (
          <div
            key={i}
            className={`hero-slide${slide === i ? ' active' : ''}`}
            style={{ backgroundImage: `url('${s.bg}')` }}
          >
            <div className="container">
              <div className="hero-slide-content">
                <div className="hero-eyebrow">{s.eyebrow}</div>
                <h1 className="hero-h1">
                  {s.title.map((line, li) => (
                    <span key={li} style={{ display:'block', color: li === s.highlight ? 'var(--red)' : 'var(--white)' }}>
                      {line}
                    </span>
                  ))}
                </h1>
                <p className="hero-desc">{s.desc}</p>
                <div className="hero-actions">
                  <Link to={s.ctaLink} className="btn-primary">{s.cta} <ArrowRight size={18}/></Link>
                  <Link to="/shop" className="btn-outline">View All Parts</Link>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Dots */}
        <div className="slider-controls">
          <button onClick={() => setSlide(s => (s - 1 + SLIDES.length) % SLIDES.length)} style={{ background:'rgba(255,255,255,0.1)', border:'none', color:'white', width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
            <ChevronLeft size={18}/>
          </button>
          {SLIDES.map((_, i) => (
            <div key={i} className={`slider-dot${slide === i ? ' active' : ''}`} onClick={() => setSlide(i)} />
          ))}
          <button onClick={() => setSlide(s => (s + 1) % SLIDES.length)} style={{ background:'rgba(255,255,255,0.1)', border:'none', color:'white', width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
            <ChevronRight size={18}/>
          </button>
        </div>
      </div>

      {/* ── Trust Strip ── */}
      <div className="trust-strip">
        <div className="container">
          <div className="trust-grid">
            <div className="trust-item">
              <div className="trust-icon"><Truck size={24} /></div>
              <div className="trust-text">
                <h4>Islandwide Delivery</h4>
                <p>Free on orders over Rs. 5,000</p>
              </div>
            </div>
            <div className="trust-item">
              <div className="trust-icon"><ShieldCheck size={24} /></div>
              <div className="trust-text">
                <h4>100% Genuine</h4>
                <p>Authentic auto parts guaranteed</p>
              </div>
            </div>
            <div className="trust-item">
              <div className="trust-icon"><Lock size={24} /></div>
              <div className="trust-text">
                <h4>Secure Payments</h4>
                <p>Safe & secure checkout process</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Vehicle Search Bar ── */}
      <div className="vehicle-banner">
        <div className="container">
          <div className="vehicle-banner-inner">
            <div className="vehicle-banner-header">
              <h2 className="vehicle-banner-title">Find Your Perfect Fit</h2>
              <p className="vehicle-banner-subtitle">Select your vehicle details below to find 100% compatible parts.</p>
            </div>

            <div className="vehicle-banner-controls">
              <div className="veh-selector-box">
                <span className="veh-selector-label">1. Make</span>
                <span className={`veh-selector-val ${!make ? 'placeholder' : ''}`}>{make || 'Select Make'}</span>
                <select className="veh-native-select" value={make} onChange={e => { setMake(e.target.value); setModel(''); }}>
                  <option value="">Select Make</option>
                  {dynamicMakes.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <div className="veh-chevron"><ChevronDown size={20}/></div>
              </div>

              <div className={`veh-selector-box ${!make ? 'disabled' : ''}`}>
                <span className="veh-selector-label">2. Model</span>
                <span className={`veh-selector-val ${!model ? 'placeholder' : ''}`}>{model || 'Select Model'}</span>
                <select className="veh-native-select" value={model} onChange={e => setModel(e.target.value)} disabled={!make}>
                  <option value="">Select Model</option>
                  {dynamicModels.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <div className="veh-chevron"><ChevronDown size={20}/></div>
              </div>

              <div className="veh-selector-box">
                <span className="veh-selector-label">3. Year</span>
                <span className={`veh-selector-val ${!year ? 'placeholder' : ''}`}>{year || 'Select Year'}</span>
                <select className="veh-native-select" value={year} onChange={e => setYear(e.target.value)}>
                  <option value="">Select Year</option>
                  {Array.from({ length: 25 }, (_, i) => new Date().getFullYear() - i).map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <div className="veh-chevron"><ChevronDown size={20}/></div>
              </div>

              <button className="veh-search-btn" onClick={handleVehicleSearch} disabled={!make}>
                Search Parts <ArrowRight size={18}/>
              </button>
            </div>

            {vehicleSelected && (
              <div style={{ textAlign: 'center', marginTop: '-8px' }}>
                <button
                  onClick={() => setVehicleSelected(null)}
                  style={{ color:'var(--muted)', fontSize:'0.85rem', fontWeight:600, padding: '4px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '20px' }}
                >
                  ✕ Clear Selection ({vehicleSelected.make} {vehicleSelected.model})
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Category Strip ── */}
      <div className="category-strip">
        <div className="container">
          <div className="cat-strip-grid">
            {categories.map(c => (
              <Link to={`/shop?category=${encodeURIComponent(c.name)}`} key={c.id} className="cat-strip-item">
                {getCategoryIcon(c.name)}
                <span className="cat-strip-name">{c.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── AI Agent Promo ── */}
      <div className="container" style={{ marginTop: 60, marginBottom: 40 }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(228, 0, 15, 0.05), rgba(0, 0, 0, 0.4))',
          border: '1px solid var(--border)',
          borderRadius: 24,
          padding: '40px',
          display: 'flex',
          alignItems: 'center',
          gap: 30,
          position: 'relative',
          overflow: 'hidden',
          flexWrap: 'wrap'
        }}>
          {/* Decorative glow */}
          <div style={{ position:'absolute', top: '-50%', left: '-10%', width: 300, height: 300, background: 'var(--red)', filter: 'blur(100px)', opacity: 0.15, borderRadius: '50%' }} />
          
          <div style={{ background: 'linear-gradient(135deg, var(--red), #ff4d4d)', width: 80, height: 80, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 8px 32px rgba(228,0,15,0.4)' }}>
             <Sparkles size={40} color="white" />
          </div>
          
          <div style={{ flex: 1, zIndex: 1, minWidth: 280 }}>
            <h2 style={{ fontSize: '2rem', fontFamily: 'var(--font-hero)', margin: '0 0 8px 0', color: 'var(--text-main)' }}>
              Meet Your New AI Parts Assistant
            </h2>
            <p style={{ color: 'var(--text-sub)', fontSize: '1.1rem', margin: '0 0 20px 0', maxWidth: 650, lineHeight: 1.6 }}>
              Not sure which part fits your car? Just tell us what you need! For example: <span style={{ color: 'var(--red)', fontWeight: '600' }}>"I need brake pads for a Toyota Corolla"</span>. Our intelligent assistant will find the exact match instantly.
            </p>
            <button 
              onClick={onOpenAI}
              className="btn-primary"
            >
              <Sparkles size={18} /> Try AI Assistant
            </button>
          </div>
        </div>
      </div>

      {/* ── Hot Deals ── */}
      {hotDeals.length > 0 && (
        <section className="section section-dark">
          <div className="container">
            <div className="section-header">
              <div className="section-title-wrap">
                <div className="section-eyebrow">Limited Time</div>
                <h2 className="section-title">🔥 Hot Deals</h2>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button className="deal-nav-btn" onClick={() => dealsRef.current?.scrollBy({ left: -310, behavior:'smooth' })}>
                  <ChevronLeft size={18}/>
                </button>
                <button className="deal-nav-btn" onClick={() => dealsRef.current?.scrollBy({ left: 310, behavior:'smooth' })}>
                  <ChevronRight size={18}/>
                </button>
              </div>
            </div>
            <div className="deals-row" ref={dealsRef}>
              {hotDeals.map((p, i) => (
                <ProductCard key={p.id} product={p} onAddToCart={onAddToCart} vehicleSelected={vehicleSelected} categories={categories} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Featured Products ── */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div className="section-title-wrap">
              <div className="section-eyebrow">Full Catalogue</div>
              <h2 className="section-title">Featured Products</h2>
            </div>
            <Link to="/shop" className="btn-ghost">
              Browse All <ArrowRight size={16}/>
            </Link>
          </div>
          <div className="product-grid">
            {featured.map(p => (
              <ProductCard key={p.id} product={p} onAddToCart={onAddToCart} vehicleSelected={vehicleSelected} categories={categories} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
