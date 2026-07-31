import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Package, Server, Plus, Edit, Trash2 } from 'lucide-react';

export default function VendorDashboard({ user, userLoading, addToast, showConfirm }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState('dashboard');
  const [stats, setStats] = useState({ totalProducts: 0, totalRevenue: 0, totalOrders: 0 });
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  
  const [form, setForm] = useState({ name: '', category: '', brand_id: '', price: '', discount_percent: '', stock: '', description: '', item_condition: 'reconditioned', image: null });
  const [editingProductId, setEditingProductId] = useState(null);

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (userLoading) return; // wait for auth check to finish
    if (!user) {
      navigate('/login');
      return;
    }
    if (!user.is_vendor && user.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchStats();
    fetchProducts();
    fetchOrders();
    fetchCategories();
    fetchBrands();
  }, [user, userLoading, navigate]);

  const fetchStats = () => fetch('/api/vendor/stats', { headers: { 'x-auth-token': token } }).then(res => res.json()).then(setStats).catch(console.error);
  const fetchOrders = () => fetch('/api/vendor/orders', { headers: { 'x-auth-token': token } }).then(res => res.json()).then(setOrders).catch(console.error);
  const fetchProducts = () => fetch('/api/products').then(res => res.json()).then(data => {
    // Only keep this vendor's products
    setProducts(data.filter(p => p.vendor_id === user.id));
  }).catch(console.error);
  const fetchCategories = () => fetch('/api/categories').then(res => res.json()).then(data => { setCategories(data); if (data.length > 0) setForm(f => ({...f, category: data[0].name}))}).catch(console.error);
  const fetchBrands = () => fetch('/api/brands').then(res => res.json()).then(setBrands).catch(console.error);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('category', form.category);
      formData.append('brand_id', form.brand_id);
      formData.append('price', form.price);
      formData.append('discount_percent', form.discount_percent || 0);
      formData.append('stock', form.stock);
      formData.append('description', form.description);
      formData.append('item_condition', form.item_condition);
      if (form.image instanceof File) formData.append('image', form.image);

      const method = editingProductId ? 'PUT' : 'POST';
      const url = editingProductId ? `/api/products/${editingProductId}` : `/api/products`;

      const res = await fetch(url, { method, headers: { 'x-auth-token': token }, body: formData });
      if (res.ok) {
        addToast(editingProductId ? 'Product updated!' : 'Product added!', 'success');
        setForm({ name: '', category: categories.length > 0 ? categories[0].name : '', brand_id: '', price: '', discount_percent: '', stock: '', description: '', item_condition: 'reconditioned', image: null });
        setEditingProductId(null);
        if (document.getElementById('v-product-image-upload')) document.getElementById('v-product-image-upload').value = '';
        fetchProducts();
        fetchStats();
      } else addToast('Error saving product', 'error');
    } catch (err) { addToast('Network error', 'error'); }
  };

  const handleDeleteProduct = async (id) => {
    const confirmed = await showConfirm('Delete Product?', 'Are you sure you want to delete this product?');
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE', headers: { 'x-auth-token': token } });
      if (res.ok) {
        addToast('Product deleted', 'success');
        fetchProducts();
        fetchStats();
      } else addToast('Failed to delete', 'error');
    } catch (err) { addToast('Error', 'error'); }
  };

  const handleEditProduct = (p) => {
    setEditingProductId(p.id);
    setForm({
      name: p.name,
      category: p.category,
      brand_id: p.brand_id || '',
      price: p.price,
      discount_percent: p.discount_percent || '',
      stock: p.stock,
      description: p.description || '',
      item_condition: p.item_condition || 'reconditioned',
      image: null
    });
    setTab('add_product');
  };

  if (userLoading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>Loading...</div>
  );

  if (!user) return null;

  return (
    <div className="container section" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 10 }}>
        <button onClick={() => setTab('dashboard')} className={tab === 'dashboard' ? 'btn-primary' : 'btn-outline'}><Activity size={18} style={{marginRight:8}}/> Dashboard</button>
        <button onClick={() => setTab('products')} className={tab === 'products' ? 'btn-primary' : 'btn-outline'}><Package size={18} style={{marginRight:8}}/> My Products</button>
        <button onClick={() => { setTab('add_product'); setEditingProductId(null); }} className={tab === 'add_product' ? 'btn-primary' : 'btn-outline'}><Plus size={18} style={{marginRight:8}}/> Add Product</button>
        <button onClick={() => setTab('orders')} className={tab === 'orders' ? 'btn-primary' : 'btn-outline'}><Server size={18} style={{marginRight:8}}/> My Sales</button>
      </div>

      <div style={{ background: 'var(--glass)', border: '1px solid var(--border)', borderRadius: 16, padding: 32 }}>
        
        {/* DASHBOARD TAB */}
        {tab === 'dashboard' && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-hero)', fontSize: '1.5rem', marginBottom: 24, color: 'var(--white)' }}>Vendor Dashboard Overview</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: 24, borderRadius: 12, border: '1px solid var(--border)' }}>
                <p style={{ color: 'var(--muted)', margin: 0, textTransform: 'uppercase', fontSize: '0.8rem' }}>Total Sales Revenue</p>
                <h3 style={{ color: '#4ade80', fontSize: '2rem', margin: '8px 0 0' }}>Rs. {Number(stats.totalRevenue || 0).toLocaleString()}</h3>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: 24, borderRadius: 12, border: '1px solid var(--border)' }}>
                <p style={{ color: 'var(--muted)', margin: 0, textTransform: 'uppercase', fontSize: '0.8rem' }}>My Products Listed</p>
                <h3 style={{ color: 'var(--white)', fontSize: '2rem', margin: '8px 0 0' }}>{stats.totalProducts}</h3>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: 24, borderRadius: 12, border: '1px solid var(--border)' }}>
                <p style={{ color: 'var(--muted)', margin: 0, textTransform: 'uppercase', fontSize: '0.8rem' }}>Orders Containing My Items</p>
                <h3 style={{ color: 'var(--white)', fontSize: '2rem', margin: '8px 0 0' }}>{stats.totalOrders}</h3>
              </div>
            </div>
            <div style={{ marginTop: 24, padding: 16, background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.3)', borderRadius: 8 }}>
              <p style={{ color: '#eab308', margin: 0, fontSize: '0.9rem' }}><strong>Note:</strong> Total sales revenue shows items that have been marked as 'Delivered'. Payments are handled offline by the KHK Admin team.</p>
            </div>
          </div>
        )}

        {/* PRODUCTS TAB */}
        {tab === 'products' && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-hero)', fontSize: '1.5rem', marginBottom: 24, color: 'var(--white)' }}>My Products</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--white)' }}>
                <thead><tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--muted)' }}><th style={{ padding: 12 }}>Image</th><th style={{ padding: 12 }}>Name</th><th style={{ padding: 12 }}>Condition</th><th style={{ padding: 12 }}>Price</th><th style={{ padding: 12 }}>Stock</th><th style={{ padding: 12 }}>Actions</th></tr></thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: 12 }}><img src={p.image_url ? `/uploads/${p.image_url}` : 'https://placehold.co/50x50/111/444?text=No+Img'} alt={p.name} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} /></td>
                      <td style={{ padding: 12 }}>{p.name}</td>
                      <td style={{ padding: 12, textTransform: 'capitalize' }}>{p.item_condition || 'new'}</td>
                      <td style={{ padding: 12 }}>Rs. {p.price}</td>
                      <td style={{ padding: 12 }}>{p.stock}</td>
                      <td style={{ padding: 12, display: 'flex', gap: 8 }}>
                        <button onClick={() => handleEditProduct(p)} style={{ background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer' }}><Edit size={18} /></button>
                        <button onClick={() => handleDeleteProduct(p.id)} style={{ background: 'transparent', border: 'none', color: 'var(--red)', cursor: 'pointer' }}><Trash2 size={18} /></button>
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && <tr><td colSpan="6" style={{ padding: 24, textAlign: 'center', color: 'var(--muted)' }}>No products listed yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ADD PRODUCT TAB */}
        {tab === 'add_product' && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-hero)', fontSize: '1.5rem', marginBottom: 24, color: 'var(--white)' }}>{editingProductId ? 'Edit Product' : 'List New Product'}</h2>
            <form onSubmit={handleAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 600 }}>
              <div className="form-group">
                <label className="form-label">Product Name</label>
                <input required type="text" className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Category</label>
                  <select required className="form-input" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Brand</label>
                  <select className="form-input" value={form.brand_id} onChange={e => setForm({...form, brand_id: e.target.value})}>
                    <option value="">No Brand</option>
                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Price (Rs.)</label>
                  <input required type="number" step="0.01" className="form-input" value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Stock Quantity</label>
                  <input required type="number" className="form-input" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Condition</label>
                <select className="form-input" value={form.item_condition} onChange={e => setForm({...form, item_condition: e.target.value})}>
                  <option value="reconditioned">Reconditioned (Used)</option>
                  <option value="new">Brand New</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Main Image</label>
                <input id="v-product-image-upload" type="file" className="form-input" onChange={e => setForm({...form, image: e.target.files[0]})} />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" rows="4" value={form.description} onChange={e => setForm({...form, description: e.target.value})}></textarea>
              </div>
              <button type="submit" className="btn-primary">{editingProductId ? 'Update Product' : 'List Product'}</button>
            </form>
          </div>
        )}

        {/* ORDERS TAB */}
        {tab === 'orders' && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-hero)', fontSize: '1.5rem', marginBottom: 24, color: 'var(--white)' }}>Orders Containing My Items</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--white)' }}>
                <thead><tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--muted)' }}><th style={{ padding: 12 }}>Order ID</th><th style={{ padding: 12 }}>Date</th><th style={{ padding: 12 }}>Item</th><th style={{ padding: 12 }}>Qty</th><th style={{ padding: 12 }}>Total Price</th><th style={{ padding: 12 }}>City</th><th style={{ padding: 12 }}>Status</th></tr></thead>
                <tbody>
                  {orders.map((o, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: 12 }}>#{o.order_id}</td>
                      <td style={{ padding: 12 }}>{new Date(o.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: 12 }}>{o.product_name}</td>
                      <td style={{ padding: 12 }}>{o.quantity}</td>
                      <td style={{ padding: 12 }}>Rs. {(o.price * o.quantity).toLocaleString()}</td>
                      <td style={{ padding: 12 }}>{o.shipping_city}</td>
                      <td style={{ padding: 12 }}><span style={{ color: o.status === 'delivered' ? '#4ade80' : 'inherit' }}>{o.status.toUpperCase()}</span></td>
                    </tr>
                  ))}
                  {orders.length === 0 && <tr><td colSpan="7" style={{ padding: 24, textAlign: 'center', color: 'var(--muted)' }}>No sales yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
}
