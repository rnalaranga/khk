import React, { useState, useCallback, useRef, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Shop from './pages/Shop';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Account from './pages/Account';
import AdminPanel from './pages/AdminPanel';

// Products are now fetched from backend

function ToastStack({ toasts }) {
  return (
    <div className="toast-stack">
      {toasts.map(t => (
        <div key={t.id} className={`toast${t.type === 'success' ? ' toast-success' : ''}`}>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [products, setProducts]   = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [toasts, setToasts]       = useState([]);
  const [theme, setTheme]         = useState(() => localStorage.getItem('khk_theme') || 'dark');
  const [user, setUser]           = useState(null);
  const toastId = useRef(0);

  // Check auth on load
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch(`/api/auth/me`, {
        headers: { 'x-auth-token': token }
      })
      .then(res => {
        if (!res.ok) throw new Error('Invalid token');
        return res.json();
      })
      .then(userData => {
        setUser(userData);
      })
      .catch(() => {
        localStorage.removeItem('token');
        setUser(null);
      });
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    addToast('Logged out successfully', 'info');
  };

  // Fetch Products
  useEffect(() => {
    fetch(`/api/products`)
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(err => console.error('Failed to load products:', err));
  }, []);

  // Apply theme to <html> element and update mobile status bar color
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('khk_theme', theme);
    
    // Update mobile browser notification/status bar color
    const color = theme === 'dark' ? '#080808' : '#F0F2F5';
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', color);
    } else {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.name = 'theme-color';
      metaThemeColor.content = color;
      document.head.appendChild(metaThemeColor);
    }
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  const addToast = useCallback((msg, type = 'info') => {
    const id = ++toastId.current;
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  }, []);

  const addToCart = useCallback((product) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        addToast(`${product.name} — quantity updated`, 'info');
        return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      }
      addToast(`${product.name} added to cart`, 'success');
      return [...prev, { ...product, qty: 1 }];
    });
  }, [addToast]);

  const updateQty = useCallback((id, d) => {
    setCartItems(p => p.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + d) } : i));
  }, []);

  const removeFromCart = useCallback((id) => {
    setCartItems(p => p.filter(i => i.id !== id));
    addToast('Item removed from cart', 'info');
  }, [addToast]);

  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0);

  return (
    <BrowserRouter>
      <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh' }}>
        <Header cartCount={cartCount} theme={theme} toggleTheme={toggleTheme} user={user} onLogout={handleLogout} />

        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/"        element={<Home products={products} onAddToCart={addToCart} />} />
            <Route path="/shop"    element={<Shop products={products} onAddToCart={addToCart} />} />
            <Route path="/cart"    element={<Cart cartItems={cartItems} onUpdateQty={updateQty} onRemove={removeFromCart} />} />
            <Route path="/checkout" element={<Checkout cartItems={cartItems} user={user} onOrderSuccess={() => { setCartItems([]); addToast('Order placed!', 'success'); }} />} />
            <Route path="/login"   element={<Login onLogin={(u) => { setUser(u); addToast('Logged in successfully', 'success'); }} addToast={addToast} />} />
            <Route path="/account" element={<Account user={user} setUser={setUser} />} />
            <Route path="/admin"   element={<AdminPanel user={user} />} />
          </Routes>
        </main>

        <Footer />
        <ToastStack toasts={toasts} />
      </div>
    </BrowserRouter>
  );
}
