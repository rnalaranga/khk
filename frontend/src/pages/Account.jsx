import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Clock, CheckCircle } from 'lucide-react';

export default function Account({ user, setUser, addToast }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [showVendorForm, setShowVendorForm] = useState(false);
  const [vendorReqStatus, setVendorReqStatus] = useState(null);
  const [form, setForm] = useState({ phone: '', address: '', city: '' });
  const [vendorForm, setVendorForm] = useState({ address: '', google_location: '', contact_number_1: '', contact_number_2: '', seller_photo: null });
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    fetchOrders();
    if (user) {
      setForm({
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || ''
      });
    }
  }, [user, navigate]);

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/auth/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        setUser({ ...user, ...form });
        setShowProfileForm(false);
        addToast('Profile updated successfully!', 'success');
      } else {
        addToast('Failed to update profile', 'error');
      }
    } catch (err) {
      addToast('Error updating profile', 'error');
    }
  };

  const handleBecomeVendor = async (e) => {
    e.preventDefault();
    if (!vendorForm.seller_photo) {
      addToast('Please upload a seller photo', 'error');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('address', vendorForm.address);
      formData.append('google_location', vendorForm.google_location);
      formData.append('contact_number_1', vendorForm.contact_number_1);
      formData.append('contact_number_2', vendorForm.contact_number_2);
      formData.append('seller_photo', vendorForm.seller_photo);

      const res = await fetch('/api/auth/vendor-request', {
        method: 'POST',
        headers: { 'x-auth-token': token },
        body: formData
      });
      
      if (res.ok) {
        setShowVendorForm(false);
        setVendorReqStatus('pending');
        addToast('Vendor request submitted successfully!', 'success');
      } else {
        const data = await res.json();
        addToast(data.message || 'Error submitting request', 'error');
      }
    } catch (err) {
      addToast('Network error', 'error');
    }
  };

  if (!user || loading) return <div className="section container" style={{ minHeight:'60vh', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--muted)' }}>Loading...</div>;

  return (
    <section className="section">
      <div className="container">
        <div style={{ marginBottom:32, display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
          <div>
            <div className="section-eyebrow">My Account</div>
            <h1 className="section-title">Order History</h1>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {user.role !== 'admin' && (
              user.is_vendor ? (
                <button onClick={() => navigate('/vendor')} className="btn-primary" style={{ background: '#3b82f6', borderColor: '#3b82f6' }}>Vendor Dashboard</button>
              ) : vendorReqStatus === 'pending' ? (
                <button disabled className="btn-outline" style={{ opacity: 0.7, cursor: 'not-allowed', color: '#eab308', borderColor: '#eab308' }}>Vendor Request Pending</button>
              ) : vendorReqStatus === 'rejected' ? (
                <button onClick={() => setShowVendorForm(!showVendorForm)} className="btn-primary" style={{ background: '#ef4444', borderColor: '#ef4444' }}>Request Rejected - Try Again</button>
              ) : (
                <button onClick={() => setShowVendorForm(!showVendorForm)} className="btn-primary" style={{ background: '#eab308', borderColor: '#eab308', color: '#000' }}>Become a Seller</button>
              )
            )}
            <button onClick={() => setShowProfileForm(!showProfileForm)} className="btn-outline">
              {showProfileForm ? 'Cancel' : 'Update Shipping Details'}
            </button>
          </div>
        </div>

        {showVendorForm && (
          <form onSubmit={handleBecomeVendor} className="checkout-block" style={{ marginBottom: 32, background: 'rgba(234, 179, 8, 0.05)', border: '1px solid rgba(234, 179, 8, 0.3)' }}>
            <h2 style={{ fontFamily:'var(--font-hero)', fontSize:'1.2rem', marginBottom:16, color:'#eab308' }}>Vendor Application</h2>
            <p style={{ color:'var(--muted)', fontSize:'0.9rem', marginBottom:20 }}>Submit your details to start selling on KHK Auto Parts. Your request will be reviewed by an administrator.</p>
            
            <div className="form-group">
              <label className="form-label">Shop Address</label>
              <textarea required className="form-input" value={vendorForm.address} onChange={e => setVendorForm({...vendorForm, address: e.target.value})} placeholder="Full physical address" rows="2" />
            </div>
            
            <div className="form-group">
              <label className="form-label">Google Maps Location Link</label>
              <input required type="url" className="form-input" value={vendorForm.google_location} onChange={e => setVendorForm({...vendorForm, google_location: e.target.value})} placeholder="https://maps.google.com/..." />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Contact Number 1</label>
                <input required type="tel" className="form-input" value={vendorForm.contact_number_1} onChange={e => setVendorForm({...vendorForm, contact_number_1: e.target.value})} placeholder="077 123 4567" />
              </div>
              <div className="form-group">
                <label className="form-label">Contact Number 2</label>
                <input required type="tel" className="form-input" value={vendorForm.contact_number_2} onChange={e => setVendorForm({...vendorForm, contact_number_2: e.target.value})} placeholder="071 987 6543" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Seller/Shop Photo (required)</label>
              <input required type="file" accept="image/*" onChange={e => setVendorForm({...vendorForm, seller_photo: e.target.files[0]})} style={{ color: 'var(--white)', fontSize: '0.9rem', marginBottom: '8px' }} />
              <p style={{ color:'var(--muted)', fontSize:'0.8rem', margin:0 }}>Upload a clear photo of your storefront or yourself.</p>
            </div>

            <button type="submit" className="btn-primary" style={{ background: '#eab308', borderColor: '#eab308', color: '#000', width: '100%', marginTop: 8 }}>
              Submit Application
            </button>
          </form>
        )}

        {showProfileForm && (
          <form onSubmit={handleUpdateProfile} className="checkout-block" style={{ marginBottom: 32 }}>
            <h2 style={{ fontFamily:'var(--font-hero)', fontSize:'1.2rem', marginBottom:16, color:'var(--white)' }}>Shipping Details</h2>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input required type="tel" className="form-input" value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="077 123 4567" />
            </div>
            <div className="form-group">
              <label className="form-label">Street Address</label>
              <input required type="text" className="form-input" value={form.address} onChange={e => update('address', e.target.value)} placeholder="123 Main St" />
            </div>
            <div className="form-group">
              <label className="form-label">City</label>
              <input required type="text" className="form-input" value={form.city} onChange={e => update('city', e.target.value)} placeholder="Colombo" />
            </div>
            <button type="submit" className="btn-primary" style={{ marginTop: 8 }}>Save Details</button>
          </form>
        )}

        {orders.length === 0 ? (
          <div className="checkout-block" style={{ textAlign:'center', padding:'60px 20px' }}>
            <Package size={48} style={{ color:'var(--muted)', margin:'0 auto 16px' }} />
            <h2 style={{ fontFamily:'var(--font-hero)', fontSize:'1.4rem', textTransform:'uppercase', color:'var(--white)' }}>No Orders Yet</h2>
            <p style={{ color:'var(--muted)', marginTop:8 }}>When you place orders, they will appear here.</p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            {orders.map(order => (
              <div key={order.id} style={{ 
                padding: '24px', 
                marginBottom: 0,
                background: 'var(--glass-bg)',
                backdropFilter: 'blur(var(--glass-blur))',
                border: '1px solid var(--glass-border)',
                borderRadius: '12px',
                boxShadow: 'var(--shadow)'
              }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid var(--glass-border)', paddingBottom:16, marginBottom:16 }}>
                  <div>
                    <div style={{ fontFamily:'var(--font-hero)', fontSize:'1.1rem', fontWeight:800, textTransform:'uppercase', color:'var(--text)' }}>
                      Order #{order.id}
                    </div>
                    <div style={{ color:'var(--text-2)', fontSize:'0.85rem', marginTop:4 }}>
                      Placed on {new Date(order.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8, color: order.status === 'Pending' ? '#F59E0B' : '#10B981', fontWeight:600, fontSize:'0.9rem' }}>
                    {order.status === 'Pending' ? <Clock size={16} /> : <CheckCircle size={16} />}
                    {order.status}
                  </div>
                </div>

                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {order.items.map((item, i) => (
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:'0.9rem' }}>
                      <span style={{ color:'var(--text-2)' }}>{item.quantity}× {item.name}</span>
                      <strong style={{ color:'var(--text)' }}>Rs. {(item.price * item.quantity).toLocaleString()}</strong>
                    </div>
                  ))}
                </div>

                <div style={{ borderTop:'1px dashed var(--glass-border)', marginTop:16, paddingTop:16, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ color:'var(--text-2)', fontSize:'0.85rem' }}>Payment: {order.payment_method === 'cod' ? 'Cash on Delivery' : 'Card'}</span>
                  <strong style={{ fontSize:'1.1rem', color:'var(--red)' }}>Total: Rs. {Number(order.total_amount).toLocaleString()}</strong>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
