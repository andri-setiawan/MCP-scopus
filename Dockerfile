FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev for build), ignore prepare script
RUN npm ci --ignore-scripts

# Copy source and config files
COPY tsconfig.json ./
COPY src ./src

# Build the project
RUN npm run build

# Remove dev dependencies to reduce image size
RUN npm prune --production

# Expose port
EXPOSE 5566

# Set environment variables
ENV PORT=5566
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5566/health || exit 1

# Run the HTTP server
CMD ["node", "dist/http-server.js"]
