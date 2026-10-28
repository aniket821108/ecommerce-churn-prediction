# System Architecture: E-Shop Platform

## 1. Architectural Philosophy & Patterns

E-Shop is designed following modern decoupled architectural principles:
- **Presentation Layer (Client):** Single Page Application (SPA) driven by stateful reactive components and remote cache management.
- **API & Application Layer (Backend):** Model-View-Controller (MVC) pattern implemented in Express.js with layered middleware (Security, Sanitization, Authentication, Validation, Error Handling).
- **Persistence Layer (Data):** Document-oriented database (MongoDB) with Mongoose schemas, virtual properties, compound indexes, and pre/post lifecycle hooks.
- **Inference Layer (Machine Learning):** Isolated Python script executed as a subprocess via standard input/output (IPC), protected with fallback heuristics.

---

## 2. Component Architecture & Data Flow

```mermaid
graph TB
    subgraph Client ["Client Tier (Browser)"]
        UI[React 19 Components]
        Router[React Router 7]
        State[Zustand Stores: Auth & Cart]
        Cache[TanStack React Query Cache]
        AxiosClient[Axios Instance with Interceptors]
    end

    subgraph Server ["API Tier (Node.js / Express)"]
        SecMid[Security & Sanitize Middlewares<br/>Helmet, MongoSanitize, XSS, RateLimit]
        AuthMid[Auth & RBAC Middleware<br/>Token & Cookie Validation]
        Controllers[Express Controllers<br/>Auth, Product, Order, Cart, Admin, User]
        Services[Application Services<br/>EmailService, PaymentService]
        MongooseModels[Mongoose ODM Models<br/>User, Product, Order, Cart, Otp, AdminLog]
    end

    subgraph Data ["Data & External Services"]
        MongoDB[(MongoDB Database)]
        Cloudinary[Cloudinary Media Storage]
        Razorpay[Razorpay Payment Gateway]
        SMTP[Gmail SMTP Server]
    end

    subgraph MLTier ["Inference Tier (Python Subprocess)"]
        Spawn[child_process.spawn 'python3']
        PredictScript[ml-models/predict.py]
        PickleModel[(xgboost_churn_pipeline_v2.pkl)]
    end

    UI --> Router
    UI --> State
    UI --> Cache
    Cache --> AxiosClient
    State --> AxiosClient

    AxiosClient -- "HTTPS (JSON / Cookies)" --> SecMid
    SecMid --> AuthMid
    AuthMid --> Controllers
    Controllers --> Services
    Controllers --> MongooseModels
    MongooseModels --> MongoDB

    Services --> Cloudinary
    Services --> Razorpay
    Services --> SMTP

    Controllers -- "JSON via Stdin" --> Spawn
    Spawn --> PredictScript
    PredictScript --> PickleModel
    PredictScript -- "JSON via Stdout" --> Spawn
```

---

## 3. Core Workflow Sequences

### 3.1 Secure OTP-Based User Registration Flow
```mermaid
sequenceDiagram
    autonumber
    actor Customer as User (Browser)
    participant AuthCtrl as authController.js
    participant OtpModel as Otp Model (MongoDB)
    participant EmailSvc as emailService.js
    participant UserModel as User Model (MongoDB)

    Customer->>AuthCtrl: POST /api/auth/send-otp (name, email, password, phone)
    AuthCtrl->>AuthCtrl: Validate Email, Password complexity, Indian Phone regex
    AuthCtrl->>UserModel: findOne({ email })
    alt User Already Exists
        AuthCtrl-->>Customer: 200 OK (Generic anti-enumeration message)
    else New Registration
        AuthCtrl->>AuthCtrl: Hash password (bcrypt 12) + Generate 6-digit crypto OTP
        AuthCtrl->>OtpModel: deleteMany({ email })
        AuthCtrl->>OtpModel: create({ email, otp: SHA256(otp), userData, expiresAt: +10m })
        AuthCtrl->>EmailSvc: sendEmail(email, 'otpVerification', { otp, name })
        EmailSvc-->>AuthCtrl: Email Dispatched
        AuthCtrl-->>Customer: 200 OK (Verification code sent)
    end

    Customer->>AuthCtrl: POST /api/auth/verify-otp (email, otp)
    AuthCtrl->>OtpModel: findOne({ email })
    alt OTP Valid & Not Expired
        AuthCtrl->>UserModel: create({ name, email, phone, password, role: 'user' })
        AuthCtrl->>OtpModel: deleteOne({ _id })
        AuthCtrl->>EmailSvc: sendEmail(email, 'welcome')
        AuthCtrl->>Customer: 201 Created + Set-Cookie (accessToken, refreshToken)
    else Invalid OTP
        AuthCtrl->>OtpModel: $inc attempts
        AuthCtrl-->>Customer: 400 Bad Request (Attempts remaining)
    end
```

