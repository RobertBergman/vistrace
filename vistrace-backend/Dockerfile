# Multi-stage build for Node.js backend
FROM node:18-alpine AS builder

# Install system dependencies for native modules and traceroute
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    iputils \
    traceroute \
    bind-tools \
    curl

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install && npm cache clean --force

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install runtime dependencies
RUN apk add --no-cache \
    iputils \
    traceroute \
    bind-tools \
    curl \
    dumb-init

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S vistrace -u 1001

WORKDIR /app

# Copy built application
COPY --from=builder --chown=vistrace:nodejs /app/dist ./dist
COPY --from=builder --chown=vistrace:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=vistrace:nodejs /app/package*.json ./

# Create logs directory
RUN mkdir -p /app/logs && chown -R vistrace:nodejs /app/logs

# Switch to non-root user
USER vistrace

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/server.js"]
