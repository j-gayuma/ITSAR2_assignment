# Product Ordering API

## System Explanation

The Product Ordering API is an order processing system built with Node.js and Express. It follows a three-layer architecture:

- **Presentation Layer** — API endpoints and HTML pages that handle HTTP requests and responses (`server.js`)
- **Business Logic Layer** — `validateOrder()` and `validateCartCheckout()` functions that enforce ordering rules (`server.js`)
- **Data Layer** — Product data stored in `products.json`, cart data stored in session (`express-session`)

When a client sends a request, the presentation layer receives it, the business logic layer validates the data against the rules, and the data layer reads or updates the product/cart information.

## API Endpoints

### Product Endpoints

| Method | Endpoint         | Description               | Request Body                                  |
|--------|------------------|---------------------------|-----------------------------------------------|
| GET    | `/`              | Shop page (frontend)      | None                                          |
| GET    | `/products`      | Retrieve all products     | None                                          |
| GET    | `/products/:id`  | Retrieve a single product | None                                          |
| POST   | `/orders`        | Place a direct order      | `{ "productId": number, "quantity": number }` |

### Cart Endpoints

| Method | Endpoint               | Description                | Request Body                                  |
|--------|------------------------|----------------------------|-----------------------------------------------|
| GET    | `/cart`                | Cart page (frontend)       | None                                          |
| GET    | `/cart/api`            | Get cart as JSON           | None                                          |
| POST   | `/cart/add`            | Add item to cart           | `{ "productId": number, "quantity": number }` |
| POST   | `/cart/update`         | Update item quantity       | `{ "productId": number, "quantity": number }` |
| POST   | `/cart/remove`         | Remove item from cart      | `{ "productId": number }`                     |
| POST   | `/cart/clear`          | Clear entire cart          | None                                          |

### Checkout Endpoints

| Method | Endpoint               | Description                | Request Body |
|--------|------------------------|----------------------------|--------------|
| GET    | `/checkout`            | Checkout page (frontend)   | None         |
| POST   | `/checkout/place-order`| Place order from cart      | None         |
| GET    | `/order/confirmation`  | Order confirmation page    | None         |

### Business Rules

1. Product must exist
2. Quantity must be a positive integer
3. Cannot order a product with zero stock
4. Quantity must not exceed available stock
5. Cart quantity cannot exceed available stock
6. All cart items are validated at checkout before processing

## curl Testing Commands

### Get all products
```bash
curl http://localhost:3000/products
```

### Get a single product
```bash
curl http://localhost:3000/products/1
```

### Add item to cart
```bash
curl -X POST http://localhost:3000/cart/add -H "Content-Type: application/json" -d "{\"productId\": 1, \"quantity\": 2}" -c cookies.txt
```

### Add another item to cart
```bash
curl -X POST http://localhost:3000/cart/add -H "Content-Type: application/json" -d "{\"productId\": 2, \"quantity\": 1}" -b cookies.txt -c cookies.txt
```

### View cart
```bash
curl http://localhost:3000/cart/api -b cookies.txt
```

### Update item quantity in cart
```bash
curl -X POST http://localhost:3000/cart/update -H "Content-Type: application/json" -d "{\"productId\": 1, \"quantity\": 3}" -b cookies.txt -c cookies.txt
```

### Remove item from cart
```bash
curl -X POST http://localhost:3000/cart/remove -H "Content-Type: application/json" -d "{\"productId\": 2}" -b cookies.txt -c cookies.txt
```

### Place order (checkout)
```bash
curl -X POST http://localhost:3000/checkout/place-order -H "Content-Type: application/json" -b cookies.txt -c cookies.txt
```

### Clear cart
```bash
curl -X POST http://localhost:3000/cart/clear -H "Content-Type: application/json" -b cookies.txt
```

### Direct order (bypasses cart)
```bash
curl -X POST http://localhost:3000/orders -H "Content-Type: application/json" -d "{\"productId\": 5, \"quantity\": 2}"
```

### Error: Product not found
```bash
curl -X POST http://localhost:3000/orders -H "Content-Type: application/json" -d "{\"productId\": 99, \"quantity\": 1}"
```

### Error: Out of stock
```bash
curl -X POST http://localhost:3000/cart/add -H "Content-Type: application/json" -d "{\"productId\": 3, \"quantity\": 1}"
```

### Error: Invalid quantity
```bash
curl -X POST http://localhost:3000/orders -H "Content-Type: application/json" -d "{\"productId\": 1, \"quantity\": -5}"
```

### Error: Missing fields
```bash
curl -X POST http://localhost:3000/orders -H "Content-Type: application/json" -d "{}"
```

## Screenshots Demonstrating Successful API Tests

### Screenshot 1: GET /products — Retrieve All Products

```
$ curl http://localhost:3000/products

{
  "success": true,
  "data": [
    { "id": 1, "name": "Laptop",              "price": 999.99, "stock": 10, "category": "Prebuilt PC" },
    { "id": 2, "name": "Wireless Mouse",       "price": 29.99,  "stock": 50, "category": "Peripheral"  },
    { "id": 3, "name": "Mechanical Keyboard",  "price": 59.99,  "stock": 0,  "category": "Peripheral"  },
    { "id": 4, "name": "27\" Gaming Monitor",  "price": 399.99, "stock": 5,  "category": "Monitor"     },
    { "id": 5, "name": "Gaming Headset",       "price": 79.99,  "stock": 20, "category": "Peripheral"  }
  ]
}
```

