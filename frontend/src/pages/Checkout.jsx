import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, CreditCard, Truck, CheckCircle, Building2 } from 'lucide-react';

export default function Checkout({ cartItems, onOrderSuccess, user }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    firstName:'', lastName:'', phone:'', email:'', address:'', city:'', payment:'cod'
  });

  // Pre-fill form if user is logged in
  React.useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login?redirect=/checkout');
      return;
    }
    if (user) {
      const parts = user.name ? user.name.split(' ') : [];
      setForm(f => ({
        ...f,
        firstName: parts[0] || '',
        lastName: parts.slice(1).join(' ') || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || ''
      }));
    }
  }, [user]);

  const subtotal = cartItems.reduce((s, i) => s + i.finalPrice * i.qty, 0);
  const shipping = subtotal >= 5000 ? 0 : 500;
  const total = subtotal + shipping;

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleStep1 = (e) => {
    e.preventDefault();
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['x-auth-token'] = token;

      const response = await fetch(`/api/orders`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          items: cartItems,
          total_amount: total,
          payment_method: form.payment,
          address: form.address,
          city: form.city,
          phone: form.phone
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      const data = await response.json();
      setDone(true);
      onOrderSuccess();
    } catch (error) {
      console.error(error);
      alert('There was an issue processing your order. Please try again.');
    }
  };

  if (!cartItems.length && !done) {
    navigate('/cart');
    return null;
  }

  if (done) {
    return (
      <section className="section" style={{ minHeight:'70vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ textAlign:'center', maxWidth:500 }}>
          <CheckCircle size={72} style={{ color:'#22C55E', margin:'0 auto 24px' }}/>
          <h1 className="section-title" style={{ marginBottom:16 }}>Order Confirmed!</h1>
          <p style={{ color:'var(--muted)', lineHeight:1.7, marginBottom:32 }}>
            Thank you for your order! We'll send a confirmation to <strong style={{ color:'var(--white)' }}>{form.email || 'your inbox'}</strong> and our team will contact you shortly.
          </p>
          <Link to="/" className="btn-primary">Back to Home <ArrowRight size={18}/></Link>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container">
        <div style={{ marginBottom:32 }}>
          <div className="section-eyebrow">Step {step} of 2</div>
          <h1 className="section-title">{step === 1 ? 'Shipping Details' : 'Payment'}</h1>
        </div>

        <div className="checkout-layout">
          <div>
            {/* Step 1 — Shipping */}
            <form onSubmit={handleStep1} style={{ display: step === 1 ? 'block' : 'none' }}>
              <div className="checkout-block">
                <div className="checkout-step-head">
                  <div className="step-num">1</div>
                  <div className="step-title">Delivery Information</div>
                </div>
                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">First Name</label>
                    <input required className="form-input" value={form.firstName} onChange={e => update('firstName', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Last Name</label>
                    <input required className="form-input" value={form.lastName} onChange={e => update('lastName', e.target.value)} />
                  </div>
                </div>
                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input required type="tel" className="form-input" value={form.phone} onChange={e => update('phone', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input required type="email" className="form-input" value={form.email} onChange={e => update('email', e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Street Address</label>
                  <input required className="form-input" value={form.address} onChange={e => update('address', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input required className="form-input" value={form.city} onChange={e => update('city', e.target.value)} />
                </div>
                <button type="submit" className="btn-primary" style={{ marginTop:8 }}>
                  Continue to Payment <ArrowRight size={18}/>
                </button>
              </div>
            </form>

            {/* Step 2 — Payment */}
            <form onSubmit={handleSubmit} style={{ display: step === 2 ? 'block' : 'none' }}>
              <div className="checkout-block">
                <div className="checkout-step-head">
                  <div className="step-num">2</div>
                  <div className="step-title">Payment Method</div>
                </div>

                <label
                  className={`payment-option${form.payment === 'cod' ? ' selected' : ''}`}
                  onClick={() => update('payment', 'cod')}
                >
                  <input type="radio" className="payment-radio" name="payment" checked={form.payment === 'cod'} readOnly />
                  <div>
                    <Truck size={20} style={{ color:'var(--red)', marginBottom:6 }}/>
                    <div className="payment-option-title">Cash on Delivery (COD)</div>
                    <div className="payment-option-desc">Pay in cash when your order arrives. Available island-wide.</div>
                  </div>
                </label>

                <label
                  className={`payment-option${form.payment === 'card' ? ' selected' : ''}`}
                  onClick={() => update('payment', 'card')}
                >
                  <input type="radio" className="payment-radio" name="payment" checked={form.payment === 'card'} readOnly />
                  <div>
                    <CreditCard size={20} style={{ color:'var(--red)', marginBottom:6 }}/>
                    <div className="payment-option-title">Credit / Debit Card</div>
                    <div className="payment-option-desc">Secure payment via Webxpay. Visa & Mastercard accepted.</div>
                  </div>
                </label>

                {form.payment === 'card' && (
                  <div style={{ marginTop:20 }}>
                    <div className="form-group">
                      <label className="form-label">Card Number</label>
                      <input className="form-input" placeholder="0000 0000 0000 0000" maxLength={19} />
                    </div>
                    <div className="form-grid-2">
                      <div className="form-group">
                        <label className="form-label">Expiry Date</label>
                        <input className="form-input" placeholder="MM / YY" maxLength={7} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">CVV</label>
                        <input className="form-input" placeholder="123" maxLength={3} />
                      </div>
                    </div>
                  </div>
                )}

                <label
                  className={`payment-option${form.payment === 'bank' ? ' selected' : ''}`}
                  onClick={() => update('payment', 'bank')}
                >
                  <input type="radio" className="payment-radio" name="payment" checked={form.payment === 'bank'} readOnly />
                  <div>
                    <Building2 size={20} style={{ color:'var(--red)', marginBottom:6 }}/>
                    <div className="payment-option-title">Bank Transfer</div>
                    <div className="payment-option-desc">Transfer directly to our bank account. Order ships after payment is confirmed.</div>
                  </div>
                </label>

                {form.payment === 'bank' && (
                  <div style={{ marginTop: 16, padding: 20, background: 'rgba(0,0,0,0.2)', borderRadius: 8, border: '1px solid var(--border)' }}>
                    <div style={{ fontFamily: 'var(--font-hero)', fontSize: '1rem', color: 'var(--white)', textTransform: 'uppercase', marginBottom: 12 }}>Bank Details</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.9rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--muted)' }}>Bank</span><strong style={{ color: 'var(--white)' }}>Sampath Bank</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--muted)' }}>Account Name</span><strong style={{ color: 'var(--white)' }}>KHK Auto Parts (Pvt) Ltd</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--muted)' }}>Account No.</span><strong style={{ color: 'var(--white)' }}>1234 5678 9012</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--muted)' }}>Branch</span><strong style={{ color: 'var(--white)' }}>Nugegoda</strong></div>
                    </div>
                    <p style={{ color: '#F59E0B', fontSize: '0.8rem', margin: '12px 0 0 0' }}>⚠️ Please use your Order ID as the payment reference and send the receipt to our WhatsApp.</p>
                  </div>
                )}

                <div style={{ display:'flex', gap:12, marginTop:12 }}>
                  <button type="button" className="btn-outline" onClick={() => setStep(1)}>← Back</button>
                  <button type="submit" className="btn-primary">
                    Place Order — Rs. {total.toLocaleString()} <ArrowRight size={18}/>
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Order Summary */}
          <div className="order-summary-block">
            <div className="summary-title">Your Order</div>
            {cartItems.map(item => (
              <div key={item.id} style={{ display:'flex', justifyContent:'space-between', gap:12, marginBottom:14, fontSize:'0.88rem' }}>
                <span style={{ color:'var(--muted)' }}>{item.qty}× {item.name}</span>
                <strong>Rs. {(item.finalPrice * item.qty).toLocaleString()}</strong>
              </div>
            ))}
            <div style={{ height:1, background:'var(--border)', margin:'16px 0' }}/>
            <div className="summary-row"><span>Subtotal</span><strong>Rs. {subtotal.toLocaleString()}</strong></div>
            <div className="summary-row"><span>Shipping</span><strong>{shipping === 0 ? 'FREE' : `Rs. ${shipping}`}</strong></div>
            <div className="summary-total-row">
              <span className="summary-total-label">Total</span>
              <span className="summary-total-val">Rs. {total.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
