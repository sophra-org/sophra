# Syntax version
FROM alpine:latest as permissions
WORKDIR /temp_context
COPY . .
RUN find . -type d -exec chmod 0755 {} \; && \
    find . -type f -exec chmod 0644 {} \; && \
    find . -type f -name "*.sh" -exec chmod 0755 {} \;

FROM node:18-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    libc6-compat \
    python3 \
    make \
    g++

# Install pnpm globally
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set working directory and default user
WORKDIR /app
ENV NODE_ENV=production
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    chown nextjs:nodejs /app

# Builder stage
FROM base AS builder

# Copy normalized files from permissions stage
COPY --from=permissions /temp_context /app
RUN chown -R nextjs:nodejs /app

# Install dependencies
RUN pnpm install --frozen-lockfile && \
    cd prisma2 && pnpm install --frozen-lockfile && cd ..

# Install Prisma and generate artifacts
RUN pnpm add -D prisma@6.1.0 @prisma/client@6.1.0 ts-node typescript @types/node glob && \
    mkdir -p src/lib/shared/database/validation/generated/outputTypeSchemas && \
    chown -R nextjs:nodejs src/lib/shared/database

# Switch to non-root user for build
USER nextjs

# Generate Prisma artifacts and build
RUN NODE_ENV=development pnpm exec prisma generate --schema=./prisma/schema.prisma && \
    cd prisma2 && NODE_ENV=development pnpm exec prisma generate --schema=./schema.prisma && cd .. && \
    NODE_ENV=development pnpm exec ts-node --project tsconfig.json scripts/clean-zod-schemas.ts && \
    HUSKY=0 pnpm build

# Runner stage
FROM base AS runner

# Create necessary directories
RUN mkdir -p /app/logs && \
    chown -R nextjs:nodejs /app

# Copy production files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma2 ./prisma2
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy package files for production install
COPY --from=permissions /temp_context/package.json ./
COPY --from=permissions /temp_context/prisma2/package.json ./prisma2/

# Install production dependencies
RUN pnpm install --prod --frozen-lockfile && \
    cd prisma2 && pnpm install --prod --frozen-lockfile && cd .. && \
    chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Set runtime configuration
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start application
CMD ["node", "server.js"]
