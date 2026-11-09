# CHAPTER 22: FINAL 24-HOUR INTERVIEW RECALL CHECKLIST

> **Focus:** Rapid-fire 24-hour pre-interview memory refresher, key numerical metrics, and instant architectural recall.

---

## 1. Ten Non-Negotiable Metrics to Memorize

| Metric | Exact Value | Where Implemented | Why It Matters in an Interview |
| :---: | :---: | :--- | :--- |
| **Test Cases** | **115 passing tests** | `backend/tests/` | Demonstrates production quality and test discipline. |
| **Churn Threshold** | **0.35** (not 0.50) | `backend/ml-models/predict.py:125` | Calibrated to optimize Recall and minimize False Negatives. |
| **Token Lifespans** | **15m** Access / **7d** Refresh | `backend/src/controllers/authController.js` | Balances XSS protection with smooth user session refresh. |
| **Rate Limit** | **100 req / 15 mins** | `backend/src/app.js` | Mitigates brute-force authentication attacks and DoS floods. |
| **Body Parser Limit**| **10 kb** | `backend/src/app.js` | Prevents server memory exhaustion from oversized JSON payloads. |
| **ML Batch Limit** | **50 users** | `backend/src/controllers/adminController.js:101` | Limits memory allocation and keeps inference under 300ms. |
| **ML Inference Latency**| **< 300 milliseconds** | `backend/ml-models/predict.py` | Total time for vectorized batch calculation across 50 users. |
| **OTP Expiration** | **300 seconds (5 mins)** | `backend/src/models/Otp.js` | MongoDB TTL index auto-purges expired OTP documents. |
| **GST Tax Rates** | **18% Standard / 0% Books** | `backend/src/controllers/orderController.js` | Statutory compliance: Indian GST Section 15(3) & HSN 4901. |
| **Python Timeout** | **15 seconds** | `backend/src/controllers/adminController.js:16` | Defensive guard before triggering in-memory heuristic fallback. |

---

## 2. Fast Architectural Mental Models

### A. The 3-Sentence System Pitch
> *"E-Shop is a full-stack e-commerce web platform built with React 19, Node.js, Express, and MongoDB, integrated with a Python XGBoost machine learning pipeline for customer churn prediction. It features atomic inventory decrement queries inside Mongoose transactions, statutory Indian GST PDF invoice streaming, and dual-token authentication with instant token revocation via `tokenVersion`. Node.js streams vectorized feature batches into Python via standard I/O pipes, executing batch predictions in under 300 milliseconds within a multi-stage Docker container deployed on Render."*

---

### B. Core Code Snippet Flashcards

#### 1. Atomic Stock Decrement:
```javascript
// orderController.js
Product.findOneAndUpdate(
  { _id: item.product, stock: { $gte: item.quantity } },
  { $inc: { stock: -item.quantity } },
  { new: true, session }
);
```

#### 2. Razorpay HMAC-SHA256 Verification:
```javascript
// paymentService.js
const payload = `${order_id}|${payment_id}`;
const expected = crypto
  .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
  .update(payload)
  .digest('hex');
const isMatch = crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
```

#### 3. Single Aggregation (Avoiding N+1):
```javascript
// adminController.js
Order.aggregate([
  { $match: { user: { $in: userIds } } },
  { $group: {
      _id: '$user',
      totalSpent: { $sum: '$totalPrice' },
      totalOrders: { $sum: 1 },
      lastOrderDate: { $max: '$createdAt' }
  }}
]);
```

#### 4. Python Subprocess Pipe Streaming:
```javascript
// adminController.js
const proc = spawn('python3', [ML_SCRIPT], { timeout: 15000 });
proc.stdin.write(JSON.stringify(inputData));
proc.stdin.end(); // CRITICAL: Signal EOF
proc.stdout.on('data', (d) => { output += d.toString(); });
```

#### 5. Spend Ratio Engineering:
```python
# predict.py
SpendRatio = min(TotalSpend / (MonthlySpend * AccountAgeMonths + 1e-6), 5.0)
```

---

## 3. The 5-Minute Pre-Interview Checklist

- [ ] **Physical Check:** Clean desk, water bottle ready, microphone checked, stable internet connection.
- [ ] **Mindset:** Speak at a calm, deliberate pace. Do not rush. Pausing for 2 seconds to structure your thoughts sounds senior.
- [ ] **First Impression:** Deliver the 1-minute pitch from Chapter 01 with energy and conviction.
- [ ] **Two-Language Rule Active:** You know the concepts through Hinglish intuition, but your spoken answers must be fluent, articulate English.
- [ ] **Defensive Ready:** When challenged on why you didn't use microservices, defend your decision using trade-offs: cost, complexity, and sub-300ms performance.

*You have mastered the architecture, code, algorithms, and infrastructure of this project. Be confident, speak with clarity, and own your engineering decisions!*

