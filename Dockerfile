# ===== BASE =====
FROM node:20-alpine AS base
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=9002 \
    # evita que peer-deps quebrem o npm ci em ecosistemas mistos
    NPM_CONFIG_LEGACY_PEER_DEPS=1

# libs necessárias p/ binários (ex.: sharp) e builds nativos
RUN apk add --no-cache libc6-compat python3 make g++ bash git

# ===== DEPENDÊNCIAS =====
FROM base AS deps
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./
RUN corepack enable
# instala conforme o lockfile; se for npm, atualiza para 11.6.2 como o aviso pede
RUN set -eux; \
  if [ -f pnpm-lock.yaml ]; then \
    corepack prepare pnpm@latest --activate && pnpm install --frozen-lockfile; \
  elif [ -f yarn.lock ]; then \
    corepack prepare yarn@stable --activate && yarn install --frozen-lockfile; \
  else \
    npm i -g npm@11.6.2 && npm ci; \
  fi

# ===== BUILD =====
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# aumenta a memória da VM do Node p/ builds mais pesados
ENV NODE_OPTIONS=--max_old_space_size=2048
RUN set -eux; \
  if [ -f pnpm-lock.yaml ]; then pnpm run build; \
  elif [ -f yarn.lock ]; then yarn build; \
  else npm run build; \
  fi

# ===== RUNTIME =====
FROM base AS runner
WORKDIR /app
# copia artefatos necessários para "next start"
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

# usuário não-root
RUN addgroup -S nextjs && adduser -S nextjs -G nextjs && chown -R nextjs:nextjs /app
USER nextjs

EXPOSE 9002
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD wget -qO- http://127.0.0.1:9002/ >/dev/null 2>&1 || exit 1

# inicia o Next.js no PORT=9002
CMD ["npm", "run", "start"]
