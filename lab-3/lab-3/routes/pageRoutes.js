const express = require("express");
const router = express.Router();
const { getShopPage } = require("../controllers/viewController");
const cartController = require("../controllers/cartController");
const productController = require("../controllers/productController");

// GET / - Shop page
router.get("/", getShopPage);

// GET /cart - Cart page
router.get("/cart", cartController.getCartPage);

// GET /checkout - Checkout page
router.get("/checkout", cartController.getCheckoutPage);

// GET /order/confirmation - Order confirmation page
router.get("/order/confirmation", cartController.getOrderConfirmation);

// POST /checkout/place-order - Place order
router.post("/checkout/place-order", cartController.placeOrder);

// POST /orders - Direct order (bypasses cart)
router.post("/orders", productController.createOrder);

module.exports = router;
