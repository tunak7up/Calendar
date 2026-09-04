# Build the VitePress docs app
FROM node:22-alpine as build

WORKDIR /app

COPY package*.json .npmrc* ./
RUN npm ci --no-audit --no-fund || npm install --no-audit --no-fund

COPY . .
RUN npm run docs:build

# Serve with Nginx
FROM nginx:alpine
COPY --from=build /app/.vitepress/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
