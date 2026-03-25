const fs = require("fs");
const path = require("path");

const PRODUCTS_FILE = path.join(__dirname, "../data/products.json");

// --- Data Layer ---
function loadProducts() {
  return JSON.parse(fs.readFileSync(PRODUCTS_FILE, "utf-8"));
}

function saveProducts(products) {
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
}

// --- Business Logic ---
function validateOrder(products, productId, quantity) {
  console.log("[validateOrder] productId=", productId, "quantity=", quantity, "ids=", products.map(p => p.id));
  const idStr = String(productId).trim();
  const qty = parseInt(quantity);

  const product = products.find((p) => String(p.id) === idStr);
  if (!product) return { valid: false, message: "Product not found." };
  if (!Number.isInteger(qty) || qty <= 0) return { valid: false, message: "Quantity must be a positive integer." };
  if (product.stock === 0) return { valid: false, message: `${product.name} is out of stock.` };
  if (qty > product.stock) return { valid: false, message: `Insufficient stock. Only ${product.stock} ${product.name}(s) available.` };
  return { valid: true, product, quantity: qty };
}

// --- Controllers ---
const getProducts = (req, res) => {
  res.json({ success: true, data: loadProducts() });
};

const getProductById = (req, res) => {
  const products = loadProducts();
  const product = products.find((p) => p.id === parseInt(req.params.id));
  if (!product) return res.status(404).json({ success: false, message: "Product not found." });
  res.json({ success: true, data: product });
};

const createOrder = (req, res) => {
  const { productId, quantity } = req.body;
  if (productId === undefined || quantity === undefined) {
    return res.status(400).json({ success: false, message: "productId and quantity are required." });
  }
  const products = loadProducts();
  const result = validateOrder(products, productId, quantity);
  if (!result.valid) return res.status(400).json({ success: false, message: result.message });
  result.product.stock -= result.quantity;
  saveProducts(products);
  const totalPrice = parseFloat((result.product.price * result.quantity).toFixed(2));
  res.json({
    success: true,
    message: "Order placed successfully!",
    order: { product: result.product.name, quantity: result.quantity, totalPrice, remainingStock: result.product.stock }
  });
};

module.exports = {
  loadProducts,
  saveProducts,
  validateOrder,
  getProducts,
  getProductById,
  createOrder
};
