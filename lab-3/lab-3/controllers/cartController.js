const { loadProducts, saveProducts, validateOrder } = require("./productController");

// --- Helpers ---
function getCart(req) {
  if (!req.session.cart) req.session.cart = [];
  return req.session.cart;
}

function wantsJson(req) {
  const contentType = req.headers["content-type"] || "";
  const accept = req.headers["accept"] || "";
  const userAgent = (req.headers["user-agent"] || "").toLowerCase();
  return (
    contentType.includes("json") ||
    accept.includes("application/json") ||
    userAgent.includes("curl")
  );
}

// Import layout after defining getCart to avoid circular dependency
const { layout } = require("./viewController");

function validateCartCheckout(cart, products) {
  for (const item of cart) {
    const product = products.find(p => p.id === item.productId);
    if (!product) return { valid: false, message: `Product ID ${item.productId} no longer exists.` };
    if (product.stock < item.quantity) return { valid: false, message: `Insufficient stock for ${product.name}. Only ${product.stock} available.` };
  }
  return { valid: true };
}

// --- Controllers ---
const addToCart = (req, res) => {
  console.log("[addToCart] body=", req.body);
  const { productId, quantity } = req.body;
  const products = loadProducts();

  const id = parseInt(String(productId).trim(), 10);
  const qty = quantity === undefined ? 1 : parseInt(String(quantity).trim(), 10);

  const result = validateOrder(products, id, qty);
  if (!result.valid) {
    if (wantsJson(req)) return res.status(400).json({ success: false, message: result.message });
    return res.redirect("/");
  }
  const cart = getCart(req);
  const existing = cart.find(i => i.productId === id);
  const newQty = (existing ? existing.quantity : 0) + qty;
  if (newQty > result.product.stock) {
    if (wantsJson(req)) return res.status(400).json({ success: false, message: `Cannot add more. Only ${result.product.stock} in stock.` });
    return res.redirect("/cart");
  }
  if (existing) existing.quantity = newQty;
  else cart.push({ productId: id, quantity: qty });
  if (wantsJson(req)) return res.json({ success: true, message: `${result.product.name} added to cart!`, cart });
  res.redirect("/cart");
};

const updateCart = (req, res) => {
  const productId = parseInt(req.body.productId);
  const quantity = parseInt(req.body.quantity);
  const cart = getCart(req);
  if (quantity <= 0) {
    req.session.cart = cart.filter(i => i.productId !== productId);
  } else {
    const item = cart.find(i => i.productId === productId);
    if (item) item.quantity = quantity;
  }
  if (wantsJson(req)) return res.json({ success: true, cart: req.session.cart });
  res.redirect("/cart");
};

const removeFromCart = (req, res) => {
  const productId = parseInt(req.body.productId);
  const cart = getCart(req);
  req.session.cart = cart.filter(i => i.productId !== productId);
  if (wantsJson(req)) return res.json({ success: true, message: "Item removed.", cart: req.session.cart });
  res.redirect("/cart");
};

const clearCart = (req, res) => {
  req.session.cart = [];
  if (wantsJson(req)) return res.json({ success: true, message: "Cart cleared." });
  res.redirect("/cart");
};

const getCartApi = (req, res) => {
  const cart = getCart(req);
  const products = loadProducts();
  const items = cart.map(item => {
    const p = products.find(pr => pr.id === item.productId);
    return p ? { ...item, name: p.name, price: p.price, image: p.image, subtotal: p.price * item.quantity } : null;
  }).filter(Boolean);
  const total = items.reduce((s, i) => s + i.subtotal, 0);
  res.json({ success: true, items, total });
};

const placeOrder = (req, res) => {
  const cart = getCart(req);
  const products = loadProducts();
  if (cart.length === 0) {
    if (wantsJson(req)) return res.status(400).json({ success: false, message: "Cart is empty." });
    return res.redirect("/cart");
  }
  const validation = validateCartCheckout(cart, products);
  if (!validation.valid) {
    if (wantsJson(req)) return res.status(400).json({ success: false, message: validation.message });
    return res.redirect("/cart");
  }
  let total = 0;
  const orderItems = [];
  cart.forEach(item => {
    const p = products.find(pr => pr.id === item.productId);
    p.stock -= item.quantity;
    total += p.price * item.quantity;
    orderItems.push({ name: p.name, price: p.price, quantity: item.quantity, image: p.image });
  });
  saveProducts(products);
  req.session.lastOrder = { items: orderItems, total };
  req.session.cart = [];
  if (wantsJson(req)) return res.json({ success: true, message: "Order placed successfully!", order: { items: orderItems, total } });
  res.redirect("/order/confirmation");
};

