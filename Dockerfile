FROM node:20-alpine AS builder
WORKDIR /app

# Copia dependências
COPY package.json package-lock.json* ./

# Instala tudo (inclui critters se precisar)
RUN npm i -g npm@11.6.2 && \
    npm install critters@^0.0.24 --save-dev && \
    npm install

# Copia código
COPY . .

# Build
ENV NODE_OPTIONS=--max_old_space_size=4096
RUN npm run build

# Runtime
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=9002

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package*.json ./
RUN mkdir -p ./public  # cria vazio se não existir

RUN npm i -g npm@11.6.2 && npm ci --omit=dev

USER node
EXPOSE 9002
CMD ["npm", "start"]
