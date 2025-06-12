FROM node:18-alpine as base

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build TypeScript code
RUN npm run build

# Development stage
FROM base as development
ENV NODE_ENV=development

# Expose port (use environment variable or default to 8088)
EXPOSE ${PORT:-8088}

# Start the application in development mode
CMD ["npm", "run", "dev"]

# Production stage
FROM base as production
ENV NODE_ENV=production

# Expose port (use environment variable or default to 8088)
EXPOSE ${PORT:-8088}

# Start the application in production mode
CMD ["npm", "run", "prod"]
