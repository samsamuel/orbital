# Stage 1: Build frontend
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY index.html ./
COPY ./src ./src
COPY ./public ./public
RUN npm install && npm run build

# Stage 2: Run backend and serve static files
FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY package*.json ./
COPY server.js ./
COPY public ./public
EXPOSE 3000
CMD ["node", "server.js"]
