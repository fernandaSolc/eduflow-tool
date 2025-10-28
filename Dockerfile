FROM node:20-alpine AS builder

WORKDIR /app

# 1. Copie APENAS arquivos de dependências
COPY package.json ./
COPY pnpm-lock.yaml* yarn.lock* package-lock.json* ./

# 2. Instale dependências ANTES de copiar o código
RUN \
  if [ -f pnpm-lock.yaml ]; then \
    corepack enable && corepack prepare pnpm@latest --activate && pnpm install --frozen-lockfile; \
  elif [ -f yarn.lock ]; then \
    yarn install --frozen-lockfile; \
  else \
    npm ci; \
  fi

# 3. Agora copie o resto do código
COPY . .

# 4. Build com memória suficiente
ENV NODE_OPTIONS=--max_old_space_size=4096
RUN \
  if [ -f pnpm-lock.yaml ]; then pnpm run build; \
  elif [ -f yarn.lock ]; then yarn build; \
  else npm run build; \
  fi

# Runtime
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
CMD ["npm", "start"]
