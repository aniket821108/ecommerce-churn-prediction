# 🛒 E-Shop — AI-Powered E-Commerce Platform

A full-stack e-commerce platform with **ML-driven customer churn prediction**, real-time analytics, OTP-based authentication, and Razorpay payment integration.

> Built as a capstone project demonstrating full-stack development, machine learning integration, and production-ready architecture.

---

## ✨ Key Features

### 🛍️ Customer-Facing
- **Product Catalog** — Browse, search, and filter products with detailed views
- **Shopping Cart** — Persistent cart with real-time price calculations
- **Multi-Step Checkout** — Shipping → Billing → Payment → Review flow
- **Razorpay Payments** — Secure online payments with UPI, cards, and wallets
- **Cash on Delivery** — Alternative payment option
- **Order Tracking** — View order history and real-time status updates
- **OTP Verification** — Email-based OTP for secure user registration
- **User Profile** — Manage account details, addresses, and password

### 📊 Admin Dashboard
- **Dashboard Analytics** — Total users, orders, revenue, and recent activity
- **Product Management** — Full CRUD with Cloudinary image uploads
- **Order Management** — Update order status, view payment details
- **User Management** — View, manage, and monitor customer accounts
- **🧠 AI Churn Prediction** — XGBoost ML model predicts customer churn risk with probability scores

### 🔒 Security
- JWT authentication (Bearer token + HTTP-only cookies)
- Helmet, XSS protection, mongo sanitization, HPP
- Rate limiting on API endpoints
- Input validation with express-validator and Zod

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite, Tailwind CSS 4, Zustand, React Query, React Router 7 |
| **Backend** | Node.js, Express.js, MongoDB (Mongoose), JWT |
| **ML Model** | Python, XGBoost, scikit-learn, pandas |
| **Payments** | Razorpay (test mode) |
| **Email** | Nodemailer (Gmail SMTP) |
| **Images** | Cloudinary |
| **Logging** | Winston |

---

## 📁 Project Structure

```
├── backend/
│   ├── src/
│   │   ├── config/          # DB, Cloudinary config
│   │   ├── controllers/     # Auth, Product, Order, Cart, Admin, User
│   │   ├── middlewares/      # Auth, Admin, Error handling, Validation
│   │   ├── models/           # User, Product, Order, Cart, OTP, AdminLog
│   │   ├── routes/           # API route definitions
│   │   ├── services/         # Email, Payment services
│   │   ├── utils/            # Logger, JWT, Validators, Helpers
│   │   ├── app.js            # Express app setup
│   │   └── server.js         # Server entry point
│   └── ml-models/
│       ├── predict.py        # ML prediction script (XGBoost v2)
│       └── xgboost_churn_pipeline_v2.pkl
├── frontend/
│   └── src/
│       ├── components/       # Reusable UI components
│       ├── pages/            # Route pages (Home, Shop, Cart, Admin/*)
│       ├── services/         # API service layer (Axios)
│       ├── store/            # Zustand state (Auth, Cart)
│       ├── hooks/            # Custom React hooks
│       └── router.jsx        # Route configuration
└── ml-service/               # ML model training notebooks & data
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 16
- Python 3.8+ (for ML predictions)
- MongoDB Atlas account (or local MongoDB)
- Cloudinary account
- Razorpay test account

### 1. Clone the Repository
```bash
git clone https://github.com/aniket821108/ecommerce-churn-prediction.git
cd ecommerce-churn-prediction
```

### 2. Backend Setup
```bash
cd backend
npm install

# Create .env from template
cp src/.env.example src/.env
# Edit src/.env with your credentials

# Seed admin user
node seed-admin.js

# Start development server
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install

# Create .env from template
cp .env.example .env
# Edit .env with your backend URL

# Start development server
npm run dev
```

### 4. Python ML Setup
```bash
# Install Python dependencies (in a virtual env)
pip install joblib pandas scikit-learn xgboost
```

The server automatically warms up the ML model on startup.

---

## 🔑 Environment Variables

See [`backend/src/.env.example`](backend/src/.env.example) and [`frontend/.env.example`](frontend/.env.example) for all required configuration.

Key variables:
| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_ACCESS_SECRET` | Secret for JWT token signing |
| `CLOUDINARY_*` | Cloudinary upload credentials |
| `RAZORPAY_KEY_ID/SECRET` | Razorpay payment gateway keys |
| `EMAIL_USER/PASSWORD` | Gmail SMTP credentials (app password) |
| `PYTHON_CMD` | Path to Python executable (default: `python3`) |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins for production |
| `VITE_API_URL` | Backend API URL for frontend |

---

## 🧠 ML Churn Prediction

The churn prediction model uses an **XGBoost classifier** trained on e-commerce customer behavior data.

**Features used:**
- Account age, monthly/total spend, spend ratio
- Engagement score (based on 8 service usage indicators)
- Membership type, preferred device, payment method
- Customer support usage, mobile app adoption

**Pipeline:** Raw data → Feature engineering → XGBoost v2 Pipeline → Churn probability + risk level

The prediction runs via Python `child_process.spawn` from Node.js, with a built-in heuristic fallback if the ML model is unavailable.

---

## 📸 Screenshots

> *Coming soon*

---

## 📜 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/send-otp` | Send OTP for registration |
| `POST` | `/api/auth/verify-otp` | Verify OTP & create account |
| `POST` | `/api/auth/login` | User login |
| `GET` | `/api/auth/me` | Get current user |
| `GET` | `/api/products` | List products |
| `GET` | `/api/products/:id` | Product details |
| `GET/POST` | `/api/cart` | Cart operations |
| `POST` | `/api/orders` | Create order |
| `GET` | `/api/orders` | User order history |
| `GET` | `/api/admin/dashboard` | Admin dashboard stats |
| `GET` | `/api/admin/churn-predictions` | ML churn analysis |
| `GET` | `/health` | Health check |

---

## 👤 Author

**Aniket Kumar**
- GitHub: [@aniket821108](https://github.com/aniket821108)
- Email: aniketkumar821108@gmail.com

---

## 📄 License

This project is licensed under the MIT License.
