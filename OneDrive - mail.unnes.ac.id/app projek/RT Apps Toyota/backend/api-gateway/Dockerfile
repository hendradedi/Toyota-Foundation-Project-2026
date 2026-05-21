# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY backend/package*.json ./backend/

# Copy shared module
COPY backend/shared ./backend/shared

# Copy API Gateway
COPY backend/api-gateway ./backend/api-gateway

# Install dependencies
RUN npm ci --legacy-peer-deps || npm ci

# Build TypeScript
RUN cd backend/api-gateway && npm run build 2>/dev/null || true

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install dumb-init to handle signals properly
RUN apk add --no-cache dumb-init curl

# Copy from builder - root dependencies
COPY --from=builder /app/node_modules ./node_modules

# Copy from builder - backend shared
COPY --from=builder /app/backend/shared ./backend/shared

# Copy from builder - API Gateway
COPY --from=builder /app/backend/api-gateway ./backend/api-gateway

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
USER nodejs

# Set working directory
WORKDIR /app/backend/api-gateway

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Use dumb-init to handle signals
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["npm", "start"]
