import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, User, ShoppingCart, Phone, Mail, Sun, Moon, Droplets, Disc, SlidersHorizontal, FlaskConical, PackageOpen, Layers, LogOut, Shield } from 'lucide-react';

export default function Header({ cartCount, theme, toggleTheme, user, onLogout }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <header>
      {/* Top Bar */}
      <div className="header-topbar">
        <div className="container">
          <div className="topbar-left">
            <span style={{ display:'flex', alignItems:'center', gap:6 }}><Phone size={12}/> 011 234 5678</span>
            <span style={{ display:'flex', alignItems:'center', gap:6 }}><Mail size={12}/> info@khkautoparts.lk</span>
            <span style={{ display:'flex', alignItems:'center', gap:6 }}>Free delivery on orders over Rs. 5,000</span>
          </div>
          <div className="topbar-right">
            <Link to="/track">Track My Order</Link>
            <Link to="/contact">Contact</Link>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className={`main-header${scrolled ? ' scrolled' : ''}`}>
        <div className="container">
          <Link to="/" className="site-logo">
            <img src="/logo.png" alt="KHK Logo" style={{ height: '40px', width: 'auto' }} />
          </Link>

          <div className="header-search">
            <input type="text" placeholder="Search parts, models, brands..." />
            <button><Search size={20} /></button>
          </div>

          <div className="header-icons">
            {/* ── Theme Toggle ── */}
            <button className="theme-toggle" onClick={toggleTheme} title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
              {theme === 'dark' ? <Sun size={15}/> : <Moon size={15}/>}
              <div className="theme-toggle-track">
                <div className="theme-toggle-knob"></div>
              </div>
              {theme === 'dark' ? 'Light' : 'Dark'}
            </button>

            {user ? (
              <>
                {user.role === 'admin' && (
                  <Link to="/admin" className="icon-btn" style={{ color: 'var(--red)' }}>
                    <Shield size={22} />
                    <span className="icon-label">Admin</span>
                  </Link>
                )}
                <Link to="/account" className="icon-btn">
                  <User size={22} />
                  <span className="icon-label">My Account</span>
                </Link>
                <button onClick={onLogout} className="icon-btn">
                  <LogOut size={22} />
                  <span className="icon-label">Logout</span>
                </button>
              </>
            ) : (
              <Link to="/login" className="icon-btn">
                <User size={22} />
                <span className="icon-label">Sign In</span>
              </Link>
            )}
            
            <Link to="/cart" className="icon-btn cart-icon-wrapper">
              <ShoppingCart size={22} />
              <span className="icon-label">Cart</span>
              {cartCount > 0 && <div className="cart-count">{cartCount}</div>}
            </Link>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="nav-bar">
        <div className="container">
          <Link to="/" className="nav-item">Home</Link>
          <Link to="/shop" className="nav-item"><Layers size={15}/>All Parts</Link>
          <Link to="/shop?category=Engine+Oil" className="nav-item nav-highlight"><Droplets size={15}/>Engine Oil</Link>
          <Link to="/shop?category=Brake+Pads" className="nav-item"><Disc size={15}/>Brakes</Link>
          <Link to="/shop?category=Filters" className="nav-item"><SlidersHorizontal size={15}/>Filters</Link>
          <Link to="/shop?category=Chemicals" className="nav-item"><FlaskConical size={15}/>Chemicals</Link>
          <Link to="/shop?category=Combo+Deals" className="nav-item"><PackageOpen size={15}/>Combo Deals</Link>
          <Link to="/admin" className="nav-item" style={{ marginLeft:'auto' }}>Admin</Link>
        </div>
      </nav>
    </header>
  );
}
