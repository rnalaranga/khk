import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Droplets, Disc, SlidersHorizontal, FlaskConical, PackageOpen, Snowflake, Wrench, Wind, Zap, Layers, ArrowRight, ChevronLeft, ChevronRight, ChevronDown, Truck, ShieldCheck, Lock } from 'lucide-react';
import ProductCard from '../components/ProductCard';

const CAT_CONFIGS = [
  { match: ['oil', 'fluid'],           icon: Droplets,       color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',   glow: 'rgba(245,158,11,0.3)',  label: 'Engine & Fluids' },
  { match: ['brake', 'pad', 'shoe'],   icon: Disc,           color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   glow: 'rgba(239,68,68,0.3)',  label: 'Braking System' },
  { match: ['filter'],                 icon: SlidersHorizontal, color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)',  glow: 'rgba(139,92,246,0.3)', label: 'Filtration' },
  { match: ['chemical', 'additive'],   icon: FlaskConical,   color: '#10b981', bg: 'rgba(16,185,129,0.12)',  glow: 'rgba(16,185,129,0.3)', label: 'Chemicals' },
  { match: ['coolant'],                icon: Snowflake,      color: '#06b6d4', bg: 'rgba(6,182,212,0.12)',   glow: 'rgba(6,182,212,0.3)',  label: 'Cooling' },
  { match: ['wiper', 'blade'],         icon: Wind,           color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  glow: 'rgba(59,130,246,0.3)', label: 'Wipers' },
  { match: ['combo', 'deal', 'kit'],   icon: Layers,         color: '#ec4899', bg: 'rgba(236,72,153,0.12)',  glow: 'rgba(236,72,153,0.3)', label: 'Combo Deals' },
  { match: ['spark', 'ignition'],      icon: Zap,            color: '#f97316', bg: 'rgba(249,115,22,0.12)',  glow: 'rgba(249,115,22,0.3)', label: 'Ignition' },
  { match: ['tool', 'accessory'],      icon: Wrench,         color: '#6b7280', bg: 'rgba(107,114,128,0.12)', glow: 'rgba(107,114,128,0.3)',label: 'Tools' },
];

const getCatConfig = (name) => {
  const n = name.toLowerCase();
  const cfg = CAT_CONFIGS.find(c => c.match.some(m => n.includes(m)));
  return cfg || { icon: PackageOpen, color: '#e4000f', bg: 'rgba(228,0,15,0.12)', glow: 'rgba(228,0,15,0.3)' };
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
  const [brands, setBrands] = useState([]);
  const dealsRef = useRef(null);

  // Auto-advance slider
  useEffect(() => {
    const timer = setInterval(() => setSlide(s => (s + 1) % SLIDES.length), 5000);
    fetch('/api/vehicles').then(res => res.json()).then(data => setVehicles(data)).catch(console.error);
    fetch('/api/brands').then(res => res.json()).then(data => setBrands(data)).catch(console.error);
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

      {/* ── Shop by Category ── */}
      <section style={{ padding: '80px 0', background: 'var(--dark)' }}>
        <div className="container">
          <div className="section-header">
            <div className="section-title-wrap">
              <div className="section-eyebrow">Browse the Range</div>
              <h2 className="section-title">Shop by Category</h2>
            </div>
          </div>
          <div className="cat-cards-grid">
            {categories.map((c, idx) => {
              const prodCount = products.filter(p => p.category === c.name).length;
              const cfg = getCatConfig(c.name);
              const Icon = cfg.icon;
              return (
                <Link
                  to={`/shop?category=${encodeURIComponent(c.name)}`}
                  key={c.id}
                  className="cat-icon-card"
                  style={{ '--cat-color': cfg.color, '--cat-bg': cfg.bg, '--cat-glow': cfg.glow }}
                >
                  {/* Animated icon orb */}
                  <div className="cat-icon-orb">
                    <div className="cat-icon-ring" />
                    <Icon size={28} strokeWidth={1.8} className="cat-icon-svg" />
                  </div>

                  {/* Text */}
                  <div className="cat-icon-body">
                    <div className="cat-icon-name">{c.name}</div>
                    <div className="cat-icon-count">{prodCount} items</div>
                  </div>

                  {/* Discount badge */}
                  {c.discount_percent > 0 && (
                    <div className="cat-icon-badge">{c.discount_percent}%</div>
                  )}

                  {/* Hover arrow */}
                  <ArrowRight size={16} className="cat-icon-arrow" />

                  {/* Background glow */}
                  <div className="cat-icon-glow" />
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Shop by Brands ── */}
      {brands.length > 0 && (
        <section style={{ padding: '80px 0' }}>
          <div className="container">
            <div className="section-header">
              <div className="section-title-wrap">
                <div className="section-eyebrow">Top Manufacturers</div>
                <h2 className="section-title">Shop by Brand</h2>
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center' }}>
              {brands.map(b => (
                <Link
                  key={b.id}
                  to={`/shop?brand=${encodeURIComponent(b.name)}`}
                  className="home-brand-card"
                  style={{ textDecoration: 'none' }}
                >
                  {/* Logo */}
                  {b.logo_url ? (
                    <img src={`/api/uploads/${b.logo_url}`} alt={b.name} />
                  ) : (
                    <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(228,0,15,0.1)', border: '1px solid rgba(228,0,15,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--red)', fontFamily: 'var(--font-hero)', fontWeight: '900', fontSize: '1.4rem', fontStyle: 'italic', letterSpacing: '-0.02em' }}>
                      {b.name.charAt(0)}
                    </div>
                  )}
                  {/* Name */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: 'var(--white)', fontFamily: 'var(--font-hero)', fontWeight: '800', fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.06em', lineHeight: 1.1 }}>{b.name}</div>
                    {b.discount_percent > 0 && (
                      <div style={{ color: 'var(--red)', fontFamily: 'var(--font-hero)', fontSize: '0.7rem', fontWeight: '800', marginTop: '5px', letterSpacing: '0.04em' }}>{b.discount_percent}% OFF</div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}



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
