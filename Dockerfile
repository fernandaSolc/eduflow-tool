# ========= Base =========
FROM node:20-alpine AS base
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=9002
WORKDIR /app
# Necessário para libs nativas (ex.: sharp) em Alpine
RUN apk add --no-cache libc6-compat

# ========= Deps =========
FROM base AS deps
# Copia manifestos para cache eficiente
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
# Habilita corepack (yarn/pnpm gerenciados pela própria Node)
RUN corepack enable
# Instala dependências conforme lockfile disponível
# - Se for npm: já atualiza npm p/ 11.6.2 (evita falhas da versão)
RUN set -eux; \
  if [ -f pnpm-lock.yaml ]; then \
    corepack prepare pnpm@latest --activate && pnpm i --frozen-lockfile; \
  elif [ -f yarn.lock ]; then \
    corepack prepare yarn@stable --activate && yarn install --frozen-lockfile; \
  else \
    npm i -g npm@11.6.2 && npm ci; \
  fi

# ========= Build =========
FROM base AS builder
# Se usar yarn/pnpm, já vem de deps
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# IMPORTANTE: para imagem pequena no runtime, habilite no projeto:
# next.config.{js,ts} -> module.exports = { output: 'standalone', ... }
# (Seu next.config.ts atual não tem 'output', adicione.)
RUN set -eux; \
  if [ -f pnpm-lock.yaml ]; then pnpm run build; \
  elif [ -f yarn.lock ]; then yarn build; \
  else npm run build; \
  fi

# ========= Runtime (standalone) =========
FROM node:20-alpine AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=9002
WORKDIR /app
RUN addgroup -S nextjs && adduser -S nextjs -G nextjs
# Assets estáticos e bundle standalone
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/.next/standalone ./
RUN chown -R nextjs:nextjs /app
USER nextjs
EXPOSE 9002
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s CMD wget -qO- http://127.0.0.1:9002/ >/dev/null 2>&1 || exit 1
CMD ["node", "server.js"]
