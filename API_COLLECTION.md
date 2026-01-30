# API Collection

## Base URL
```
http://localhost:3000/api
```

## Authentication

All authenticated endpoints require the `Authorization` header:
```
Authorization: Bearer <jwt_token>
```

---

## Auth Endpoints

### Get All Users (for demo login)
```http
GET /api/auth/users
```

**Response:**
```json
[
  {
    "id": "clxx...",
    "name": "Nick Fury",
    "email": "nick.fury@shield.com",
    "role": "ADMIN",
    "country": { "id": "...", "name": "America", "code": "US" }
  }
]
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "userId": "clxx..."
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "clxx...",
    "name": "Nick Fury",
    "email": "nick.fury@shield.com",
    "role": "ADMIN",
    "country": { "id": "...", "name": "America", "code": "US" }
  }
}
```

---

## Restaurant Endpoints

### List Restaurants
```http
GET /api/restaurants
Authorization: Bearer <token>
```

**RBAC Notes:**
- Admin sees all restaurants
- Manager/Member see only their country's restaurants

**Response:**
```json
[
  {
    "id": "clxx...",
    "name": "Burger Barn",
    "description": "Classic American burgers...",
    "image": "https://...",
    "cuisine": "American",
    "rating": 4.4,
    "country": { "id": "...", "name": "America", "code": "US" },
    "menuItemCount": 4
  }
]
```

### Get Restaurant Details
```http
GET /api/restaurants/:id
Authorization: Bearer <token>
```

**RBAC Notes:**
- Returns 403 if user doesn't have access to the restaurant's country

**Response:**
```json
{
  "id": "clxx...",
  "name": "Burger Barn",
  "menuItems": [
    {
      "id": "...",
      "name": "Classic Cheeseburger",
      "description": "...",
      "price": 12.99,
      "image": "...",
      "category": "Burgers",
      "isVegetarian": false
    }
  ]
}
```

---

## Cart Endpoints

### Get Cart
```http
GET /api/cart
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "clxx..." | null,
  "items": [...],
  "total": 25.98,
  "itemCount": 2
}
```

### Clear Cart
```http
DELETE /api/cart
Authorization: Bearer <token>
```

---

## Order Endpoints

### List Orders
```http
GET /api/orders
Authorization: Bearer <token>
```

**RBAC Notes:**
- Admin sees all orders
- Manager sees orders from their country
- Member sees only their own orders

### Create/Add to Order (Add to Cart)
```http
POST /api/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "menuItemId": "clxx...",
  "quantity": 1
}
```

**RBAC Notes:**
- All roles can create orders
- Returns 403 if adding item from another country

### Update Order Item
```http
PUT /api/orders/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "itemId": "clxx...",
  "quantity": 2
}
```

**Notes:**
- Set quantity to 0 to remove item
- Only works for DRAFT orders

### Cancel Order
```http
DELETE /api/orders/:id
Authorization: Bearer <token>
```

**RBAC Notes:**
- Only Admin and Manager can cancel
- Manager can only cancel orders from their country
- Returns 403 for Members

### Checkout Order
```http
POST /api/orders/:id/checkout
Authorization: Bearer <token>
Content-Type: application/json

{
  "paymentMethodId": "clxx..." // optional
}
```

**RBAC Notes:**
- Only Admin and Manager can checkout
- Returns 403 for Members

---

## Payment Method Endpoints

### List Payment Methods
```http
GET /api/payment-methods
Authorization: Bearer <token>
```

### Add Payment Method
```http
POST /api/payment-methods
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "CREDIT_CARD",
  "lastFour": "4242",
  "isDefault": true
}
```

**RBAC Notes:**
- Only Admin can add payment methods

### Update Payment Method
```http
PUT /api/payment-methods
Authorization: Bearer <token>
Content-Type: application/json

{
  "id": "clxx...",
  "isDefault": true
}
```

**RBAC Notes:**
- Only Admin can update

### Delete Payment Method
```http
DELETE /api/payment-methods?id=clxx...
Authorization: Bearer <token>
```

**RBAC Notes:**
- Only Admin can delete

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "error": "Error message here"
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 500 | Internal Server Error |
