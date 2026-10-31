# Current Implementation Inventory: Verification & Gaps

## 1. Feature Implementation Matrix

To ensure absolute technical honesty, every feature is audited against the actual source files and classified as:
- **Implemented (Verified):** Functional end-to-end with matching backend, model, and frontend UI.
- **Partially Implemented:** Functional in some layers but missing critical validation, error handling, or cleanup.
- **Mocked / Stubbed:** UI exists or endpoint exists, but returns fake data or does not execute real actions.
- **Dead / Orphaned:** Code exists in the repository but is unimported, bypassed, or unused.

---

### 1.1 Authentication & Authorization

| Sub-Feature | Verification Status | Code Evidence | Notes & Edge Cases |
| :--- | :---: | :--- | :--- |
| OTP Registration | **Implemented** | `authRoutes.js`, `authController.js:83-184`, `OtpVerify.jsx` | Uses crypto-secure 6-digit generation, SHA-256 hash storage, 10m TTL. Password pre-hashed with bcrypt. |
| Credential Login | **Implemented** | `authController.js:222-250`, `Login.jsx` | Validates email/password, sets HttpOnly cookies, checks `isActive`. |
| Silent Token Refresh | **Implemented** | `api.js:24-62`, `authController.js:256-288` | Interceptor catches 401 `TOKEN_EXPIRED`, queues concurrent calls, refreshes cookies via `/api/auth/refresh-token`. |
| Password Reset | **Implemented** | `authController.js:319-394`, `ForgotPassword.jsx`, `ResetPassword.jsx` | Crypto tokens with SHA-256 hash storage, 30m expiry, increments `tokenVersion` upon reset. |
| Role-Based Access Control | **Implemented** | `middlewares/auth.js:64-69`, `AdminRoute.jsx` | Strict 403 Forbidden for non-admin on `/api/admin` routes; client-side route guard in `router.jsx`. |
| Admin Role Separation (SoD)| **Implemented** | `middlewares/auth.js:64-75`, `cartRoutes.js`, `orderRoutes.js`, `CustomerRoute.jsx` | Complete segregation of duties: Admin users cannot add items to cart, checkout, or place orders (403 `ADMIN_SHOPPING_RESTRICTED`). UI replaces purchase buttons with admin view controls. |
| Session Invalidation | **Implemented** | `authController.js:306-313`, `middlewares/auth.js:44-46` | Changing password or logging out increments `tokenVersion`, invalidating previously issued tokens. |

---

### 1.2 Product Catalog & Search

| Sub-Feature | Verification Status | Code Evidence | Notes & Edge Cases |
| :--- | :---: | :--- | :--- |
| Product Browsing & Filtering | **Implemented** | `productController.js:15-59`, `Shop.jsx`, `ProductFilter.jsx` | Supports category, brand, min/max price, featured filter, and page pagination. |
| Product Details & Zoom | **Implemented** | `ProductDetail.jsx`, `productController.js:62-66` | Image zoom on hover, responsive thumbnail switching. |
| Product Search | **Implemented** | `productController.js:240-244`, `Header.jsx` | Uses MongoDB `$text` search on name and description. |
| Product Management (Admin) | **Implemented & Clean** | `productController.js:85-175`, `ProductForm.jsx`, `fileUtils.js` | Creates and updates products with Cloudinary upload; Multer temp files automatically unlinked with zero disk leakage. |
| Product Reviews & Ratings | **Mocked / Planned** | `ProductDetail.jsx:32-37` | UI displays hardcoded static reviews; `Product.js` schema does not store ratings or reviews. |

---

### 1.3 Cart & Order Fulfillment

| Sub-Feature | Verification Status | Code Evidence | Notes & Edge Cases |
| :--- | :---: | :--- | :--- |
| Persistent Cart | **Implemented** | `cartController.js`, `cartStore.js`, `Cart.jsx` | Stored in MongoDB by user ID; items count and subtotal calculate dynamically. |
| Checkout Flow | **Implemented** | `Checkout.jsx`, `orderController.js` | 4-step wizard: Shipping → Billing → Payment → Review. |
| Cash on Delivery (COD) | **Implemented** | `orderController.js`, `OrdersManagement.jsx:72-80` | Creates order with `payment.status = 'pending'`, admin button to mark paid upon delivery. |
| Razorpay Payments | **Implemented & Secured** | `orderRoutes.js:63-103`, `Checkout.jsx`, `paymentService.js` | Server creates Razorpay order, frontend opens modal, backend enforces HMAC-SHA256 signature verification. |
| Inventory Decrement | **Implemented & Atomic** | `orderController.js:25-105, 115-195` | Atomic conditional decrement (`$inc` with `{ stock: { $gte: qty } }`) prevents overselling with compensating rollback. |
| Order Status State Machine | **Implemented** | `orderController.js:296-355`, `OrdersManagement.jsx` | Validates legal transitions (`pending` → `processing` → `shipped` → `delivered`). Restores stock on cancellation. |
| Customer Order Tracking | **Implemented** | `Orders.jsx`, `OrderDetail.jsx` | Visual status tracker, delivery estimate, order items breakdown. |

