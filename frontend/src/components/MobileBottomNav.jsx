import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Layers, ShoppingCart, User } from 'lucide-react';

export default function MobileBottomNav({ user, cartCount }) {
  const location = useLocation();

  // Hide bottom nav on admin panel
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
