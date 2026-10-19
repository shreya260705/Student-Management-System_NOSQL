# ==============================================================================
# Stage 1: Build React 19 + Vite Application
# ==============================================================================
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package definitions
COPY package*.json ./

# Install npm dependencies
RUN npm install

# Copy application source code
COPY . .

# Compile production bundle into dist/
RUN npm run build

# ==============================================================================
# Stage 2: Production Nginx Web Server
# ==============================================================================
FROM nginx:1.27-alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy compiled assets from Stage 1
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration with /api reverse proxy
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose internal HTTP port
EXPOSE 80

# Run Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