---

### 1.4 Admin & Machine Learning Intelligence

| Sub-Feature | Verification Status | Code Evidence | Notes & Edge Cases |
| :--- | :---: | :--- | :--- |
| KPI Dashboard | **Implemented** | `adminController.js:71-94`, `Dashboard.jsx` | Calculates total users, total orders, total sales via Mongoose aggregation, recent 5 orders. |
| Admin Design System | **Implemented (Phase 3)** | `AdminLayout.jsx`, `AdminSidebar.jsx`, `StatsCard.jsx`, `ProductForm.jsx` | Unified Modern Clean Light Theme matching storefront: pure white surfaces, subtle slate-200 borders, pastel badges, frosted glass topbar, responsive mobile drawer. |
| AI Churn Risk Prediction | **Implemented & Vectorized**| `adminController.js:99-221`, `predict.py`, `ChurnAnalytics.jsx` | Vectorized batch inference via single Pandas DataFrame and 1 Python subprocess. Single consolidated MongoDB order aggregation query. |
| System Resource Metrics | **Implemented** | `adminController.js:226-241` | Returns OS CPU count, RAM usage, and uptime via Node.js `os` module. |
| Admin Audit Logs | **Implemented (Phase 7)** | `adminController.js`, `AdminLog.js`, `productController.js`, `orderController.js`, `userController.js` | Persists administrative actions (`create`, `update`, `delete`, `backup`) with IP, userAgent, and entity metadata. Filterable and paginated. |
| System Cache Clear | **Implemented (Phase 7)** | `adminController.js:285-300` | Logs administrative cache clearance event and resets in-memory cache states. |
| Database Backup | **Implemented (Phase 7)** | `adminController.js:315-330` | Initiates database backup tracking checkpoint and creates persistent audit record. |

---

### 1.5 Resolved Architectural Gaps & Remaining Tech Debt

1. **`backend/src/utils/jwt.js` & Token Lifecycle [RESOLVED - Phase 6]:**
   - Refactored into unified token management module providing `signAccessToken`, `signRefreshToken`, `verifyAccessToken`, and `verifyRefreshToken`.
   - Payload standard unified across `authController.js` and `middlewares/auth.js` (`{ id, tokenVersion, type }`).
   - Deprecated separate inline token signing.
2. **`backend/src/middlewares/errorHandler.js` Error Mapping [RESOLVED - Phase 6]:**
   - Wired `handleCastError`, `handleDuplicateFields`, `handleValidationError`, `handleJWTError`, and `handleJWTExpiredError` directly into `errorHandler(err, req, res, next)`.
   - Operational errors now return structured HTTP 400/401 payloads with field error details in production rather than masking failures under generic 500 responses.
3. **`IMPORTANT_INFORMATION/rzp-key.csv` (Exposed Secret File - User Retained):**
   - Plaintext CSV containing Razorpay Key ID and Secret residing in repo workspace per user retention requirement.


---

### 1.6 Newly Remediated Production Features (November 2026)

| Sub-Feature | Verification Status | Code Evidence | Notes & Edge Cases |
| :--- | :---: | :--- | :--- |
| Multimodal AI Visual Search | **Implemented & Hardened** | `visualSearchService.js`, `productRoutes.js:65`, `VisualSearchModal.jsx` | Google Gemini Vision API; dedicated 25 req/15min rate limiting; optical character recognition (OCR) and token Jaccard similarity; zero disk upload leaks via memory storage. |
| GST Tax Invoice Generator | **Implemented & Statutory** | `invoiceService.js`, `orderController.js`, `OrderDetail.jsx` | Compliant with Section 15(3) CGST Act (pre-tax trade discount deduction); 0% NIL rate for books (HSN 4901); Intrastate/Interstate tax bifurcation; QR code payload; dynamic multi-page A4 PDF flow. |
| Live Delivery Map Simulation | **Implemented & Synchronized** | `LiveDeliveryMap.jsx`, `OrderDetail.jsx` | Leaflet 1.9 map with moving van marker and real-time ETA; guarded to active order states (`processing`, `shipped`, `delivered`); cancellation banner for cancelled orders; unmapped city demo disclosure pill. |