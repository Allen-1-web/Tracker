# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
WORKDIR /app
COPY package.json package-lock.json ./
COPY bot/package.json ./bot/
RUN npm ci --workspace bot

FROM base AS build
COPY bot ./bot
RUN npm run build --workspace bot

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY bot/package.json ./bot/
RUN npm ci --workspace bot --omit=dev
COPY --from=build /app/bot/dist ./bot/dist
USER node

FROM runtime AS webhook
EXPOSE 3001
CMD ["node", "bot/dist/app/start-webhook.js"]

FROM runtime AS worker
EXPOSE 3002
CMD ["node", "bot/dist/app/start-worker.js"]
