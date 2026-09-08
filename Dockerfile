# ------------------------------------------------------------------------------
# Graywood Digital Ecosystem - Production Multi-Stage Dockerfile
# Node.js 20 Alpine with libc6-compat for native Sharp bindings
# ------------------------------------------------------------------------------

FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

# --- Dependencies Stage ---
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# --- Builder Stage ---
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client for the Linux container architecture
ENV PRISMA_GENERATE_DATAPROXY=false
RUN npx prisma generate

# Build Next.js with standalone output
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV DOCKER_BUILD=1
RUN npm run build

# --- Production Runner Stage ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy static assets and standalone server
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

# Persistent data and cache directories
RUN mkdir -p /app/data /app/cache/previews /app/storage/nas && \
    chown -R nextjs:nodejs /app/data /app/cache /app/storage/nas

# Copy source files needed by the cron sidecar (scripts + lib + config)
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
COPY --from=builder --chown=nextjs:nodejs /app/lib ./lib
COPY --from=builder --chown=nextjs:nodejs /app/tsconfig.json ./tsconfig.json
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
