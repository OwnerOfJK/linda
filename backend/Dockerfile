# stage 1: build
FROM node:18-alpine AS build
WORKDIR /app
COPY package.json ./
RUN npm install --production
COPY src ./src

# stage 2: runtime
FROM node:18-alpine
WORKDIR /app
COPY --from=build /app /app
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "src/index.js"]
