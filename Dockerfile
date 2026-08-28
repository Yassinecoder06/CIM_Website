# CIM Website - Production Dockerfile
# Multi-stage: build with Node, serve with Nginx
FROM node:20-alpine AS builder
WORKDIR /app
# Install deps first for better cache
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY . .
# Build static site (outputs to dist/)
RUN npm run build

FROM nginx:alpine AS runner
# Remove default config
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
# Nginx will serve on 80
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
