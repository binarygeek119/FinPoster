## Multi-stage Dockerfile for FinPoster (Vite + React)
## Stage 1: build the static site
FROM node:22-alpine AS build

# Use a dedicated working directory
WORKDIR /app

# Install dependencies separately to leverage Docker layer cache
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./ 2>/dev/null || true
RUN npm install

# Copy the rest of the source code
COPY . .

# Build the production bundle
RUN npm run build

## Stage 2: serve with nginx (simple, fast static hosting)
FROM nginx:stable-alpine AS runtime

# Copy built assets from the previous stage
COPY --from=build /app/dist /usr/share/nginx/html

# Basic nginx config: serve index.html for all routes (SPA)
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

