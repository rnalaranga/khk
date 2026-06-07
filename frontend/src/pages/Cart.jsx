import React from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowRight, ShoppingCart } from 'lucide-react';

export default function Cart({ cartItems, onUpdateQty, onRemove }) {
  const subtotal = cartItems.reduce((sum, i) => sum + i.finalPrice * i.qty, 0);
  const shipping = subtotal >= 5000 ? 0 : 500;
  const total = subtotal + shipping;

  if (cartItems.length === 0) {
    return (
      <section className="section" style={{ minHeight:'65vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ textAlign:'center' }}>
          <ShoppingCart size={64} style={{ color:'var(--red)', margin:'0 auto 24px' }}/>
          <h2 className="section-title" style={{ marginBottom:16 }}>Your cart is empty</h2>
          <p style={{ color:'var(--muted)', marginBottom:32 }}>Add some parts to get started.</p>
          <Link to="/shop" className="btn-primary">Browse Parts <ArrowRight size={18}/></Link>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container">
        <div style={{ marginBottom:32 }}>
          <div className="section-eyebrow">Review</div>
          <h1 className="section-title">Shopping Cart</h1>
        </div>

        <div className="cart-page-layout">
          {/* Items */}
          <div className="cart-block">
            <div className="cart-header">
              <span className="cart-header-title">Cart Items ({cartItems.length})</span>
            </div>
            {cartItems.map(item => (
              <div key={item.id} className="cart-row">
                <img
                  src={item.image || '/prod_oil.png'}
                  alt={item.name}
                  className="cart-img"
                />
                <div className="cart-info">
                  <div className="cart-cat">{item.category}</div>
                  <div className="cart-name">{item.name}</div>
                  <div className="cart-qty">
                    <button className="qty-btn" onClick={() => onUpdateQty(item.id, -1)}><Minus size={12}/></button>
                    <span className="qty-val">{item.qty}</span>
                    <button className="qty-btn" onClick={() => onUpdateQty(item.id, 1)}><Plus size={12}/></button>
                  </div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:12 }}>
                  <span className="cart-price">Rs. {(item.finalPrice * item.qty).toLocaleString()}</span>
                  <button className="cart-remove" onClick={() => onRemove(item.id)}>
                    <Trash2 size={14} style={{ display:'inline', marginRight:4 }}/>
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="order-summary-block">
            <div className="summary-title">Order Summary</div>
            <div className="summary-row">
              <span>Subtotal</span>
              <strong>Rs. {subtotal.toLocaleString()}</strong>
            </div>
            <div className="summary-row">
              <span>Shipping</span>
              <strong>{shipping === 0 ? 'FREE' : `Rs. ${shipping.toLocaleString()}`}</strong>
            </div>
            {shipping === 0 && (
              <div style={{ background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.3)', color:'#22C55E', padding:'10px 12px', fontSize:'0.8rem', fontWeight:700, marginBottom:8 }}>
                ✓ You've qualified for free delivery!
              </div>
            )}
            {shipping > 0 && (
              <p style={{ fontSize:'0.78rem', color:'var(--muted)', marginBottom:12 }}>
                Add Rs. {(5000 - subtotal).toLocaleString()} more for free delivery.
              </p>
            )}
            <div className="summary-total-row">
              <span className="summary-total-label">Total</span>
              <span className="summary-total-val">Rs. {total.toLocaleString()}</span>
            </div>
            <Link to="/checkout" className="btn-primary" style={{ width:'100%', marginTop:24 }}>
              Proceed to Checkout <ArrowRight size={18}/>
            </Link>
            <Link to="/shop" className="btn-outline" style={{ width:'100%', marginTop:12 }}>
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
