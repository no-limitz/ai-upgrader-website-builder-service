# AI Web Upgrader - Builder Service Docker Image

FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies for Puppeteer
RUN apk add --no-cache \
    curl \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Tell Puppeteer to use installed Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Copy package files first for better Docker layer caching
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY src/ ./src/
COPY scripts/ ./scripts/
COPY tests/ ./tests/

# Create output directory
RUN mkdir -p /app/output && \
    chown -R node:node /app

# Switch to non-root user
USER node

# Expose port - use environment variable with fallback
EXPOSE ${PORT:-8002}

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8002}/health || exit 1

# Run the application
CMD ["npm", "start"]