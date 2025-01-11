# Node.js Dockerfile with Windows compatibility
FROM node:18-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files first to leverage Docker caching
COPY package*.json ./

# Install dependencies
RUN pnpm install

# Copy application files
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN pnpm run build

# Set environment variables
ENV PORT=3000 \
    NODE_ENV=production \
    NEW_RELIC_ENABLED=false \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    NEXT_SHARP_PATH=/app/node_modules/sharp

# Setup standalone directory and copy files
WORKDIR /app/.next/standalone
RUN mkdir -p .next/static && \
    cp -r /app/.next/static/* .next/static/ && \
    cp -r /app/public .
WORKDIR /app/.next/standalone

# Expose port
EXPOSE 3000

# Start the Next.js standalone server directly
CMD ["node", "./server.js"]