// --- Page Controllers ---
const getCartPage = (req, res) => {
  const cart = getCart(req);
  const products = loadProducts();
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  let itemsHtml = '';
  let subtotal = 0;

  if (cart.length === 0) {
    itemsHtml = `
      <div class="empty-cart">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>
        <h3>Your cart is empty</h3>
        <p>Browse our products and add items to your cart.</p>
        <a href="/" class="btn btn-primary" style="margin-top:1rem;">Browse Products</a>
      </div>`;
  } else {
    cart.forEach(item => {
      const p = products.find(pr => pr.id === item.productId);
      if (!p) return;
      const lineTotal = p.price * item.quantity;
      subtotal += lineTotal;
      itemsHtml += `
        <div class="ci">
          <img src="${p.image}" alt="${p.name}" class="ci-img">
          <div class="ci-info">
            <div class="ci-name">${p.name}</div>
            <div class="ci-cat">${p.category}</div>
            <div class="ci-unit">$${p.price.toFixed(2)} each</div>
          </div>
          <div class="ci-stepper">
            <form method="POST" action="/cart/update" style="display:inline;">
              <input type="hidden" name="productId" value="${p.id}">
              <input type="hidden" name="quantity" value="${item.quantity - 1}">
              <button class="step-btn" ${item.quantity <= 1 ? 'disabled' : ''}>−</button>
            </form>
            <span class="step-val">${item.quantity}</span>
            <form method="POST" action="/cart/update" style="display:inline;">
              <input type="hidden" name="productId" value="${p.id}">
              <input type="hidden" name="quantity" value="${item.quantity + 1}">
              <button class="step-btn" ${item.quantity >= p.stock ? 'disabled' : ''}>+</button>
            </form>
          </div>
          <div class="ci-subtotal">$${lineTotal.toFixed(2)}</div>
          <form method="POST" action="/cart/remove">
            <input type="hidden" name="productId" value="${p.id}">
            <button class="ci-remove" title="Remove">&times;</button>
          </form>
        </div>`;
    });
  }

  const content = `
  <style>
    .cart-page { max-width: 960px; margin: 2rem auto; padding: 0 2.5rem; }
    .cart-title { font-size: 1.5rem; font-weight: 800; margin-bottom: 1.5rem; }
    .empty-cart { text-align: center; padding: 4rem 2rem; }
    .empty-cart svg { color: var(--text-muted); margin-bottom: 1rem; }
    .empty-cart h3 { font-size: 1.25rem; color: var(--text-secondary); margin-bottom: 0.35rem; }
    .empty-cart p { color: var(--text-muted); font-size: 0.9rem; }
    .ci { display: grid; grid-template-columns: 88px 1fr auto auto auto; align-items: center; gap: 1.25rem; padding: 1.25rem; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); margin-bottom: 0.75rem; transition: var(--transition); }
    .ci:hover { border-color: var(--border-hover); }
    .ci-img { width: 88px; height: 68px; object-fit: cover; border-radius: var(--radius-sm); }
    .ci-name { font-weight: 700; font-size: 0.95rem; }
    .ci-cat { font-size: 0.78rem; color: var(--text-muted); margin-top: 2px; }
    .ci-unit { font-size: 0.82rem; color: var(--accent); margin-top: 4px; font-weight: 600; }
    .ci-stepper { display: inline-flex; align-items: center; gap: 0; border: 1px solid var(--border); border-radius: var(--radius-sm); overflow: hidden; }
    .step-btn { width: 32px; height: 32px; background: var(--bg-surface); border: none; color: var(--text-primary); font-size: 1rem; cursor: pointer; transition: var(--transition); font-family: inherit; }
    .step-btn:hover:not(:disabled) { background: var(--bg-elevated); }
    .step-btn:disabled { opacity: 0.3; cursor: not-allowed; }
    .step-val { width: 36px; text-align: center; font-size: 0.85rem; font-weight: 600; background: var(--bg-dark); height: 32px; line-height: 32px; }
    .ci-subtotal { font-weight: 700; font-size: 1rem; color: var(--text-primary); min-width: 80px; text-align: right; }
    .ci-remove { background: none; border: none; color: var(--text-muted); font-size: 1.3rem; cursor: pointer; transition: var(--transition); padding: 0.25rem; }
    .ci-remove:hover { color: var(--red); }
    .summary { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); padding: 1.5rem; margin-top: 1.5rem; }
    .sum-row { display: flex; justify-content: space-between; padding: 0.6rem 0; font-size: 0.9rem; color: var(--text-secondary); }
    .sum-row + .sum-row { border-top: 1px solid var(--border); }
    .sum-total { font-size: 1.2rem; font-weight: 800; color: var(--accent); }
    .sum-label-total { font-size: 1.05rem; font-weight: 700; color: var(--text-primary); }
    .sum-free { color: var(--green); font-weight: 600; }
    .action-bar { display: flex; justify-content: space-between; align-items: center; margin-top: 1.5rem; flex-wrap: wrap; gap: 0.75rem; }
    .action-left { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    @media (max-width: 768px) {
      .cart-page { padding: 0 1.25rem; }
      .ci { grid-template-columns: 64px 1fr; gap: 0.75rem; }
      .ci-stepper, .ci-subtotal, .ci-remove { grid-column: 2; }
    }
  </style>
  <div class="cart-page">
    <h2 class="cart-title">Shopping Cart</h2>
    ${itemsHtml}
    ${cart.length > 0 ? `
    <div class="summary">
      <div class="sum-row"><span>${cartCount} item${cartCount !== 1 ? 's' : ''}</span><span>$${subtotal.toFixed(2)}</span></div>
      <div class="sum-row"><span>Shipping</span><span class="sum-free">Free</span></div>
      <div class="sum-row"><span class="sum-label-total">Total</span><span class="sum-total">$${subtotal.toFixed(2)}</span></div>
    </div>
    <div class="action-bar">
      <div class="action-left">
        <a href="/" class="btn btn-ghost">Continue Shopping</a>
        <form method="POST" action="/cart/clear" style="display:inline;"><button class="btn btn-danger">Clear Cart</button></form>
      </div>
      <a href="/checkout" class="btn btn-success">Proceed to Checkout &rarr;</a>
    </div>` : ''}
  </div>`;
  res.send(layout("TechVault — Cart", content, cartCount));
};

