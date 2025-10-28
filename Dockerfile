# ========= Base image =========
FROM node:20-alpine AS base
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=9002
WORKDIR /app

# ========= Deps (usa o lockfile que existir) =========
FROM base AS deps
# Copia apenas os manifestos para otimizar cache
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
# Instala dependências conforme o lockfile encontrado
RUN \
  if [ -f pnpm-lock.yaml ]; then \
    corepack enable && corepack prepare pnpm@latest --activate && pnpm i --frozen-lockfile; \
  elif [ -f yarn.lock ]; then \
    corepack enable && corepack prepare yarn@stable --activate && yarn install --frozen-lockfile; \
  else \
    npm ci; \
  fi

# ========= Build (gera .next/standalone) =========
FROM base AS builder
# Habilita standalone (precisa de next.config.js com: module.exports = { output: 'standalone' })
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Importante: as variáveis NEXT_PUBLIC_* entram no build
# Ajuste conforme necessário, ou injete via CI:
# ENV NEXT_PUBLIC_AI_SERVICE_URL=https://aiservice.eduflow.pro \
#     NEXT_PUBLIC_BACKEND_URL=https://main.eduflow.pro/api \
#     NEXT_PUBLIC_AI_SERVICE_API_KEY=test-api-key-123 \
#     NEXT_PUBLIC_BACKEND_API_KEY=dev-api-key-123 \
#     NEXT_PUBLIC_APP_URL=https://tool.eduflow.pro
RUN \
  if [ -f pnpm-lock.yaml ]; then pnpm run build; \
  elif [ -f yarn.lock ]; then yarn build; \
  else npm run build; \
  fi

# ========= Runtime mínimo (standalone) =========
FROM node:20-alpine AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=9002
WORKDIR /app
# Usuário sem privilégios
RUN addgroup -S nextjs && adduser -S nextjs -G nextjs

# Copia artefatos do build standalone
# - .next/standalone contém app + node_modules otimizados
# - .next/static contém assets estáticos
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/.next/standalone ./

# Permissões
RUN chown -R nextjs:nextjs /app
USER nextjs

EXPOSE 9002
# Healthcheck simples (opcional)
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s CMD wget -qO- http://127.0.0.1:9002/ >/dev/null 2>&1 || exit 1

# Se o build standalone gerou server.js na raiz de .next/standalone
CMD ["node", "server.js"]
