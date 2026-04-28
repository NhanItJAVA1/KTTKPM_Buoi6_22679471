FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
EXPOSE 8082
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s \
  CMD wget -qO- http://localhost:8082/health || exit 1
CMD ["node", "dist/main"]
