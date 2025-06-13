# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Build and test the application (excluding e2e tests)
RUN npm run build && npm run test:unit

# Production stage
FROM node:22-alpine AS production

# Install curl for healthcheck and create user in single layer
RUN apk --no-cache add curl && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

WORKDIR /app

# Copy package.json, built app, and production node_modules in single operation
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

# Create logs directory
RUN mkdir -p logs && chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# production port
EXPOSE 8085

# Use node directly with correct entry point
CMD ["node", "dist/app.js"]