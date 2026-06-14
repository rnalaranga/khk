import { useState, useEffect } from 'react';

const API_BASE = `/api`;

const STATUS_LIST = ['Pending', 'Processing', 'Shipped', 'Completed', 'Cancelled'];

const STATUS_BADGE = {
  Pending:    'badge-yellow',
  Processing: 'badge-blue',
  Shipped:    'badge-solid',
  Completed:  'badge-green',
  Cancelled:  'badge-gray',
};

const CAT_EMOJI = {
  'Engine Oil':'🛢️', 'Filters':'🔧', 'Coolant':'🧊',
  'Wiper Blades':'🌧️', 'Brake Pads':'🚗', 'Brake Washers':'⚙️',
};

const MOCK_ORDERS = [
  {
    id: 1, order_number: 'KHK-001823',
    customer_name: 'Kamal Perera', customer_phone: '0771234567', customer_city: 'Colombo',
    total_amount: 12500, delivery_fee: 0, status: 'Completed',
    created_at: '2026-05-20T08:30:00Z',
    items: [
      { name: 'Synthetic Engine Oil 5W-30', category: 'Engine Oil', quantity: 2, unit_price: 3825 },
      { name: 'Premium Oil Filter',         category: 'Filters',     quantity: 1, unit_price: 680  },
    ],
  },
  {
    id: 2, order_number: 'KHK-001824',
    customer_name: 'Nimal Silva', customer_phone: '0712345678', customer_city: 'Kandy',
    total_amount: 9200, delivery_fee: 350, status: 'Shipped',
    created_at: '2026-05-21T10:15:00Z',
    items: [
      { name: 'Ceramic Brake Pads (Front)',  category: 'Brake Pads',   quantity: 1, unit_price: 4675 },
      { name: 'Bosch Wiper Blades (Pair)',   category: 'Wiper Blades', quantity: 2, unit_price: 1920 },
    ],
  },
  {
    id: 3, order_number: 'KHK-001825',
    customer_name: 'Sunethra Jayawardena', customer_phone: '0761234567', customer_city: 'Galle',
    total_amount: 5800, delivery_fee: 0, status: 'Processing',
    created_at: '2026-05-22T14:20:00Z',
    items: [
      { name: 'Hybrid Engine Oil 0W-16', category: 'Engine Oil', quantity: 1, unit_price: 5220 },
      { name: 'Cabin Air Filter',        category: 'Filters',    quantity: 1, unit_price: 750  },
    ],
  },
  {
    id: 4, order_number: 'KHK-001826',
    customer_name: 'Ravi Bandara', customer_phone: '0779876543', customer_city: 'Negombo',
    total_amount: 14850, delivery_fee: 0, status: 'Pending',
    created_at: '2026-05-23T07:45:00Z',
    items: [
      { name: 'Brake Rotor Set',     category: 'Brake Washers', quantity: 1, unit_price: 10800 },
      { name: 'All-Season Coolant',  category: 'Coolant',        quantity: 2, unit_price: 1710  },
    ],
  },
  {
    id: 5, order_number: 'KHK-001827',
    customer_name: 'Dilani Fernando', customer_phone: '0751234567', customer_city: 'Matara',
    total_amount: 3200, delivery_fee: 350, status: 'Cancelled',
    created_at: '2026-05-23T09:10:00Z',
    items: [
      { name: 'Air Filter Pro', category: 'Filters', quantity: 2, unit_price: 1080 },
    ],
  },
];

const fmt = d => new Date(d).toLocaleDateString('en-LK', {
  day: '2-digit', month: 'short', year: 'numeric',
  hour: '2-digit', minute: '2-digit',
});