const getCheckoutPage = (req, res) => {
  const cart = getCart(req);
  const products = loadProducts();
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  if (cart.length === 0) return res.redirect("/cart");

  let itemsHtml = '';
  let subtotal = 0;
  cart.forEach(item => {
    const p = products.find(pr => pr.id === item.productId);
    if (!p) return;
    const lineTotal = p.price * item.quantity;
    subtotal += lineTotal;
    itemsHtml += `
      <div class="co-item">
        <img src="${p.image}" alt="${p.name}" class="co-img">
        <div class="co-info">
          <div class="co-name">${p.name}</div>
          <div class="co-detail">$${p.price.toFixed(2)} &times; ${item.quantity}</div>
        </div>
        <div class="co-line-total">$${lineTotal.toFixed(2)}</div>
      </div>`;
  });

  const content = `
  <style>
    .co-page { max-width: 720px; margin: 2rem auto; padding: 0 2.5rem; }
    .co-title { font-size: 1.5rem; font-weight: 800; margin-bottom: 1.5rem; }
    .co-info-bar { display: flex; align-items: center; gap: 0.6rem; padding: 0.85rem 1.25rem; background: rgba(59,130,246,0.08); border: 1px solid rgba(59,130,246,0.2); border-radius: var(--radius-sm); color: var(--blue); font-size: 0.9rem; font-weight: 500; margin-bottom: 1.5rem; }
    .co-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
    .co-header { background: var(--bg-surface); padding: 1rem 1.5rem; font-weight: 700; font-size: 0.95rem; border-bottom: 1px solid var(--border); }
    .co-items { padding: 0.5rem 0; }
    .co-item { display: flex; align-items: center; gap: 1rem; padding: 0.85rem 1.5rem; }
    .co-item + .co-item { border-top: 1px solid var(--border); }
    .co-img { width: 52px; height: 42px; object-fit: cover; border-radius: 6px; }
    .co-info { flex: 1; }
    .co-name { font-weight: 600; font-size: 0.9rem; }
    .co-detail { font-size: 0.8rem; color: var(--text-muted); margin-top: 2px; }
    .co-line-total { font-weight: 700; color: var(--accent); font-size: 0.95rem; }
    .co-summary { padding: 1.25rem 1.5rem; border-top: 1px solid var(--border); }
    .co-sum-row { display: flex; justify-content: space-between; padding: 0.4rem 0; font-size: 0.9rem; color: var(--text-secondary); }
    .co-grand { display: flex; justify-content: space-between; padding: 0.75rem 0 0; margin-top: 0.5rem; border-top: 1px solid var(--border); }
    .co-grand-label { font-size: 1.1rem; font-weight: 700; }
    .co-grand-val { font-size: 1.35rem; font-weight: 900; color: var(--accent); }
    .co-actions { display: flex; justify-content: space-between; margin-top: 1.5rem; }
    @media (max-width: 768px) { .co-page { padding: 0 1.25rem; } }
  </style>
  <div class="co-page">
    <h2 class="co-title">Checkout</h2>
    <div class="co-info-bar">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
      Review your order. Stock availability is validated before processing.
    </div>
    <div class="co-card">
      <div class="co-header">Order Summary &mdash; ${cartCount} item${cartCount !== 1 ? 's' : ''}</div>
      <div class="co-items">${itemsHtml}</div>
      <div class="co-summary">
        <div class="co-sum-row"><span>Subtotal</span><span>$${subtotal.toFixed(2)}</span></div>
        <div class="co-sum-row"><span>Shipping</span><span style="color:var(--green);font-weight:600;">Free</span></div>
        <div class="co-grand"><span class="co-grand-label">Grand Total</span><span class="co-grand-val">$${subtotal.toFixed(2)}</span></div>
      </div>
    </div>
    <div class="co-actions">
      <a href="/cart" class="btn btn-ghost">&larr; Back to Cart</a>
      <form method="POST" action="/checkout/place-order"><button class="btn btn-success">Place Order</button></form>
    </div>
  </div>`;
  res.send(layout("TechVault — Checkout", content, cartCount));
};