---

### 3.2 Silent JWT Refresh Mechanism
```mermaid
sequenceDiagram
    autonumber
    actor Client as Axios Interceptor
    participant API as /api/* Endpoint
    participant RefreshEndpoint as /api/auth/refresh-token
    participant UserModel as User Model

    Client->>API: GET /api/orders/my-orders (Cookie: accessToken)
    API-->>Client: 401 Unauthorized { code: 'TOKEN_EXPIRED' }
    
    note over Client: Interceptor halts requests and queues concurrent calls
    Client->>RefreshEndpoint: POST /api/auth/refresh-token (Cookie: refreshToken)
    RefreshEndpoint->>RefreshEndpoint: Verify JWT signature & type === 'refresh'
    RefreshEndpoint->>UserModel: findById(decoded.id) + Check tokenVersion
    alt Token Valid & tokenVersion matches
        RefreshEndpoint-->>Client: 200 OK + Set-Cookie (new accessToken, new refreshToken)
        note over Client: Process queued requests with re-issued tokens
        Client->>API: Retry GET /api/orders/my-orders
        API-->>Client: 200 OK (Order payload)
    else Invalid or Revoked
        RefreshEndpoint-->>Client: 401 Unauthorized { code: 'REFRESH_EXPIRED' }
        note over Client: Clear client auth state and redirect to /login
    end
```

---

### 3.3 Customer Churn ML Prediction Flow
```mermaid
sequenceDiagram
    autonumber
    actor Admin as Admin Browser
    participant AdminCtrl as adminController.js
    participant OrderModel as Order Model (MongoDB)
    participant Subprocess as Python Child Process
    participant PredictPy as ml-models/predict.py
    participant XGBoost as XGBoost Pipeline v2 (.pkl)

    Admin->>AdminCtrl: GET /api/admin/analytics/churn (Cookie: accessToken, role: 'admin')
    AdminCtrl->>AdminCtrl: Fetch top active customers (User.find({ role: 'user', isActive: true }))
    
    loop For Each Customer
        AdminCtrl->>OrderModel: Aggregate order count, total spent, last order date
        AdminCtrl->>AdminCtrl: Compute AccountAgeMonths, MonthlySpend, DaysSinceLastOrder
        AdminCtrl->>Subprocess: spawn(PYTHON_CMD, [predict.py])
        AdminCtrl->>Subprocess: Write Customer Features JSON to stdin
        Subprocess->>PredictPy: Ingest stdin JSON
        PredictPy->>PredictPy: Calculate SpendRatio, EngagementScore, SpendTier
        PredictPy->>XGBoost: model.predict_proba(FeatureMatrix)
        XGBoost-->>PredictPy: Churn Probability (e.g., 0.82)
        PredictPy-->>Subprocess: Output JSON to stdout { probability, risk_level, model }
        Subprocess-->>AdminCtrl: Process closed, buffer resolved
    end
    
    AdminCtrl->>AdminCtrl: Sort customers by highest churn risk
    AdminCtrl-->>Admin: 200 OK { count, predictions, users }
```

---

## 4. Cross-Cutting Concerns

### 4.1 Security Layering
- **Edge HTTP Security:** Helmet sets HTTP response headers, content security policies (CSP) allowing Razorpay framing, Cloudinary assets, and Google Fonts.
- **Sanitization:** `express-mongo-sanitize` strips out `$` and `.` operators to prevent NoSQL query injection; `xss-clean` escapes script payloads; `hpp` guards against HTTP parameter pollution.
- **Rate Limiting:**
  - Global API: 1,000 requests per 15-minute window per IP.
  - Auth Login: 5 requests per 15-minute window.
  - OTP Requests: 5 requests per 15-minute window.
  - Forgot Password: 3 requests per 15-minute window.
- **Session Revocation:** Users possess a `tokenVersion` counter in MongoDB. Changing passwords or logging out increments this counter, immediately invalidating all outstanding JWT access and refresh tokens.

### 4.2 Logging & Auditing
- Application events are routed through Winston (`logger.js`) with two transport streams:
  - Console transport formatted for human readability in development.
  - Rotating daily file transports (`logs/error-%DATE%.log` and `logs/combined-%DATE%.log`) capturing structured JSON payloads with request methods, IPs, and user identifiers.
