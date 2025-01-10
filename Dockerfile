# Permissions stage
FROM alpine:latest AS permissions
WORKDIR /temp_context
COPY . .
RUN find . -type d -exec chmod 0755 {} \; && \
    find . -type f -exec chmod 0644 {} \; && \
    find . -type f -name "*.sh" -exec chmod 0755 {} \;

# Base stage with dependencies
FROM node:18-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat python3 make g++ && \
    corepack enable && \
    corepack prepare pnpm@latest --activate
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Builder stage
FROM base AS builder
WORKDIR /app

# Safe copy of package files
COPY ["package.json", "pnpm-lock.yaml", "./"]
COPY ["prisma2/package.json", "prisma2/pnpm-lock.yaml", "./prisma2/"]

# Install dependencies
RUN pnpm install --frozen-lockfile && \
    cd prisma2 && pnpm install --frozen-lockfile && cd ..

# Copy source with explicit paths
COPY prisma ./prisma/
COPY prisma2 ./prisma2/
COPY src ./src/
COPY tsconfig.json .

# Generate Prisma
RUN pnpm exec prisma generate --schema=./prisma/schema.prisma && \
    cd prisma2 && pnpm exec prisma generate --schema=./schema.prisma

# Production stage
FROM base AS production
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built files
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/prisma2/node_modules ./prisma2/node_modules
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma2 ./prisma2
COPY --chown=nextjs:nodejs . .

USER nextjs
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]

# Add a final stage
FROM base AS final
WORKDIR /app
COPY --from=builder /app .

# Set the default command
CMD ["node", "index.js"]
