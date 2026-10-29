# REST API Specification: E-Shop Platform

## 1. API Conventions & Standards

- **Base URL:** `/api` (or custom host e.g. `http://localhost:5000/api`)
- **Format:** JSON (`Content-Type: application/json` or `multipart/form-data` for file uploads)
- **Standard Success Response:**
  ```json
  {
    "success": true,
    "message": "Optional descriptive status message",
    "data": {}
  }
  ```
- **Standard Error Response:**
  ```json
  {
    "success": false,
    "message": "Specific error message",
    "code": "OPTIONAL_ERROR_CODE",
    "errors": [
      { "field": "email", "message": "Please provide a valid email" }
    ]
  }
  ```
- **Authentication Scheme:**
  - Standard: `Cookie: accessToken=<jwt>; refreshToken=<jwt>`
  - Fallback: `Authorization: Bearer <jwt>`
  - Access Token Expiration: 15 minutes
  - Refresh Token Expiration: 7 days

---

## 2. Authentication Endpoints (`/api/auth`)

| Method | Endpoint | Access | Rate Limit | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/send-otp` | Public | 5 / 15m | Validates credentials and dispatches 6-digit verification OTP |
| `POST` | `/api/auth/verify-otp` | Public | 5 / 15m | Verifies OTP, persists user account, sets auth cookies |
| `POST` | `/api/auth/resend-otp` | Public | 5 / 15m | Dispatches refreshed OTP to pending unverified registration |
| `POST` | `/api/auth/login` | Public | 5 / 15m | Validates email & password, sets session cookies |
| `POST` | `/api/auth/logout` | Optional Auth | — | Increments `tokenVersion`, invalidates cookies |
| `POST` | `/api/auth/refresh-token` | Public | — | Validates refresh token cookie, rotates access cookie |
| `GET` | `/api/auth/me` | Authenticated | — | Returns profile payload of current authenticated user |
| `PUT` | `/api/auth/update-password` | Authenticated | — | Updates password and revokes previous active tokens |
| `POST` | `/api/auth/forgot-password` | Public | 3 / 15m | Sends password reset email link with hashed token |
| `POST` | `/api/auth/reset-password/:token`| Public | — | Sets new password via token, invalidates token |

---

## 3. Product Catalog Endpoints (`/api/products`)

| Method | Endpoint | Access | Description | Query Parameters / Body |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/products` | Public | List products with pagination & filtering | `page`, `limit`, `category`, `minPrice`, `maxPrice`, `brand`, `search`, `featured`, `sort` |
| `GET` | `/api/products/search` | Public | Full-text product search | `q` (search string) |
| `GET` | `/api/products/featured` | Public | Retrieve featured showcase products | `limit` (default: 10) |
| `GET` | `/api/products/category/:category` | Public | Filter products by category enum | `category`, `limit` |
| `GET` | `/api/products/:id` | Public | Retrieve detailed product specification | `:id` (MongoDB ObjectId) |
| `POST` | `/api/products` | Admin Only | Create new product with Cloudinary images | `multipart/form-data`: `name`, `description`, `price`, `stock`, `category`, `brand`, `images` (up to 5 files) |
| `PUT` | `/api/products/:id` | Admin Only | Update existing product details & imagery | `multipart/form-data`: Updated product fields |
| `DELETE` | `/api/products/:id` | Admin Only | Soft-delete product (`isActive = false`) | `:id` |
| `POST` | `/api/products/:id/images` | Admin Only | Append images to existing product | `images` (files) |
| `DELETE` | `/api/products/:id/images/:imageId` | Admin Only | Remove image from Cloudinary & Product | `:id`, `:imageId` |

---

## 4. Shopping Cart Endpoints (`/api/cart`)

> [!NOTE]
> All shopping cart routes require role `user`. Administrative accounts are restricted with HTTP 403 `ADMIN_SHOPPING_RESTRICTED`.

