# Feature Roadmap & Learning Implementation Plan

## 1. Roadmap Overview & Philosophy

The evolution of E-Shop is structured into three progressive, learning-oriented tracks designed to transform the application from an academic capstone into a production-grade, enterprise-ready software platform:

```
[ Track A: Foundational Resilience & Security ]
                 |
                 v
[ Track B: Industry-Grade E-Commerce Features ]
                 |
                 v
[ Track C: Advanced Engineering & Distributed Systems ]
```

- **Track A (Foundational):** Remediates confirmed vulnerabilities, concurrency hazards, memory leaks, and establishes automated regression testing.
- **Track B (Industry-Relevant):** Implements real-world e-commerce capabilities (real customer reviews, coupon engine, invoice generation, multi-address management) that showcase practical full-stack software craftsmanship.
- **Track C (Advanced Engineering):** Explores distributed systems concepts (Redis caching, background job queues with BullMQ, WebSocket real-time notifications, OpenTelemetry observability, automated ML model re-training).

---

## 2. Track A: Essential Improvements (Foundational Resilience)

### Feature A.1: Cryptographic Payment Verification Enforcement
- **Classification:** **Must-Have** (Security Blocker)
- **Complexity:** Easy
- **What it does:** Eliminates the unverified `/confirm-payment` endpoint and routes all Razorpay transactions through server-side order generation and HMAC-SHA256 signature verification.
- **Problem it solves:** Fixes Critical Vulnerability SEC-01 where any user can claim an order was paid by submitting a fake payment ID string.
- **Architecture Fit:** Re-aligns frontend `Checkout.jsx` with the existing `verifyRazorpayPayment` method in `paymentService.js`.
- **Changes Required:**
  - *Backend:* Remove `POST /:id/confirm-payment` in `orderRoutes.js`. Ensure `POST /:id/razorpay/verify` updates order state and payment record.
  - *Frontend:* In `Checkout.jsx`, call `orderService.createRazorpayOrder(order._id)` first, pass `razorpayOrderId` to Razorpay checkout options, and on modal success post `{ razorpay_payment_id, razorpay_order_id, razorpay_signature }` to `orderService.verifyRazorpayPayment()`.
- **Concepts Learned:** HMAC-SHA256 signature verification, idempotent payment callbacks, webhook security.
- **Acceptance Criteria:** Fake payment IDs rejected with 400; genuine payments verified and order state set to `'completed'`.

---

### Feature A.2: Atomic Inventory Management with Transactions
- **Classification:** **Must-Have** (Data Integrity Blocker)
- **Complexity:** Medium
- **What it does:** Replaces sequential JavaScript stock decrements with atomic MongoDB conditional operations wrapped in a multi-document session transaction.
- **Problem it solves:** Fixes race conditions causing negative stock under concurrent checkouts, and prevents partial inventory deduction when order creation fails.
- **Architecture Fit:** Refactors order creation logic inside `backend/src/controllers/orderController.js`.
- **Changes Required:**
  - *Backend:* Implement Mongoose sessions:
    ```javascript
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      for (const item of items) {
        const product = await Product.findOneAndUpdate(
          { _id: item.product, stock: { $gte: item.quantity }, isActive: true },
          { $inc: { stock: -item.quantity } },
          { session, new: true }
        );
        if (!product) throw new AppError(`Insufficient stock for item`, 400);
      }
      const order = await Order.create([orderData], { session });
      await Cart.findOneAndUpdate({ user: req.userId }, { items: [] }, { session });
      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
    ```
- **Concepts Learned:** ACID transactions in NoSQL, optimistic locking, atomic operators, race condition mitigation.
- **Acceptance Criteria:** Concurrent purchases against low stock never result in negative inventory; failed order creation restores stock completely.

---

