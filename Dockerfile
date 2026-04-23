# syntax=docker/dockerfile:1.7

FROM node:22-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run prisma:generate && npm run build

FROM base AS runner
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/app ./app
COPY --from=build /app/components ./components
COPY --from=build /app/lib ./lib
COPY --from=build /app/server ./server
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/next.config.ts ./next.config.ts
COPY --from=build /app/postcss.config.mjs ./postcss.config.mjs
COPY --from=build /app/tsconfig.json ./tsconfig.json
COPY --from=build /app/proxy.ts ./proxy.ts
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/prisma.config.ts ./prisma.config.ts

RUN mkdir -p /app/data/backups \
  && chown -R node:node /app

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || '3000') + '/').then((res)=>process.exit(res.ok?0:1)).catch(()=>process.exit(1))"

CMD ["npm", "run", "start"]
