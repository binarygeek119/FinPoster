## Multi-stage Dockerfile for FinPoster (Vite + React + Node backend)

## Stage 1: build the frontend
FROM node:22-alpine AS build

WORKDIR /app

# Install dependencies (dev + prod) to build
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./ 2>/dev/null || true
RUN npm install

# Copy source
COPY . .

# Build the production bundle
RUN npm run build

## Stage 2: production runtime with Node backend serving built frontend
FROM node:22-alpine AS runtime

WORKDIR /app

# Only install production dependencies
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./ 2>/dev/null || true
RUN npm install --omit=dev

# Copy built frontend and server code
COPY --from=build /app/dist ./dist
COPY --from=build /app/server ./server

EXPOSE 3000

CMD ["node", "server/index.mjs"]

