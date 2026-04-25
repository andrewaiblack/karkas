FROM node:20-alpine
WORKDIR /app

COPY package.json ./
RUN npm install

COPY oracle.js ./

# oracle.js reads .env via dotenv — we mount it at runtime from docker-compose
CMD ["node", "oracle.js"]
