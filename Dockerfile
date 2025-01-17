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
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    NEXT_SHARP_PATH=/app/node_modules/sharp 


# Setup standalone directory and copy files
RUN mkdir -p /app/standalone && \
    cp -r .next/standalone/* /app/standalone/ && \
    mkdir -p /app/standalone/.next && \
    cp -r .next/* /app/standalone/.next/ && \
    cp -r public /app/standalone/ && \
    cp package.json /app/standalone/

WORKDIR /app/standalone

# Expose port
EXPOSE 3000

# Start the Next.js server
CMD ["node", "server.js"]