const getOrderConfirmation = (req, res) => {
  const order = req.session.lastOrder;
  if (!order) return res.redirect("/");

  let itemsHtml = '';
  order.items.forEach(item => {
    itemsHtml += `
      <div class="conf-item">
        <img src="${item.image}" class="conf-img" alt="${item.name}">
        <div class="conf-info">
          <div class="conf-name">${item.name}</div>
          <div class="conf-detail">$${item.price.toFixed(2)} &times; ${item.quantity}</div>
        </div>
        <div class="conf-line-total">$${(item.price * item.quantity).toFixed(2)}</div>
      </div>`;
  });

  const content = `
  <style>
    .conf-page { max-width: 720px; margin: 2rem auto; padding: 0 2.5rem; }
    .conf-hero { text-align: center; padding: 2.5rem; background: rgba(34,197,94,0.06); border: 1px solid rgba(34,197,94,0.2); border-radius: var(--radius); margin-bottom: 1.5rem; }
    .conf-check { width: 64px; height: 64px; border-radius: 50%; border: 2px solid var(--green); display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; }
    .conf-hero h2 { color: var(--green); font-size: 1.5rem; font-weight: 800; margin-bottom: 0.35rem; }
    .conf-hero p { color: var(--text-secondary); font-size: 0.95rem; }
    .conf-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
    .conf-header { background: var(--bg-surface); padding: 1rem 1.5rem; font-weight: 700; font-size: 0.95rem; border-bottom: 1px solid var(--border); }
    .conf-item { display: flex; align-items: center; gap: 1rem; padding: 0.85rem 1.5rem; }
    .conf-item + .conf-item { border-top: 1px solid var(--border); }
    .conf-img { width: 52px; height: 42px; object-fit: cover; border-radius: 6px; }
    .conf-info { flex: 1; }
    .conf-name { font-weight: 600; font-size: 0.9rem; }
    .conf-detail { font-size: 0.8rem; color: var(--text-muted); margin-top: 2px; }
    .conf-line-total { font-weight: 700; color: var(--accent); }
    .conf-total-bar { display: flex; justify-content: space-between; padding: 1.25rem 1.5rem; border-top: 1px solid var(--border); }
    .conf-total-label { font-size: 1.05rem; font-weight: 700; }
    .conf-total-val { font-size: 1.25rem; font-weight: 900; color: var(--accent); }
    .conf-actions { text-align: center; margin-top: 1.5rem; }
  </style>
  <div class="conf-page">
    <div class="conf-hero">
      <div class="conf-check"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg></div>
      <h2>Order Confirmed</h2>
      <p>Your order has been placed and stock has been updated.</p>
    </div>
    <div class="conf-card">
      <div class="conf-header">Order Details</div>
      ${itemsHtml}
      <div class="conf-total-bar">
        <span class="conf-total-label">Total Paid</span>
        <span class="conf-total-val">$${order.total.toFixed(2)}</span>
      </div>
    </div>
    <div class="conf-actions"><a href="/" class="btn btn-primary">Continue Shopping</a></div>
  </div>`;
  res.send(layout("TechVault — Order Confirmed", content, 0));
};

module.exports = {
  getCart,
  addToCart,
  updateCart,
  removeFromCart,
  clearCart,
  getCartApi,
  placeOrder,
  getCartPage,
  getCheckoutPage,
  getOrderConfirmation
};
