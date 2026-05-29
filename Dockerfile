# ─── Stage 1: Dependencies ───────────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Only copy package files first — better layer caching
COPY package*.json ./

RUN npm ci --only=production && npm cache clean --force

# ─── Stage 2: Final Image ────────────────────────────────────────────────────
FROM node:20-alpine AS final

# Security: non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy dependencies from stage 1
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# uploads folder create karo with correct ownership
RUN mkdir -p uploads/documents && chown -R appuser:appgroup /app

# Non-root user se run karo
USER appuser

EXPOSE 5000

# Health check — Docker itself monitor karega
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:5000/health || exit 1

CMD ["node", "server.js"]
