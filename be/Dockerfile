FROM node:22-alpine

WORKDIR /usr/src/app

COPY package*.json .npmrc* ./

RUN npm ci --no-audit --no-fund || npm install --no-audit --no-fund

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
