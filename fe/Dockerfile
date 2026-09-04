# Stage 1: Build the frontend (Vite/React)
FROM node:22-alpine as build

WORKDIR /app

COPY package*.json .npmrc* ./

RUN npm ci --no-audit --no-fund || npm install --no-audit --no-fund

COPY . .

RUN npm run build

# Stage 2: Serve the app with Nginx
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
