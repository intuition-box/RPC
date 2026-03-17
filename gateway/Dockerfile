FROM node:22-alpine AS dashboard
WORKDIR /app
COPY dashboard/package.json dashboard/package-lock.json* ./
RUN npm ci
COPY dashboard/ .
RUN npm run build

FROM nginx:alpine
COPY --from=dashboard /app/dist /usr/share/nginx/html
COPY gateway/nginx.conf /etc/nginx/conf.d/default.conf
