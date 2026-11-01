# AGENTS.md — Developer & AI Agent Guide for E-Shop

Welcome to the **E-Shop AI-Powered E-Commerce Platform** codebase. This guide defines project standards, architectural boundaries, and operational procedures for all AI assistants and contributing developers.

---

## 1. System Overview & Technology Stack

- **Architecture:** Decoupled Client-Server Monorepo with integrated Python ML inference.
- **Backend:** Node.js, Express.js 4, MongoDB (Mongoose 7), JWT authentication with HttpOnly cookies, Winston logger.
- **Frontend:** React 19, Vite 7, Tailwind CSS 4, Zustand 5, TanStack React Query 5, React Router 7, React Hook Form, Zod.
- **Machine Learning:** Python 3.11, XGBoost Pipeline v2, scikit-learn, pandas, joblib. Invoked via `child_process.spawn`.
- **Infrastructure & Deployment:** Multi-stage Docker container (`Dockerfile`), Render Web Service (`render.yaml`).

---

## 2. Directory Structure & Key Paths

- `PROGRESS.md`: Master single source of truth for project status, architecture, completed milestones, bugfixes, and AI handover log. MUST BE UPDATED after every implementation.
- `backend/src/server.js`: Application bootstrap, MongoDB connection, Python ML warmup.
- `backend/src/app.js`: Express middleware pipeline, route mounts, static file server for production.
- `backend/src/controllers/`: MVC controllers (`auth`, `product`, `order`, `cart`, `admin`, `user`).
- `backend/src/models/`: Mongoose schemas (`User`, `Product`, `Order`, `Cart`, `Otp`, `AdminLog`).
- `backend/src/middlewares/`: Security, authentication (`auth.js`), validation (`validation.js`), error handling (`errorHandler.js`).
- `backend/src/services/`: External integrations (`emailService.js`, `paymentService.js`).
- `backend/ml-models/`: Production prediction script (`predict.py`) and serialised models (`xgboost_churn_pipeline_v2.pkl`).
- `frontend/src/router.jsx`: React Router 7 route definitions, public and protected routes, admin dark theme layout.
- `frontend/src/store/`: Zustand persistent state stores (`authStore.js`, `cartStore.js`).
- `frontend/src/services/api.js`: Axios instance configured with `withCredentials: true` and automatic silent refresh queue.
- `docs/`: Complete project documentation knowledge base.

---

## 3. Strict Development Rules & Constraints

### 3.1 Security First
- **Never expose credentials:** Never hardcode secrets, passwords, or private keys. All secrets must come from environment variables (`process.env.*` on backend, `import.meta.env.VITE_*` on frontend).
- **Payment integrity:** Never mark an order as paid without verifying the cryptographic HMAC signature (`verifyRazorpayPayment`). Do not reintroduce unverified payment endpoints.
- **Input sanitization & validation:** Always validate user inputs using `express-validator` or `validators.js` before database persistence.

### 3.2 Data Integrity & Transactions
- **Atomic inventory:** Never perform read-modify-write on stock in memory (`stock -= quantity; await save()`). Use atomic database queries (`$inc: { stock: -quantity }` with `{ stock: { $gte: quantity } }`).
- **Database transactions:** Wrap multi-document checkout operations (order creation, stock decrement, cart clearing) inside Mongoose transactions (`session = await mongoose.startSession()`).

### 3.3 Memory & Performance
- **Batch ML inference:** Never spawn multiple Python child processes concurrently in an unthrottled loop. Batch data into a single subprocess execution.
- **File upload cleanup:** Always clean up temporary files written to `uploads/` immediately after Cloudinary upload or in error handlers.

### 3.4 Code Quality & Style
- Maintain existing English documentation and comments.
- Adhere to the established MVC pattern on the backend and hook/store-driven component architecture on the frontend.
- When adding new endpoints, document them in `docs/API_DOCUMENTATION.md`.

---

## 4. Useful Commands & Workflows

### 4.1 Backend
```bash
cd backend
npm install             # Install dependencies
npm run dev             # Start dev server with nodemon (Port 5000)
npm run lint            # Run ESLint
node seed-admin.js      # Seed or update admin user
```

### 4.2 Frontend
```bash
cd frontend
npm install             # Install dependencies
npm run dev             # Start Vite dev server (Port 5173)
npm run build           # Build production bundle to dist/
npm run lint            # Run ESLint
```

### 4.3 Python ML Setup
```bash
pip install -r backend/ml-models/requirements.txt
# Required packages: joblib, pandas, scikit-learn, xgboost
```

### 4.4 Docker & Containerized Run
```bash
docker build -t eshop-app .
docker run -p 5000:5000 --env-file backend/src/.env eshop-app
```
