# Known Issues & Defect Log: E-Shop Platform

This document captures all confirmed defects, reliability hazards, and architectural weaknesses identified during the codebase audit.

---

### Issue 1: Unverified Payment Status Mutation via `/confirm-payment` — [RESOLVED]
- **Severity:** Critical
- **Priority:** P0 (Resolved in Phase 2)
- **Evidence:** `backend/src/routes/orderRoutes.js:32-50` and `frontend/src/pages/Checkout.jsx:136-140`
- **Relevant Files:**
  - `backend/src/routes/orderRoutes.js` (`/:id/razorpay/verify`)
  - `frontend/src/pages/Checkout.jsx` (`handleRazorpay`)
  - `frontend/src/services/orderService.js`
- **Initial Behavior:** Authenticated users could issue an HTTP POST to `/api/orders/:id/confirm-payment` supplying only a `razorpay_payment_id` string. The order's payment status was updated to `'completed'` without contacting Razorpay or verifying cryptographic signatures.
- **Remediation Implemented:**
  1. Completely deleted the unverified `POST /api/orders/:id/confirm-payment` bypass route.
  2. Hardened `POST /api/orders/:id/razorpay/verify` to validate `razorpay_payment_id`, `razorpay_order_id`, and `razorpay_signature` using HMAC-SHA256 against `RAZORPAY_KEY_SECRET`.
  3. Ensured order lookup requires `{ _id: req.params.id, user: req.userId }` preventing cross-user verification tampering.
  4. Updated `Checkout.jsx` to create server-side Razorpay orders first, and forward genuine cryptographic signatures to `/razorpay/verify`.
- **Suggested Verification:**
  - Send fake `razorpay_payment_id` without valid HMAC signature; assert API responds with `400 Bad Request`.
  - Simulate genuine payment with correct signature; assert payment status becomes `completed`.

---

### Issue 2: Plaintext Credentials Committed in Repository
- **Severity:** High
- **Priority:** P0
- **Evidence:** `IMPORTANT_INFORMATION/rzp-key.csv` containing live Razorpay API keys.
- **Relevant Files:**
  - `IMPORTANT_INFORMATION/rzp-key.csv`
  - `.gitignore`
- **Current Behavior:** Sensitive API credentials reside in files inside the working tree. Note: Path is ignored by git via `.gitignore:105`.
- **Expected Behavior:** No production, sandbox, or third-party secret should ever reside in the filesystem unless strictly within an untracked `.env` file.
- **Potential Impact:** Compromise of merchant Razorpay account, potential financial theft or unauthorized refunds.
- **Recommended Solution:** Rotate keys immediately in the Razorpay dashboard, keep `.gitignore` protecting `IMPORTANT_INFORMATION/`.
- **Dependencies & Risks:** Zero functional risk.
- **Suggested Verification:** Run git status and grep for API keys; ensure no hits in tracked files.

---

### Issue 3: High-Concurrency Subprocess Spawn in Churn Predictions — [RESOLVED]
- **Severity:** High
- **Priority:** P1 (Resolved in Phase 4)
- **Evidence:** `backend/src/controllers/adminController.js:108-166` and `backend/ml-models/predict.py`
- **Relevant Files:**
  - `backend/src/controllers/adminController.js` (`getChurnPredictions`)
  - `backend/ml-models/predict.py`
- **Initial Behavior:** `Promise.all(users.map(...))` spawned up to 50 concurrent Python processes and fired 50 individual MongoDB aggregation queries. Each process initialized scikit-learn, pandas, and unpickled the XGBoost pipeline, creating a severe memory/CPU spike and risk of OOM crashes on 512MB RAM servers.
- **Remediation Implemented:**
  1. **Consolidated Aggregation:** Replaced 50 individual `Order.aggregate` queries with 1 single `$match: { user: { $in: userIds } }` aggregation mapped in-memory via a fast JavaScript `Map`.
  2. **Vectorized Pandas Batch Inference:** Refactored `predict.py` to accept JSON arrays of user feature objects via stdin, build a single `pd.DataFrame`, and execute `model.predict_proba(X)` across all rows in a single C-level vectorized matrix operation.
  3. **Scikit-Learn 1.8 Compatibility Patch:** Dynamically patched `SimpleImputer._fill_dtype` on ColumnTransformer steps during pipeline load to prevent cross-version attribute exceptions.
  4. **Single Subprocess Invocation:** `adminController.js` now invokes `runPrediction` exactly once with the batch array, reducing child processes from 50 to 1, cutting execution time to <1s, and reducing RAM usage from ~2GB to <80MB.
