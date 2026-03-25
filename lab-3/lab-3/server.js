const express = require("express");
const path = require("path");

// Middleware
const { sessionMiddleware } = require("./middleware/sessionMiddleware");

// Routes
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const pageRoutes = require("./routes/pageRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

/**
 * MIDDLEWARE SECTION
 */

// 1. Body parsing: Allows Express to read JSON and Form data from requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. Static Files: Serves your CSS, Images, and Client-side JS from the 'public' folder
app.use(express.static(path.join(__dirname, "public")));

// 3. Session: Must be initialized BEFORE the routes
app.use(sessionMiddleware);

/**
 * ROUTES SECTION
 */

app.use("/products", productRoutes); // GET /products
app.use("/cart", cartRoutes);        // POST /cart/add, GET /cart
app.use("/", pageRoutes);            // Home page and others

/**
 * ERROR HANDLING
 */

// Catch-all for malformed JSON to prevent the server from sending HTML error pages
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({ 
        success: false, 
        message: "Invalid JSON format in request body." 
    });
  }
  next();
});

// Start the server
app.listen(PORT, () => {
  console.log(`Product Ordering API running on http://localhost:${PORT}`);
  console.log(`Test your API with: curl.exe -X GET http://localhost:${PORT}/products`);
});