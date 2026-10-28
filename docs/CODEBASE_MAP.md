# Codebase Map: Directory Structure & Component Inventory

## 1. Directory Tree Overview

```
ecommerce-churn-prediction/
├── backend/                        # Node.js + Express API & ML Models
│   ├── ml-models/                  # Production ML models & prediction script
│   │   ├── features_list.json      # Feature column definitions for logistic baseline
│   │   ├── predict.py              # Python inference script invoked via child_process
│   │   ├── requirements.txt        # Python ML runtime dependencies
│   │   └── xgboost_churn_pipeline_v2.pkl # Production XGBoost pipeline
│   ├── src/
│   │   ├── config/                 # Service configurations
│   │   │   ├── cloudinary.js       # Cloudinary SDK wrapper & upload helpers
│   │   │   ├── constants.js        # Global domain enums and pagination constants
│   │   │   └── database.js         # Mongoose connection manager
│   │   ├── controllers/            # Request handlers (MVC Controllers)
│   │   │   ├── adminController.js  # Dashboard stats & ML churn orchestration
│   │   │   ├── authController.js   # OTP registration, login, refresh, password reset
│   │   │   ├── cartController.js   # Cart mutations, quantity syncing, subtotal math
│   │   │   ├── orderController.js  # Order creation, status workflow, sales analytics
│   │   │   ├── productController.js# Product CRUD, multi-image Cloudinary handling
│   │   │   └── userController.js   # Profile management, admin user CRUD
│   │   ├── middlewares/            # Express request pipeline filters
│   │   │   ├── admin.js            # Admin-only authorization helper
│   │   │   ├── auth.js             # JWT verification, cookie parsing, RBAC check
│   │   │   ├── errorHandler.js     # Global error responder & AppError class
│   │   │   └── validation.js       # Express-validator schemas & multer file checks
│   │   ├── models/                 # Mongoose schemas & domain models
│   │   │   ├── AdminLog.js         # Audit log schema for administrative actions
│   │   │   ├── Cart.js             # Shopping cart schema with item virtuals
│   │   │   ├── Order.js            # Order entity, items, addresses, payment status
│   │   │   ├── Otp.js              # Short-lived OTP documents with TTL index
│   │   │   ├── Product.js          # Product catalog item schema with slug generation
│   │   │   └── User.js             # User accounts, bcrypt hooks, token revocation
│   │   ├── routes/                 # Express router definitions
│   │   │   ├── adminRoutes.js      # /api/admin endpoints
│   │   │   ├── authRoutes.js       # /api/auth endpoints with rate limiters
│   │   │   ├── cartRoutes.js       # /api/cart endpoints
│   │   │   ├── orderRoutes.js      # /api/orders endpoints
│   │   │   ├── productRoutes.js    # /api/products endpoints
│   │   │   └── userRoutes.js       # /api/users endpoints
│   │   ├── services/               # Reusable external domain services
│   │   │   ├── emailService.js     # Nodemailer transporter & HTML email templates
│   │   │   └── paymentService.js   # Razorpay, Stripe, and PayPal gateway adapters
│   │   ├── utils/                  # Cross-cutting helper functions
│   │   │   ├── helpers.js          # Currency, slug, date, SKU formatting utilities
│   │   │   ├── jwt.js              # Standalone JWT signing helpers (legacy/orphaned)
│   │   │   ├── logger.js           # Winston multi-transport logger
│   │   │   └── validators.js       # Pure validation functions (Email, PAN, GST, etc.)
│   │   ├── app.js                  # Express application configuration & middleware mount
│   │   └── server.js               # Application entrypoint & HTTP server bootstrap
│   ├── nodemon.json                # Nodemon watcher configuration
│   ├── package.json                # Node dependencies and scripts
│   └── seed-admin.js               # CLI script to seed default admin user
├── frontend/                       # React 19 + Vite Single Page Application
│   ├── public/                     # Static public assets
│   ├── src/
│   │   ├── assets/                 # SVGs, banners, and static imagery
│   │   ├── components/             # Reusable UI modules
│   │   │   ├── admin/              # Admin components (AdminSidebar, ProductForm, StatsCard)
│   │   │   ├── cart/               # Cart components (CartItem, CartSummary)
│   │   │   ├── checkout/           # Checkout steps (Shipping, Billing, Payment, Summary)
│   │   │   ├── common/             # Layout & guards (Header, Footer, HeroSlider, ProtectedRoute, AdminRoute, Loader)
│   │   │   └── product/            # Catalog cards, filters, and responsive grids
│   │   ├── pages/                  # Route view components
│   │   │   ├── admin/              # Dashboard, ChurnAnalytics, OrdersManagement, ProductsManagement, UsersManagement
│   │   │   ├── Cart.jsx            # Shopping cart overview page
│   │   │   ├── Checkout.jsx        # Multi-step checkout & payment orchestration
│   │   │   ├── ForgotPassword.jsx  # Password reset request view
│   │   │   ├── Home.jsx            # Store homepage with hero banner & featured rails
│   │   │   ├── Login.jsx           # Sign-in form with remember-me
│   │   │   ├── OrderDetail.jsx     # Detailed order view with status tracker
│   │   │   ├── Orders.jsx          # Customer order history listing
│   │   │   ├── OtpVerify.jsx       # 6-digit OTP verification & account completion
│   │   │   ├── ProductDetail.jsx   # Product display with zoom, specs, and mock reviews
│   │   │   ├── Profile.jsx         # Multi-tab customer settings & address manager
│   │   │   ├── Register.jsx        # Customer registration with step 1 submission
│   │   │   ├── ResetPassword.jsx   # New password entry with token validation
│   │   │   └── Shop.jsx            # Catalog filtering & browsing view
│   │   ├── services/               # API client adapters (Axios)
│   │   │   ├── adminService.js     # Admin dashboard & churn prediction requests
│   │   │   ├── api.js              # Axios instance, withCredentials, silent refresh interceptor
│   │   │   ├── authService.js      # Auth API endpoints
│   │   │   ├── cartService.js      # Cart API endpoints
│   │   │   ├── orderService.js     # Order & payment API endpoints
│   │   │   ├── productService.js   # Product catalog API endpoints
│   │   │   └── userService.js      # Profile & address API endpoints
│   │   ├── store/                  # Client state management (Zustand)
│   │   │   ├── authStore.js        # Auth state, login/logout actions, user profile
│   │   │   └── cartStore.js        # Cart items, subtotal, optimistic count updates
│   │   ├── utils/                  # Frontend formatting helpers (formatters.js)
│   │   ├── App.jsx                 # Base application layout wrapper (Header + Outlet + Footer)
│   │   ├── main.jsx                # React root bootstrap & QueryClientProvider
│   │   └── router.jsx              # React Router 7 route definitions & AdminLayout
│   ├── index.html                  # HTML5 entrypoint
│   ├── package.json                # Frontend dependencies
│   ├── tailwind.config.js          # Tailwind styling configuration
│   └── vite.config.js              # Vite bundler configuration & dev server proxy
├── ml-service/                     # Data Science experimentation workspace
│   ├── data_preprocessing.py       # Data cleaning and imputation script
│   ├── feature_engineering.py      # Feature engineering and dataset split script
│   ├── features_list.json          # Input feature definition schema
│   ├── final_model.ipynb           # Model development notebook
│   ├── ecommerce_churn_model_v2.ipynb # XGBoost training & evaluation notebook
│   ├── requirements.txt            # Training environment dependencies
│   └── *.csv / *.pkl               # Datasets and serialised baseline models
├── Dockerfile                      # Multi-stage production container build
├── render.yaml                     # Render Cloud deployment blueprint
└── README.md                       # Repository root documentation
```

