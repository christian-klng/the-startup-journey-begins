# ---- build ----
FROM node:22-alpine AS build
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build && npm prune --omit=dev

# ---- runtime ----
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0 \
    DATABASE_PATH=/data/game.sqlite \
    CONTENT_DIR=/app/content \
    MIGRATIONS_DIR=/app/drizzle
COPY --from=build /app/build ./build
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
COPY content ./content
COPY drizzle ./drizzle
RUN mkdir -p /data && chown node:node /data
USER node
VOLUME ["/data"]
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD wget -qO- http://127.0.0.1:3000/healthz || exit 1
CMD ["node", "build"]
