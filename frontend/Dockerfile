# syntax=docker/dockerfile:1
# Build from repository root: docker build -f frontend/Dockerfile .
# Debian-based image: Tailwind v4 / lightningcss native bindings fail on Alpine musl.

FROM node:20-bookworm-slim AS base
WORKDIR /app
COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/
RUN npm ci --workspace frontend

FROM base AS build
WORKDIR /app
ARG SUPABASE_URL
ARG SUPABASE_ANON_KEY
ARG TELEGRAM_BOT_USERNAME
ENV NODE_ENV=production \
    SUPABASE_URL=${SUPABASE_URL} \
    SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY} \
    TELEGRAM_BOT_USERNAME=${TELEGRAM_BOT_USERNAME}
COPY frontend ./frontend
RUN npm run build --workspace frontend

FROM node:20-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
RUN groupadd -g 1001 nodejs && useradd -u 1001 -g nodejs -m nextjs
COPY --from=build /app/frontend/public ./frontend/public
COPY --from=build --chown=nextjs:nodejs /app/frontend/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/frontend/.next/static ./frontend/.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "frontend/server.js"]