- **Suggested Verification:** Call `GET /api/admin/analytics/churn`; assert response arrives in under 1 second with exactly 1 Python process execution.

---

### Issue 4: Non-Atomic Product Stock Decrement & Lack of Rollback — [RESOLVED]
- **Severity:** High
- **Priority:** P0 (Resolved in Phase 2)
- **Evidence:** `backend/src/controllers/orderController.js:56-59` and `147-150`
- **Relevant Files:**
  - `backend/src/controllers/orderController.js` (`createOrder`, `createOrderFromCart`)
- **Initial Behavior:** Stock was checked and decremented in a JavaScript `for` loop with in-memory arithmetic:
  `product.stock -= item.quantity; await product.save();`
  Prone to race condition overselling under concurrent requests, and orphaned inventory deductions if order document creation crashed midway.
- **Remediation Implemented:**
  1. Replaced with atomic MongoDB conditional updates: `Product.findOneAndUpdate({ _id, stock: { $gte: quantity }, isActive: true }, { $inc: { stock: -quantity } })`.
  2. Implemented compensating transaction rollback in the catch block: if any item fails stock reservation or order creation fails, all previously decremented items are automatically compensated via `$inc: { stock: quantity }`.
  3. Added `compareAtPrice` to `Product.js` schema so discount price data is properly persisted.
- **Suggested Verification:** Attempt to purchase more than available stock concurrently; verify zero overselling and exact stock balance preservation.

---

### Issue 5: Disk Space Leak via Uncleaned Multer Temp Files — [RESOLVED]
- **Severity:** Medium
- **Priority:** P2 (Resolved in Phase 5)
- **Evidence:** `backend/src/routes/productRoutes.js:23-43`, `backend/src/routes/userRoutes.js:23-45`
- **Relevant Files:**
  - `backend/src/utils/fileUtils.js`
  - `backend/src/config/cloudinary.js`
  - `backend/src/middlewares/validation.js`
  - `backend/src/middlewares/errorHandler.js`
  - `backend/src/server.js`