### Feature A.3: Vectorized Batch ML Inference Engine
- **Classification:** **Must-Have** (Performance Blocker)
- **Complexity:** Medium
- **What it does:** Refactors `predict.py` to accept an array of customers via standard input, processes them in a single batch pandas DataFrame, and returns an array of predictions in one invocation.
- **Problem it solves:** Prevents 50 concurrent Python processes from launching simultaneously, eliminating server memory spikes and OOM crashes.
- **Architecture Fit:** Updates `adminController.js` and `backend/ml-models/predict.py`.
- **Changes Required:**
  - *Python:* Modify `predict.py` main handler to deserialize `[ { customer1 }, { customer2 } ]`, construct single DataFrame `pd.DataFrame(rows)`, run `model.predict_proba(X)` once.
  - *Backend:* In `adminController.js`, aggregate features for all 50 users into an array, call `runPrediction(batchUsers)` once, and map predictions back to user documents.
- **Concepts Learned:** Vectorized batch inference, process lifecycle management, IPC throughput optimization.
- **Acceptance Criteria:** Inference for 50 users completes in a single Python process in under 2 seconds; zero memory leaks.

---

### Feature A.4: Automated Test Harness (Unit & Integration)
- **Classification:** **Must-Have** (Quality Blocker)
- **Complexity:** Medium
- **What it does:** Introduces a comprehensive Jest + Supertest suite in the backend covering Auth, Products, Cart math, and Order placement, plus Vitest in the frontend.
- **Problem it solves:** Protects the project against silent regressions during refactoring.
- **Changes Required:**
  - Configure `jest.config.js` and in-memory MongoDB (`mongodb-memory-server`) for fast, isolated tests.
  - Write test suites: `auth.test.js`, `cart.test.js`, `order.test.js`, `product.test.js`.
- **Concepts Learned:** TDD, test doubles, in-memory database isolation, CI test execution.
- **Acceptance Criteria:** `npm test` runs in CI/CD and passes with >80% coverage on core controllers.

---

## 3. Track B: Industry-Relevant Features (Practical Engineering)

### Feature B.1: Authentic Product Reviews & Verified Buyer Ratings
- **Classification:** **Useful Enhancement**
- **Complexity:** Medium
- **What it does:** Allows authenticated users who have purchased a product (verified buyers) to submit 1–5 star reviews with text feedback, photos, and helpful votes.
- **Problem it solves:** Replaces the static mock reviews in `ProductDetail.jsx` with real user-generated content and live rating calculations.
- **Architecture Fit:**
  - *Database:* New `Review` collection (`user`, `product`, `order`, `rating`, `comment`, `images`, `verifiedPurchase`, `helpfulCount`). Update `Product` model with `ratings: { average: Number, count: Number }`.
  - *Backend:* Create `reviewController.js` and `reviewRoutes.js`. Add Mongoose post-save/delete hooks to recalculate product average rating automatically.
  - *Frontend:* Connect `ProductDetail.jsx` to live review query, add review submission form with star rating selector and verified buyer badge.
- **Concepts Learned:** Data denormalization, rating aggregation hooks, anti-spam verified buyer checks.
- **Acceptance Criteria:** Only users with `delivered` order status for the product can submit reviews; product average rating updates instantly.

---

### Feature B.2: Promotional Coupon & Discount Engine
- **Classification:** **Useful Enhancement**
- **Complexity:** Medium
- **What it does:** Allows administrators to define discount promo codes (percentage off, fixed amount, minimum spend, expiry date, usage limit) and customers to apply them at checkout.
- **Problem it solves:** Makes the currently unused `coupon` subdocument in `Cart.js` fully functional.
- **Architecture Fit:**
  - *Database:* New `Coupon` model (`code`, `discountType`, `discountValue`, `minOrderAmount`, `maxDiscount`, `startDate`, `endDate`, `usageLimit`, `usedCount`, `isActive`).
  - *Backend:* Add `/api/cart/coupon/apply` and `/api/cart/coupon/remove` endpoints. Validate expiry, minimum purchase, and calculate discounts in cart totals.
  - *Frontend:* Add coupon input box and dynamic discount display in `CartSummary.jsx` and `OrderSummary.jsx`.
