# ---------- Base stage: shared node_modules ----------
FROM node:20-alpine AS base
WORKDIR /app
COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY server/package.json server/
COPY web/package.json     web/
RUN npm ci

# ---------- Web (Vite dev server) ----------
FROM base AS web
COPY shared/ shared/
COPY web/    web/
EXPOSE 5173
# Vite must listen on 0.0.0.0 so Docker can forward the port.
CMD ["npx", "--workspace=web", "vite", "--host", "0.0.0.0"]