- **Initial Behavior:** Multer saved image uploads to local disk in `uploads/`. After Cloudinary upload finished (or if an error or validation failure occurred midway), the local file in `uploads/` was never unlinked, causing persistent disk space leakage.
- **Remediation Implemented:**
  1. Built [backend/src/utils/fileUtils.js](file:///e:/Darkrider/coding/sem_6/my_project/backend/src/utils/fileUtils.js) providing `cleanupFile()`, `cleanupFiles()`, and `sweepTempDirectory()`.
  2. Wrapped Cloudinary uploads in [backend/src/config/cloudinary.js](file:///e:/Darkrider/coding/sem_6/my_project/backend/src/config/cloudinary.js) with a guaranteed `finally` block to delete local temp files immediately upon upload completion or failure.
  3. Added auto-cleanup in [backend/src/middlewares/validation.js](file:///e:/Darkrider/coding/sem_6/my_project/backend/src/middlewares/validation.js) (`validate` and `validateFile`) to unlink uploaded files if request validation fails.
  4. Added emergency cleanup in [backend/src/middlewares/errorHandler.js](file:///e:/Darkrider/coding/sem_6/my_project/backend/src/middlewares/errorHandler.js) to destroy any `req.file` or `req.files` if an unhandled exception aborts request processing.
  5. Wired automatic startup sweep in [backend/src/server.js](file:///e:/Darkrider/coding/sem_6/my_project/backend/src/server.js) to reclaim leaked disk space on boot. All 24 historical orphaned files were swept and reclaimed.
- **Suggested Verification:** Upload product image; assert `uploads/` directory remains completely clean.

---

### Issue 6: Unwired Error Handlers in Global Error Middleware [RESOLVED]
- **Severity:** Medium
- **Priority:** P2
- **Status:** **Resolved (Phase 6)**
- **Evidence:** [backend/src/middlewares/errorHandler.js](file:///e:/Darkrider/coding/sem_6/my_project/backend/src/middlewares/errorHandler.js)
- **Relevant Files:**
  - [backend/src/middlewares/errorHandler.js](file:///e:/Darkrider/coding/sem_6/my_project/backend/src/middlewares/errorHandler.js)
- **Original Root Cause:** Helper functions `handleCastError`, `handleValidationError`, `handleDuplicateFields`, `handleJWTError`, and `handleJWTExpiredError` were defined at the bottom of the module but never invoked inside `errorHandler(err, req, res, next)`. In production mode (`NODE_ENV === 'production'`), native Mongoose and JWT errors had `isOperational === undefined`, causing the middleware to fall through to generic 500 "Something went wrong" responses. In addition, `handleDuplicateFields` relied on deprecated `err.errmsg` regex parsing which threw TypeError exceptions when `err.keyValue` was provided by modern MongoDB drivers.
- **Resolution Applied:**
  1. Wired operational error interception directly into `errorHandler(err, req, res, next)` for `CastError`, `code: 11000` (duplicate key), `ValidationError`, `JsonWebTokenError`, and `TokenExpiredError`.
  2. Upgraded `handleDuplicateFields` to safely inspect `err.keyValue`, `err.errmsg`, and `err.message` without null-dereference crashes.
  3. Mapped schema validation errors to structured `{ success: false, message, code: 'VALIDATION_ERROR', errors: { field: message } }` with HTTP 400 Bad Request.
  4. Mapped invalid ObjectIds (`CastError`) to clean operational `{ success: false, message: 'Invalid <field>: <value>', code: 'INVALID_ID' }` with HTTP 400 Bad Request.
  5. Mapped `TokenExpiredError` to `{ success: false, message: 'Your token has expired. Please log in again', code: 'TOKEN_EXPIRED' }` with HTTP 401 Unauthorized, maintaining contract alignment with frontend Axios silent refresh.
- **Verification:** Unit tests and live server probe (`GET /api/products/invalid_mongo_id_123`) confirmed operational 400 Bad Request with `code: 'INVALID_ID'`.

---

### Issue 7: Inconsistent and Orphaned `utils/jwt.js` Module [RESOLVED]
- **Severity:** Low
- **Priority:** P3
- **Status:** **Resolved (Phase 6)**
- **Evidence:** [backend/src/utils/jwt.js](file:///e:/Darkrider/coding/sem_6/my_project/backend/src/utils/jwt.js) vs [backend/src/controllers/authController.js](file:///e:/Darkrider/coding/sem_6/my_project/backend/src/controllers/authController.js) and [backend/src/middlewares/auth.js](file:///e:/Darkrider/coding/sem_6/my_project/backend/src/middlewares/auth.js)
- **Relevant Files:**
  - [backend/src/utils/jwt.js](file:///e:/Darkrider/coding/sem_6/my_project/backend/src/utils/jwt.js)
  - [backend/src/controllers/authController.js](file:///e:/Darkrider/coding/sem_6/my_project/backend/src/controllers/authController.js)
  - [backend/src/middlewares/auth.js](file:///e:/Darkrider/coding/sem_6/my_project/backend/src/middlewares/auth.js)
- **Original Root Cause:** `utils/jwt.js` signed tokens with `{ userId, role }` and fallback dev secrets, while `authController.js` bypassed `utils/jwt.js` to sign `{ id, tokenVersion, type }` inline, and `auth.js` inspected `decoded.id` and `decoded.tokenVersion`. If any route imported `utils/jwt.js`, authentication failed due to claim schema mismatch (`userId` vs `id`).
- **Resolution Applied:**
  1. Refactored `backend/src/utils/jwt.js` into the single source of truth for token lifecycle management.
  2. Implemented `signAccessToken(id, tokenVersion, extraClaims)`: standardizes access token payload `{ id, tokenVersion, type: 'access' }` with configurable expiry (`15m`).
  3. Implemented `signRefreshToken(id, tokenVersion)`: standardizes refresh token payload `{ id, tokenVersion, type: 'refresh' }` with configurable expiry (`7d`).
  4. Implemented `verifyAccessToken(token)` and `verifyRefreshToken(token)` with robust environment secret fallback and production configuration logging.
  5. Refactored `backend/src/controllers/authController.js` and `backend/src/middlewares/auth.js` to import and consume `signAccessToken`, `signRefreshToken`, `verifyAccessToken`, and `verifyRefreshToken`.
- **Verification:** Verified token creation and verification flow; confirmed `decoded.id`, `decoded.tokenVersion`, and `decoded.type` match across all modules. Tested expired token probe on live server `/api/auth/me` returning HTTP 401 with `code: 'TOKEN_EXPIRED'`.

---

### Issue 8: Completely Absent Automated Test Suite [RESOLVED]
- **Severity:** Medium
- **Priority:** P2
- **Status:** **Resolved (Phase 7)**
- **Evidence:** [backend/package.json](file:///e:/Darkrider/coding/sem_6/my_project/backend/package.json), [backend/jest.config.js](file:///e:/Darkrider/coding/sem_6/my_project/backend/jest.config.js), [backend/tests/](file:///e:/Darkrider/coding/sem_6/my_project/backend/tests)
- **Relevant Files:**
  - [backend/jest.config.js](file:///e:/Darkrider/coding/sem_6/my_project/backend/jest.config.js)
  - [backend/tests/unit/jwt.test.js](file:///e:/Darkrider/coding/sem_6/my_project/backend/tests/unit/jwt.test.js)
  - [backend/tests/unit/validators.test.js](file:///e:/Darkrider/coding/sem_6/my_project/backend/tests/unit/validators.test.js)
  - [backend/tests/unit/errorHandler.test.js](file:///e:/Darkrider/coding/sem_6/my_project/backend/tests/unit/errorHandler.test.js)
  - [backend/tests/unit/fileUtils.test.js](file:///e:/Darkrider/coding/sem_6/my_project/backend/tests/unit/fileUtils.test.js)
  - [backend/tests/integration/health.test.js](file:///e:/Darkrider/coding/sem_6/my_project/backend/tests/integration/health.test.js)
  - [backend/tests/integration/authGuards.test.js](file:///e:/Darkrider/coding/sem_6/my_project/backend/tests/integration/authGuards.test.js)
  - [backend/tests/integration/productsApi.test.js](file:///e:/Darkrider/coding/sem_6/my_project/backend/tests/integration/productsApi.test.js)
  - [backend/tests/integration/adminLogs.test.js](file:///e:/Darkrider/coding/sem_6/my_project/backend/tests/integration/adminLogs.test.js)
- **Original Root Cause:** Zero automated unit or integration tests existed in the repository, presenting severe regression risk during any architectural modification or refactoring.
- **Resolution Applied:**
  1. Configured [backend/jest.config.js](file:///e:/Darkrider/coding/sem_6/my_project/backend/jest.config.js) with isolated Node environment, clean mock teardown, and force-exit safety.
  2. Implemented 4 comprehensive unit test suites covering JWT lifecycle and token claim tampering, validation rules (email, phone, password, PIN, XSS sanitization), operational error middleware mapping (CastError, DuplicateKey, ValidationError, JWT expiration), and Multer temporary file cleanup/directory sweeps.
  3. Implemented 4 Supertest integration test suites verifying `/health` telemetry, 404 handlers, unauthenticated route protection (401), invalid/expired token handling, product catalog pagination, and administrative authorization barriers.
  4. Optimized query mocks to achieve sub-6-second execution across all 8 test suites.
- **Verification:** Executed `npm test` in backend: **8 test suites passed, 63 tests passed, 0 failures** in 5.8s.

---

### Issue 9: Placeholder & Stubbed Administrative Operations [RESOLVED]
- **Severity:** Low
- **Priority:** P3
- **Status:** **Resolved (Phase 7)**
- **Evidence:** [backend/src/controllers/adminController.js](file:///e:/Darkrider/coding/sem_6/my_project/backend/src/controllers/adminController.js), [backend/src/models/AdminLog.js](file:///e:/Darkrider/coding/sem_6/my_project/backend/src/models/AdminLog.js)
- **Relevant Files:**
  - [backend/src/controllers/adminController.js](file:///e:/Darkrider/coding/sem_6/my_project/backend/src/controllers/adminController.js)
  - [backend/src/controllers/productController.js](file:///e:/Darkrider/coding/sem_6/my_project/backend/src/controllers/productController.js)
  - [backend/src/controllers/orderController.js](file:///e:/Darkrider/coding/sem_6/my_project/backend/src/controllers/orderController.js)
  - [backend/src/controllers/userController.js](file:///e:/Darkrider/coding/sem_6/my_project/backend/src/controllers/userController.js)
  - [backend/src/models/AdminLog.js](file:///e:/Darkrider/coding/sem_6/my_project/backend/src/models/AdminLog.js)
- **Original Root Cause:** `getAdminLogs`, `clearCache`, `sendSystemNotification`, and `backupDatabase` in `adminController.js` returned dummy static JSON strings. The existing Mongoose `AdminLog` model was completely orphaned and never written to during administrative operations.
- **Resolution Applied:**
  1. Connected `getAdminLogs` to the MongoDB `AdminLog` collection with pagination (`page`, `limit`), sorting by `performedAt: -1`, admin user population (`name email role avatar`), and multi-attribute filters (`action`, `entity`, `status`).
  2. Wired `AdminLog.logAction` into administrative operations:
     - Product CRUD (`createProduct`, `updateProduct`, `deleteProduct` in `productController.js`).
     - Order status transitions (`updateOrderStatus` in `orderController.js`).
     - User management (`updateUser`, `deleteUser` in `userController.js`).
     - System utilities (`clearCache`, `sendSystemNotification`, `backupDatabase` in `adminController.js`).
- **Verification:** Verified syntax and executed automated integration tests in [backend/tests/integration/adminLogs.test.js](file:///e:/Darkrider/coding/sem_6/my_project/backend/tests/integration/adminLogs.test.js).

---

### Issue 10: Absence of Role Separation (Admin Accounts Placing Customer Orders) — [RESOLVED]
- **Severity:** High
- **Priority:** P0 (Resolved)
- **Evidence:** `backend/src/routes/cartRoutes.js`, `backend/src/routes/orderRoutes.js`, `frontend/src/pages/ProductDetail.jsx`, `frontend/src/components/product/ProductCard.jsx`
- **Relevant Files:**
  - `backend/src/middlewares/auth.js` (`authorize`)
  - `backend/src/routes/cartRoutes.js`
  - `backend/src/routes/orderRoutes.js`
  - `frontend/src/components/common/CustomerRoute.jsx`
  - `frontend/src/router.jsx`
  - `frontend/src/pages/ProductDetail.jsx`
  - `frontend/src/components/product/ProductCard.jsx`
  - `frontend/src/pages/Cart.jsx`
  - `frontend/src/pages/Checkout.jsx`
- **Initial Behavior:** Admin accounts could add products to cart, proceed to checkout, place orders, and pay, causing serious Segregation of Duties (SoD) conflicts, financial manipulation risks (admins altering prices or stock and purchasing them), and pollution of customer churn training datasets.
- **Remediation Implemented:**
  1. **Backend Route Guards:** Mounted `authorize('user')` on all cart endpoints and customer order endpoints (`POST /`, `POST /from-cart`, `POST /:id/confirm-payment`, `POST /:id/razorpay/create`, `POST /:id/razorpay/verify`, `PUT /:id/cancel`, `GET /my-orders`).
  2. **Clear Error Contract:** Updated `authorize` middleware to reject administrative accounts with HTTP 403 Forbidden and `{ code: 'ADMIN_SHOPPING_RESTRICTED', message: 'Administrative accounts cannot perform customer shopping actions. Please use a regular customer account.' }`.
  3. **Frontend Route Guards:** Built `<CustomerRoute>` wrapper redirecting admin users trying to access `/cart`, `/checkout`, or `/orders` directly to `/admin` with an explanatory toast notification.
  4. **Product UI Separation:** Product cards render an "Admin View" badge and disable Quick Add for admins; Product Details page replaces "Add to Cart" and "Buy Now" with an "Admin View Mode" banner linking to administrative inventory management.
  5. **State Sanitation:** `cartStore.js` catches `ADMIN_SHOPPING_RESTRICTED` to immediately clear cart state and prevents cart queries by admins.

---

### Issue 11: Unauthenticated Cart Badge Bleed & Missing Logout Cart Sanitation — [RESOLVED]
- **Severity:** Medium
- **Priority:** P1 (Resolved)
- **Evidence:** `frontend/src/components/common/Header.jsx:18`, `frontend/src/store/cartStore.js:82`, `frontend/src/store/authStore.js:30`
- **Relevant Files:**
  - `frontend/src/store/cartStore.js` (`resetCartLocal`)
  - `frontend/src/store/authStore.js` (`logout`, `clearAuth`)
  - `frontend/src/components/common/Header.jsx` (`itemCount`)
  - `frontend/src/router.jsx` (`/cart` `requireAuth`)
  - `frontend/src/components/product/ProductCard.jsx`
  - `frontend/src/pages/ProductDetail.jsx`
- **Initial Behavior:** When a logged-in customer added items to the cart and subsequently logged out, Zustand's `persist` middleware kept the serialized cart items in browser `localStorage['cart-storage']`. Because `Header.jsx` calculated `itemCount` unconditionally from `items`, an unauthenticated visitor saw a red badge (e.g. "2") on the cart icon on the `/login` and landing pages, despite having no active session. Clicking the cart caused an unexpected 401 redirect back to login.
- **Remediation Implemented:**
  1. **Conditional Badge Computation:** `Header.jsx` guards `itemCount` with `isAuthenticated && !isAdmin`, ensuring unauthenticated visitors always see `0` and no badge.
  2. **Storage Eviction on Logout & Expiry:** `authStore.js` wipes `localStorage['cart-storage']` and calls `cartStore.resetCartLocal()` on both explicit `logout()` and automatic session expiry (`clearAuth()`).
  3. **Auto-Sanitization on App Mount:** `Header.jsx` checks if `!isAuthenticated && items?.length > 0` and flushes any stale serialized state.
  4. **Smooth Guest UX:** `ProductCard.jsx` and `ProductDetail.jsx` prompt unauthenticated visitors to sign in before adding items, avoiding unhandled 401 exceptions.

---

### Issue 12: Order View Authorization Type Mismatch (String vs ObjectId) — [RESOLVED]
- **Severity:** High
- **Priority:** P0 (Resolved)
- **Evidence:** `backend/src/controllers/orderController.js:305`, `backend/src/middlewares/auth.js:54`
- **Relevant Files:**
  - `backend/src/controllers/orderController.js` (`getOrder`)
  - `backend/src/middlewares/auth.js` (`authenticate`, `optionalAuth`)
  - `backend/src/controllers/userController.js` (`updateUser`, `deleteUser`)
  - `frontend/src/pages/OrderDetail.jsx`
- **Initial Behavior:** When a normal customer placed an order (COD or Razorpay) and was redirected to the Order Details page (`/orders/:id`), the backend rejected `GET /api/orders/:id` with HTTP 403 Forbidden: *"Not authorized to view this order"*.
- **Root Cause Analysis:** In `auth.js`, `req.userId` was assigned as `user._id` (a Mongoose `ObjectId` object). In `orderController.js:305`, authorization was checked using strict raw JavaScript comparison:
  `if (req.user.role !== 'admin' && order.user._id.toString() !== req.userId)`
  Because `order.user._id.toString()` produces a primitive `string` while `req.userId` was an `ObjectId` instance, `'string' !== ObjectId` was ALWAYS `true` in JavaScript. As a result, every non-admin customer was falsely blocked from viewing their own freshly placed orders.
- **Remediation Implemented:**
  1. In `auth.js`, normalized `req.userId` to string via `user._id.toString()` in both `authenticate` and `optionalAuth`.
  2. In `orderController.js`, robustly normalized both IDs:
     ```javascript
     const orderOwnerId = (order.user?._id || order.user)?.toString();
     const currentUserId = (req.userId?._id || req.userId)?.toString();
     if (req.user?.role !== 'admin' && req.userRole !== 'admin' && orderOwnerId !== currentUserId) {
       return next(new AppError('Not authorized to view this order', 403));
     }
     ```
  3. Fixed identical type mismatch in `userController.js` self-demotion and self-deletion prevention checks.



---

### Issue 13: Unthrottled AI Visual Search Quota Exhaustion (DoS Risk) — [RESOLVED]
- **Severity:** High
- **Priority:** P0 (Resolved - November 2026 Audit)
- **Evidence:** `backend/src/routes/productRoutes.js:65`
- **Relevant Files:**
  - `backend/src/routes/productRoutes.js`
  - `backend/src/middlewares/errorHandler.js`
- **Initial Behavior:** Route `POST /api/products/visual-search` lacked dedicated rate limiting. A burst of unauthenticated requests could rapidly exhaust upstream Google Gemini Vision API free-tier quotas (15 RPM / 1,500 RPD). Multer size limit errors also threw generic 500 errors in production.
- **Remediation Implemented:**
  1. Attached dedicated `visualSearchLimiter` (25 req / 15 min per IP) directly to `POST /api/products/visual-search`.
  2. Enhanced centralized `errorHandler.js` to map `MulterError` (`LIMIT_FILE_SIZE`) and disallowed image file types to operational HTTP 400 Bad Request responses with code `FILE_UPLOAD_ERROR` and `INVALID_FILE_TYPE`.
- **Verification:** Unit and integration test suites pass; verified via `errorHandler.test.js`.

---

### Issue 14: Statutory GST Rate Violation & Post-Tax Discount Computation — [RESOLVED]
- **Severity:** High
- **Priority:** P1 (Resolved - November 2026 Audit)
- **Evidence:** `backend/src/controllers/orderController.js:66-69, 169-172`
- **Relevant Files:**
  - `backend/src/controllers/orderController.js`
  - `backend/src/services/invoiceService.js`
- **Initial Behavior:** Applied a flat 18% GST across all items regardless of category. Books (HSN 4901 / category: 'books') were illegally taxed at 18% instead of the statutory 0% NIL rate. Trade discounts were deducted after tax rather than from the taxable supply base, violating Section 15(3) of the CGST Act, 2017.
- **Remediation Implemented:**
  1. Created `calculateOrderTax(items, subtotal, discount)` helper in `orderController.js` to allocate discounts proportionately to the taxable base before tax computation.
  2. Exempted printed books (HSN 4901) with statutory 0% GST rate.
  3. Aligned `invoiceService.js` PDF generation to display pre-tax discounts, 0% book exemption, and correct Intrastate vs Interstate bifurcation.
- **Verification:** Tested in `invoiceService.test.js`; single-item and mixed-cart tax calculations verified against Section 15(3) rules.

---

### Issue 15: PDF Invoice Table Overlap on Multi-Item Orders (>6 Items) — [RESOLVED]
- **Severity:** Medium
- **Priority:** P1 (Resolved - November 2026 Audit)
- **Evidence:** `backend/src/services/invoiceService.js:217-313`
- **Relevant Files:**
  - `backend/src/services/invoiceService.js`
- **Initial Behavior:** The PDF table incremented Y coordinates linearly without pagination checks, causing table rows to collide with the digital signatory box and legal terms at hardcoded `footerY = 690` for orders containing > 6 items.
- **Remediation Implemented:**
  1. Extracted modular `renderTableHeader(y)` to repeat column headers on subsequent pages.
  2. Implemented dynamic page-break detection (`if (currentY + rowHeight > 640) { doc.addPage(); ... }`).
  3. Implemented space budgeting for summary totals and anchored the signatory footer dynamically.
- **Verification:** Tested via 15-item order simulation; generated valid multi-page PDF buffer without overlap.

---

### Issue 16: Live Delivery Map Moving on Cancelled / Pending Orders — [RESOLVED]
- **Severity:** Medium
- **Priority:** P1 (Resolved - November 2026 Audit)
- **Evidence:** `frontend/src/pages/OrderDetail.jsx:250`
- **Relevant Files:**
  - `frontend/src/pages/OrderDetail.jsx`
- **Initial Behavior:** The `<LiveDeliveryMap order={order} />` component was mounted unconditionally. Cancelled and pending orders showed an active delivery van moving toward the destination with an active ETA countdown.
- **Remediation Implemented:**
  1. Guarded live map rendering: `{['processing', 'shipped', 'delivered'].includes(order.status) && <LiveDeliveryMap order={order} />}`.
  2. Added informative cancellation banner for cancelled orders and awaiting-processing banner for pending orders.
- **Verification:** Verified via Vite production build and manual component state inspection.

---

### Issue 17: Silent Geographic Fallback for Non-Metro Cities — [RESOLVED]
- **Severity:** Low
- **Priority:** P2 (Resolved - November 2026 Audit)
- **Evidence:** `frontend/src/components/delivery/LiveDeliveryMap.jsx:110`
- **Relevant Files:**
  - `frontend/src/components/delivery/LiveDeliveryMap.jsx`
- **Initial Behavior:** When customer shipping address city was not in the 17-city metro coordinate dictionary, the map silently fell back to Bengaluru coordinates without user disclosure.
- **Remediation Implemented:**
  1. Added `isCityMapped` boolean memo to check city dictionary presence.
  2. Rendered prominent disclosure badge in the map card header: `Demo Route (Bengaluru Regional Hub)` when city is unmapped.
- **Verification:** Verified via Vite production build.