export default function AdminDashboard({ addToast }) {
  const [orders, setOrders]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [expanded, setExpanded]   = useState(null);
  const [isLive, setIsLive]       = useState(false);

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  const load = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/orders`, { signal: AbortSignal.timeout(3000) });
      if (!res.ok) throw new Error();
      setOrders(await res.json());
      setIsLive(true);
    } catch {
      setOrders(MOCK_ORDERS);
      setIsLive(false);
    } finally {
      setLoading(false);
    }
  };

  const changeStatus = async (id, status) => {
    setOrders(o => o.map(x => x.id === id ? { ...x, status } : x));
    try {
      await fetch(`${API_BASE}/admin/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
        signal: AbortSignal.timeout(3000),
      });
      addToast(`Order status → "${status}"`, 'success');
    } catch {
      addToast(`Status updated (Demo Mode)`, 'info');
    }
  };

  /* metrics */
  const active  = orders.filter(o => o.status !== 'Cancelled');
  const revenue = active.reduce((s, o) => s + Number(o.total_amount), 0);
  const pending = orders.filter(o => o.status === 'Pending').length;
  const avg     = active.length ? Math.round(revenue / active.length) : 0;

  return (
    <div className="admin">
      {/* ── Header ── */}
      <div className="admin-top">
        <div>
          <h1 className="admin-heading">Orders <em>Dashboard</em></h1>
          <div className="admin-sub">
            {isLive
              ? '🟢 Live data from MySQL database'
              : '🟡 Demo mode — connect MySQL backend to enable live tracking'}
          </div>
        </div>
        <button className="btn btn-outline" onClick={load} id="refresh-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
          Refresh
        </button>
      </div>

      {/* ── Metric Cards ── */}
      <div className="metrics">
        <div className="metric-card">
          <span className="metric-icon">💰</span>
          <div className="metric-label">Total Revenue</div>
          <div className="metric-value">Rs.&nbsp;{revenue.toLocaleString()}</div>
          <div className="metric-note">Excluding cancelled orders</div>
        </div>
        <div className="metric-card">
          <span className="metric-icon">📦</span>
          <div className="metric-label">Total Orders</div>
          <div className="metric-value">{orders.length}</div>
          <div className="metric-note">{active.length} active</div>
        </div>
        <div className="metric-card">
          <span className="metric-icon">⏳</span>
          <div className="metric-label">Pending</div>
          <div className="metric-value">{pending}</div>
          <div className={`metric-note ${pending > 0 ? 'warn' : 'ok'}`}>
            {pending > 0 ? '⚠ Action required' : '✓ All cleared'}
          </div>
        </div>
        <div className="metric-card">
          <span className="metric-icon">📈</span>
          <div className="metric-label">Avg. Order</div>
          <div className="metric-value">Rs.&nbsp;{avg.toLocaleString()}</div>
          <div className="metric-note">Per active order</div>
        </div>
      </div>

      {/* ── Orders Table ── */}
      <div className="orders-box">
        <div className="orders-box-head">
          <div>
            <div className="orders-box-title">Recent Orders</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: 2 }}>
              {orders.length} orders total
            </div>
          </div>
          <div className="orders-status-pills">
            {STATUS_LIST.map(s => (
              <span key={s} className={`badge ${STATUS_BADGE[s]}`}>
                {s}&nbsp;{orders.filter(o => o.status === s).length}
              </span>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 56, textAlign: 'center', color: 'var(--text-3)' }}>
            <div style={{ width: 32, height: 32, border: '3px solid var(--line)', borderTopColor: 'var(--accent)', borderRadius: '50%', margin: '0 auto 12px', animation: 'spin 0.8s linear infinite' }} />
            Loading orders…
          </div>
        ) : orders.length === 0 ? (
          <div className="admin-empty">
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📭</div>
            <div style={{ fontWeight: 600, marginBottom: 6, color: 'var(--text-2)' }}>No orders yet</div>
            <div style={{ fontSize: '0.84rem' }}>Orders placed through the shop will appear here</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="orders-table" id="orders-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>City</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Items</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <>
                    <tr key={order.id} id={`order-${order.id}`}>
                      <td><span className="ord-id">{order.order_number || `#${order.id}`}</span></td>
                      <td>
                        <div className="ord-customer">{order.customer_name}</div>
                        <div className="ord-phone">{order.shipping_phone || order.customer_phone}</div>
                        <div className="ord-address" style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: 4 }}>
                          {order.shipping_address || 'No address provided'}
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-2)' }}>{order.shipping_city || '—'}</td>
                      <td><div className="ord-date">{fmt(order.created_at)}</div></td>
                      <td>
                        <div className="ord-amount">Rs.&nbsp;{Number(order.total_amount).toLocaleString()}</div>
                        {Number(order.delivery_fee) === 0 && <div className="ord-free">Free delivery</div>}
                      </td>
                      <td>
                        <select
                          className="status-select"
                          value={order.status}
                          onChange={e => changeStatus(order.id, e.target.value)}
                          id={`status-${order.id}`}
                        >
                          {STATUS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td>
                        <button
                          className="expand-btn"
                          onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                          id={`expand-${order.id}`}
                        >
                          {expanded === order.id ? '▲' : '▼'}
                          &nbsp;{(order.items || []).length} item{(order.items || []).length !== 1 ? 's' : ''}
                        </button>
                      </td>
                    </tr>

                    {expanded === order.id && (
                      <tr className="items-row" key={`items-${order.id}`}>
                        <td colSpan={7}>
                          <div className="items-list">
                            {(order.items || []).map((item, i) => (
                              <div className="item-row" key={i}>
                                <span className="item-row-icon">{CAT_EMOJI[item.category] || '🔩'}</span>
                                <span className="item-row-name">{item.name}</span>
                                <span className="item-row-qty badge badge-gray">× {item.quantity}</span>
                                <span className="item-row-price">
                                  Rs.&nbsp;{(Number(item.unit_price) * Number(item.quantity)).toLocaleString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
