import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BrowserRouter, Link, NavLink, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import './styles.css';

const API_URL = process.env.REACT_APP_API_URL
  || (process.env.NODE_ENV === 'development' ? 'http://localhost:8000/api/v1' : '/api/v1');

async function request(path, options = {}) {
  const token = localStorage.getItem('annadata_token');
  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) },
    });
    const contentType = response.headers.get('content-type') || '';
    const json = contentType.includes('application/json')
      ? await response.json()
      : { message: `The server returned HTML instead of an API response (${response.status}). Check that the backend is running on port 8000.` };
    if (!response.ok) throw new Error(json.message || json.error || 'Something went wrong');
    return json;
  } catch (error) {
    console.error(`Annadata API request failed: ${path}`, error);
    if (options.required) throw error;
    return null;
  }
}

async function getShippingAddress(user) {
  if (user?.address?.trim()) return user.address.trim();
  const profile = await request('/auth/me');
  return profile?.data?.address?.trim() || '';
}

// ─── STATUS HELPERS ──────────────────────────────────────────────────────────
const STATUS_STEPS = ['Placed', 'Confirmed', 'Dispatched', 'Delivered'];
const STATUS_COLORS = {
  Placed: '#f59e0b',
  Confirmed: '#3b82f6',
  Dispatched: '#8b5cf6',
  Delivered: '#10b981',
  Cancelled: '#ef4444',
};
const PAYMENT_COLORS = { Pending: '#f59e0b', Completed: '#10b981', Failed: '#ef4444', Refunded: '#6b7280' };

// ─── APP ──────────────────────────────────────────────────────────────────────
function App() {
  return <BrowserRouter><AppShell /></BrowserRouter>;
}

