import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Layers, ShoppingCart, User, Sparkles } from 'lucide-react';

export default function MobileBottomNav({ user, cartCount, onOpenAI, isAIChatOpen }) {
  const location = useLocation();

  if (location.pathname.startsWith('/admin')) return null;

  return (
    <nav className="mobile-bottom-nav">
      <Link to="/" className={`bottom-nav-item ${location.pathname === '/' ? 'active' : ''}`}>
        <Home size={22} />
        <span>Home</span>
      </Link>
      
      <Link to="/shop" state={{ openCategories: true }} className={`bottom-nav-item ${location.pathname === '/shop' ? 'active' : ''}`}>
        <Layers size={22} />
        <span>Categories</span>
      </Link>

      {/* Center AI Agent Button */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', position: 'relative' }}>
        {!isAIChatOpen && (
          <div style={{
            position: 'absolute',
            top: -55,
            background: 'var(--red)',
            color: 'white',
            padding: '4px 10px',
            borderRadius: 16,
            fontSize: '0.75rem',
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
            animation: 'ai-bounce 2s infinite, ai-tooltip 0.5s ease-out',
            boxShadow: '0 4px 12px rgba(228, 0, 15, 0.4)',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}>
            ✨ Ask AI
            <div style={{
              position: 'absolute',
              bottom: -4,
              left: '50%',
              transform: 'translateX(-50%) rotate(45deg)',
              width: 8,
              height: 8,
              background: 'var(--red)'
            }}></div>
          </div>
        )}
        <button 
          onClick={onOpenAI}
          style={{
            width: 56, 
            height: 56, 
            borderRadius: '50%', 
            background: 'linear-gradient(135deg, var(--red), #ff4d4d)',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            color: 'white', 
            border: '4px solid var(--bg-body)',
            boxShadow: '0 -4px 16px rgba(228, 0, 15, 0.3)', 
            marginTop: -24, 
            zIndex: 10, 
            cursor: 'pointer'
          }}
        >
          <Sparkles size={24} />
        </button>
      </div>

      <Link to="/cart" className={`bottom-nav-item ${location.pathname === '/cart' ? 'active' : ''}`}>
        <div style={{ position: 'relative' }}>
          <ShoppingCart size={22} />
          {cartCount > 0 && <span className="bottom-nav-badge">{cartCount}</span>}
        </div>
        <span>Cart</span>
      </Link>

      <Link 
        to={user ? "/account" : "/login"} 
        className={`bottom-nav-item ${(location.pathname === '/account' || location.pathname === '/login') ? 'active' : ''}`}
      >
        <User size={22} />
        <span>{user ? 'Account' : 'Login'}</span>
      </Link>
    </nav>
  );
}