| Method | Endpoint | Access | Description | Request Body Payload |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/cart` | Customer Only (`user`) | Fetch active user shopping cart & subtotal | None |
| `POST` | `/api/cart` | Customer Only (`user`) | Add product or increment item quantity | `{ "productId": "...", "quantity": 1 }` |
| `PUT` | `/api/cart/item/:itemId` | Customer Only (`user`) | Update quantity of specific cart line item | `{ "quantity": 3 }` |
| `DELETE`| `/api/cart/item/:itemId` | Customer Only (`user`) | Remove specific product from cart | None |
| `DELETE`| `/api/cart` | Customer Only (`user`) | Flush all items from user cart | None |

---

## 5. Order & Payment Endpoints (`/api/orders`)

| Method | Endpoint | Access | Description | Payload / Notes |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/orders` | Customer Only (`user`) | Create order with explicit items array | `shippingAddress`, `billingAddress`, `paymentMethod`, `items` |
| `POST` | `/api/orders/from-cart` | Customer Only (`user`) | Create order directly from active user cart | `shippingAddress`, `billingAddress`, `paymentMethod`, `notes` |
| `GET` | `/api/orders/my-orders` | Customer Only (`user`) | List all historical orders for current user | Paginated / sorted `-createdAt` |
| `GET` | `/api/orders/:id` | Customer Owner or Admin | Retrieve single order details | `:id` |
| `PUT` | `/api/orders/:id/cancel`| Customer Only (`user`) | Cancel order (allowed if `pending`/`processing`) | `{ "reason": "..." }` |
| `POST` | `/api/orders/:id/razorpay/create` | Customer Only (`user`) | Generate server-side Razorpay order | Generates Razorpay order in paise, sets `razorpayOrderId` |
| `POST` | `/api/orders/:id/razorpay/verify` | Customer Only (`user`) | Cryptographic HMAC-SHA256 payment verification | `{ "razorpay_payment_id", "razorpay_order_id", "razorpay_signature" }` |
| `GET` | `/api/orders` | Admin Only | Administrative order overview with filters | `page`, `limit`, `status`, `paymentStatus`, `search`, `startDate`, `endDate` |
| `PUT` | `/api/orders/:id/status`| Admin Only | Advance order state machine (`shipped`, etc.) | `{ "status": "shipped", "trackingNumber": "...", "courier": "..." }` |
| `PUT` | `/api/orders/:id/payment`| Admin Only | Update payment state (e.g., mark COD received) | `{ "paymentStatus": "completed", "transactionId": "..." }` |
| `GET` | `/api/orders/analytics/sales`| Admin Only| Sales revenue analytics aggregated by period | `period` (`day`\|`week`\|`month`\|`year`), `startDate`, `endDate` |

---

## 6. User Management Endpoints (`/api/users`)

| Method | Endpoint | Access | Description | Payload / Notes |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/users/profile` | Authenticated | Retrieve authenticated user profile | Strips password hash |
| `PUT` | `/api/users/profile` | Authenticated | Update user name, phone, address, avatar | `multipart/form-data`: `name`, `phone`, `address`, `avatar` (file) |
| `GET` | `/api/users/orders` | Authenticated | Fetch current user order summaries | Alternate route to `/orders/my-orders` |
| `GET` | `/api/users/orders/:id` | Authenticated | Fetch specific user order | `:id` |
| `GET` | `/api/users` | Admin Only | List all registered users with pagination | `page`, `limit`, `role`, `active`, `search` |
| `GET` | `/api/users/stats/overview` | Admin Only | Total user counts, active users, growth trends | `startDate`, `endDate` |
| `GET` | `/api/users/:id` | Admin Only | Detailed user profile + total spend analytics | `:id` |
| `PUT` | `/api/users/:id` | Admin Only | Administrative user modification (role, active) | `{ "role": "admin", "isActive": true }` (Guards against self-demotion) |
| `DELETE`| `/api/users/:id` | Admin Only | Deactivate user account (soft delete) | Guards against self-deletion |

---

## 7. Admin & ML Analytics Endpoints (`/api/admin`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/dashboard` | Admin Only | Aggregated KPIs: total users, products, orders, total sales, recent 5 orders |
| `GET` | `/api/admin/analytics/churn` | Admin Only | 🧠 AI Customer Churn Analysis: executes XGBoost model per customer, returns churn probability and rationale |
| `GET` | `/api/admin/metrics` | Admin Only | Returns OS memory usage, CPU cores, platform, uptime |
| `GET` | `/api/admin/logs` | Admin Only | Returns audit log history (Stubbed: returns empty array) |
| `POST` | `/api/admin/cache/clear` | Admin Only | Flush application cache (Stubbed: returns success) |
| `POST` | `/api/admin/notifications`| Admin Only | Send system broadcast (Stubbed: returns success) |
| `POST` | `/api/admin/backup` | Admin Only | Trigger database dump (Stubbed: returns success) |

---

## 8. AI Chatbot & Operations Copilot Endpoints (`/api/chat`)

| Method | Endpoint | Access | Description | Request Body Payload |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/chat/customer` | Public / Optional Auth | Storefront conversational shopping concierge. Grounded catalog search, order tracking, and store policies. | `{ "message": "Find running shoes under ₹2,000", "conversationHistory": [] }` |
| `POST` | `/api/chat/admin` | Admin Only (`admin`) | Executive operations copilot. Queries gross sales, order KPIs, inventory depletion, ML churn risk, audit logs, and CRM email drafts. | `{ "message": "Show executive KPIs and revenue", "conversationHistory": [] }` |
| `POST` | `/api/chat/admin/send-email` | Admin Only (`admin`) | Dispatches confirmed CRM promotional/deal email to a targeted customer with strict cryptographic audit logging to `AdminLog`. | `{ "customerEmail": "user@example.com", "customerName": "John", "subject": "Exclusive Deal", "body": "Enjoy special 20% savings", "dealCode": "SAVE20", "discountPercent": 20 }` |

---

## 9. System & Observability

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Public | System liveness probe returning uptime, memory usage, and timestamp |
