import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Package, Server, AlertCircle, Edit, Trash2 } from 'lucide-react';

export default function AdminPanel({ user }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState('orders');
  const [vehicles, setVehicles] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  
  const [form, setForm] = useState({ name: '', category: 'Engine Oil', price: '', stock: '', vehicle_ids: [], image: null });

  const token = localStorage.getItem('token');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!user && token) return; // Still loading user
    
    if (!user || user.role !== 'admin') { navigate('/'); return; }
    
    // Fetch base data
    fetch(`/api/vehicles`).then(res => res.json()).then(data => setVehicles(data)).catch(err => console.error('Vehicles err:', err));
    fetchProducts();
    fetchOrders();
  }, [user, navigate]);

  const fetchProducts = () => {
    fetch(`/api/products`).then(res => res.json()).then(data => setProducts(data)).catch(err => console.error('Products err:', err));
  };

  const fetchOrders = () => {
    fetch(`/api/orders/all`, { headers: { 'x-auth-token': token } })
      .then(res => res.json()).then(data => setOrders(data)).catch(err => console.error('Orders err:', err));
  };

  const updateForm = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleVehicle = (id) => {
    setForm(f => ({ ...f, vehicle_ids: f.vehicle_ids.includes(id) ? f.vehicle_ids.filter(v => v !== id) : [...f.vehicle_ids, id] }));
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('category', form.category);
      formData.append('price', form.price);
      formData.append('stock', form.stock);
      formData.append('vehicle_ids', JSON.stringify(form.vehicle_ids));
      if (form.image) {
        formData.append('image', form.image);
      }

      const res = await fetch(`/api/products`, {
        method: 'POST',
        headers: { 'x-auth-token': token },
        body: formData
      });
      if (res.ok) {
        alert('Product added!');
        setForm({ name: '', category: 'Engine Oil', price: '', stock: '', vehicle_ids: [], image: null });
        // Optional: clear file input visually
        const fileInput = document.getElementById('product-image-upload');
        if (fileInput) fileInput.value = '';
        fetchProducts();
      } else alert('Error adding product');
    } catch (err) { alert('Network error'); }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    await fetch(`/api/products/${id}`, { method: 'DELETE', headers: { 'x-auth-token': token } });
    fetchProducts();
  };

  const handleUpdateOrder = async (orderId, newStatus, newTracking) => {
    await fetch(`/api/orders/${orderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
      body: JSON.stringify({ status: newStatus, tracking_number: newTracking })
    });
    fetchOrders();
  };

  const tokenLocal = localStorage.getItem('token');
  if (!user && tokenLocal) return <div style={{ color: 'white', padding: 50, textAlign: 'center' }}>Loading Admin Panel...</div>;
  if (!user || user.role !== 'admin') return null;

  return (
    <div className="container section admin-layout" style={{ minHeight: '70vh', gap: 32, display: 'flex' }}>
      
      {/* Sidebar */}
      <div className="admin-sidebar" style={{ width: '250px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h2 style={{ fontFamily: 'var(--font-hero)', textTransform: 'uppercase', color: 'var(--white)' }}>Admin Panel</h2>
        <button onClick={() => setTab('orders')} className={tab === 'orders' ? 'btn-primary' : 'btn-outline'} style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-start' }}>
          <Server size={18} /> View Orders
        </button>
        <button onClick={() => setTab('products')} className={tab === 'products' ? 'btn-primary' : 'btn-outline'} style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-start' }}>
          <Package size={18} /> Manage Products
        </button>
        <button onClick={() => setTab('add_product')} className={tab === 'add_product' ? 'btn-primary' : 'btn-outline'} style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-start' }}>
          <Plus size={18} /> Add Product
        </button>
      </div>

      {/* Main Content */}
      <div className="admin-main" style={{ flex: 1, background: 'var(--glass)', border: '1px solid var(--border)', borderRadius: 16, padding: 32, overflowX: 'auto' }}>
        
        {/* ADD PRODUCT TAB */}
        {tab === 'add_product' && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-hero)', fontSize: '1.5rem', marginBottom: 24, color: 'var(--white)' }}>Add New Product</h2>
            <form onSubmit={handleAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', gap: 20 }}>
                <div className="form-group" style={{ flex: 2 }}>
                  <label className="form-label">Product Name</label>
                  <input required type="text" className="form-input" value={form.name} onChange={e => updateForm('name', e.target.value)} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Category</label>
                  <select className="form-input" value={form.category} onChange={e => updateForm('category', e.target.value)}>
                    <option value="Engine Oil">Engine Oil</option><option value="Filters">Filters</option>
                    <option value="Brake Pads">Brake Pads</option><option value="Coolant">Coolant</option><option value="Chemicals">Chemicals</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 20 }}>
                <div className="form-group" style={{ flex: 1 }}><label className="form-label">Price (LKR)</label><input required type="number" className="form-input" value={form.price} onChange={e => updateForm('price', e.target.value)} /></div>
                <div className="form-group" style={{ flex: 1 }}><label className="form-label">Stock</label><input required type="number" className="form-input" value={form.stock} onChange={e => updateForm('stock', e.target.value)} /></div>
              </div>
              <div className="form-group">
                <label className="form-label">Product Image</label>
                <input 
                  type="file" 
                  id="product-image-upload"
                  className="form-input" 
                  accept="image/*"
                  onChange={e => updateForm('image', e.target.files[0])} 
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>Compatible Vehicles <AlertCircle size={14} style={{ color: 'var(--muted)' }} /></label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, background: 'rgba(0,0,0,0.2)', padding: 16, borderRadius: 8, border: '1px solid var(--border)', maxHeight: '300px', overflowY: 'auto' }}>
                  {vehicles.map(v => (
                    <label key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: 'var(--muted)', fontSize: '0.9rem' }}>
                      <input type="checkbox" checked={form.vehicle_ids.includes(v.id)} onChange={() => toggleVehicle(v.id)} style={{ accentColor: 'var(--red)', width: 16, height: 16 }} />
                      {v.make} {v.model}
                    </label>
                  ))}
                </div>
              </div>
              <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start', marginTop: 16 }}>Create Product</button>
            </form>
          </div>
        )}

        {/* MANAGE PRODUCTS TAB */}
        {tab === 'products' && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-hero)', fontSize: '1.5rem', marginBottom: 24, color: 'var(--white)' }}>Manage Products</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--white)' }}>
                <thead><tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--muted)' }}><th style={{ padding: 12 }}>ID</th><th style={{ padding: 12 }}>Name</th><th style={{ padding: 12 }}>Price</th><th style={{ padding: 12 }}>Stock</th><th style={{ padding: 12 }}>Actions</th></tr></thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: 12 }}>#{p.id}</td><td style={{ padding: 12 }}>{p.name}</td><td style={{ padding: 12 }}>Rs. {p.price}</td><td style={{ padding: 12 }}>{p.stock}</td>
                      <td style={{ padding: 12, display: 'flex', gap: 8 }}>
                        <button onClick={() => handleDeleteProduct(p.id)} style={{ background: 'transparent', border: 'none', color: 'var(--red)', cursor: 'pointer' }}><Trash2 size={18} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW ORDERS TAB */}
        {tab === 'orders' && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-hero)', fontSize: '1.5rem', marginBottom: 24, color: 'var(--white)' }}>Order Management</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {orders.map(o => (
                <div key={o.id} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: 8, padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div>
                      <h3 style={{ color: 'var(--white)', margin: 0 }}>Order #{o.id} <span style={{ fontSize: '0.8rem', padding: '4px 8px', borderRadius: 12, background: o.status === 'Pending' ? 'var(--red)' : 'var(--red)', color: 'white' }}>{o.status}</span></h3>
                      <p style={{ color: 'var(--muted)', margin: '4px 0 0 0', fontSize: '0.9rem' }}>{new Date(o.created_at).toLocaleString()}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ color: 'var(--white)', fontWeight: 'bold', margin: 0, fontSize: '1.2rem' }}>Rs. {o.total_amount}</p>
                      <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.9rem' }}>{o.payment_method}</p>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 16 }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <h4 style={{ color: 'var(--white)', marginBottom: 8, fontSize: '0.9rem', textTransform: 'uppercase' }}>Customer & Shipping</h4>
                      <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.9rem' }}><strong>{o.customer_name}</strong> ({o.customer_email})</p>
                      <p style={{ color: 'var(--muted)', margin: '4px 0', fontSize: '0.9rem' }}>{o.shipping_address || 'No address'}, {o.shipping_city}</p>
                      <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.9rem' }}>📞 {o.shipping_phone}</p>
                    </div>
                    <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div>
                        <label style={{ display: 'block', color: 'var(--muted)', fontSize: '0.8rem', marginBottom: 4 }}>Update Status</label>
                        <select className="form-input" value={o.status} onChange={(e) => handleUpdateOrder(o.id, e.target.value, o.tracking_number)}>
                          <option value="Pending">Pending</option><option value="Processing">Processing</option><option value="Shipped">Shipped</option><option value="Delivered">Delivered</option><option value="Cancelled">Cancelled</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', color: 'var(--muted)', fontSize: '0.8rem', marginBottom: 4 }}>Tracking Number</label>
                        <input type="text" className="form-input" placeholder="e.g. TRK123456789" value={o.tracking_number || ''} onChange={(e) => {
                          const val = e.target.value;
                          setOrders(orders.map(order => order.id === o.id ? { ...order, tracking_number: val } : order));
                        }} onBlur={(e) => handleUpdateOrder(o.id, o.status, e.target.value)} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
