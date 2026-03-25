const { loadProducts } = require("./productController");

function getCart(req) {
  if (!req.session.cart) req.session.cart = [];
  return req.session.cart;
}

function layout(title, content, cartCount) {
  cartCount = cartCount || 0;
  const cartBadge = cartCount > 0 ? `<span class="cart-badge">${cartCount}</span>` : '';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    :root {
      --bg-dark: #060611; --bg-card: #0d0d1a; --bg-card-hover: #111128;
      --bg-surface: #13132b; --bg-elevated: #1a1a3e;
      --border: #1e1e40; --border-hover: #2d2d5e;
      --text-primary: #f0f0f5; --text-secondary: #8888aa; --text-muted: #555577;
      --accent: #e94560; --accent-hover: #ff5a78; --accent-glow: rgba(233,69,96,0.25);
      --green: #22c55e; --green-glow: rgba(34,197,94,0.2);
      --yellow: #eab308; --red: #ef4444; --blue: #3b82f6; --purple: #8b5cf6;
      --radius: 14px; --radius-sm: 10px; --radius-full: 100px;
      --shadow: 0 8px 32px rgba(0,0,0,0.4);
      --transition: 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }
    body { font-family: 'Inter', -apple-system, sans-serif; background: var(--bg-dark); color: var(--text-primary); min-height: 100vh; -webkit-font-smoothing: antialiased; }
    ::-webkit-scrollbar { width: 8px; }
    ::-webkit-scrollbar-track { background: var(--bg-dark); }
    ::-webkit-scrollbar-thumb { background: #2a2a4a; border-radius: 4px; }
    a { color: inherit; text-decoration: none; }

    .navbar { background: rgba(13,13,26,0.85); backdrop-filter: blur(20px); padding: 0 2.5rem; height: 64px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 200; }
    .navbar-brand { font-size: 1.5rem; font-weight: 900; letter-spacing: -0.5px; }
    .navbar-brand span { color: var(--accent); }
    .nav-links { display: flex; gap: 0.5rem; align-items: center; }
    .nav-link { padding: 0.5rem 1rem; border-radius: var(--radius-sm); font-size: 0.875rem; font-weight: 500; color: var(--text-secondary); transition: var(--transition); }
    .nav-link:hover { color: var(--text-primary); background: rgba(255,255,255,0.04); }
    .nav-link.active { color: var(--accent); background: rgba(233,69,96,0.08); }
    .cart-link { position: relative; display: flex; align-items: center; gap: 0.4rem; padding: 0.45rem 1.1rem; border-radius: var(--radius-full); border: 1px solid var(--border); font-size: 0.85rem; font-weight: 500; color: var(--text-secondary); transition: var(--transition); }
    .cart-link:hover { border-color: var(--border-hover); color: var(--text-primary); }
    .cart-badge { position: absolute; top: -6px; right: -6px; background: var(--accent); color: #fff; font-size: 0.65rem; font-weight: 700; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }

    .btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.65rem 1.4rem; border: none; border-radius: var(--radius-sm); font-family: inherit; font-size: 0.875rem; font-weight: 600; cursor: pointer; transition: var(--transition); white-space: nowrap; }
    .btn-primary { background: var(--accent); color: #fff; }
    .btn-primary:hover { background: var(--accent-hover); box-shadow: 0 0 24px var(--accent-glow); }
    .btn-ghost { background: transparent; color: var(--text-secondary); border: 1px solid var(--border); }
    .btn-ghost:hover { border-color: var(--border-hover); color: var(--text-primary); }
    .btn-success { background: var(--green); color: #fff; }
    .btn-success:hover { box-shadow: 0 0 24px var(--green-glow); filter: brightness(1.1); }
    .btn-danger { background: transparent; color: var(--red); border: 1px solid rgba(239,68,68,0.3); }
    .btn-danger:hover { background: rgba(239,68,68,0.1); }

    .footer { border-top: 1px solid var(--border); padding: 2rem 2.5rem; text-align: center; color: var(--text-muted); font-size: 0.8rem; }
    .alert { padding: 0.85rem 1.25rem; border-radius: var(--radius-sm); font-weight: 500; font-size: 0.9rem; display: flex; align-items: center; gap: 0.6rem; animation: alertIn 0.35s ease; max-width: 1440px; margin: 1rem auto; }
    @keyframes alertIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
    .alert-success { background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.2); color: var(--green); }
    .alert-error { background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); color: var(--red); }
    .alert-info { background: rgba(59,130,246,0.08); border: 1px solid rgba(59,130,246,0.2); color: var(--blue); }

    @media (max-width: 768px) { .navbar { padding: 0 1.25rem; } }
  </style>
</head>
<body>
  <nav class="navbar">
    <a href="/" class="navbar-brand">Tech<span>Vault</span></a>
    <div class="nav-links">
      <a href="/" class="nav-link">Shop</a>
      <a href="/cart" class="cart-link">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>
        Cart ${cartBadge}
      </a>
    </div>
  </nav>
  ${content}
  <footer class="footer"><p>TechVault &copy; 2026 &mdash; Lab 3: Systems on Business Logic | Product Ordering System</p></footer>
</body>
</html>`;
}

const getShopPage = (req, res) => {
  const products = loadProducts();
  const cart = getCart(req);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const categories = [...new Set(products.map(p => p.category))];

  const stockTag = (stock) => {
    if (stock > 10) return '<span class="stock-tag stock-ok">In Stock (' + stock + ')</span>';
    if (stock > 0) return '<span class="stock-tag stock-low">Low Stock (' + stock + ')</span>';
    return '<span class="stock-tag stock-none">Out of Stock</span>';
  };
  const badgeClass = (cat) => ({ 'Prebuilt PC': 'prebuilt-pc', 'Peripheral': 'peripheral', 'Monitor': 'monitor' }[cat] || 'default');

  const cards = products.map(p => `
    <div class="card" data-category="${p.category}" data-search="${(p.name + ' ' + p.category).toLowerCase()}">
      <div class="card-img-wrap">
        <img src="${p.image}" alt="${p.name}" class="card-img" loading="lazy">
        <div class="card-img-overlay"></div>
        <span class="card-badge badge-${badgeClass(p.category)}">${p.category}</span>
      </div>
      <div class="card-body">
        <h3 class="card-name">${p.name}</h3>
        <div class="card-footer">
          <div class="card-price-row">
            <span class="card-price">$${p.price.toFixed(2)}</span>
            ${stockTag(p.stock)}
          </div>
          <div class="card-actions">
            <input type="number" value="1" min="1" max="${p.stock}" class="card-qty" id="qty-${p.id}" ${p.stock === 0 ? 'disabled' : ''}>
            <button class="btn-cart" onclick="addToCart(${p.id})" ${p.stock === 0 ? 'disabled' : ''}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>
              ${p.stock === 0 ? 'Sold Out' : 'Add to Cart'}
            </button>
          </div>
        </div>
      </div>
    </div>`).join('');

  const chips = ['All', ...categories].map((cat, i) =>
    `<button class="chip ${i === 0 ? 'active' : ''}" data-category="${i === 0 ? 'all' : cat}">${cat}</button>`
  ).join('');

  const content = `
  <style>
    .hero { position: relative; padding: 5rem 2.5rem 4rem; text-align: center; overflow: hidden; background: var(--bg-card); border-bottom: 1px solid var(--border); }
    .hero-bg { position: absolute; inset: 0; background: radial-gradient(ellipse 60% 50% at 20% 60%, rgba(233,69,96,0.08) 0%, transparent 70%), radial-gradient(ellipse 50% 60% at 80% 40%, rgba(59,130,246,0.06) 0%, transparent 70%); pointer-events: none; }
    .hero-content { position: relative; z-index: 1; max-width: 640px; margin: 0 auto; }
    .hero h1 { font-size: 2.8rem; font-weight: 900; letter-spacing: -1px; line-height: 1.1; margin-bottom: 0.75rem; }
    .hero h1 .accent { color: var(--accent); }
    .hero p { font-size: 1.05rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 2rem; }
    .search-wrap { max-width: 560px; margin: 0 auto; position: relative; }
    .search-icon { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: var(--text-muted); pointer-events: none; }
    .search-input { width: 100%; padding: 0.85rem 1rem 0.85rem 2.75rem; border: 1px solid var(--border); background: var(--bg-dark); color: var(--text-primary); border-radius: var(--radius); font-size: 0.95rem; font-family: inherit; transition: var(--transition); }
    .search-input:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-glow); }
    .search-input::placeholder { color: var(--text-muted); }
    .toolbar { max-width: 1440px; margin: 1.75rem auto 0; padding: 0 2.5rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; }
    .filters { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .chip { padding: 0.45rem 1.1rem; border: 1px solid var(--border); background: transparent; color: var(--text-secondary); border-radius: var(--radius-full); cursor: pointer; font-size: 0.82rem; font-weight: 500; font-family: inherit; transition: var(--transition); }
    .chip:hover { border-color: var(--border-hover); color: var(--text-primary); }
    .chip.active { background: var(--accent); border-color: var(--accent); color: #fff; box-shadow: 0 0 16px var(--accent-glow); }
    .result-count { font-size: 0.85rem; color: var(--text-muted); font-weight: 500; }
    .result-count strong { color: var(--text-secondary); }
    .grid-section { max-width: 1440px; margin: 1.5rem auto 4rem; padding: 0 2.5rem; }
    .products-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 1.25rem; }
    .card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; transition: var(--transition); display: flex; flex-direction: column; }
    .card:hover { border-color: var(--border-hover); transform: translateY(-4px); box-shadow: 0 16px 48px rgba(0,0,0,0.35); }
    .card-img-wrap { position: relative; overflow: hidden; aspect-ratio: 16/10; }
    .card-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s ease; }
    .card:hover .card-img { transform: scale(1.05); }
    .card-img-overlay { position: absolute; inset: 0; background: linear-gradient(180deg, transparent 40%, rgba(6,6,17,0.6) 100%); pointer-events: none; }
    .card-badge { position: absolute; top: 0.75rem; left: 0.75rem; padding: 0.25rem 0.65rem; border-radius: var(--radius-full); font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; z-index: 2; }
    .badge-prebuilt-pc { background: var(--accent); color: #fff; }
    .badge-peripheral { background: var(--blue); color: #fff; }
    .badge-monitor { background: var(--purple); color: #fff; }
    .badge-default { background: #6b7280; color: #fff; }
    .card-body { padding: 1.15rem 1.25rem; display: flex; flex-direction: column; flex: 1; }
    .card-name { font-size: 1rem; font-weight: 700; margin-bottom: 0.5rem; }
    .card-footer { margin-top: auto; }
    .card-price-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem; }
    .card-price { font-size: 1.3rem; font-weight: 800; color: var(--accent); letter-spacing: -0.5px; }
    .stock-tag { font-size: 0.72rem; padding: 0.2rem 0.6rem; border-radius: var(--radius-full); font-weight: 600; }
    .stock-ok { background: rgba(34,197,94,0.1); color: var(--green); border: 1px solid rgba(34,197,94,0.2); }
    .stock-low { background: rgba(234,179,8,0.1); color: var(--yellow); border: 1px solid rgba(234,179,8,0.2); }
    .stock-none { background: rgba(239,68,68,0.1); color: var(--red); border: 1px solid rgba(239,68,68,0.2); }
    .card-actions { display: flex; gap: 0.5rem; }
    .card-qty { width: 56px; padding: 0.55rem 0.25rem; border: 1px solid var(--border); background: var(--bg-dark); color: var(--text-primary); border-radius: var(--radius-sm); text-align: center; font-size: 0.85rem; font-family: inherit; transition: var(--transition); }
    .card-qty:focus { outline: none; border-color: var(--accent); }
    .btn-cart { flex: 1; padding: 0.55rem 0.75rem; background: var(--accent); color: #fff; border: none; border-radius: var(--radius-sm); font-family: inherit; font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: var(--transition); display: flex; align-items: center; justify-content: center; gap: 0.4rem; }
    .btn-cart:hover { background: var(--accent-hover); box-shadow: 0 0 20px var(--accent-glow); }
    .btn-cart:disabled { opacity: 0.3; cursor: not-allowed; box-shadow: none; }
    .empty-state { grid-column: 1/-1; text-align: center; padding: 5rem 2rem; display: none; }
    .empty-state svg { color: var(--text-muted); margin-bottom: 1rem; }
    .empty-state h3 { font-size: 1.15rem; color: var(--text-secondary); margin-bottom: 0.35rem; }
    .empty-state p { color: var(--text-muted); font-size: 0.9rem; }
    #shopAlert { max-width: 1440px; margin: 1rem auto; padding: 0 2.5rem; }
    @media (max-width: 768px) {
      .hero { padding: 3rem 1.25rem 2.5rem; } .hero h1 { font-size: 2rem; }
      .toolbar, .grid-section { padding: 0 1.25rem; }
      .products-grid { grid-template-columns: 1fr 1fr; gap: 0.75rem; }
      .card-body { padding: 0.85rem; } .card-price { font-size: 1.1rem; }
      .card-actions { flex-direction: column; } .card-qty { width: 100%; }
    }
    @media (max-width: 480px) { .products-grid { grid-template-columns: 1fr; } }
  </style>
  <section class="hero"><div class="hero-bg"></div><div class="hero-content">
    <h1>Build Your <span class="accent">Dream</span> PC</h1>
    <p>Premium prebuilt computers and components. Order directly through our API-powered store.</p>
    <div class="search-wrap">
      <span class="search-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
      <input type="text" class="search-input" id="searchInput" placeholder="Search products..." autocomplete="off">
    </div>
  </div></section>
  <div id="shopAlert"></div>
  <div class="toolbar">
    <div class="filters" id="filters">${chips}</div>
    <span class="result-count" id="resultCount"><strong>${products.length}</strong> products</span>
  </div>
  <section class="grid-section"><div class="products-grid" id="grid">
    ${cards}
    <div class="empty-state" id="emptyState">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <h3>No products found</h3><p>Try a different search term or category.</p>
    </div>
  </div></section>
  <script>
    let activeCat = 'all', query = '';
    const grid = document.getElementById('grid'), rc = document.getElementById('resultCount'), es = document.getElementById('emptyState');
    function applyFilters() {
      let c = 0;
      grid.querySelectorAll('.card').forEach(card => {
        const cm = activeCat === 'all' || card.dataset.category === activeCat;
        const sm = !query || card.dataset.search.includes(query);
        card.style.display = cm && sm ? '' : 'none';
        if (cm && sm) c++;
      });
      rc.innerHTML = '<strong>' + c + '</strong> product' + (c !== 1 ? 's' : '');
      es.style.display = c === 0 ? '' : 'none';
    }
    document.querySelectorAll('.chip').forEach(ch => ch.addEventListener('click', () => {
      document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      ch.classList.add('active'); activeCat = ch.dataset.category; applyFilters();
    }));
    document.getElementById('searchInput').addEventListener('input', e => { query = e.target.value.toLowerCase().trim(); applyFilters(); });

    function showAlert(msg, type) {
      const d = document.getElementById('shopAlert');
      const icon = type === 'success' ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>' : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
      d.innerHTML = '<div class="alert alert-' + type + '">' + icon + ' ' + msg + '</div>';
      setTimeout(() => { d.innerHTML = ''; }, 4000);
    }

    function addToCart(productId) {
      const qty = parseInt(document.getElementById('qty-' + productId).value);
      fetch('/cart/add', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId, quantity: qty }) })
        .then(r => r.json()).then(data => {
          if (data.success) { showAlert(data.message, 'success'); setTimeout(() => location.reload(), 800); }
          else showAlert(data.message, 'error');
        });
    }
  </script>`;
  res.send(layout("TechVault — Shop", content, cartCount));
};

module.exports = {
  layout,
  getShopPage
};