---

## 2. Component Responsibility Matrix

| Component File | Primary Responsibility | Critical Dependencies |
| :--- | :--- | :--- |
| `backend/src/server.js` | Boots HTTP listener, establishes MongoDB connection, runs Python model warm-up | `mongoose`, `app.js`, `child_process` |
| `backend/src/app.js` | Mounts security headers, parsers, CORS, rate limiters, routes, static frontend | `express`, `helmet`, `cors`, `morgan` |
| `backend/src/controllers/authController.js` | Handles OTP generation, account creation, cookie issuance, token refresh, password resets | `User.js`, `Otp.js`, `emailService.js`, `bcryptjs`, `jsonwebtoken` |
| `backend/src/controllers/adminController.js` | Computes business metrics and runs customer churn inference via Python subprocess | `User.js`, `Order.js`, `Product.js`, `child_process` |
| `backend/src/controllers/orderController.js` | Processes cart checkout, inventory checks, order status lifecycles, sales metrics | `Order.js`, `Product.js`, `Cart.js`, `logger.js` |
| `backend/src/services/paymentService.js` | Integrates Razorpay order creation and HMAC-SHA256 signature verification | `razorpay`, `crypto`, `logger.js` |
| `backend/src/services/emailService.js` | Compiles HTML templates and sends emails via SMTP | `nodemailer`, `logger.js` |
| `backend/src/middlewares/auth.js` | Extracts JWT from cookies/headers, checks expiration, verifies `tokenVersion` | `jsonwebtoken`, `User.js` |
| `frontend/src/services/api.js` | Configures Axios instance, handles queued token refreshes on 401 TOKEN_EXPIRED | `axios`, `authStore.js`, `react-hot-toast` |
| `frontend/src/pages/Checkout.jsx` | Coordinates 4-step checkout, loads Razorpay SDK, submits orders | `react-hook-form`, `zod`, `orderService.js`, `cartStore.js` |
| `frontend/src/pages/admin/ChurnAnalytics.jsx` | Renders AI customer risk cards, probability meters, and risk rationales | `@tanstack/react-query`, `adminService.js` |
