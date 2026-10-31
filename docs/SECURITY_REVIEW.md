# Security & Threat Review: E-Shop Platform

## 1. Threat Matrix & Vulnerability Summary

| Ref | Vulnerability / Threat Area | Severity | Priority | Status | Impact |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **SEC-01** | Payment Verification Bypass via `/confirm-payment` | **CRITICAL** | **P0** | Confirmed | Free unauthorized order fulfillment |
| **SEC-02** | Plaintext Secrets in Repository (`rzp-key.csv`) | **HIGH** | **P0** | Confirmed | Financial & infrastructure compromise |
| **SEC-03** | Local File Storage Leak in Multer Uploads | **MEDIUM** | **P1** | Confirmed | Disk exhaustion / Denial of Service (DoS) |
| **SEC-04** | Subprocess Concurrency DoS in Churn Inference | **HIGH** | **P1** | Confirmed | Node server memory crash (OOM) |
| **SEC-05** | IDOR Risk in User Order Lookup Fallback | **LOW** | **P2** | Potential | Cross-tenant data leakage if query fails |
| **SEC-06** | Incomplete Error Masking (Mongoose Uncaught 500s) | **LOW** | **P3** | Confirmed | Schema detail leakage in dev mode |
| **SEC-07** | AI Visual Search Quota Exhaustion & DoS (CWE-770) | **HIGH** | **P0** | **RESOLVED** | Dedicated 25 req/15min rate limiting attached |
| **SEC-08** | Invoice PDF Download Cross-Tenant IDOR (CWE-284) | **HIGH** | **P0** | **VERIFIED PASS** | Strict ownership + admin role authorization check |

---

## 2. In-Depth Vulnerability Analysis

### 2.1 SEC-01: Payment Verification Bypass (CRITICAL — P0)
- **Vulnerability Type:** Business Logic Flaw / Insecure Direct State Mutation (CWE-284)
- **Location:** `backend/src/routes/orderRoutes.js:32-50` and `frontend/src/pages/Checkout.jsx:136-140`
- **Current Behavior:**
  ```javascript
  // In orderRoutes.js:
  router.post('/:id/confirm-payment', authenticate, catchAsync(async (req, res, next) => {
    const { razorpay_payment_id } = req.body;
    const order = await Order.findOne({ _id: req.params.id, user: req.userId });
    if (!order) return next(new Error('Order not found'));

    order.payment.status = 'completed';
    order.payment.transactionId = razorpay_payment_id;
    order.payment.paidAt = new Date();
    await order.save();
    res.status(200).json({ success: true, message: 'Payment confirmed successfully', order });
  }));
  ```
- **Exploitation:**
  An attacker can create an order of any monetary amount (e.g., ₹100,000), bypass the Razorpay modal, and send an HTTP POST request to `/api/orders/<orderId>/confirm-payment` with a dummy `{ "razorpay_payment_id": "pay_fake123" }`. The server marks the order as `'completed'` without contacting Razorpay API or verifying HMAC-SHA256 signatures.
- **Impact:** Complete financial loss. Orders will be marked as paid and sent to fulfillment without any money captured.
- **Remediation:**
  1. Deprecate and remove the `/:id/confirm-payment` route.
  2. Enforce the two-step Razorpay cryptographic verification already present in `paymentService.verifyRazorpayPayment`:
     - Step A: Frontend requests server to create Razorpay Order (`POST /api/orders/:id/razorpay/create`).
     - Step B: Razorpay popup returns `razorpay_payment_id`, `razorpay_order_id`, and `razorpay_signature`.
     - Step C: Frontend calls `POST /api/orders/:id/razorpay/verify`.
     - Step D: Server calculates HMAC-SHA256:
       ```javascript
       const expectedSignature = crypto
         .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
         .update(orderId + '|' + paymentId)
         .digest('hex');
       if (expectedSignature !== signature) throw new AppError('Invalid payment signature', 400);
       ```

---

