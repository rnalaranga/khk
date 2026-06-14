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
import MobileBottomNav from './components/MobileBottomNav';
import { MessageCircle } from 'lucide-react';

// Products are now fetched from backend

const playToastSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch(e) {}
};

function ToastStack({ toasts, onDismiss }) {
  const centerToasts = toasts.filter(t => t.pos !== 'top-right');
  const topToasts = toasts.filter(t => t.pos === 'top-right');
  return (
    <>
      <div className="toast-stack toast-center">
        {centerToasts.map(t => (
          <div key={t.id} className="toast-interactive glass-modal" style={{ textAlign: 'center', pointerEvents: 'auto', marginBottom: '20px' }}>
            <h3 style={{ marginTop: 0, color: 'var(--red)', fontFamily: 'var(--font-hero)', textTransform: 'uppercase', fontSize: '1.4rem' }}>{t.title}</h3>
            <p style={{ color: 'var(--text-main)', marginBottom: '24px', fontSize: '1.1rem' }}>{t.msg}</p>
            <button className="btn-primary" style={{ width: '100%', padding: '12px' }} onClick={() => onDismiss(t.id)}>OK</button>
          </div>
        ))}
      </div>
      <div className="toast-stack toast-top-right">
        {topToasts.map(t => (
          <div key={t.id} className={`toast${t.type === 'success' ? ' toast-success' : ''}`}>
            {t.msg}
          </div>
        ))}
      </div>
    </>
  );
}

function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel }) {
  if (!isOpen) return null;
  return (
    <div className="cart-overlay" style={{ zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-modal">
        <h3 style={{ marginTop: 0, color: 'var(--red)', fontFamily: 'var(--font-hero)' }}>{title}</h3>
        <p style={{ color: 'var(--text)', marginBottom: '24px' }}>{message}</p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button className="btn-outline" onClick={onCancel}>Cancel</button>
          <button className="btn-primary" onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [products, setProducts]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('khk_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [toasts, setToasts]       = useState([]);
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('khk_theme');
    if (saved) return saved;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    return 'dark';
  });
  const [user, setUser]           = useState(null);
  const [bumpCart, setBumpCart]   = useState(false);
  const toastId = useRef(0);

  const [confirmState, setConfirmState] = useState({ isOpen: false, title: '', message: '', onConfirm: null, onCancel: null });

  const showConfirm = useCallback((title, message) => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        title,
        message,
        onConfirm: () => {
          setConfirmState(prev => ({ ...prev, isOpen: false }));
          resolve(true);
        },
        onCancel: () => {
          setConfirmState(prev => ({ ...prev, isOpen: false }));
          resolve(false);
        }
      });
    });
  }, []);

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

  // Fetch Products & Categories
  useEffect(() => {
    fetch(`/api/products`)
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(err => console.error('Failed to load products:', err));

    fetch(`/api/categories`)
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(err => console.error('Failed to load categories:', err));
  }, []);

  // Apply theme to <html> element and update mobile status bar color
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('khk_theme', theme);
    
    // Update mobile browser notification/status bar color
    const color = theme === 'dark' ? '#080808' : '#B80000'; // Dark Red for light theme
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

  // Sync cart to localStorage
  useEffect(() => {
    localStorage.setItem('khk_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const toggleTheme = useCallback(() => {setTheme(t => t === 'dark' ? 'light' : 'dark')}, []);

  const removeToast = useCallback((id) => {
    setToasts(p => p.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((msg, type = 'info', pos = 'center', title = '') => {
    const id = ++toastId.current;
    let finalTitle = title;
    if (!finalTitle && pos === 'center') {
      finalTitle = type === 'success' ? 'Success' : type === 'error' ? 'Error' : 'Notice';
    }
    setToasts(p => [...p, { id, msg, type, pos, title: finalTitle }]);
    playToastSound();
    
    if (pos === 'top-right') {
      setTimeout(() => removeToast(id), 3500);
    } else {
      setTimeout(() => removeToast(id), 8000);
    }
  }, [removeToast]);

  const addToCart = useCallback((product) => {
    const existing = cartItems.find(i => i.id === product.id);
    if (existing) {
      if (existing.qty >= product.stock) {
        addToast(`Only ${product.stock} items available in stock`, 'error', 'top-right');
        return;
      }
      addToast(`${product.name} — quantity updated`, 'info', 'top-right');
      setBumpCart(true);
      setTimeout(() => setBumpCart(false), 300);
      setCartItems(cartItems.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i));
    } else {
      if (product.stock <= 0) {
        addToast(`Item is out of stock`, 'error', 'top-right');
        return;
      }
      addToast(`${product.name} added to cart`, 'success', 'top-right');
      setBumpCart(true);
      setTimeout(() => setBumpCart(false), 300);
      setCartItems([...cartItems, { ...product, qty: 1 }]);
    }
  }, [cartItems, addToast]);

  const updateQty = useCallback((id, d) => {
    setCartItems(p => p.map(i => {
      if (i.id === id) {
        const clampedQty = Math.min(i.stock, Math.max(1, i.qty + d));
        return { ...i, qty: clampedQty };
      }
      return i;
    }));
  }, []);

  const removeFromCart = useCallback((id) => {
    setCartItems(p => p.filter(i => i.id !== id));
    addToast('Item removed from cart', 'info');
  }, [addToast]);

  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0);

  return (
    <BrowserRouter>
      <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh' }}>
        <Header cartCount={cartCount} theme={theme} toggleTheme={toggleTheme} user={user} onLogout={handleLogout} bumpCart={bumpCart} />

        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/"        element={<Home products={products} categories={categories} onAddToCart={addToCart} />} />
            <Route path="/shop"    element={<Shop products={products} categories={categories} onAddToCart={addToCart} />} />
            <Route path="/cart"    element={<Cart cartItems={cartItems} onUpdateQty={updateQty} onRemove={removeFromCart} />} />
            <Route path="/checkout" element={<Checkout cartItems={cartItems} user={user} onOrderSuccess={() => { setCartItems([]); addToast('Order placed!', 'success'); }} addToast={addToast} />} />
            <Route path="/login"   element={<Login onLogin={(u) => { setUser(u); addToast('Logged in successfully', 'success'); }} addToast={addToast} />} />
            <Route path="/account" element={<Account user={user} setUser={setUser} addToast={addToast} />} />
            <Route path="/admin"   element={<AdminPanel user={user} addToast={addToast} showConfirm={showConfirm} />} />
          </Routes>
        </main>

        <Footer />
        <a href="https://wa.me/94719010751" target="_blank" rel="noreferrer" className="floating-whatsapp">
          <MessageCircle size={28} />
          <div className="floating-whatsapp-tooltip">Chat with us!</div>
        </a>
        <MobileBottomNav user={user} cartCount={cartCount} />
        <ToastStack toasts={toasts} onDismiss={removeToast} />
        <ConfirmDialog {...confirmState} />
      </div>
    </BrowserRouter>
  );
}
