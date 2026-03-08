# ---------- Base stage: shared node_modules ----------
FROM node:20-alpine AS base
WORKDIR /app
COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY server/package.json server/
COPY web/package.json     web/
RUN npm ci

# ---------- Server ----------
FROM base AS server
COPY shared/ shared/
COPY server/ server/
EXPOSE 3001
CMD ["npm", "run", "start", "--workspace=server"]
