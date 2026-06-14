import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Package, PackageOpen, Server, AlertCircle, Edit, Trash2, Activity, Users, Car } from 'lucide-react';

export default function AdminPanel({ user }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState('dashboard');
  const [vehicles, setVehicles] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [editingProductId, setEditingProductId] = useState(null);
  const [productSearch, setProductSearch] = useState('');

  // Order filters & pagination
  const [orderSearch, setOrderSearch] = useState('');
  const [orderPayment, setOrderPayment] = useState('');
  const [orderStatus, setOrderStatus] = useState('');
  const [orderDateFrom, setOrderDateFrom] = useState('');
  const [orderDateTo, setOrderDateTo] = useState('');
  const [orderPage, setOrderPage] = useState(1);
  const ORDERS_PER_PAGE = 5;
  
  const [form, setForm] = useState({ name: '', category: '', price: '', stock: '', description: '', vehicle_ids: [], image: null });
  const [vForm, setVForm] = useState({ make: '', model: '', year_start: '', year_end: '' });
  const [cForm, setCForm] = useState({ name: '', image: null });

  const token = localStorage.getItem('token');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!user && token) return; // Still loading user
    
    if (!user || user.role !== 'admin') { navigate('/'); return; }
    
    fetchVehicles();
    fetchProducts();
    fetchOrders();
    fetchCustomers();
    fetchCategories();
  }, [user, navigate]);

  const fetchVehicles = () => fetch(`/api/vehicles`).then(res => res.json()).then(data => setVehicles(data)).catch(console.error);
  const fetchProducts = () => fetch(`/api/products`).then(res => res.json()).then(data => setProducts(data)).catch(console.error);
  const fetchOrders = () => fetch(`/api/orders/all`, { headers: { 'x-auth-token': token } }).then(res => res.json()).then(data => setOrders(data)).catch(console.error);
  const fetchCustomers = () => fetch(`/api/auth/users`, { headers: { 'x-auth-token': token } }).then(res => res.json()).then(data => setCustomers(data)).catch(console.error);
  const fetchCategories = () => fetch(`/api/categories`).then(res => res.json()).then(data => { setCategories(data); if (data.length > 0) setForm(f => ({ ...f, category: f.category || data[0].name })); }).catch(console.error);

  const updateForm = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const updateVForm = (k, v) => setVForm(f => ({ ...f, [k]: v }));
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
      formData.append('description', form.description);
      formData.append('vehicle_ids', JSON.stringify(form.vehicle_ids));
      if (form.image) {
        formData.append('image', form.image);
      }

      const method = editingProductId ? 'PUT' : 'POST';
      const url = editingProductId ? `/api/products/${editingProductId}` : `/api/products`;

      const res = await fetch(url, {
        method,
        headers: { 'x-auth-token': token },
        body: formData
      });
      if (res.ok) {
        alert(editingProductId ? 'Product updated!' : 'Product added!');
        setForm({ name: '', category: 'Engine Oil', price: '', stock: '', description: '', vehicle_ids: [], image: null });
        setEditingProductId(null);
        const fileInput = document.getElementById('product-image-upload');
        if (fileInput) fileInput.value = '';
        fetchProducts();
      } else alert('Error saving product');
    } catch (err) { alert('Network error'); }
  };

  const handleEditProduct = (p) => {
    setEditingProductId(p.id);
    setForm({
      name: p.name,
      category: p.category || 'Engine Oil',
      price: p.price,
      stock: p.stock,
      description: p.description || '',
      vehicle_ids: p.vehicle_ids || [],
      image: null
    });
    setTab('add_product');
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    await fetch(`/api/products/${id}`, { method: 'DELETE', headers: { 'x-auth-token': token } });
    fetchProducts();
  };

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/vehicles', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-auth-token': token }, body: JSON.stringify(vForm) });
    if (res.ok) {
      setVForm({ make: '', model: '', year_start: '', year_end: '' });
      fetchVehicles();
    }
  };

  const handleDeleteVehicle = async (id) => {
    if (!window.confirm("Delete this vehicle?")) return;
    await fetch(`/api/vehicles/${id}`, { method: 'DELETE', headers: { 'x-auth-token': token } });
    fetchVehicles();
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', cForm.name);
    if (cForm.image) formData.append('image', cForm.image);

    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'x-auth-token': token },
      body: formData
    });
    if (res.ok) {
      setCForm({ name: '', image: null });
      fetchCategories();
    } else {
      const data = await res.json();
      alert(data.message || 'Error creating category');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Delete this category?")) return;
    await fetch(`/api/categories/${id}`, { method: 'DELETE', headers: { 'x-auth-token': token } });
    fetchCategories();
  };

  const handleUpdateOrder = async (orderId, newStatus, newTracking) => {
    await fetch(`/api/orders/${orderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
      body: JSON.stringify({ status: newStatus, tracking_number: newTracking })
    });
    fetchOrders();
  };

  const handleBlockCustomer = async (id, currentStatus) => {
    if (!window.confirm(`Are you sure you want to ${currentStatus ? 'unblock' : 'block'} this user?`)) return;
    await fetch(`/api/auth/users/${id}/block`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'x-auth-token': token }, body: JSON.stringify({ is_blocked: !currentStatus }) });
    fetchCustomers();
  };

  const handleDeleteCustomer = async (id) => {
    if (!window.confirm("Delete this user permanently?")) return;
    await fetch(`/api/auth/users/${id}`, { method: 'DELETE', headers: { 'x-auth-token': token } });
    fetchCustomers();
  };

  const tokenLocal = localStorage.getItem('token');
  if (!user && tokenLocal) return <div style={{ color: 'white', padding: 50, textAlign: 'center' }}>Loading Admin Panel...</div>;
  if (!user || user.role !== 'admin') return null;

  const filteredOrders = orders.filter(o => {
    if (!startDate && !endDate) return true;
    const orderDate = new Date(o.created_at);
    if (startDate && orderDate < new Date(startDate)) return false;
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (orderDate > end) return false;
    }
    return true;
  });

  const totalIncome = filteredOrders.filter(o => o.status === 'Delivered').reduce((sum, o) => sum + parseFloat(o.total_amount), 0);
  const pendingCount = filteredOrders.filter(o => o.status === 'Pending').length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;

  return (
    <div className="container section admin-layout" style={{ minHeight: '70vh', gap: 32, display: 'flex' }}>
      
      {/* Sidebar */}
      <div className="admin-sidebar" style={{ width: '250px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h2 style={{ fontFamily: 'var(--font-hero)', textTransform: 'uppercase', color: 'var(--white)' }}>Admin Panel</h2>
        <button onClick={() => setTab('dashboard')} className={tab === 'dashboard' ? 'btn-primary' : 'btn-outline'} style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-start' }}><Activity size={18} /> Dashboard</button>
        <button onClick={() => setTab('orders')} className={tab === 'orders' ? 'btn-primary' : 'btn-outline'} style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-start' }}><Server size={18} /> View Orders</button>
        <button onClick={() => setTab('products')} className={tab === 'products' ? 'btn-primary' : 'btn-outline'} style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-start' }}><Package size={18} /> Manage Products</button>
        <button onClick={() => { setTab('add_product'); setEditingProductId(null); setForm({ name: '', category: categories.length > 0 ? categories[0].name : '', price: '', stock: '', description: '', vehicle_ids: [], image: null }); }} className={tab === 'add_product' ? 'btn-primary' : 'btn-outline'} style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-start' }}><Plus size={18} /> Add Product</button>
        <button onClick={() => setTab('categories')} className={tab === 'categories' ? 'btn-primary' : 'btn-outline'} style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-start' }}><PackageOpen size={18} /> Categories</button>
        <button onClick={() => setTab('vehicles')} className={tab === 'vehicles' ? 'btn-primary' : 'btn-outline'} style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-start' }}><Car size={18} /> Vehicles</button>
        <button onClick={() => setTab('customers')} className={tab === 'customers' ? 'btn-primary' : 'btn-outline'} style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-start' }}><Users size={18} /> Customers</button>
      </div>

      {/* Main Content */}
      <div className="admin-main" style={{ flex: 1, background: 'var(--glass)', border: '1px solid var(--border)', borderRadius: 16, padding: 32, overflowX: 'auto' }}>
        
        {/* DASHBOARD TAB */}
        {tab === 'dashboard' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
              <h2 style={{ fontFamily: 'var(--font-hero)', fontSize: '1.5rem', margin: 0, color: 'var(--white)' }}>Dashboard Overview</h2>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: 4 }}>Start Date</label>
                  <input type="date" className="form-input" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ padding: '8px 12px' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: 4 }}>End Date</label>
                  <input type="date" className="form-input" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ padding: '8px 12px' }} />
                </div>
                {(startDate || endDate) && (
                  <button onClick={() => { setStartDate(''); setEndDate(''); }} style={{ marginTop: 20, background: 'transparent', border: '1px solid var(--border)', color: 'var(--white)', padding: '8px 12px', borderRadius: 4, cursor: 'pointer' }}>Clear</button>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: 24, borderRadius: 12, border: '1px solid var(--border)' }}>
                <p style={{ color: 'var(--muted)', margin: 0, textTransform: 'uppercase', fontSize: '0.8rem' }}>Total Revenue (Delivered)</p>
                <h3 style={{ color: 'var(--white)', fontSize: '2rem', margin: '8px 0 0' }}>Rs. {totalIncome.toLocaleString()}</h3>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: 24, borderRadius: 12, border: '1px solid var(--border)' }}>
                <p style={{ color: 'var(--muted)', margin: 0, textTransform: 'uppercase', fontSize: '0.8rem' }}>Total Orders</p>
                <h3 style={{ color: 'var(--white)', fontSize: '2rem', margin: '8px 0 0' }}>{filteredOrders.length}</h3>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: 24, borderRadius: 12, border: '1px solid var(--border)' }}>
                <p style={{ color: 'var(--muted)', margin: 0, textTransform: 'uppercase', fontSize: '0.8rem' }}>Pending Orders</p>
                <h3 style={{ color: 'var(--red)', fontSize: '2rem', margin: '8px 0 0' }}>{pendingCount}</h3>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: 24, borderRadius: 12, border: '1px solid var(--border)' }}>
                <p style={{ color: 'var(--muted)', margin: 0, textTransform: 'uppercase', fontSize: '0.8rem' }}>Out of Stock</p>
                <h3 style={{ color: 'var(--white)', fontSize: '2rem', margin: '8px 0 0' }}>{outOfStockCount}</h3>
              </div>
            </div>
          </div>
        )}

        {/* CUSTOMERS TAB */}
        {tab === 'customers' && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-hero)', fontSize: '1.5rem', marginBottom: 24, color: 'var(--white)' }}>Registered Customers</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--white)' }}>
                <thead><tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--muted)' }}><th style={{ padding: 12 }}>Name</th><th style={{ padding: 12 }}>Email</th><th style={{ padding: 12 }}>Phone</th><th style={{ padding: 12 }}>Address</th><th style={{ padding: 12 }}>Status</th><th style={{ padding: 12 }}>Actions</th></tr></thead>
                <tbody>
                  {customers.map(c => (
                    <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: 12 }}>{c.name} {c.is_verified ? '✓' : ''}</td>
                      <td style={{ padding: 12 }}>{c.email}</td>
                      <td style={{ padding: 12 }}>{c.phone || '-'}</td>
                      <td style={{ padding: 12 }}>{c.address ? `${c.address}, ${c.city}` : '-'}</td>
                      <td style={{ padding: 12 }}><span style={{ color: c.is_blocked ? 'var(--red)' : '#4ade80' }}>{c.is_blocked ? 'Blocked' : 'Active'}</span></td>
                      <td style={{ padding: 12, display: 'flex', gap: 8 }}>
                        <button onClick={() => { setOrderSearch(c.email); setTab('orders'); setOrderPage(1); }} style={{ background: 'transparent', border: '1px solid #3b82f6', color: '#3b82f6', padding: '4px 8px', borderRadius: 4, cursor: 'pointer', fontSize: '0.8rem' }}>Orders</button>
                        <button onClick={() => handleBlockCustomer(c.id, c.is_blocked)} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--white)', padding: '4px 8px', borderRadius: 4, cursor: 'pointer', fontSize: '0.8rem' }}>{c.is_blocked ? 'Unblock' : 'Block'}</button>
                        <button onClick={() => handleDeleteCustomer(c.id)} style={{ background: 'transparent', border: 'none', color: 'var(--red)', cursor: 'pointer' }}><Trash2 size={18} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VEHICLES TAB */}
        {tab === 'vehicles' && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-hero)', fontSize: '1.5rem', marginBottom: 24, color: 'var(--white)' }}>Vehicle Management</h2>
            <form onSubmit={handleAddVehicle} style={{ display: 'flex', gap: 16, marginBottom: 32, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ marginBottom: 0, flex: 1 }}><label className="form-label">Make</label><input required type="text" className="form-input" placeholder="Honda" value={vForm.make} onChange={e => updateVForm('make', e.target.value)} /></div>
              <div className="form-group" style={{ marginBottom: 0, flex: 1 }}><label className="form-label">Model</label><input required type="text" className="form-input" placeholder="Civic" value={vForm.model} onChange={e => updateVForm('model', e.target.value)} /></div>
              <div className="form-group" style={{ marginBottom: 0, flex: 1 }}><label className="form-label">Year Start</label><input type="text" className="form-input" placeholder="2010" value={vForm.year_start} onChange={e => updateVForm('year_start', e.target.value)} /></div>
              <div className="form-group" style={{ marginBottom: 0, flex: 1 }}><label className="form-label">Year End</label><input type="text" className="form-input" placeholder="2015" value={vForm.year_end} onChange={e => updateVForm('year_end', e.target.value)} /></div>
              <button type="submit" className="btn-primary" style={{ padding: '12px 24px' }}>Add</button>
            </form>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--white)' }}>
                <thead><tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--muted)' }}><th style={{ padding: 12 }}>Make</th><th style={{ padding: 12 }}>Model</th><th style={{ padding: 12 }}>Years</th><th style={{ padding: 12 }}>Action</th></tr></thead>
                <tbody>
                  {vehicles.map(v => (
                    <tr key={v.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: 12 }}>{v.make}</td>
                      <td style={{ padding: 12 }}>{v.model}</td>
                      <td style={{ padding: 12 }}>{v.year_start ? `${v.year_start} - ${v.year_end || 'Present'}` : 'Any'}</td>
                      <td style={{ padding: 12 }}><button onClick={() => handleDeleteVehicle(v.id)} style={{ background: 'transparent', border: 'none', color: 'var(--red)', cursor: 'pointer' }}><Trash2 size={18} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ADD PRODUCT TAB */}
        {tab === 'add_product' && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-hero)', fontSize: '1.5rem', marginBottom: 24, color: 'var(--white)' }}>{editingProductId ? 'Edit Product' : 'Add New Product'}</h2>
            <form onSubmit={handleAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', gap: 20 }}>
                <div className="form-group" style={{ flex: 2 }}>
                  <label className="form-label">Product Name</label>
                  <input required type="text" className="form-input" value={form.name} onChange={e => updateForm('name', e.target.value)} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Category</label>
                  <select className="form-input" value={form.category} onChange={e => updateForm('category', e.target.value)}>
                    {categories.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 20 }}>
                <div className="form-group" style={{ flex: 1 }}><label className="form-label">Price (LKR)</label><input required type="number" className="form-input" value={form.price} onChange={e => updateForm('price', e.target.value)} /></div>
                <div className="form-group" style={{ flex: 1 }}><label className="form-label">Stock</label><input required type="number" className="form-input" value={form.stock} onChange={e => updateForm('stock', e.target.value)} /></div>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" rows="3" placeholder="Product details..." value={form.description} onChange={e => updateForm('description', e.target.value)}></textarea>
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
              <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start', marginTop: 16 }}>{editingProductId ? 'Update Product' : 'Create Product'}</button>
            </form>
          </div>
        )}

        {/* MANAGE PRODUCTS TAB */}
        {tab === 'products' && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-hero)', fontSize: '1.5rem', marginBottom: 24, color: 'var(--white)' }}>Manage Products</h2>
            
            <div style={{ marginBottom: 24 }}>
              <input 
                type="text" 
                placeholder="Search products by name or ID..." 
                className="form-input" 
                value={productSearch} 
                onChange={e => setProductSearch(e.target.value)} 
                style={{ maxWidth: '400px', padding: '10px 16px' }} 
              />
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--white)' }}>
                <thead><tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--muted)' }}><th style={{ padding: 12 }}>ID</th><th style={{ padding: 12 }}>Name</th><th style={{ padding: 12 }}>Price</th><th style={{ padding: 12 }}>Stock</th><th style={{ padding: 12 }}>Actions</th></tr></thead>
                <tbody>
                  {products
                    .filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()) || String(p.id) === productSearch)
                    .map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: 12 }}>#{p.id}</td><td style={{ padding: 12 }}>{p.name}</td><td style={{ padding: 12 }}>Rs. {p.price}</td>
                      <td style={{ padding: 12 }}><span style={{ color: p.stock === 0 ? 'var(--red)' : 'inherit' }}>{p.stock === 0 ? 'Out of Stock' : p.stock}</span></td>
                      <td style={{ padding: 12, display: 'flex', gap: 8 }}>
                        <button onClick={() => handleEditProduct(p)} style={{ background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer' }}><Edit size={18} /></button>
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

            {/* Filter Bar */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 24, padding: 20, background: 'rgba(0,0,0,0.2)', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ flex: '1 1 200px' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Customer Name</label>
                <input type="text" className="form-input" placeholder="Search customer..." value={orderSearch} onChange={e => { setOrderSearch(e.target.value); setOrderPage(1); }} style={{ padding: '8px 12px' }} />
              </div>
              <div style={{ flex: '1 1 160px' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Payment Type</label>
                <select className="form-input" value={orderPayment} onChange={e => { setOrderPayment(e.target.value); setOrderPage(1); }} style={{ padding: '8px 12px' }}>
                  <option value="">All</option>
                  <option value="cod">Cash on Delivery</option>
                  <option value="card">Card</option>
                  <option value="bank">Bank Transfer</option>
                </select>
              </div>
              <div style={{ flex: '1 1 160px' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Status</label>
                <select className="form-input" value={orderStatus} onChange={e => { setOrderStatus(e.target.value); setOrderPage(1); }} style={{ padding: '8px 12px' }}>
                  <option value="">All</option>
                  <option value="Pending">Pending</option>
                  <option value="Processing">Processing</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div style={{ flex: '1 1 160px' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block', marginBottom: 4 }}>From Date</label>
                <input type="date" className="form-input" value={orderDateFrom} onChange={e => { setOrderDateFrom(e.target.value); setOrderPage(1); }} style={{ padding: '8px 12px' }} />
              </div>
              <div style={{ flex: '1 1 160px' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block', marginBottom: 4 }}>To Date</label>
                <input type="date" className="form-input" value={orderDateTo} onChange={e => { setOrderDateTo(e.target.value); setOrderPage(1); }} style={{ padding: '8px 12px' }} />
              </div>
              {(orderSearch || orderPayment || orderStatus || orderDateFrom || orderDateTo) && (
                <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'flex-end' }}>
                  <button onClick={() => { setOrderSearch(''); setOrderPayment(''); setOrderStatus(''); setOrderDateFrom(''); setOrderDateTo(''); setOrderPage(1); }} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--white)', borderRadius: 4, cursor: 'pointer' }}>Clear</button>
                </div>
              )}
            </div>

            {/* Orders List */}
            {(() => {
              const filtered = orders.filter(o => {
                if (orderSearch && !o.customer_name?.toLowerCase().includes(orderSearch.toLowerCase()) && !o.customer_email?.toLowerCase().includes(orderSearch.toLowerCase())) return false;
                if (orderPayment && o.payment_method !== orderPayment) return false;
                if (orderStatus && o.status !== orderStatus) return false;
                if (orderDateFrom && new Date(o.created_at) < new Date(orderDateFrom)) return false;
                if (orderDateTo) {
                  const end = new Date(orderDateTo); end.setHours(23,59,59,999);
                  if (new Date(o.created_at) > end) return false;
                }
                return true;
              });
              const totalPages = Math.ceil(filtered.length / ORDERS_PER_PAGE);
              const paginated = filtered.slice((orderPage - 1) * ORDERS_PER_PAGE, orderPage * ORDERS_PER_PAGE);

              return (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, background: 'rgba(255,255,255,0.05)', padding: '12px 16px', borderRadius: 8, border: '1px solid var(--border)' }}>
                    <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
                      Showing <strong>{filtered.length}</strong> {filtered.length === 1 ? 'order' : 'orders'}
                    </div>
                    <div style={{ color: 'var(--white)', fontSize: '1.1rem', fontWeight: 'bold' }}>
                      Total Value: Rs. {filtered.reduce((sum, o) => sum + Number(o.total_amount), 0).toLocaleString()}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {paginated.length === 0 && (
                      <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>No orders match your filters.</div>
                    )}
                    {paginated.map(o => (
                      <div key={o.id} style={{ 
                        background: 'var(--glass-bg)', 
                        backdropFilter: 'blur(var(--glass-blur))',
                        border: '1px solid var(--glass-border)', 
                        borderRadius: 12, 
                        padding: 24,
                        boxShadow: 'var(--shadow)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                          <div>
                            <h3 style={{ color: 'var(--text)', margin: 0 }}>Order #{o.id} <span style={{ fontSize: '0.8rem', padding: '4px 8px', borderRadius: 12, background: o.status === 'Delivered' ? '#166534' : o.status === 'Cancelled' ? '#4B1113' : '#7C2D12', color: 'white' }}>{o.status}</span></h3>
                            <p style={{ color: 'var(--text-2)', margin: '4px 0 0 0', fontSize: '0.9rem' }}>{new Date(o.created_at).toLocaleString()}</p>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <p style={{ color: 'var(--text)', fontWeight: 'bold', margin: 0, fontSize: '1.2rem' }}>Rs. {Number(o.total_amount).toLocaleString()}</p>
                            <p style={{ color: 'var(--text-2)', margin: 0, fontSize: '0.9rem', textTransform: 'uppercase' }}>{o.payment_method === 'cod' ? 'Cash on Delivery' : o.payment_method === 'bank' ? 'Bank Transfer' : 'Card'}</p>
                          </div>
                        </div>
                        
                        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', borderTop: '1px solid var(--glass-border)', paddingTop: 16 }}>
                          <div style={{ flex: 1, minWidth: '200px' }}>
                            <h4 style={{ color: 'var(--text)', marginBottom: 8, fontSize: '0.9rem', textTransform: 'uppercase' }}>Customer & Shipping</h4>
                            <p style={{ color: 'var(--text-2)', margin: 0, fontSize: '0.9rem' }}><strong>{o.customer_name}</strong> ({o.customer_email})</p>
                            <p style={{ color: 'var(--text-2)', margin: '4px 0', fontSize: '0.9rem' }}>{o.shipping_address || 'No address'}, {o.shipping_city}</p>
                            <p style={{ color: 'var(--text-2)', margin: 0, fontSize: '0.9rem' }}>📞 {o.shipping_phone}</p>
                          </div>
                          <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div>
                              <label style={{ display: 'block', color: 'var(--text-2)', fontSize: '0.8rem', marginBottom: 4 }}>Update Status</label>
                              <select className="form-input" value={o.status} onChange={(e) => handleUpdateOrder(o.id, e.target.value, o.tracking_number)}>
                                <option value="Pending">Pending</option><option value="Processing">Processing</option><option value="Shipped">Shipped</option><option value="Delivered">Delivered</option><option value="Cancelled">Cancelled</option>
                              </select>
                            </div>
                            <div>
                              <label style={{ display: 'block', color: 'var(--text-2)', fontSize: '0.8rem', marginBottom: 4 }}>Tracking Number</label>
                              <input type="text" className="form-input" placeholder="e.g. TRK123456789" value={o.tracking_number || ''} onChange={(e) => { const val = e.target.value; setOrders(orders.map(order => order.id === o.id ? { ...order, tracking_number: val } : order)); }} onBlur={(e) => handleUpdateOrder(o.id, o.status, e.target.value)} />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
                      <button onClick={() => setOrderPage(p => Math.max(1, p - 1))} disabled={orderPage === 1} style={{ padding: '8px 16px', background: orderPage === 1 ? 'rgba(255,255,255,0.05)' : 'var(--red)', border: 'none', color: 'white', borderRadius: 4, cursor: orderPage === 1 ? 'default' : 'pointer' }}>← Prev</button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                        <button key={p} onClick={() => setOrderPage(p)} style={{ padding: '8px 14px', background: p === orderPage ? 'var(--red)' : 'rgba(255,255,255,0.05)', border: 'none', color: 'white', borderRadius: 4, cursor: 'pointer', fontWeight: p === orderPage ? 'bold' : 'normal' }}>{p}</button>
                      ))}
                      <button onClick={() => setOrderPage(p => Math.min(totalPages, p + 1))} disabled={orderPage === totalPages} style={{ padding: '8px 16px', background: orderPage === totalPages ? 'rgba(255,255,255,0.05)' : 'var(--red)', border: 'none', color: 'white', borderRadius: 4, cursor: orderPage === totalPages ? 'default' : 'pointer' }}>Next →</button>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {/* CATEGORIES TAB */}
        {tab === 'categories' && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-hero)', fontSize: '1.5rem', marginBottom: 24, color: 'var(--white)' }}>Category Management</h2>
            <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: 16, marginBottom: 32, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 200px' }}>
                <label className="form-label">Category Name</label>
                <input required type="text" className="form-input" value={cForm.name} onChange={e => setCForm({ ...cForm, name: e.target.value })} />
              </div>
              <div style={{ flex: '1 1 200px' }}>
                <label className="form-label">Category Image (Optional)</label>
                <input type="file" className="form-input" accept="image/*" onChange={e => setCForm({ ...cForm, image: e.target.files[0] })} style={{ padding: '8px 12px' }} />
              </div>
              <button type="submit" className="btn-primary" style={{ padding: '12px 24px', flex: '0 0 auto' }}>Add Category</button>
            </form>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--white)' }}>
                <thead><tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--muted)' }}><th style={{ padding: 12 }}>Image</th><th style={{ padding: 12 }}>Name</th><th style={{ padding: 12 }}>Actions</th></tr></thead>
                <tbody>
                  {categories.map(c => (
                    <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: 12 }}>
                        {c.image_url ? (
                          <img src={`/api/uploads/${c.image_url}`} alt={c.name} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 8 }} />
                        ) : (
                          <div style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.1)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</div>
                        )}
                      </td>
                      <td style={{ padding: 12 }}>{c.name}</td>
                      <td style={{ padding: 12 }}><button onClick={() => handleDeleteCategory(c.id)} style={{ background: 'transparent', border: 'none', color: 'var(--red)', cursor: 'pointer' }}><Trash2 size={18} /></button></td>
                    </tr>
                  ))}
                  {categories.length === 0 && <tr><td colSpan="3" style={{ padding: 20, textAlign: 'center', color: 'var(--muted)' }}>No categories found</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