- **Concepts Learned:** Promotion rule evaluation, defensive business logic, idempotency.
- **Acceptance Criteria:** Invalid or expired coupons rejected; valid coupons reduce order total correctly.

---

### Feature B.3: Automated PDF Invoice Generation & Email Dispatch
- **Classification:** **Useful Enhancement**
- **Complexity:** Easy
- **What it does:** Generates a professional branded PDF invoice upon order placement or delivery, and emails it as an attachment to the customer.
- **Problem it solves:** Provides legitimate customer receipts and transactional closure.
- **Architecture Fit:**
  - *Backend:* Add `pdfkit` dependency; create `invoiceService.js` to render order details, tax breakdown, and shipping addresses into a PDF buffer. Attach to `emailService.sendEmail('orderConfirmation')`.
  - *Frontend:* Add "Download Invoice" button in `OrderDetail.jsx`.
- **Concepts Learned:** Dynamic PDF rendering, binary streaming, email MIME attachments.
- **Acceptance Criteria:** PDF invoice generated accurately with GST calculation and downloadable from user order history.

---

## 4. Track C: Advanced Engineering & Distributed Systems

### Feature C.1: Redis High-Performance Caching Layer
- **Classification:** **Optional Experiment / Advanced Engineering**
- **Complexity:** Hard
- **What it does:** Integrates Redis to cache high-read endpoints (Product Catalog, Categories, Featured Products) with smart cache invalidation on product mutations.
- **Problem it solves:** Drastically reduces MongoDB database load and drops catalog response times from ~150ms to <15ms.
- **Architecture Fit:** Add Redis client middleware (`redisMiddleware.js`). When `GET /api/products` is hit, check Redis cache first; if cache miss, query MongoDB and store in Redis with TTL. Invalidate product cache in `productController.js` on create/update/delete.
- **Concepts Learned:** Cache-aside pattern, TTL management, cache invalidation strategies, Redis data types.
- **Acceptance Criteria:** Repeated product catalog queries served from Redis; updating a product immediately purges stale cache.

---

### Feature C.2: Asynchronous Job Queues with BullMQ & Redis
- **Classification:** **Advanced Engineering**
- **Complexity:** Hard
- **What it does:** Decouples email sending, PDF invoice creation, and ML churn feature extraction into asynchronous background worker jobs.
- **Problem it solves:** Prevents HTTP requests from blocking while waiting for external SMTP servers or PDF rendering; provides automatic retries with exponential backoff on transient network failures.
- **Architecture Fit:** Add `bullmq` and Redis. Replace inline `await sendEmail(...)` with `await emailQueue.add('sendEmail', data)`. Worker processes jobs in background threads.
- **Concepts Learned:** Message queues, producer-consumer pattern, dead-letter queues, idempotent workers, horizontal worker scaling.
- **Acceptance Criteria:** API responses return in <100ms; failed emails retry 3 times automatically.

---

### Feature C.3: Real-Time Order & Churn Updates via WebSockets (Socket.IO)
- **Classification:** **Advanced Engineering**
- **Complexity:** Medium
- **What it does:** Establishes full-duplex WebSocket connections between server and client for instant order status notifications (e.g. "Your order has shipped!") and real-time admin dashboard metrics.
- **Architecture Fit:** Attach `socket.io` to Express server in `server.js`. Authenticate socket handshakes using JWT cookies. Emit events when order status changes in `orderController.updateOrderStatus`.
- **Concepts Learned:** WebSockets, pub/sub communication, state synchronization across clients, connection resilience.
- **Acceptance Criteria:** Admin dashboard order counter increments in real-time without browser page refresh.

---

### Feature C.4: Automated ML Model Monitoring & Drift Detection
- **Classification:** **Advanced Engineering**
- **Complexity:** Hard
- **What it does:** Tracks model prediction distribution over time, alerts admins when customer feature drift occurs (e.g., changes in shopping behavior patterns), and provides a trigger to retrain XGBoost on recent historical data.
- **Concepts Learned:** MLOps, concept drift, feature distribution monitoring, automated retraining pipelines.
