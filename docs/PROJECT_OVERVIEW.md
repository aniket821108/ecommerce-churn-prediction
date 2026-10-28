# Project Overview: E-Shop AI-Powered E-Commerce Platform

## 1. Executive Summary
**E-Shop** is a modern, full-stack e-commerce web application engineered with an integrated Machine Learning (ML) inference pipeline. Built as a multi-tier platform, it combines a responsive customer-facing storefront, an administrative analytics and inventory management portal, and an XGBoost-based customer churn prediction engine. 

The platform demonstrates end-to-end software engineering principles: secure multi-step user onboarding with OTP verification, cookie-based JWT authentication with automatic silent token refresh, shopping cart persistence, dynamic checkout supporting Razorpay and Cash on Delivery (COD), Cloudinary-backed asset management, and ML-assisted business intelligence.

---

## 2. Intended Users & Personas

### 2.1 Customer Persona
- **Goal:** Discover products, manage cart contents, checkout securely, track order fulfillment, and update personal profile details.
- **Key Flows:**
  1. Browse and filter product catalog by category, price, brand, and featured status.
  2. Inspect product details, image galleries, and pricing.
  3. Manage persistent shopping cart (add/update/remove items, quantity adjustments).
  4. Complete multi-step checkout (Shipping address, Billing address, Payment selection).
  5. Authenticate securely via OTP-verified registration, credential login, and password reset flows.
  6. Track real-time status of orders and view order history.
  7. Manage profile (avatar upload, address book, password modification).

### 2.2 Store Administrator Persona
- **Goal:** Oversee e-commerce operations, monitor revenue and orders, manage product catalog and customer accounts, and identify at-risk customers using predictive ML models.
- **Key Flows:**
  1. Dashboard overview: live revenue calculation, order counts, product counts, and recent transactions.
  2. Inventory management: create, edit, soft-delete products, and upload high-resolution images to Cloudinary.
  3. Order fulfillment: transition order statuses (`pending` → `processing` → `shipped` → `delivered` / `cancelled`), assign tracking numbers and couriers, confirm COD payments.
  4. Customer management: inspect customer spend history, toggle active/inactive status, manage roles.
  5. Churn intelligence: view AI churn risk scores, engagement scores, and actionable risk explanations for proactive retention.

---

## 3. High-Level System Architecture

The project is structured as a decoupled three-tier system:

```
[ React 19 + Vite SPA ]  <--- HTTPS / JSON / Cookies --->  [ Node.js + Express Backend ]
                                                                     |
                           +-----------------------------------------+-----------------------------------------+
                           |                                         |                                         |
                           v                                         v                                         v
                 [ MongoDB Database ]                     [ Python ML Subprocess ]                   [ Cloud Services ]
                 - Users & Auth Data                      - XGBoost Pipeline v2                     - Cloudinary (CDN)
                 - Products & Catalog                     - pandas / scikit-learn                   - Razorpay (Payments)
                 - Orders & Carts                         - stdin/stdout JSON IPC                   - Gmail SMTP (Nodemailer)
```

1. **Frontend Client:** React 19 Single Page Application built with Vite, Tailwind CSS 4, React Router 7, Zustand, and TanStack React Query.
2. **Backend Server:** Node.js Express REST API structured in MVC architecture with centralized error handling, security middleware, and Mongoose ODM.
3. **ML Inference Engine:** Standalone Python script running an XGBoost v2 classification pipeline invoked via Node.js `child_process.spawn` IPC with graceful heuristic fallback.
4. **Third-Party Integrations:** Cloudinary (media upload/hosting), Razorpay (payment processing), and Gmail SMTP (transactional OTP and status emails).

---

## 4. Key Capabilities & Implementation Status

| Feature Area | Sub-Feature | Implementation Status | Notes |
| :--- | :--- | :--- | :--- |
| **Authentication** | Email + Password Login | ✅ Implemented | HttpOnly cookie + Bearer token support, `tokenVersion` revocation |
| **Authentication** | OTP Registration Flow | ✅ Implemented | Crypto-secure OTP generation, SHA-256 hashed storage, TTL expiry |
| **Authentication** | Password Reset Flow | ✅ Implemented | Hashed crypto token email link, 30m expiry, all-session revocation |
| **Authentication** | Silent Token Refresh | ✅ Implemented | Axios response interceptor with request queue, refresh token cookie |
| **Product Catalog** | Product Search & Filter | ✅ Implemented | Category, price range, brand, text search, featured toggle |
| **Product Catalog** | Product Image Upload | ⚠️ Partial | Multer uploads to disk without cleanup; Cloudinary upload works |
| **Product Catalog** | Reviews & Ratings | ❌ Planned / Mocked | UI displays hardcoded mock reviews; no database or API backing |
| **Cart & Checkout** | Persistent Cart | ✅ Implemented | MongoDB backed, item quantity sync, subtotal computation |
| **Cart & Checkout** | Cash on Delivery (COD)| ✅ Implemented | Order created with pending payment, admin mark-as-paid flow |
| **Cart & Checkout** | Razorpay Payments | ⚠️ Insecure / Vulnerable | Client bypasses signature verification; `/confirm-payment` lacks HMAC check |
| **Admin Operations**| Dashboard Metrics | ✅ Implemented | Aggregates orders, products, users, total revenue |
| **Admin Operations**| Order Management | ✅ Implemented | Status transitions with validation, tracking info capture |
| **Admin Operations**| Product Management | ✅ Implemented | CRUD operations with Cloudinary integration |
| **Admin Operations**| User Management | ✅ Implemented | List, search, deactivate, role updates |
| **Admin Operations**| Utility Actions | ❌ Planned / Stubs | `backupDatabase`, `clearCache`, `getAdminLogs` return static JSON |
| **ML Intelligence** | XGBoost Churn Prediction| ⚠️ Performance Risk | Works, but spawns 50 concurrent Python processes in parallel |
| **Observability**   | Health Check | ✅ Implemented | `/health` endpoint returning uptime, memory, and status |
| **Testing**         | Automated Tests | ❌ Not Implemented | Jest in package.json, but 0 test suites exist in repo |

---

## 5. Development & Operational Lifecycle

- **Local Development:**
  - Backend: `npm run dev` in `backend/` (runs `nodemon` on port 5000).
  - Frontend: `npm run dev` in `frontend/` (runs Vite dev server on port 5173).
  - ML Pipeline: Requires Python environment with `joblib`, `pandas`, `scikit-learn`, `xgboost`.
- **Production Build:**
  - Containerized via multi-stage `Dockerfile`:
    - Stage 1 compiles Vite React bundle into static files.
    - Stage 2 uses `nikolaik/python-nodejs` base image with Python 3.11 and Node 20, installs ML and production dependencies, copies React bundle to `/public`, and serves both API and static UI.
  - Deployment configuration provided in `render.yaml` for Render Web Service deployment.
