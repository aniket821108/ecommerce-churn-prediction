# CHAPTER 19: PROJECT-BASED PRACTICAL CODING CHALLENGES

> **Focus:** 7 core engineering coding problems extracted directly from the E-Shop codebase architecture.  
> **Skills Evaluated:** Concurrency control, Closures & Promises, Asynchronous streams, Error wrappers, Aggregation pipelines, and Vectorized transformations.

---

## PROBLEM 1: Atomic Inventory Decrement & Checkout Transaction

### Problem Statement
Write a Node.js controller function `processCheckout(userId, orderItems, shippingAddress)` using Mongoose.  
Requirements:
1. Ensure the inventory for every item in `orderItems` is decremented atomically.
2. Prevent race conditions: if any item has insufficient stock, abort the entire transaction immediately without partial stock decrements.
3. Create the `Order` document inside the transaction.
4. Clean up and end the Mongoose session in all circumstances.

### Hinglish Intuition & Edge Cases
> **Approach:** Kabhi bhi memory mein `product.stock -= qty; await product.save()` mat karna! Do users same time par checkout karenge toh negative stock ho jayega.  
> Mongoose session shuru karo (`startTransaction`). Loop mein har product par `findOneAndUpdate({ _id: prodId, stock: { $gte: qty } }, { $inc: { stock: -qty } })` chalao. Agar kisi ek ka return `null` aaya (stock kam tha), turant `abortTransaction()` call karke error throw karo. Sab pass ho tabhi `commitTransaction()`.

### Production-Ready Solution
```javascript
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Order = require('../models/Order');
const AppError = require('../utils/AppError');

const processCheckout = async (userId, orderItems, shippingAddress) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    let calculatedItemsPrice = 0;
    const verifiedOrderItems = [];

    // 1. Decrement inventory atomically for each item
    for (const item of orderItems) {
      const product = await Product.findOneAndUpdate(
        { _id: item.product, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { new: true, session }
      );

      // If condition stock >= quantity failed, product is null
      if (!product) {
        throw new AppError(
          `Checkout failed: Item "${item.title || item.product}" is out of stock or requested quantity unavailable!`,
          400
        );
      }

      calculatedItemsPrice += product.price * item.quantity;
      verifiedOrderItems.push({
        product: product._id,
        title: product.title,
        price: product.price,
        quantity: item.quantity,
        image: product.images?.[0] || ''
      });
    }

    // 2. Compute tax and total
    const taxPrice = parseFloat((calculatedItemsPrice * 0.18).toFixed(2));
    const shippingPrice = calculatedItemsPrice > 1000 ? 0 : 50;
    const totalPrice = calculatedItemsPrice + taxPrice + shippingPrice;

    // 3. Create Order inside session
    const [order] = await Order.create(
      [
        {
          user: userId,
          orderItems: verifiedOrderItems,
          shippingAddress,
          itemsPrice: calculatedItemsPrice,
          taxPrice,
          shippingPrice,
          totalPrice,
          status: 'Pending',
          isPaid: false
        }
      ],
      { session }
    );

    // 4. Commit atomic transaction
    await session.commitTransaction();
    return order;
  } catch (error) {
    // 5. Abort and rollback on any failure
    await session.abortTransaction();
    throw error;
  } finally {
    // 6. Guarantee session cleanup
    session.endSession();
  }
};
```

### Complexity Analysis
- **Time Complexity:** $O(K \log N)$ where $K$ is the number of distinct items in the cart and $N$ is total products in the catalog (utilizing the `_id` B-Tree index).
- **Space Complexity:** $O(K)$ temporary memory allocations in Node for session buffers.

---

## PROBLEM 2: Axios Silent Refresh Interceptor with Mutex Queue

### Problem Statement
Write an Axios response interceptor that catches `401 Unauthorized` HTTP responses.  
Requirements:
1. When multiple API requests fail simultaneously with 401, only trigger ONE call to `/auth/refresh-token`.
2. Pause all other downstream requests in an asynchronous queue closure.
3. When the refresh succeeds, replay all queued requests with the updated `Bearer` token.
4. If the refresh call itself fails, reject all queued promises and trigger a logout handler.

### Production-Ready Solution
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true
});

let isRefreshing = false;
let failedQueue = [];

