# Use official Node.js LTS image
FROM node:20-alpine

# Set working directory inside container
WORKDIR /app

# Copy package files first (layer caching — npm install only re-runs if package.json changes)
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy rest of application
COPY . .

# Don't run as root (security best practice)
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Expose the port
EXPOSE 3000

# Health check — Docker restarts container if this fails
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

# Start the app
CMD ["node", "server.js"]
