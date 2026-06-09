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
import { MessageCircle } from 'lucide-react';

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
  }, [user]);

  // Sync cart to localStorage
  useEffect(() => {
    localStorage.setItem('khk_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const toggleTheme = useCallback(() => {setTheme(t => t === 'dark' ? 'light' : 'dark')}, []);

  const addToast = useCallback((msg, type = 'info') => {
    const id = ++toastId.current;
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  }, []);

  const addToCart = useCallback((product) => {
    const existing = cartItems.find(i => i.id === product.id);
    if (existing) {
      if (existing.qty >= product.stock) {
        addToast(`Only ${product.stock} items available in stock`, 'error');
        return;
      }
      addToast(`${product.name} — quantity updated`, 'info');
      setBumpCart(true);
      setTimeout(() => setBumpCart(false), 300);
      setCartItems(cartItems.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i));
    } else {
      if (product.stock <= 0) {
        addToast(`Item is out of stock`, 'error');
        return;
      }
      addToast(`${product.name} added to cart`, 'success');
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
        <a href="https://wa.me/94701234567" target="_blank" rel="noreferrer" className="floating-whatsapp">
          <MessageCircle size={28} />
          <div className="floating-whatsapp-tooltip">Chat with us!</div>
        </a>
        <ToastStack toasts={toasts} />
      </div>
    </BrowserRouter>
  );
}