// Closure: drains or rejects the queue
const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = []; // Clear queue
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401 and request hasn't been retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Enqueue request inside a pending Promise
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Dispatch single refresh call
        const { data } = await axios.post(
          '/api/v1/auth/refresh-token',
          {},
          { withCredentials: true }
        );

        const newAccessToken = data.accessToken;
        processQueue(null, newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Dispatch custom logout event or window redirect
        window.dispatchEvent(new CustomEvent('auth:session-expired'));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

---

## PROBLEM 3: Centralized Express Error Handling Engine

### Problem Statement
Implement a custom operational error class `AppError`, an asynchronous controller wrapper `catchAsync`, and a 4-argument global error middleware.  
Requirements:
1. `AppError` must capture the stack trace and set `isOperational = true`.
2. `catchAsync` must catch unhandled rejections and forward them via `next(err)`.
3. In production, conceal technical stack traces and send standardized `{ success: false, message }` JSON.

### Production-Ready Solution
```javascript
// 1. Operational Error Class
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode || 500;
    this.status = `${this.statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true; // Mark as predictable operational error
    Error.captureStackTrace(this, this.constructor);
  }
}

// 2. Higher-Order Controller Wrapper
const catchAsync = (fn) => (req, res, next) => {
  fn(req, res, next).catch(next);
};

// 3. Centralized 4-Argument Middleware
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message,
      stack: err.stack,
      error: err
    });
  } else {
    // Production Mode: Shield internal server internals
    if (err.isOperational) {
      res.status(err.statusCode).json({
        success: false,
        status: err.status,
        message: err.message
      });
    } else {
      // Unhandled programming bug (log to Winston, return generic 500)
      console.error('CRITICAL UNCAUGHT ERROR:', err);
      res.status(500).json({
        success: false,
        status: 'error',
        message: 'Something went wrong on our end. Please try again later.'
      });
    }
  }
};

module.exports = { AppError, catchAsync, errorHandler };
```

---

## PROBLEM 4: Vectorized Feature Transformation for Churn Prediction (Python)

### Problem Statement
Write a Python function `transform_batch(records)` that accepts a list of dictionary payloads from Node.js standard input.  
Requirements:
1. Derive numerical interactions: `SpendRatio`, `EngagementScore`, `SpendTier`.
2. Fill missing numeric values with defaults without throwing `KeyError`.
3. Normalize binary string values (`'Yes'`, `'No'`).
4. Assemble and return a clean Pandas DataFrame with strict column order ready for `model.predict_proba()`.

### Production-Ready Solution
```python
import pandas as pd

def transform_batch(records):
    NUMERIC_COLS = [
        'IsSeniorCitizen', 'AccountAgeMonths', 'MonthlySpend', 'TotalSpend',
        'SpendRatio', 'EngagementScore', 'IsLongTermCustomer'
    ]
    BINARY_COLS = [
        'HasPartner', 'HasDependents', 'HasMobileApp', 'HasTwoFactorAuth',
        'UsesWishlist', 'HasPurchaseProtection', 'UsesCustomerSupport',
        'WatchesProductVideos', 'WatchesLiveStreaming', 'UsesPaperlessBilling'
    ]
    MULTI_CAT_COLS = [
        'Gender', 'UsesMultipleDevices', 'PreferredDevice',
        'MembershipType', 'PreferredPaymentMethod', 'SpendTier'
    ]

    processed_rows = []
    for d in records:
        row = {}
        # 1. Base Numerics with defensive typecasting
        row['IsSeniorCitizen']  = float(d.get('IsSeniorCitizen', 0))
        row['AccountAgeMonths'] = float(d.get('AccountAgeMonths', 6))
        row['MonthlySpend']     = float(d.get('MonthlySpend', 0.0))
        row['TotalSpend']       = float(d.get('TotalSpend', 0.0))

        # 2. Feature Engineering
        age, monthly, total = row['AccountAgeMonths'], row['MonthlySpend'], row['TotalSpend']
        
        # SpendRatio with epsilon and ceiling cap
        row['SpendRatio'] = min(total / (monthly * age + 1e-6), 5.0)
        row['IsLongTermCustomer'] = 1 if age >= 12 else 0

        # Composite Engagement Score
        svc_keys = [
            'HasMobileApp', 'UsesWishlist', 'HasPurchaseProtection', 'UsesCustomerSupport',
            'WatchesProductVideos', 'WatchesLiveStreaming', 'HasTwoFactorAuth', 'UsesPaperlessBilling'
        ]
        row['EngagementScore'] = sum(1 for k in svc_keys if str(d.get(k, 'No')).lower() in ['yes', '1', 'true'])

        # Categorical Spend Tier
        if monthly <= 35:   spend_tier = 'Low'
        elif monthly <= 60: spend_tier = 'Medium'
        elif monthly <= 90: spend_tier = 'High'
        else:               spend_tier = 'Premium'
        row['SpendTier'] = spend_tier

        # 3. Binaries normalization
        for col in BINARY_COLS:
            val = d.get(col, 'No')
            row[col] = 'Yes' if str(val).lower() in ['yes', '1', 'true'] else 'No'

        # 4. Multi-Categoricals
        row['Gender']                 = d.get('Gender', 'Male')
        row['UsesMultipleDevices']    = d.get('UsesMultipleDevices', 'Yes')
        row['PreferredDevice']        = d.get('PreferredDevice', 'Mobile')
        row['MembershipType']         = d.get('MembershipType', 'Month-to-month')
        row['PreferredPaymentMethod'] = d.get('PreferredPaymentMethod', 'Credit card')

        processed_rows.append(row)

    # Return DataFrame with strict column order
    return pd.DataFrame(processed_rows, columns=NUMERIC_COLS + BINARY_COLS + MULTI_CAT_COLS)
