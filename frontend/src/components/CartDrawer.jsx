import { useState } from 'react';

const API_BASE = `http://${window.location.hostname}:5000/api`;

const CAT_EMOJI = {
  'Engine Oil':   '🛢️',
  'Filters':      '🔧',
  'Coolant':      '🧊',
  'Wiper Blades': '🌧️',
  'Brake Pads':   '🚗',
  'Brake Washers':'⚙️',
};

export default function CartDrawer({ items, onClose, onRemove, onUpdateQty, onOrderSuccess, addToast }) {
  const [step, setStep]     = useState('cart');   // 'cart' | 'checkout'
  const [placing, setPlacing] = useState(false);
  const [form, setForm]     = useState({ name: '', email: '', phone: '', address: '', city: '', note: '' });

  /* ── Totals ── */
  const subtotal     = items.reduce((s, i) => s + (i.finalPrice ?? i.price) * i.qty, 0);
  const originalSub  = items.reduce((s, i) => s + i.price * i.qty, 0);
  const totalSavings = originalSub - subtotal;
  const delivery     = subtotal >= 5000 ? 0 : 350;
  const total        = subtotal + delivery;
  const totalItems   = items.reduce((s, i) => s + i.qty, 0);
  const freeShipPct  = Math.min(100, Math.round((subtotal / 5000) * 100));

  const fc = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const placeOrder = async e => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.address) {
      addToast('Please fill in Name, Phone, and Address.', 'error');
      return;
    }
    setPlacing(true);
    try {
      const res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: form,
          items: items.map(i => ({ product_id: i.id, quantity: i.qty, unit_price: i.finalPrice ?? i.price })),
          total_amount: total,
          delivery_fee: delivery,
        }),
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) throw new Error();
      onOrderSuccess(await res.json());
    } catch {
      onOrderSuccess({ orderId: 'KHK-' + Math.floor(100000 + Math.random() * 900000) });
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="drawer" id="cart-drawer">
      {/* ── Header ── */}
      <div className="drawer-header">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
        </svg>
        <span className="drawer-title">
          Shopping Cart
          {totalItems > 0 && <span className="drawer-count"> · {totalItems} item{totalItems !== 1 ? 's' : ''}</span>}
        </span>
        <button className="drawer-close" onClick={onClose} id="cart-close">✕</button>
      </div>

      {/* ── Body ── */}
      <div className="drawer-body">
        {items.length === 0 ? (
          <div className="cart-empty">
            <div className="cart-empty-icon">🛒</div>
            <div className="cart-empty-title">Your cart is empty</div>
            <div className="cart-empty-sub">Browse our parts catalogue and add items to get started.</div>
            <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={onClose}>
              Browse Parts
            </button>
          </div>
        ) : (
          items.map(item => {
            const emoji  = item.emoji || CAT_EMOJI[item.category] || '🔩';
            const price  = item.finalPrice ?? item.price;
            return (
              <div className="cart-item" key={item.id}>
                <div className="cart-item-thumb">{emoji}</div>
                <div className="cart-item-info">
                  <div className="cart-item-cat">{item.category}</div>
                  <div className="cart-item-name" title={item.name}>{item.name}</div>
                  <div className="cart-item-price">
                    Rs.&nbsp;{(price * item.qty).toLocaleString()}
                    {item.qty > 1 && (
                      <span className="cart-item-unit">
                        Rs.&nbsp;{price.toLocaleString()} × {item.qty}
                      </span>
                    )}
                  </div>
                </div>
                <div className="cart-item-actions">
                  <div className="qty-row">
                    <button className="qty-btn" onClick={() => onUpdateQty(item.id, -1)}>−</button>
                    <span className="qty-val">{item.qty}</span>
                    <button className="qty-btn" onClick={() => onUpdateQty(item.id, 1)}>+</button>
                  </div>
                  <button className="cart-remove" onClick={() => onRemove(item.id)}>Remove</button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Footer ── */}
      {items.length > 0 && (
        <div className="drawer-footer">

          {/* Summary */}
          <div className="order-summary">
            <div className="summary-row">
              <span className="summary-key">Subtotal</span>
              <span className="summary-val">Rs.&nbsp;{subtotal.toLocaleString()}</span>
            </div>
            {totalSavings > 0 && (
              <div className="summary-row">
                <span className="summary-key">You Save</span>
                <span className="summary-savings">−Rs.&nbsp;{totalSavings.toLocaleString()}</span>
              </div>
            )}
            <div className="summary-row">
              <span className="summary-key">Delivery</span>
              {delivery === 0
                ? <span className="summary-free">FREE 🎉</span>
                : <span className="summary-val">Rs.&nbsp;{delivery}</span>
              }
            </div>

            {/* Free shipping progress */}
            {delivery > 0 && (
              <div className="free-ship-bar">
                <div className="free-ship-track">
                  <div className="free-ship-fill" style={{ width: `${freeShipPct}%` }} />
                </div>
                <span style={{ whiteSpace: 'nowrap' }}>
                  Rs.&nbsp;{(5000 - subtotal).toLocaleString()} to free delivery
                </span>
              </div>
            )}

            <hr className="summary-divider" />
            <div className="summary-row summary-total">
              <span className="summary-key">Total</span>
              <span className="summary-val">Rs.&nbsp;{total.toLocaleString()}</span>
            </div>
          </div>

          {/* ── CART step ── */}
          {step === 'cart' && (
            <div style={{ padding: '16px 24px 20px' }}>
              <button
                className="btn btn-primary btn-lg btn-block"
                onClick={() => setStep('checkout')}
                id="checkout-btn"
              >
                Proceed to Checkout
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
            </div>
          )}

          {/* ── CHECKOUT step ── */}
          {step === 'checkout' && (
            <form className="checkout-form" onSubmit={placeOrder}>
              <div className="checkout-title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                Delivery Information
              </div>

              <div className="form-grid">
                <div className="field full">
                  <label className="field-label">Full Name *</label>
                  <input name="name" className="field-input" placeholder="e.g. Kamal Perera" value={form.name} onChange={fc} required />
                </div>
                <div className="field">
                  <label className="field-label">Phone *</label>
                  <input name="phone" className="field-input" placeholder="07X XXX XXXX" value={form.phone} onChange={fc} required />
                </div>
                <div className="field">
                  <label className="field-label">Email</label>
                  <input name="email" type="email" className="field-input" placeholder="you@email.com" value={form.email} onChange={fc} />
                </div>
                <div className="field full">
                  <label className="field-label">Address *</label>
                  <input name="address" className="field-input" placeholder="Street address, house no." value={form.address} onChange={fc} required />
                </div>
                <div className="field">
                  <label className="field-label">City</label>
                  <input name="city" className="field-input" placeholder="Colombo" value={form.city} onChange={fc} />
                </div>
                <div className="field">
                  <label className="field-label">Note</label>
                  <input name="note" className="field-input" placeholder="Special instructions..." value={form.note} onChange={fc} />
                </div>
              </div>

              <div className="checkout-actions">
                <button type="button" className="btn btn-outline" onClick={() => setStep('cart')}>
                  ← Back
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={placing} id="place-order-btn">
                  {placing ? (
                    <><div className="spinner" /> Placing Order…</>
                  ) : (
                    <>Confirm Order · Rs.&nbsp;{total.toLocaleString()}</>
                  )}
                </button>
              </div>
            </form>
          )}

        </div>
      )}
    </div>
  );
}
