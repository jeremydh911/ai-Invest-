# Agentic Pono - Multi-stage Docker build for Kubernetes deployment
# Supports both CPU and GPU workloads

# Stage 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma

# Install dependencies
RUN npm ci --omit=dev

# Generate Prisma client
RUN npx prisma generate

# Stage 2: Runtime - CPU base
FROM node:20-alpine AS runtime-cpu

WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl ca-certificates

# Copy from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

# Copy application files
COPY . .

# Create directories for runtime
RUN mkdir -p /app/logs /app/data /app/uploads

# Set permissions
RUN chown -R node:node /app

# Use non-root user
USER node

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Expose port
EXPOSE 3000

# Start application
CMD ["node", "server.js"]

# Stage 3: Runtime - GPU base (NVIDIA CUDA)
FROM nvidia/cuda:12.2.2-runtime-ubuntu22.04 AS runtime-gpu

WORKDIR /app

# Install Node.js on GPU image
RUN apt-get update && apt-get install -y \
    nodejs npm curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

# Copy application files
COPY . .

# Create directories for runtime
RUN mkdir -p /app/logs /app/data /app/uploads

# Create non-root user
RUN useradd -m -u 1000 node && chown -R node:node /app

# Use non-root user
USER node

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Expose port
EXPOSE 3000

# Start application
CMD ["node", "server.js"]
