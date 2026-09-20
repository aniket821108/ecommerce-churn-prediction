# ── Stage 1: Build Frontend ─────────────────────────────
FROM node:20-alpine AS frontend-build

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --production=false
COPY frontend/ ./

# Build args for frontend env vars (set in Render dashboard)
ARG VITE_API_URL
ARG VITE_RAZORPAY_KEY_ID
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_RAZORPAY_KEY_ID=$VITE_RAZORPAY_KEY_ID

RUN npm run build

# ── Stage 2: Production Backend + Python ────────────────
FROM nikolaik/python-nodejs:python3.11-nodejs20

WORKDIR /app

# Install Python ML dependencies
COPY backend/ml-models/requirements.txt ./ml-requirements.txt
RUN pip install --no-cache-dir -r ml-requirements.txt 2>/dev/null || \
    pip install --no-cache-dir joblib pandas scikit-learn xgboost

# Install Node.js backend dependencies
COPY backend/package*.json ./
RUN npm ci --production

# Copy backend source
COPY backend/src/ ./src/
COPY backend/ml-models/ ./ml-models/

# Copy built frontend to serve as static files
COPY --from=frontend-build /app/frontend/dist ./public

# Set Python command for ML predictions
ENV PYTHON_CMD=python3
ENV NODE_ENV=production

# Expose port (Render sets PORT automatically)
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 5000) + '/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

CMD ["node", "src/server.js"]
