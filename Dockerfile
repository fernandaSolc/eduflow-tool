FROM node:20-alpine AS base
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=9002 \
    NPM_CONFIG_LEGACY_PEER_DEPS=1
RUN apk add --no-cache libc6-compat python3 make g++ bash git

# ===== DEPENDÊNCIAS =====
FROM base AS deps
ENV NODE_ENV=development
COPY package.json package-lock.json* ./

# FORÇA critters + npm atualizado + npm ci
RUN npm i -g npm@11.6.2 && \
    npm install critters@^0.0.24 --save-dev && \
    npm ci --include=dev

# ===== BUILD =====
FROM base AS builder
ENV NODE_ENV=development
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_OPTIONS=--max_old_space_size=4096
RUN npm run build

# ===== RUNTIME =====
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=9002
RUN apk add --no-cache bash

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./

# Instala apenas prod deps
RUN npm i -g npm@11.6.2 && npm ci --omit=dev

RUN addgroup -S nextjs && adduser -S nextjs -G nextjs && chown -R nextjs:nextjs /app
USER nextjs

EXPOSE 9002
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD wget -qO- http://127.0.0.1:9002/ >/dev/null 2>&1 || exit 1

CMD ["npm", "start"]
