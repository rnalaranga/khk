import React, { useState, useEffect } from 'react';

export default function Navbar({ theme, onThemeToggle, cartCount, onCartOpen, view, onViewChange }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="nav-logo" style={{ cursor: 'pointer' }} onClick={() => onViewChange('shop')}>
        KH<span>K</span>
      </div>

      {(view === 'shop' || view === 'liquimoly' || view === 'chemicals') && (
        <div className="nav-links">
          <button className={`nav-link ${view === 'shop' ? 'active' : ''}`} onClick={() => onViewChange('shop')}>Home</button>
          <button className={`nav-link ${view === 'chemicals' ? 'active' : ''}`} onClick={() => onViewChange('chemicals')}>Chemicals</button>
          <button className={`nav-link ${view === 'liquimoly' ? 'active' : ''}`} onClick={() => onViewChange('liquimoly')}>Liqui Moly</button>
          <button className="nav-link">Contact</button>
        </div>
      )}

      <div className="nav-actions">
        <button className="nav-link" onClick={() => onViewChange(view === 'admin' ? 'shop' : 'admin')}>
          {view === 'admin' ? 'Back to Shop' : 'Admin Panel'}
        </button>

        <div className="theme-switch" onClick={onThemeToggle}>
          <div className="knob"></div>
          <span style={{marginLeft: 4}}>☀️</span>
          <span style={{marginRight: 4}}>🌙</span>
        </div>

        <button className="cart-btn" onClick={onCartOpen}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
          {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
        </button>
      </div>
    </nav>
  );
}