```

---

## PROBLEM 5: Custom React 19 `useDebounce` Hook

### Problem Statement
Write a custom React hook `useDebounce(value, delay)` that delays updating a state value until the user pauses typing for `delay` milliseconds (e.g. for catalog live search).

### Production-Ready Solution
```javascript
import { useState, useEffect } from 'react';

export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Schedule timeout to update value after delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup: cancel timeout if value changes before delay elapses
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

---

## PROBLEM 6: Cryptographic HMAC Signature Verification

### Problem Statement
Implement a standalone Node.js utility `verifyHmacSignature(orderId, paymentId, signature, secret)` that cryptographically validates Razorpay webhook or callback integrity using timing-safe comparison.

### Production-Ready Solution
```javascript
const crypto = require('crypto');

function verifyHmacSignature(orderId, paymentId, signature, secret) {
  if (!orderId || !paymentId || !signature || !secret) {
    return false;
  }

  // 1. Construct raw payload as defined by payment gateway protocol
  const payload = `${orderId}|${paymentId}`;

  // 2. Generate expected HMAC-SHA256 digest
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
  const signatureBuffer = Buffer.from(signature, 'utf8');

  // Buffers must have identical length for timingSafeEqual
  if (expectedBuffer.length !== signatureBuffer.length) {
    return false;
  }

  // 3. Constant-time comparison preventing timing attacks
  return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
}

module.exports = verifyHmacSignature;
```

---

## PROBLEM 7: Single Aggregation Pipeline to Avoid N+1 Queries

### Problem Statement
Write a Mongoose query that accepts an array of `userIds` and calculates:
1. `totalOrders`: Count of all orders placed by the user.
2. `totalSpent`: Sum of all `totalPrice` fields.
3. `lastOrderDate`: Most recent `createdAt` timestamp.  
The function must return a JavaScript `Map` mapping `userId` string to its calculated statistics in a single database round-trip.

### Production-Ready Solution
```javascript
const Order = require('../models/Order');

async function getUserOrderStatisticsBatch(userIds) {
  const results = await Order.aggregate([
    // Stage 1: Filter to target users only
    {
      $match: {
        user: { $in: userIds }
      }
    },
    // Stage 2: Group and accumulate metrics
    {
      $group: {
        _id: '$user',
        totalOrders: { $sum: 1 },
        totalSpent: { $sum: { $ifNull: ['$totalPrice', '$total', 0] } },
        lastOrderDate: { $max: '$createdAt' }
      }
    }
  ]);

  // Transform array into fast O(1) lookup Map
  const statsMap = new Map();
  results.forEach((record) => {
    statsMap.set(record._id.toString(), {
      totalOrders: record.totalOrders,
      totalSpent: parseFloat(record.totalSpent.toFixed(2)),
      lastOrderDate: record.lastOrderDate
    });
  });

  return statsMap;
}

module.exports = getUserOrderStatisticsBatch;
```

---

## 8. Rapid Revision Checklist: Code Muscle Memory
- [ ] Practiced writing `Product.findOneAndUpdate({ _id, stock: { $gte: qty } }, { $inc: { stock: -qty } })` without looking.
- [ ] Can write the `isRefreshing` and `failedQueue` closure logic from memory.
- [ ] Understand why `crypto.timingSafeEqual` requires identical buffer lengths.
- [ ] Remember to return a cleanup function in `useDebounce` to clear the timeout.
- [ ] Can assemble a MongoDB `$match` and `$group` pipeline on whiteboard/editor.

