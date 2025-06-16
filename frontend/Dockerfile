# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Set environment variables for build
ENV VITE_API_URL=
ENV VITE_GOOGLE_MAPS_API_KEY=
ENV VITE_NODE_ENV=
ENV VITE_APP_NAME=
ENV VITE_APP_VERSION=
ENV VITE_ENABLE_VOICE_CHAT=
ENV VITE_ENABLE_ANALYTICS=
ENV VITE_ENABLE_COMPARISON=

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