// ─── NOTIFICATION BELL ────────────────────────────────────────────────────────
function NotificationBell({ user }) {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const load = useCallback(async () => {
    if (!user) return;
    const r = await request('/notifications');
    if (r?.data) { setNotifications(r.data); setUnread(r.unreadCount || 0); }
  }, [user]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = async () => {
    await request('/notifications/read-all', { method: 'PUT' });
    setUnread(0);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markOne = async (id) => {
    await request(`/notifications/${id}/read`, { method: 'PUT' });
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    setUnread(prev => Math.max(0, prev - 1));
  };

  if (!user) return null;

  return (
    <div className="notif-bell-wrap" ref={ref}>
      <button className="notif-bell" onClick={() => { setOpen(o => !o); if (!open) load(); }} aria-label="Notifications">
        🔔{unread > 0 && <span className="notif-badge">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open && (
        <div className="notif-dropdown">
          <div className="notif-header">
            <strong>Notifications</strong>
            {unread > 0 && <button className="notif-mark-all" onClick={markAllRead}>Mark all read</button>}
          </div>
          <div className="notif-list">
            {notifications.length === 0 && <div className="notif-empty">No notifications yet</div>}
            {notifications.map(n => (
              <div key={n._id} className={`notif-item${n.read ? '' : ' unread'}`} onClick={() => markOne(n._id)}>
                <span className="notif-dot" />
                <div>
                  <p>{n.message}</p>
                  <small>{new Date(n.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AppShell() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('annadata_user') || 'null'));
  const [menuOpen, setMenuOpen] = useState(false);
  const logout = () => { localStorage.removeItem('annadata_token'); localStorage.removeItem('annadata_user'); setUser(null); };
  return (
    <div className="app">
      <div className="announcement"><span>✦</span> India's trusted digital marketplace for better farm-to-table trade <Link to="/marketplace">Explore today's mandi prices →</Link></div>
      <header className="site-header">
        <Link to="/" className="brand"><span className="brand-mark">अ</span><span>Annadata<strong>Digital</strong><small>Grow together</small></span></Link>
        <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation">☰</button>
        <nav className={menuOpen ? 'main-nav open' : 'main-nav'}>
          <NavLink to="/" end onClick={() => setMenuOpen(false)}>Home</NavLink>
          <NavLink to="/marketplace" onClick={() => setMenuOpen(false)}>Marketplace</NavLink>
          <NavLink to="/group-buying" onClick={() => setMenuOpen(false)}>Group buying <span className="nav-badge">New</span></NavLink>
          {user && <NavLink to="/dashboard" onClick={() => setMenuOpen(false)}>My dashboard</NavLink>}
          {user ? <div className="header-account">
            <NotificationBell user={user} />
            <Link className="header-user" to="/profile"><span>{user.name?.[0] || 'A'}</span>{user.name?.split(' ')[0] || 'Account'} <small>Profile</small></Link>
            <button className="logout-button" onClick={logout}>Log out</button>
          </div> : <Link className="login-link" to="/login" onClick={() => setMenuOpen(false)}>Log in <span>→</span></Link>}
        </nav>
      </header>
      <main><Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/marketplace" element={<MarketplacePage />} />
        <Route path="/product/:id" element={<ProductPage user={user} />} />
        <Route path="/group-buying" element={<GroupBuyingPage user={user} />} />
        <Route path="/login" element={<AuthPage mode="login" setUser={setUser} />} />
        <Route path="/register" element={<AuthPage mode="register" setUser={setUser} />} />
        <Route path="/dashboard" element={<DashboardPage user={user} />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/orders/:id" element={<OrderDetailPage />} />
        <Route path="/profile" element={<ProfilePage setUser={setUser} />} />
        <Route path="/sell" element={<ProductFormPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/users/:userId" element={<AdminUserPage />} />
        <Route path="/reviews" element={<FarmerReviewsPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes></main>
      <footer><div className="footer-top"><div><Link to="/" className="brand footer-brand"><span className="brand-mark">अ</span><span>Annadata<strong>Digital</strong><small>Grow together</small></span></Link><p>Making agriculture more transparent,<br />profitable and connected.</p></div><div><h4>Discover</h4><Link to="/marketplace">Marketplace</Link><Link to="/group-buying">Group buying</Link><Link to="/marketplace">Market prices</Link></div><div><h4>For farmers</h4><Link to="/register">Start selling</Link><Link to="/register">Farmer community</Link><Link to="/dashboard">Farmer dashboard</Link></div><div><h4>Need help?</h4><a href="mailto:hello@annadata.digital">hello@annadata.digital</a><span>Mon–Sat, 9am–6pm</span><span>Made in India 🇮🇳</span></div></div><div className="footer-bottom"><span>© 2026 Annadata Digital</span><span>Fair trade. Better futures.</span></div></footer>
    </div>
  );
}

function HomePage() {
  const [market, setMarket] = useState([]);
  const [products, setProducts] = useState([]);
  useEffect(() => { request('/marketplace/status').then(r => r?.data && setMarket(r.data)); request('/products').then(r => r?.data && setProducts(r.data.slice(0, 4))); }, []);
  return <><section className="hero"><div className="hero-copy"><div className="eyebrow"><span className="pulse-dot" /> The smarter way to trade produce</div><h1>From your field<br />to <em>their table.</em></h1><p>India's digital marketplace where farmers earn better, buyers source smarter, and every harvest finds its true value.</p><div className="hero-actions"><Link className="button primary" to="/marketplace">Explore the marketplace <span>↗</span></Link><Link className="button text-button" to="/register">I'm a farmer <span>→</span></Link></div><div className="hero-proof"><div className="avatar-stack"><i>R</i><i>M</i><i>S</i><i>+1k</i></div><span><strong>1,200+ people</strong><br />growing together</span></div></div><div className="hero-art"><div className="sun" /><div className="field field-back" /><div className="field field-mid" /><div className="field field-front" /><div className="hero-card"><span>MARKET UPDATE</span><strong>Wheat <b>↑ 4.3%</b></strong><small>₹2,420 / quintal</small></div><div className="art-plant">🌾</div></div></section>
    <section className="stats-strip"><div><strong>₹18.4Cr</strong><span>Value traded</span></div><div><strong>2,840<span>+</span></strong><span>Farmer partners</span></div><div><strong>18<span> states</span></strong><span>Connected across India</span></div><div><strong>4.9<span> / 5</span></strong><span>Community rating</span></div></section>
    <section className="section market-preview"><div className="section-heading"><div><span className="eyebrow">LIVE FROM THE MANDI</span><h2>Know your market.<br /><em>Make your move.</em></h2></div><Link to="/marketplace" className="button outline">View all prices ↗</Link></div><div className="market-grid">{market.map((item, index) => <MarketCard key={item._id || item.cropName} item={item} index={index} />)}</div></section>
    <section className="section featured"><div className="section-heading"><div><span className="eyebrow">FRESHLY LISTED</span><h2>Good produce.<br /><em>Good people.</em></h2></div><Link to="/marketplace" className="button outline">Browse marketplace ↗</Link></div><ProductGrid products={products} /></section>
    <section className="cta-banner"><div><span className="eyebrow">YOUR HARVEST, YOUR TERMS</span><h2>Ready to get a fairer<br /><em>deal for your work?</em></h2><Link to="/register" className="button light">Join Annadata Digital <span>→</span></Link></div><div className="cta-leaf">✽</div></section>
  </>;
}

function MarketCard({ item, index }) {
  const price = item.currentPrice || item.current_price || 0; const previous = item.previousPrice || item.previous_price || price; const rise = price >= previous;
  return <div className={`market-card tone-${index % 4}`}><div className="market-icon">{['🌾', '🌱', '🫘', '🧅'][index % 4]}</div><div><strong>{item.cropName || item.crop || 'Crop'}</strong><span>₹{price.toLocaleString('en-IN')} / qtl</span></div><div className={rise ? 'trend up' : 'trend down'}>{rise ? '↗' : '↘'} {Math.abs(((price - previous) / previous) * 100).toFixed(1)}%</div><small>{item.demandLevel || 'Stable'} demand</small></div>;
}

function MarketplacePage() {
  const [products, setProducts] = useState([]); const [search, setSearch] = useState(''); const [category, setCategory] = useState('All'); const [market, setMarket] = useState([]);
  useEffect(() => { request('/products').then(r => r?.data && setProducts(r.data)); request('/marketplace/status').then(r => r?.data && setMarket(r.data)); }, []);
  const filtered = products.filter(p => (category === 'All' || p.category === category) && p.name.toLowerCase().includes(search.toLowerCase()));
  return <><div className="page-hero"><div><span className="eyebrow">THE MARKETPLACE</span><h1>Source with<br /><em>confidence.</em></h1><p>Direct-from-farm produce, transparent pricing, and a community built on trust.</p></div><div className="page-hero-visual">🌾<span>Verified harvests<br /><b>arrive daily</b></span></div></div><section className="section marketplace-section"><div className="toolbar"><div className="search-box">⌕<input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search rice, onions, pulses..." /></div><div className="category-tabs">{['All', 'Grains', 'Pulses', 'Vegetables', 'Fruits', 'Spices', 'Oilseeds'].map(c => <button className={category === c ? 'active' : ''} onClick={() => setCategory(c)} key={c}>{c}</button>)}</div></div><div className="market-layout"><div className="market-products"><div className="results-line"><span><strong>{filtered.length}</strong> harvests available</span><span className="verified-label">✓ Verified sellers only</span></div><ProductGrid products={filtered} /></div><aside className="price-aside"><span className="eyebrow">TODAY'S PULSE</span><h3>Mandi prices</h3>{market.map((item, i) => <MarketCard key={item._id || item.cropName} item={item} index={i} />)}<Link to="/marketplace" className="aside-link">See all market trends →</Link></aside></div></section></>;
}

function ProductGrid({ products }) { return <div className="product-grid">{products.length ? products.map(p => <ProductCard key={p._id} product={p} />) : <div className="empty-state">No produce is currently available from the marketplace.</div>}</div>; }
function ProductCard({ product }) { const image = { Grains: '🌾', Pulses: '🫘', Vegetables: '🥕', Fruits: '🥭', Spices: '🌶️', Oilseeds: '🌻' }[product.category] || '🌱'; return <Link to={`/product/${product._id}`} className="product-card"><div className={`product-image cat-${product.category?.toLowerCase()}`}><span>{image}</span><label>{product.category}</label><button onClick={e => e.preventDefault()} aria-label="Save product">♡</button></div><div className="product-info"><div className="farmer-line"><span className="mini-avatar">{product.farmerId?.name?.[0] || 'F'}</span><span>{product.farmerId?.name || 'Verified farmer'} <b>✓</b></span><span className="rating">★ {product.farmerId?.averageRating || '4.8'}</span></div><h3>{product.name}</h3><div className="price-row"><strong>₹{Number(product.price_per_quintal).toLocaleString('en-IN')}<small> / quintal</small></strong><span>{product.quantity_quintals} qtl available</span></div></div></Link>; }

function ProductPage({ user }) { const { id } = useParams(); const [product, setProduct] = useState(null); const [quantity, setQuantity] = useState(1); const [sent, setSent] = useState(false); const [orderError, setOrderError] = useState(''); useEffect(() => { request(`/products/${id}`, { required: true }).then(r => r?.data && setProduct(r.data)).catch(() => setProduct(null)); }, [id]); if (!product) return <section className="section empty-state-page"><span className="eyebrow">PRODUCT</span><h1>Produce not<br /><em>found.</em></h1><Link to="/marketplace" className="button primary">Back to marketplace →</Link></section>; const buy = async () => { if (!user) return; setOrderError(''); const shippingAddress = await getShippingAddress(user); if (!shippingAddress) { setOrderError('Please update your address before placing an order.'); return; } const result = await request('/orders', { method: 'POST', required: true, body: JSON.stringify({ productId: product._id, quantity_quintals: quantity, shippingAddress }) }).catch(error => { setOrderError(error.message); return null; }); if (result) setSent(true); }; return <section className="section product-detail"><Link to="/marketplace" className="back-link">← Back to marketplace</Link><div className="detail-layout"><div className={`detail-image cat-${product.category?.toLowerCase()}`}><span>{product.category === 'Fruits' ? '🥭' : product.category === 'Vegetables' ? '🥕' : product.category === 'Pulses' ? '🫘' : '🌾'}</span><label>Harvested with care</label></div><div className="detail-copy"><div className="farmer-line"><span className="mini-avatar">{product.farmerId?.name?.[0] || 'F'}</span><span>{product.farmerId?.name || 'Verified farmer'} <b>✓</b> · {product.farmerId?.address || 'India'}</span></div><span className="eyebrow">{product.category}</span><h1>{product.name}</h1><p className="detail-description">{product.description}</p><div className="detail-price"><strong>₹{Number(product.price_per_quintal).toLocaleString('en-IN')}</strong><span>per quintal · {product.quantity_quintals} quintals available</span></div><div className="order-box"><label>How much do you need?</label><div className="quantity-input"><button onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button><strong>{quantity}</strong><span>quintal{quantity > 1 ? 's' : ''}</span><button onClick={() => setQuantity(Math.min(product.quantity_quintals, quantity + 1))}>+</button></div><div className="order-total"><span>Estimated total</span><strong>₹{(quantity * product.price_per_quintal).toLocaleString('en-IN')}</strong></div>{orderError && <div className="form-error">{orderError}</div>}{sent ? <div className="success-message">✓ Order placed successfully. The farmer will be in touch soon.</div> : <button className="button primary wide" onClick={buy}>{user ? 'Place order' : 'Log in to order'} <span>→</span></button>}</div></div></div></section>; }

function GroupBuyingPage({ user }) { const [deals, setDeals] = useState([]); const [joined, setJoined] = useState(null); useEffect(() => { request('/group-buying').then(r => r?.data && setDeals(r.data)); }, []); return <><div className="page-hero group-hero"><div><span className="eyebrow">BUY BETTER, TOGETHER</span><h1>More hands.<br /><em>Better prices.</em></h1><p>Pool your order with other buyers, unlock bulk discounts, and help farmers move more produce in one go.</p></div><div className="group-orbit"><span>12%</span><small>average<br />saving</small></div></div><section className="section"><div className="section-heading"><div><span className="eyebrow">OPEN GROUP DEALS</span><h2>Join the next<br /><em>big harvest.</em></h2></div><div className="deal-note">⏱ Deals close when the target is reached</div></div><div className="deal-grid">{deals.length ? deals.map(deal => { const p = deal.productId || {}; const progress = Math.min(100, ((deal.current_quantity_quintals || 0) / deal.target_quantity_quintals) * 100); return <div className="deal-card" key={deal._id}><div className="deal-top"><span className="deal-icon">{p.category === 'Fruits' ? '🥭' : p.category === 'Pulses' ? '🫘' : '🌾'}</span><span className="discount">Save {deal.discount_percentage || deal.bulkDiscountPercentage || 10}%</span></div><span className="eyebrow">{p.category || 'Fresh produce'}</span><h3>{p.name || 'Community harvest'}</h3><p>Premium produce, sourced directly from a verified farmer.</p><div className="progress-label"><span><strong>{deal.current_quantity_quintals || 0} qtl</strong> joined</span><span>{deal.target_quantity_quintals} qtl goal</span></div><div className="progress"><i style={{ width: `${progress}%` }} /></div><div className="deal-footer"><span>Closes {new Date(deal.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span><button className="button small primary" onClick={async () => { if (!user) return; const shippingAddress = await getShippingAddress(user); if (!shippingAddress) return; const r = await request(`/group-buying/${deal._id}/join`, { method: 'PUT', required: true, body: JSON.stringify({ quantity_quintals: 1, shippingAddress }) }); if (r) setJoined(deal._id); }}>{joined === deal._id ? 'Joined ✓' : user ? 'Join deal →' : 'Log in to join'}</button></div></div>; }) : <div className="empty-state">No active group deals are available right now.</div>}</div></section></>; }

function AuthPage({ mode, setUser }) { const login = mode === 'login'; const navigate = useNavigate(); const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', address: '', role: 'Consumer' }); const [error, setError] = useState(''); const update = e => setForm({ ...form, [e.target.name]: e.target.value }); const submit = async e => { e.preventDefault(); setError(''); if (!login && !/^[6-9]\d{9}$/.test(form.phone)) { setError('Enter a valid 10-digit Indian mobile number.'); return; } const result = await request(`/auth/${login ? 'login' : 'register'}`, { method: 'POST', required: true, body: JSON.stringify(form) }).catch(err => { setError(err.message); return null; }); if (result) { localStorage.setItem('annadata_token', result.token); localStorage.setItem('annadata_user', JSON.stringify(result.user)); setUser(result.user); navigate('/dashboard'); } }; return <section className="auth-page"><div className="auth-art"><div className="auth-quote">"When farmers prosper,<br /><em>communities flourish.</em>"</div><span>Built for the people who grow India.</span></div><div className="auth-form"><Link to="/" className="back-link">← Back home</Link><span className="eyebrow">{login ? 'WELCOME BACK' : 'JOIN THE MOVEMENT'}</span><h1>{login ? 'Good to see you.' : "Let\u2019s grow together."}</h1><p>{login ? 'Sign in to keep your farm or sourcing journey moving.' : 'Create your account and discover a fairer way to trade.'}</p><form onSubmit={submit}>{!login && <label>Full name<input name="name" required minLength="2" value={form.name} onChange={update} placeholder="Your name" /></label>}<label>Email address<input name="email" type="email" required value={form.email} onChange={update} placeholder="you@example.com" /></label><label>Password<input name="password" type="password" required minLength="6" value={form.password} onChange={update} placeholder="At least 6 characters" /></label>{!login && <><label>Mobile number<input name="phone" required inputMode="numeric" pattern="[6-9][0-9]{9}" value={form.phone} onChange={update} placeholder="10-digit mobile number" /></label><label>Address<input name="address" required minLength="5" value={form.address} onChange={update} placeholder="City, state" /></label><label>I am a...<select name="role" value={form.role} onChange={update}><option>Consumer</option><option>Farmer</option></select></label></>}{error && <div className="form-error">{error}</div>}<button className="button primary wide">{login ? 'Sign in' : 'Create my account'} <span>→</span></button></form><div className="auth-switch">{login ? 'New to Annadata?' : 'Already have an account?'} <Link to={login ? '/register' : '/login'}>{login ? 'Create an account' : 'Sign in'}</Link></div></div></section>; }

function DashboardPage({ user }) { const [products, setProducts] = useState([]); const [orders, setOrders] = useState([]); useEffect(() => { if (user?.role === 'Farmer') request(`/products?farmerId=${user.id}`).then(r => r?.data && setProducts(r.data)); else request('/products').then(r => r?.data && setProducts(r.data)); if (user?.role === 'Consumer') request('/orders').then(r => r?.data && setOrders(r.data)); }, [user]); if (!user) return <NavigateToLogin />; if (user.role === 'Admin') return <NavigateToAdmin />; const farmer = user.role === 'Farmer'; return <section className="section dashboard"><div className="dashboard-head"><div><span className="eyebrow">{farmer ? 'FARMER STUDIO' : 'YOUR SPACE'}</span><h1>Good morning, {user.name?.split(' ')[0] || 'friend'} <span>✦</span></h1><p>{farmer ? "Your harvest is valuable. Here\u2019s how it is moving today." : 'Stay close to every order, every harvest, every connection.'}</p></div><span className="status-chip">● Account active</span></div><div className="dashboard-grid"><div className="welcome-card"><span className="eyebrow">YOUR ACCOUNT</span><strong>{farmer ? `${products.length} listings` : `${orders.length} orders`}</strong><p>{farmer ? 'Active produce listings from your farm' : 'Orders placed from your account'}</p><div className="sparkline">╱╲╱╲╱╱╲╱╲╱</div></div><div className="metric-card"><span>{farmer ? 'Active listings' : 'Orders placed'}</span><strong>{farmer ? products.length : orders.length}</strong><small>{farmer ? 'Loaded from your marketplace' : 'Loaded from your account'}</small></div><div className="metric-card"><span>Community rating</span><strong>{user.averageRating || '—'} <i>★</i></strong><small>From your profile</small></div></div><div className="dashboard-content"><div className="panel"><div className="panel-head"><h2>{farmer ? 'Your harvests' : 'Recent orders'}</h2><Link to={farmer ? '/sell' : '/orders'}>View all →</Link></div>{(farmer ? products : orders).slice(0, 3).map(item => farmer ? <div className="list-row" key={item._id}><span className="row-icon">{item.category === 'Fruits' ? '🥭' : item.category === 'Vegetables' ? '🥕' : '🌾'}</span><div><strong>{item.name}</strong><small>{item.quantity_quintals} quintals available</small></div><b>₹{Number(item.price_per_quintal).toLocaleString('en-IN')}</b></div> : <Link className="list-row list-row-link" to={`/orders/${item._id}`} key={item._id}><span className="row-icon">📦</span><div><strong>{item.productId?.name || 'Produce order'}</strong><small>{item.quantity_quintals} qtl · {item.status}</small></div><b>₹{Number(item.total_price).toLocaleString('en-IN')}</b></Link>)}{!(farmer ? products : orders).length && <div className="empty-state">{farmer ? 'You have not listed any produce yet.' : 'You have not placed any orders yet.'}</div>}</div><div className="quick-panel"><span className="eyebrow">QUICK ACTIONS</span><Link to="/marketplace">⌕ <span>Find produce</span> →</Link>{farmer && <Link to="/sell">＋ <span>List a harvest</span> →</Link>}<Link to="/group-buying">◎ <span>Join a group deal</span> →</Link>{farmer && <Link to="/reviews">★ <span>See ratings</span> →</Link>}<Link to="/orders">▣ <span>Track an order</span> →</Link><Link to="/profile">◉ <span>View profile</span> →</Link></div></div></section>; }
function NavigateToLogin() { const navigate = useNavigate(); useEffect(() => navigate('/login'), [navigate]); return null; }
function NavigateToAdmin() { const navigate = useNavigate(); useEffect(() => navigate('/admin'), [navigate]); return null; }

// ─── PROFILE PAGE (with UPI ID for farmers) ──────────────────────────────────
function ProfilePage({ setUser }) {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    request('/users/profile', { required: true })
      .then(r => { setProfile(r?.data); setForm(r?.data || {}); })
      .catch(err => setError(err.message));
  }, []);

  if (!profile && error) return <section className="section empty-state-page"><div className="form-error">{error}</div></section>;
  if (!profile) return <section className="section"><p>Loading profile...</p></section>;

  const update = e => setForm({ ...form, [e.target.name]: e.target.value });

  const save = async e => {
    e.preventDefault(); setMessage(''); setError('');
    const payload = { name: form.name, email: form.email, phone: form.phone, address: form.address };
    if (profile.role === 'Farmer') payload.upiId = form.upiId || '';
    const result = await request('/users/profile', { method: 'PUT', required: true, body: JSON.stringify(payload) })
      .catch(err => { setError(err.message); return null; });
    if (result?.data) {
      setProfile(result.data); setForm(result.data);
      const saved = JSON.parse(localStorage.getItem('annadata_user') || '{}');
      localStorage.setItem('annadata_user', JSON.stringify({ ...saved, ...result.data }));
      setUser({ ...saved, ...result.data });
      setMessage('Profile updated successfully.');
    }
  };

  return (
    <section className="section profile-page">
      <span className="eyebrow">YOUR PROFILE</span>
      <h1>Personal <em>details.</em></h1>
      <p className="detail-description">Keep your contact and delivery information up to date.</p>
      <form className="profile-form" onSubmit={save}>
        <label>Full name<input name="name" required value={form.name || ''} onChange={update} /></label>
        <label>Email address<input name="email" type="email" required value={form.email || ''} onChange={update} /></label>
        <label>Mobile number<input name="phone" required pattern="[6-9][0-9]{9}" value={form.phone || ''} onChange={update} /></label>
        <label>Address<input name="address" required minLength="5" value={form.address || ''} onChange={update} /></label>
        {profile.role === 'Farmer' && (
          <label>
            UPI ID <small style={{ fontWeight: 400, color: '#6b7280' }}>(for receiving payments from consumers)</small>
            <input name="upiId" value={form.upiId || ''} onChange={update} placeholder="e.g. yourname@upi or 9876543210@paytm" />
          </label>
        )}
        <div>{message && <div className="success-message">{message}</div>}{error && <div className="form-error">{error}</div>}</div>
        <button className="button primary">Save changes →</button>
      </form>
    </section>
  );
}

// ─── ORDERS PAGE (All orders list, clickable) ─────────────────────────────────
function OrdersPage() {
  const user = JSON.parse(localStorage.getItem('annadata_user') || 'null');
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    request('/orders', { required: true })
      .then(r => { setOrders(r?.data || []); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, []);

  if (!user) return <NavigateToLogin />;

  const isFarmer = user.role === 'Farmer';

  return (
    <section className="section orders-page">
      <span className="eyebrow">{isFarmer ? 'FARMER ORDERS' : 'YOUR JOURNEY'}</span>
      <h1>{isFarmer ? 'Incoming <em>orders.</em>' : 'Orders & <em>deliveries.</em>'}</h1>
      {/* Fix: use dangerouslySetInnerHTML for the h1 with em */}
      {error && <div className="form-error">{error}</div>}
      {loading && <p style={{ color: '#6b7280' }}>Loading orders...</p>}
      {!loading && orders.length > 0 && (
        <div className="orders-list">
          {orders.map(order => <OrderSummaryCard key={order._id} order={order} isFarmer={isFarmer} />)}
        </div>
      )}
      {!loading && !orders.length && !error && (
        <div className="empty-orders">
          <div>📦</div>
          <h2>{isFarmer ? 'No orders yet' : 'Your orders will appear here'}</h2>
          <p>{isFarmer ? 'Orders from consumers will show up here once they place them.' : 'Once you place an order, you\'ll be able to follow it from farm to doorstep.'}</p>
          {!isFarmer && <Link to="/marketplace" className="button primary">Explore produce →</Link>}
        </div>
      )}
    </section>
  );
}

function OrderSummaryCard({ order, isFarmer }) {
  const stepIndex = STATUS_STEPS.indexOf(order.status);
  const statusColor = STATUS_COLORS[order.status] || '#6b7280';
  const otherParty = isFarmer ? order.consumerId : order.farmerId;

  return (
    <Link to={`/orders/${order._id}`} className="order-summary-card">
      <div className="osc-left">
        <span className="row-icon">📦</span>
        <div>
          <strong>{order.productId?.name || 'Produce order'}</strong>
          <small>{order.quantity_quintals} quintal{order.quantity_quintals === 1 ? '' : 's'} · ₹{Number(order.total_price).toLocaleString('en-IN')}</small>
          {otherParty && <small>{isFarmer ? 'From consumer' : 'From farmer'}: {otherParty.name}</small>}
        </div>
      </div>
      <div className="osc-right">
        <span className="order-status-badge" style={{ background: statusColor + '22', color: statusColor, border: `1px solid ${statusColor}44` }}>{order.status}</span>
        <span className="osc-pay" style={{ color: PAYMENT_COLORS[order.paymentStatus] || '#6b7280' }}>₹ {order.paymentStatus}</span>
        <span className="osc-arrow">→</span>
      </div>
    </Link>
  );
}

// ─── ORDER DETAIL PAGE ────────────────────────────────────────────────────────
function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('annadata_user') || 'null');
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Dispatch form
  const [transporterName, setTransporterName] = useState('');
  const [transporterPhone, setTransporterPhone] = useState('');

  const loadOrder = useCallback(async () => {
    const r = await request(`/orders/${id}`, { required: true }).catch(err => { setError(err.message); return null; });
    if (r?.data) setOrder(r.data);
    setLoading(false);
  }, [id]);

  useEffect(() => { if (!user) return; loadOrder(); }, [loadOrder]);

  if (!user) return <NavigateToLogin />;
  if (loading) return <section className="section"><p>Loading order details...</p></section>;
  if (error) return <section className="section"><div className="form-error">{error}</div></section>;
  if (!order) return <section className="section empty-state-page"><h1>Order not <em>found.</em></h1><Link to="/orders" className="button primary">Back to orders →</Link></section>;

  const isFarmer = order.farmerId?._id === user.id || order.farmerId?._id?.toString() === user.id;
  const isConsumer = order.consumerId?._id === user.id || order.consumerId?._id?.toString() === user.id;
  const stepIndex = STATUS_STEPS.indexOf(order.status);
  const statusColor = STATUS_COLORS[order.status] || '#6b7280';

  const doAction = async (status, extra = {}) => {
    setActionError(''); setActionMsg(''); setActionLoading(true);
    const body = { status, ...extra };
    const r = await request(`/orders/${id}/status`, { method: 'PUT', required: true, body: JSON.stringify(body) })
      .catch(err => { setActionError(err.message); return null; });
    if (r?.data) { setOrder(r.data); setActionMsg(`Order successfully updated to "${status}".`); }
    setActionLoading(false);
  };

  const doPaymentUpdate = async () => {
    setActionError(''); setActionMsg(''); setActionLoading(true);
    const r = await request(`/orders/${id}/payment`, { method: 'PUT', required: true, body: JSON.stringify({ paymentStatus: 'Completed' }) })
      .catch(err => { setActionError(err.message); return null; });
    if (r?.data) { setOrder(r.data); setActionMsg('Payment marked as received!'); }
    setActionLoading(false);
  };

  return (
    <section className="section order-detail-page">
      <button className="back-link" onClick={() => navigate('/orders')}>← Back to orders</button>

      {/* Header */}
      <div className="od-header">
        <div>
          <span className="eyebrow">ORDER #{String(order._id).slice(-8).toUpperCase()}</span>
          <h1>{order.productId?.name || 'Produce Order'}</h1>
          <p className="od-meta">{order.quantity_quintals} quintal{order.quantity_quintals === 1 ? '' : 's'} · <strong>₹{Number(order.total_price).toLocaleString('en-IN')}</strong></p>
        </div>
        <div className="od-badges">
          <span className="order-status-badge" style={{ background: statusColor + '22', color: statusColor, border: `1px solid ${statusColor}44` }}>{order.status}</span>
          <span className="order-status-badge" style={{ background: PAYMENT_COLORS[order.paymentStatus] + '22', color: PAYMENT_COLORS[order.paymentStatus], border: `1px solid ${PAYMENT_COLORS[order.paymentStatus]}44` }}>💰 {order.paymentStatus}</span>
        </div>
      </div>

      {/* Progress Timeline */}
      <div className="od-timeline">
        {STATUS_STEPS.map((step, i) => (
          <div key={step} className={`od-step${i <= stepIndex ? ' done' : ''}${i === stepIndex ? ' current' : ''}`}>
            <div className="od-step-icon">{i < stepIndex ? '✓' : i === stepIndex ? '●' : i + 1}</div>
            <span>{step}</span>
            {i < STATUS_STEPS.length - 1 && <div className={`od-step-line${i < stepIndex ? ' done' : ''}`} />}
          </div>
        ))}
      </div>

      <div className="od-body">
        {/* Product Info */}
        <div className="od-card">
          <h3>📦 Product Details</h3>
          <div className="od-info-row"><span>Name</span><strong>{order.productId?.name}</strong></div>
          <div className="od-info-row"><span>Category</span><strong>{order.productId?.category}</strong></div>
          <div className="od-info-row"><span>Quantity</span><strong>{order.quantity_quintals} quintal{order.quantity_quintals === 1 ? '' : 's'}</strong></div>
          <div className="od-info-row"><span>Price/quintal</span><strong>₹{Number(order.productId?.price_per_quintal).toLocaleString('en-IN')}</strong></div>
          <div className="od-info-row"><span>Total Amount</span><strong>₹{Number(order.total_price).toLocaleString('en-IN')}</strong></div>
          <div className="od-info-row"><span>Delivery Address</span><strong>{order.shippingAddress}</strong></div>
          <div className="od-info-row"><span>Placed On</span><strong>{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</strong></div>
        </div>

        {/* Farmer Info (shown to consumers) */}
        {isConsumer && (
          <div className="od-card">
            <h3>👨‍🌾 Farmer Details</h3>
            <div className="od-info-row"><span>Name</span><strong>{order.farmerId?.name}</strong></div>
            <div className="od-info-row"><span>Phone</span><strong>{order.farmerId?.phone}</strong></div>
            <div className="od-info-row"><span>Address</span><strong>{order.farmerId?.address}</strong></div>
            {stepIndex >= 1 && order.farmerId?.upiId && (
              <div className="od-upi-box">
                <span>🏦 UPI ID for Payment</span>
                <strong className="upi-id">{order.farmerId.upiId}</strong>
                <small>Transfer ₹{Number(order.total_price).toLocaleString('en-IN')} directly to the farmer using this UPI ID. Do not pay through the website.</small>
              </div>
            )}
          </div>
        )}

        {/* Consumer Info (shown to farmers) */}
        {isFarmer && (
          <div className="od-card">
            <h3>🛒 Consumer Details</h3>
            <div className="od-info-row"><span>Name</span><strong>{order.consumerId?.name}</strong></div>
            <div className="od-info-row"><span>Phone</span><strong>{order.consumerId?.phone}</strong></div>
            <div className="od-info-row"><span>Email</span><strong>{order.consumerId?.email}</strong></div>
            <div className="od-info-row"><span>Address</span><strong>{order.consumerId?.address}</strong></div>
          </div>
        )}

        {/* Transporter Info (shown after Dispatched) */}
        {stepIndex >= 2 && order.transporter?.name && (
          <div className="od-card od-transporter">
            <h3>🚛 Transporter Details</h3>
            <small style={{ color: '#6b7280', marginBottom: '0.75rem', display: 'block' }}>Contact the transporter to know where your order has reached.</small>
            <div className="od-info-row"><span>Name</span><strong>{order.transporter.name}</strong></div>
            <div className="od-info-row"><span>Mobile</span><a href={`tel:${order.transporter.phone}`} className="transporter-phone">📞 {order.transporter.phone}</a></div>
          </div>
        )}
      </div>

      {/* Action Panel */}
      <div className="od-actions">
        {actionMsg && <div className="success-message">{actionMsg}</div>}
        {actionError && <div className="form-error">{actionError}</div>}

        {/* Farmer: Confirm */}
        {isFarmer && order.status === 'Placed' && (
          <button className="button primary" disabled={actionLoading} onClick={() => doAction('Confirmed')}>
            ✓ Confirm Order {actionLoading && '...'}
          </button>
        )}

        {/* Farmer: Dispatch with transporter info */}
        {isFarmer && order.status === 'Confirmed' && (
          <div className="dispatch-form">
            <h4>Enter Transporter Details to Dispatch</h4>
            <label>Transporter Name<input value={transporterName} onChange={e => setTransporterName(e.target.value)} placeholder="Driver / transport partner name" /></label>
            <label>Transporter Phone<input value={transporterPhone} onChange={e => setTransporterPhone(e.target.value)} placeholder="10-digit mobile number" inputMode="numeric" /></label>
            <button className="button primary" disabled={actionLoading || !transporterName || !transporterPhone}
              onClick={() => doAction('Dispatched', { transporter: { name: transporterName, phone: transporterPhone } })}>
              🚛 Mark as Dispatched {actionLoading && '...'}
            </button>
          </div>
        )}

        {/* Farmer: Mark payment received */}
        {isFarmer && order.status !== 'Placed' && order.paymentStatus === 'Pending' && (
          <button className="button outline" disabled={actionLoading} onClick={doPaymentUpdate}>
            💰 Mark Payment Received {actionLoading && '...'}
          </button>
        )}

        {/* Consumer: Mark delivered */}
        {isConsumer && order.status === 'Dispatched' && (
          <button className="button primary" disabled={actionLoading} onClick={() => doAction('Delivered')}>
            ✅ Mark as Delivered {actionLoading && '...'}
          </button>
        )}

        {/* Leave review after delivery */}
        {isConsumer && order.status === 'Delivered' && (
          <ReviewForm order={order} onDone={() => setActionMsg('Thank you for reviewing this farmer!')} />
        )}
      </div>
    </section>
  );
}

function ProductFormPage() { const user = JSON.parse(localStorage.getItem('annadata_user') || 'null'); const [form, setForm] = useState({ name: '', category: 'Grains', quantity_quintals: '', price_per_quintal: '', harvest_date: '', description: '' }); const [group, setGroup] = useState(false); const [groupForm, setGroupForm] = useState({ target_quantity_quintals: '', discount_percentage: '', expiresAt: '' }); const [message, setMessage] = useState(''); const [error, setError] = useState(''); if (!user) return <NavigateToLogin />; const update = e => setForm({ ...form, [e.target.name]: e.target.value }); const submit = async e => { e.preventDefault(); setError(''); setMessage(''); const body = new FormData(); Object.entries(form).forEach(([key, value]) => body.append(key, value)); const result = await request('/products', { method: 'POST', body, headers: {}, required: true }).catch(err => { setError(err.message); return null; }); if (!result?.data) return; if (group) { const deal = await request('/group-buying', { method: 'POST', required: true, body: JSON.stringify({ productId: result.data._id, ...groupForm }) }).catch(err => { setError(`Produce listed, but group deal failed: ${err.message}`); return null; }); if (!deal) return; } setMessage('Produce listed successfully.'); setForm({ name: '', category: 'Grains', quantity_quintals: '', price_per_quintal: '', harvest_date: '', description: '' }); }; return <section className="section form-page"><span className="eyebrow">FARMER STUDIO</span><h1>List a <em>harvest.</em></h1>{user.status !== 'Approved' && <div className="form-error">Your farmer account is pending approval. You can list produce after an admin approves your account.</div>}<form className="product-form" onSubmit={submit}><label>Produce name<input name="name" required value={form.name} onChange={update} placeholder="e.g. Organic Sharbati Wheat" /></label><label>Category<select name="category" value={form.category} onChange={update}>{['Grains', 'Pulses', 'Vegetables', 'Fruits', 'Oilseeds', 'Spices', 'Other'].map(item => <option key={item}>{item}</option>)}</select></label><label>Available quantity (quintals)<input name="quantity_quintals" type="number" min="0" step="0.1" required value={form.quantity_quintals} onChange={update} /></label><label>Price per quintal (₹)<input name="price_per_quintal" type="number" min="0" required value={form.price_per_quintal} onChange={update} /></label><label>Harvest date<input name="harvest_date" type="date" required value={form.harvest_date} onChange={update} /></label><label>Description<textarea name="description" maxLength="1000" value={form.description} onChange={update} /></label><label className="check-row"><input type="checkbox" checked={group} onChange={e => setGroup(e.target.checked)} /> Create Group Buying on this produce</label>{group && <div className="group-form"><label>Target quantity (quintals)<input name="target_quantity_quintals" type="number" min="1" required value={groupForm.target_quantity_quintals} onChange={e => setGroupForm({ ...groupForm, target_quantity_quintals: e.target.value })} /></label><label>Discount percentage<input name="discount_percentage" type="number" min="0" max="100" required value={groupForm.discount_percentage} onChange={e => setGroupForm({ ...groupForm, discount_percentage: e.target.value })} /></label><label>Deal expiry<input name="expiresAt" type="datetime-local" required value={groupForm.expiresAt} onChange={e => setGroupForm({ ...groupForm, expiresAt: e.target.value })} /></label></div>}{message && <div className="success-message">{message}</div>}{error && <div className="form-error">{error}</div>}<button disabled={user.role === 'Farmer' && user.status !== 'Approved'} className="button primary">Publish harvest →</button></form></section>; }
function AdminPage() { const user = JSON.parse(localStorage.getItem('annadata_user') || 'null'); const navigate = useNavigate(); const [overview, setOverview] = useState(null); const [error, setError] = useState(''); const load = () => request('/admin/overview', { required: true }).then(r => setOverview(r?.data)).catch(err => setError(err.message)); useEffect(() => { if (user?.role === 'Admin') load(); }, [user]); if (!user) return <NavigateToLogin />; if (user.role !== 'Admin') return <section className="section empty-state-page"><h1>Admin access<br /><em>required.</em></h1></section>; if (!overview && !error) return <section className="section"><p>Loading admin dashboard...</p></section>; if (error) return <section className="section"><div className="form-error">{error}</div></section>; const approve = async id => { await request(`/admin/users/${id}/approval`, { method: 'PUT', required: true, body: JSON.stringify({ status: 'Approved' }) }); load(); }; return <section className="section admin-page"><span className="eyebrow">PLATFORM CONTROL</span><h1>Admin <em>dashboard.</em></h1><div className="admin-stats"><div><strong>{overview.users.length}</strong><span>Users</span></div><div><strong>{overview.products.length}</strong><span>Produce listings</span></div><div><strong>{overview.orders.length}</strong><span>Orders</span></div></div><div className="admin-panel"><h2>Users & approvals</h2>{overview.users.map(item => <div className="admin-row admin-clickable" key={item._id} onClick={() => navigate(`/admin/users/${item._id}`)}><div><strong>{item.name}</strong><small>{item.role} · {item.email} · {item.phone}</small></div><span>{item.status}</span>{item.role === 'Farmer' && item.status === 'Pending Approval' && <button className="button small primary" onClick={event => { event.stopPropagation(); approve(item._id); }}>Approve</button>}</div>)}</div><div className="admin-panel"><h2>Produce by farmers</h2>{overview.products.map(product => <div className="admin-row" key={product._id}><div><strong>{product.name}</strong><small>{product.farmerId?.name} · {product.farmerId?.email} · {product.farmerId?.phone}</small></div><span>{product.quantity_quintals} qtl</span></div>)}</div><div className="admin-panel"><h2>Order history</h2>{overview.orders.map(order => <div className="admin-row" key={order._id}><div><strong>{order.productId?.name || 'Produce'}</strong><small>{order.consumerId?.name} buying from {order.farmerId?.name}</small></div><span>{order.status} · {order.paymentStatus}</span></div>)}</div></section>; }

function AdminUserPage() { const { userId } = useParams(); const navigate = useNavigate(); const [overview, setOverview] = useState(null); const [error, setError] = useState(''); useEffect(() => { request('/admin/overview', { required: true }).then(r => setOverview(r?.data)).catch(err => setError(err.message)); }, [userId]); if (error) return <section className="section"><div className="form-error">{error}</div></section>; if (!overview) return <section className="section"><p>Loading user details...</p></section>; const user = overview.users.find(item => item._id === userId); if (!user) return <section className="section empty-state-page"><h1>User not<br /><em>found.</em></h1></section>; const buyingHistory = overview.orders.filter(order => order.consumerId?._id === userId); const farmerProduce = overview.products.filter(product => product.farmerId?._id === userId); return <section className="section admin-page"><button className="back-link admin-back" onClick={() => navigate('/admin')}>← Back to admin dashboard</button><span className="eyebrow">{user.role.toUpperCase()} PROFILE</span><h1>{user.name}'s <em>details.</em></h1><div className="profile-summary"><strong>{user.name}</strong><span>{user.email} · {user.phone}</span><span>{user.address}</span><b>{user.status}</b></div><div className="admin-panel"><h2>Buying history</h2>{buyingHistory.length ? buyingHistory.map(order => <div className="admin-row" key={order._id}><div><strong>{order.productId?.name || 'Produce'}</strong><small>{order.quantity_quintals} qtl · ₹{Number(order.total_price).toLocaleString('en-IN')} · {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN') : ''}</small></div><span>{order.status} · {order.paymentStatus}</span></div>) : <p className="detail-description">No buying history for this user.</p>}</div>{user.role === 'Farmer' && <div className="admin-panel"><h2>Produce history</h2>{farmerProduce.length ? farmerProduce.map(product => <div className="admin-row" key={product._id}><div><strong>{product.name}</strong><small>{product.category} · ₹{Number(product.price_per_quintal).toLocaleString('en-IN')} per quintal</small></div><span>{product.quantity_quintals} qtl remaining</span></div>) : <p className="detail-description">This farmer has not added any produce.</p>}</div>}</section>; }

function FarmerReviewsPage() { const user = JSON.parse(localStorage.getItem('annadata_user') || 'null'); const [reviews, setReviews] = useState(null); useEffect(() => { if (user?.role === 'Farmer') request(`/reviews/farmer/${user.id}`).then(r => setReviews(r)); }, [user]); if (!user) return <NavigateToLogin />; if (user.role !== 'Farmer') return <section className="section empty-state-page"><h1>Farmer access<br /><em>required.</em></h1></section>; return <section className="section reviews-page"><span className="eyebrow">YOUR COMMUNITY VOICE</span><h1>Farmer <em>ratings.</em></h1><div className="rating-summary"><strong>{reviews?.averageRating || user.averageRating || 0}</strong><span>★ average rating<br />{reviews?.count || 0} consumer reviews</span></div><div className="review-list">{reviews?.data?.map(review => <article className="review-card" key={review._id}><strong>{'★'.repeat(review.ratingStars)}{'☆'.repeat(5 - review.ratingStars)}</strong><p>{review.comment}</p><small>By {review.reviewerId?.name || 'Consumer'} · {new Date(review.createdAt).toLocaleDateString('en-IN')}</small></article>) || <div className="empty-state">No reviews yet. Completed orders will appear here.</div>}</div></section>; }

// ─── ORDER CARD (legacy, used in OrdersPage if needed) ────────────────────────
function OrderCard({ order }) { const steps = ['Placed', 'Confirmed', 'Dispatched', 'Delivered']; const current = steps.indexOf(order.status); const [reviewed, setReviewed] = useState(false); return <article className="order-card"><div className="order-card-head"><div><span className="eyebrow">ORDER #{String(order._id).slice(-8).toUpperCase()}</span><h2>{order.productId?.name || 'Produce order'}</h2><span className="order-meta">{order.quantity_quintals} quintal{order.quantity_quintals === 1 ? '' : 's'} · ₹{Number(order.total_price).toLocaleString('en-IN')}</span></div><span className={`order-status status-${order.status?.toLowerCase().replace(' ', '-')}`}>{order.status}</span></div><div className="order-timeline">{steps.map((step, index) => <div className={index <= current ? 'timeline-step complete' : 'timeline-step'} key={step}><span>{index <= current ? '✓' : index + 1}</span><small>{step}</small></div>)}</div><div className="order-card-foot"><span>Delivery address: {order.shippingAddress}</span><span>Payment: {order.paymentStatus}</span></div>{order.status === 'Delivered' && !reviewed && <ReviewForm order={order} onDone={() => setReviewed(true)} />}{reviewed && <div className="success-message">Thank you for reviewing this farmer.</div>}</article>; }

function ReviewForm({ order, onDone }) { const [ratingStars, setRatingStars] = useState(5); const [comment, setComment] = useState(''); const [error, setError] = useState(''); const submit = async e => { e.preventDefault(); const result = await request('/reviews', { method: 'POST', required: true, body: JSON.stringify({ farmerId: order.farmerId?._id || order.farmerId, orderId: order._id, ratingStars, comment }) }).catch(err => { setError(err.message); return null; }); if (result) onDone(); }; return <form className="review-form" onSubmit={submit}><strong>Rate this produce and farmer</strong><select value={ratingStars} onChange={e => setRatingStars(Number(e.target.value))}><option value="5">★★★★★ Excellent</option><option value="4">★★★★ Very good</option><option value="3">★★★ Good</option><option value="2">★★ Needs improvement</option><option value="1">★ Poor</option></select><textarea required maxLength="500" value={comment} onChange={e => setComment(e.target.value)} placeholder="Share your experience..." />{error && <div className="form-error">{error}</div>}<button className="button small primary">Submit review</button></form>; }
function NotFound() { return <section className="section empty-state-page"><span className="eyebrow">404</span><h1>That path hasn't<br /><em>been harvested yet.</em></h1><Link to="/" className="button primary">Back to home →</Link></section>; }

export default App;
