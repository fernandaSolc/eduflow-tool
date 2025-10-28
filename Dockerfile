FROM node:20-alpine AS builder

WORKDIR /app

# Copia apenas arquivos de dependências
COPY package.json pnpm-lock.yaml* yarn.lock* ./

# Instala dependências
RUN \
  if [ -f pnpm-lock.yaml ]; then \
    corepack enable && corepack prepare pnpm@latest --activate && pnpm install --frozen-lockfile; \
  elif [ -f yarn.lock ]; then \
    yarn install --frozen-lockfile; \
  else \
    npm install; \
  fi

# Copia o resto do código
COPY . .

# Build com mais memória
ENV NODE_OPTIONS=--max_old_space_size=4096
RUN \
  if [ -f pnpm-lock.yaml ]; then pnpm run build; \
  elif [ -f yarn.lock ]; then yarn build; \
  else npm run build; \
  fi

# Stage 2: Runtime
FROM node:20-alpine

WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
CMD ["npm", "start"]
