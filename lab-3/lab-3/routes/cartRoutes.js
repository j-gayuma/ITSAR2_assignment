const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cartController");

// API routes for cart operations
// POST /cart/add
router.post("/add", cartController.addToCart);

// POST /cart/update
router.post("/update", cartController.updateCart);

// POST /cart/remove
router.post("/remove", cartController.removeFromCart);

// POST /cart/clear
router.post("/clear", cartController.clearCart);

// GET /cart/api - JSON representation of current cart
router.get("/api", cartController.getCartApi);

module.exports = router;