> Result: Returns all 5 products with id, name, price, stock, and category.

### Screenshot 2: GET /products/1 — Retrieve Single Product

```
$ curl http://localhost:3000/products/1

{
  "success": true,
  "data": { "id": 1, "name": "Laptop", "price": 999.99, "stock": 10, "category": "Prebuilt PC" }
}
```

> Result: Returns the Laptop product with full details.

### Screenshot 3: POST /cart/add — Add Item to Cart

```
$ curl -X POST http://localhost:3000/cart/add -H "Content-Type: application/json" -d '{"productId": 1, "quantity": 2}' -c cookies.txt

{
  "success": true,
  "message": "Laptop added to cart!",
  "cart": [ { "productId": 1, "quantity": 2 } ]
}
```

> Result: 2 Laptops added to cart. Session cookie saved.

### Screenshot 4: POST /cart/add — Add Second Item

```
$ curl -X POST http://localhost:3000/cart/add -H "Content-Type: application/json" -d '{"productId": 2, "quantity": 1}' -b cookies.txt -c cookies.txt

{
  "success": true,
  "message": "Wireless Mouse added to cart!",
  "cart": [ { "productId": 1, "quantity": 2 }, { "productId": 2, "quantity": 1 } ]
}
```

> Result: Wireless Mouse added. Cart now has 2 items.

### Screenshot 5: GET /cart/api — View Cart

```
$ curl http://localhost:3000/cart/api -b cookies.txt

{
  "success": true,
  "items": [
    { "productId": 1, "quantity": 2, "name": "Laptop", "price": 999.99, "subtotal": 1999.98 },
    { "productId": 2, "quantity": 1, "name": "Wireless Mouse", "price": 29.99, "subtotal": 29.99 }
  ],
  "total": 2029.97
}
```

> Result: Cart shows 2 items with calculated subtotals and total.

### Screenshot 6: POST /cart/update — Update Quantity

```
$ curl -X POST http://localhost:3000/cart/update -H "Content-Type: application/json" -d '{"productId": 1, "quantity": 3}' -b cookies.txt -c cookies.txt

{
  "success": true,
  "cart": [ { "productId": 1, "quantity": 3 }, { "productId": 2, "quantity": 1 } ]
}
```

> Result: Laptop quantity updated from 2 to 3.

### Screenshot 7: POST /cart/remove — Remove Item

```
$ curl -X POST http://localhost:3000/cart/remove -H "Content-Type: application/json" -d '{"productId": 2}' -b cookies.txt -c cookies.txt

{
  "success": true,
  "message": "Item removed.",
  "cart": [ { "productId": 1, "quantity": 3 } ]
}
```

> Result: Wireless Mouse removed. Cart now has 1 item.

### Screenshot 8: POST /checkout/place-order — Place Order from Cart

```
$ curl -X POST http://localhost:3000/checkout/place-order -H "Content-Type: application/json" -b cookies.txt

{
  "success": true,
  "message": "Order placed successfully!",
  "order": {
    "items": [ { "name": "Laptop", "price": 999.99, "quantity": 3 } ],
    "total": 2999.97
  }
}
```

> Result: Order placed. 3 Laptops at $999.99 each = $2999.97. Stock deducted. Cart cleared.

### Screenshot 9: POST /orders — Direct Order (Bypasses Cart)

```
$ curl -X POST http://localhost:3000/orders -H "Content-Type: application/json" -d '{"productId": 5, "quantity": 2}'

{
  "success": true,
  "message": "Order placed successfully!",
  "order": { "product": "Gaming Headset", "quantity": 2, "totalPrice": 159.98, "remainingStock": 18 }
}
```

> Result: Direct order placed. 2 Headsets ordered. Stock reduced from 20 to 18.

### Screenshot 10: Error — Out of Stock

```
$ curl -X POST http://localhost:3000/cart/add -H "Content-Type: application/json" -d '{"productId": 3, "quantity": 1}'

{
  "success": false,
  "message": "Mechanical Keyboard is out of stock."
}
```

> Result: Business rule enforced — Mechanical Keyboard has 0 stock.

### Screenshot 11: Error — Product Not Found

```
$ curl -X POST http://localhost:3000/orders -H "Content-Type: application/json" -d '{"productId": 99, "quantity": 1}'

{
  "success": false,
  "message": "Product not found."
}
```

> Result: Business rule enforced — product with ID 99 does not exist.

### Screenshot 12: Error — Invalid Quantity

```
$ curl -X POST http://localhost:3000/orders -H "Content-Type: application/json" -d '{"productId": 1, "quantity": -5}'

{
  "success": false,
  "message": "Quantity must be a positive integer."
}
```

> Result: Business rule enforced — negative quantity is not allowed.

### Screenshot 13: Error — Missing Fields

```
$ curl -X POST http://localhost:3000/orders -H "Content-Type: application/json" -d '{}'

{
  "success": false,
  "message": "productId and quantity are required."
}
```

> Result: Validation enforced — both productId and quantity are required fields.