### 2.2 SEC-02: Exposure of Plaintext Production Secrets (HIGH — P0)
- **Vulnerability Type:** Sensitive Data Exposure / Insecure Credential Storage (CWE-312)
- **Location:**
  - `IMPORTANT_INFORMATION/rzp-key.csv` (contains active Razorpay Key ID and Key Secret in plain CSV)
  - `backend/src/.env` (contains active MongoDB Atlas URI with credentials, Cloudinary secret, Gmail SMTP password)
- **Exploitation:**
  Anyone cloning or reviewing the workspace immediately gains full administrative access to Razorpay payment APIs, MongoDB Atlas database contents, and email dispatch services.
- **Remediation:**
  1. Immediately rotate the exposed Razorpay Key Secret in the Razorpay Dashboard.
  2. Add `IMPORTANT_INFORMATION/` and `*.csv` containing credentials to `.gitignore`.
  3. Ensure `.env` is never committed; provide dummy templates strictly via `.env.example`.

---

### 2.3 SEC-03: Temporary File Leak in Multer File Uploads (MEDIUM — P1)
- **Vulnerability Type:** Uncontrolled Resource Consumption / Storage Leak (CWE-400)
- **Location:** `backend/src/routes/productRoutes.js:23-43`, `backend/src/routes/userRoutes.js:23-45`, `backend/src/config/cloudinary.js:12-33`
- **Current Behavior:**
  Multer is configured with `diskStorage` writing to `uploads/`. When an admin creates a product or user updates an avatar, the file is saved to the filesystem, uploaded to Cloudinary, but never deleted with `fs.unlink()`.
  Furthermore, if downstream validation (`validationSchemas.createProduct`) fails, the temporary file remains abandoned on disk.
- **Impact:** Server disk fills up over time, eventually causing the host OS to fail write operations (DoS).
- **Remediation:**
  Option A (Recommended): Switch Multer to `memoryStorage()`, streaming buffers directly to Cloudinary via `cloudinary.uploader.upload_stream`.
  Option B: Ensure every controller wraps uploads in a `try...finally` block that removes `file.path` using `fs.promises.unlink`.

---

### 2.4 SEC-04: Subprocess Concurrency Denial of Service (HIGH — P1)
- **Vulnerability Type:** Resource Exhaustion / Algorithmic Complexity DoS (CWE-400)
- **Location:** `backend/src/controllers/adminController.js:108-166`
- **Current Behavior:**
  `adminController.js` executes `Promise.all(users.map(async (user) => await runPrediction(...)))` for up to 50 customers concurrently. Each iteration spawns a separate OS process (`child_process.spawn('python3', ...)`), loading pandas, scikit-learn, joblib, and the 1.09 MB XGBoost model.
- **Impact:** Spawning 50 concurrent Python processes creates massive memory spikes (>3GB RAM). In cloud environments like Render or Railway (512MB RAM free tier), this triggers an instant OOM crash, taking the entire backend offline.
- **Remediation:**
  1. Update `predict.py` to accept a batch JSON array of users on stdin and process them in a single Python process with vectorized pandas operations.
  2. Alternatively, migrate the ML inference into a persistent background FastAPI/Flask microservice or pre-calculate churn scores via a scheduled cron task.

---

## 3. Defense-in-Depth Strengths & Positive Patterns

The codebase demonstrates several industry-standard defensive controls:
1. **JWT Revocation Architecture:** The `tokenVersion` pattern on the `User` document ensures that when a user changes their password or clicks "Sign out all devices", all previously issued JWTs are rendered useless on their next API request.
2. **Timing-Safe & Enumeration-Resistant Auth:**
   - Registration endpoint (`/send-otp`) returns a uniform generic message whether an email is registered or not, thwarting user enumeration attacks.
   - Password reset endpoint (`/forgot-password`) always returns a generic success notice.
3. **Crypto-Secure OTP Generation:** OTPs are generated using `crypto.randomInt(100000, 999999)` rather than `Math.random()`. Stored OTPs are hashed using SHA-256 with attempt rate-limiting (max 5 attempts before deletion).
4. **NoSQL Injection & Parameter Defense:** `express-mongo-sanitize` actively strips operators (`$gt`, `$ne`), and `hpp` protects query parameters against array pollution.
5. **Content Security Policy:** Helmet is configured with strict script, frame, and font source allowlists accommodating Razorpay and Cloudinary.
