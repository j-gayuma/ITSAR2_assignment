const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");

// GET /products - Get all products
router.get("/", productController.getProducts);

// GET /products/:id - Get product by ID
router.get("/:id", productController.getProductById);

module.exports = router;
