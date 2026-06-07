import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="footer-brand-name">
              <img src="/logo.png" alt="KHK Logo" style={{ height: '36px', width: 'auto', marginBottom: '16px' }} />
            </div>
            <p className="footer-desc">
              Sri Lanka's premier destination for genuine OEM and high-performance aftermarket auto parts.
              Professional grade parts for every vehicle, delivered island-wide.
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:24 }}>
              <span style={{ display:'flex', alignItems:'center', gap:8, color:'var(--muted)', fontSize:'0.85rem' }}><Phone size={14} style={{ color:'var(--red)' }}/> 011 234 5678</span>
              <span style={{ display:'flex', alignItems:'center', gap:8, color:'var(--muted)', fontSize:'0.85rem' }}><Mail size={14} style={{ color:'var(--red)' }}/> info@khkautoparts.lk</span>
              <span style={{ display:'flex', alignItems:'center', gap:8, color:'var(--muted)', fontSize:'0.85rem' }}><MapPin size={14} style={{ color:'var(--red)' }}/> Colombo 07, Sri Lanka</span>
            </div>
          </div>

          <div>
            <div className="footer-col-title">Shop</div>
            <ul className="footer-links">
              <li><Link to="/shop?category=Engine+Oil">Engine Oil</Link></li>
              <li><Link to="/shop?category=Brake+Pads">Brake Pads</Link></li>
              <li><Link to="/shop?category=Filters">Filters</Link></li>
              <li><Link to="/shop?category=Chemicals">Chemicals &amp; Additives</Link></li>
              <li><Link to="/shop?category=Combo+Deals">Combo Deals</Link></li>
            </ul>
          </div>

          <div>
            <div className="footer-col-title">Support</div>
            <ul className="footer-links">
              <li><Link to="/track">Track Order</Link></li>
              <li><Link to="/returns">Returns &amp; Exchanges</Link></li>
              <li><Link to="/shipping">Shipping Info</Link></li>
              <li><Link to="/contact">Contact Us</Link></li>
              <li><Link to="/faq">FAQ</Link></li>
            </ul>
          </div>

          <div>
            <div className="footer-col-title">Account</div>
            <ul className="footer-links">
              <li><Link to="/login">Sign In</Link></li>
              <li><Link to="/login">Register</Link></li>
              <li><Link to="/account">My Orders</Link></li>
              <li><Link to="/admin">Admin Panel</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-credit">
            Designed &amp; Developed by <span>Rashitha Nalaranga</span>
          </div>
          <div className="footer-bottom-info">
            <span>&copy; {new Date().getFullYear()} KHK Auto Parts. All rights reserved.</span>
            <span className="footer-separator">|</span>
            <span>Built for Sri Lanka 🇱🇰</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
