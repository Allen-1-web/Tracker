# syntax=docker/dockerfile:1
# Build from repository root: docker build -f frontend/Dockerfile .

FROM node:20-bookworm-slim AS base
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/
COPY bot/package.json ./bot/
# Tailwind v4 is in devDependencies; force Linux optional native modules.
ENV npm_config_platform=linux \
    npm_config_arch=x64 \
    npm_config_libc=glibc
RUN npm ci --workspace=frontend --include=dev --include=optional

FROM base AS build
WORKDIR /app
ARG SUPABASE_URL
ARG SUPABASE_ANON_KEY
ARG TELEGRAM_BOT_USERNAME
ARG SENTRY_DSN
ARG NEXT_PUBLIC_SENTRY_DSN
ENV SUPABASE_URL=${SUPABASE_URL} \
    SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY} \
    TELEGRAM_BOT_USERNAME=${TELEGRAM_BOT_USERNAME} \
    SENTRY_DSN=${SENTRY_DSN} \
    NEXT_PUBLIC_SENTRY_DSN=${NEXT_PUBLIC_SENTRY_DSN} \
    NEXT_TELEMETRY_DISABLED=1 \
    NODE_OPTIONS=--max-old-space-size=1536
COPY frontend ./frontend
RUN npm install --no-save \
    @tailwindcss/oxide-linux-x64-gnu@4.3.0 \
    lightningcss-linux-x64-gnu@1.32.0 \
    --workspace=frontend
ENV NODE_ENV=production
RUN npm run build --workspace=frontend

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
