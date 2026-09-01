# CIM Website - Production Dockerfile
# Multi-stage: build with Node, serve with Nginx
FROM node:20-alpine AS builder
WORKDIR /app
# Vite bakes VITE_* vars at build time — expose them as build args
ARG VITE_REGISTRATION_ENDPOINT
ARG VITE_CONTACT_ENDPOINT
ARG VITE_REGISTRATION_ALLOWED_ORIGINS
ARG VITE_FACEBOOK_URL
ARG VITE_LINKEDIN_URL
ENV VITE_REGISTRATION_ENDPOINT=$VITE_REGISTRATION_ENDPOINT
ENV VITE_CONTACT_ENDPOINT=$VITE_CONTACT_ENDPOINT
ENV VITE_REGISTRATION_ALLOWED_ORIGINS=$VITE_REGISTRATION_ALLOWED_ORIGINS
ENV VITE_FACEBOOK_URL=$VITE_FACEBOOK_URL
ENV VITE_LINKEDIN_URL=$VITE_LINKEDIN_URL
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
